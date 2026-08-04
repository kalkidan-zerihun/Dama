import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot, serverTimestamp, Unsubscribe 
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { findUserByUsername, getSavedUsername, updatePresenceStatus, UserProfile } from './userService';

export interface Invitation {
  id: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  roomId?: string;
  createdAt?: any;
}

/**
 * Generates initial 8x8 Damma board matrix serialized as JSON
 */
export function createInitialBoardData(): number[][] {
  const board: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
  // Player 2 (Pink/CPU/Opponent) = -1 on top 3 rows
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = -1;
    }
  }
  // Player 1 (Blue/You/Host) = 1 on bottom 3 rows
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = 1;
    }
  }
  return board;
}

/**
 * Searches for target username and creates direct game invitation
 */
export async function invitePlayerByUsername(targetUsername: string): Promise<{
  success: boolean;
  message: string;
  invitationId?: string;
  unsubscribe?: Unsubscribe;
}> {
  const user = await ensureAuth();
  const myUsername = getSavedUsername();

  if (!myUsername) {
    return { success: false, message: 'Please set a username first.' };
  }

  if (targetUsername.trim().toLowerCase() === myUsername.toLowerCase()) {
    return { success: false, message: 'You cannot invite yourself.' };
  }

  const targetProfile = await findUserByUsername(targetUsername);
  if (!targetProfile) {
    return { success: false, message: 'Player not found.' };
  }

  if (targetProfile.status === 'in_match') {
    return { success: false, message: 'Player is currently in another match.' };
  }

  const invitationId = `inv_${user.uid}_${targetProfile.uid}_${Date.now()}`;
  const invRef = doc(db, 'invitations', invitationId);

  await setDoc(invRef, {
    fromUid: user.uid,
    fromUsername: myUsername,
    toUid: targetProfile.uid,
    toUsername: targetProfile.username,
    toUsernameLower: targetProfile.usernameLower,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  return {
    success: true,
    message: 'Invitation sent! Waiting for response...',
    invitationId
  };
}

/**
 * Listens to invitation updates (e.g., when sent by sender)
 */
export function listenToSentInvitation(
  invitationId: string, 
  onAccepted: (roomId: string) => void, 
  onDeclined: () => void
): Unsubscribe {
  const invRef = doc(db, 'invitations', invitationId);
  return onSnapshot(invRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as Invitation;
    if (data.status === 'accepted' && data.roomId) {
      onAccepted(data.roomId);
    } else if (data.status === 'declined') {
      onDeclined();
    }
  }, (err) => {
    console.warn('Sent invitation snapshot error:', err);
  });
}

/**
 * Cancels a sent invitation
 */
export async function cancelSentInvitation(invitationId: string) {
  try {
    const invRef = doc(db, 'invitations', invitationId);
    await updateDoc(invRef, { status: 'cancelled' });
  } catch (e) {
    console.warn('Failed to cancel invitation:', e);
  }
}

/**
 * Realtime listener for incoming game invitations directed to current user
 */
export function listenForIncomingInvitations(onInvitationReceived: (invitation: Invitation) => void): Unsubscribe {
  let activeUnsub: Unsubscribe | null = null;

  ensureAuth().then((user) => {
    const q = query(
      collection(db, 'invitations'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    activeUnsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const invData = { id: change.doc.id, ...change.doc.data() } as Invitation;
          onInvitationReceived(invData);
        }
      });
    }, (err) => {
      console.warn('Incoming invitation snapshot error:', err);
    });
  });

  return () => {
    if (activeUnsub) activeUnsub();
  };
}

/**
 * Accepts an incoming invitation and creates room
 */
export async function acceptInvitation(invitation: Invitation): Promise<string> {
  const user = await ensureAuth();
  const myUsername = getSavedUsername();

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const roomRef = doc(db, 'rooms', roomId);

  const initialBoard = createInitialBoardData();

  // Create room
  await setDoc(roomRef, {
    roomId,
    player1Uid: invitation.fromUid,
    player1Username: invitation.fromUsername,
    player2Uid: user.uid,
    player2Username: myUsername,
    currentTurn: 1, // Player 1 (white/blue) starts
    board: JSON.stringify(initialBoard),
    p1Count: 12,
    p2Count: 12,
    totalMoves: 0,
    status: 'playing',
    winnerUid: null,
    winReason: null,
    rematchRequestedBy: [],
    player1DisconnectedAt: null,
    player2DisconnectedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Mark invitation accepted
  const invRef = doc(db, 'invitations', invitation.id);
  await updateDoc(invRef, {
    status: 'accepted',
    roomId
  });

  await updatePresenceStatus('in_match');

  return roomId;
}

/**
 * Declines an incoming invitation
 */
export async function declineInvitation(invitationId: string) {
  const invRef = doc(db, 'invitations', invitationId);
  await updateDoc(invRef, { status: 'declined' });
}

// Store queue listener unsubscribe
let matchmakingQueueUnsub: Unsubscribe | null = null;

/**
 * Starts random matchmaking: joins queue and scans for opponent
 */
export async function startRandomMatchmaking(
  onMatched: (roomId: string) => void,
  onError: (err: string) => void
) {
  const user = await ensureAuth();
  const myUsername = getSavedUsername();

  if (!myUsername) {
    onError('Please set a username first.');
    return;
  }

  await updatePresenceStatus('searching');

  const myQueueRef = doc(db, 'matchmaking', user.uid);

  // 1. Enter queue
  await setDoc(myQueueRef, {
    uid: user.uid,
    username: myUsername,
    status: 'searching',
    createdAt: serverTimestamp()
  });

  // 2. Listen to my own queue document to see if matched by another player
  matchmakingQueueUnsub = onSnapshot(myQueueRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status === 'matched' && data.roomId) {
      if (matchmakingQueueUnsub) {
        matchmakingQueueUnsub();
        matchmakingQueueUnsub = null;
      }
      updatePresenceStatus('in_match');
      onMatched(data.roomId);
    }
  }, (err) => {
    console.warn('Matchmaking queue snapshot error:', err);
  });

  // 3. Scan queue for existing searching opponents
  try {
    const q = query(
      collection(db, 'matchmaking'),
      where('status', '==', 'searching')
    );

    const snapshot = await getDocs(q);
    const candidates = snapshot.docs
      .map(d => d.data())
      .filter(d => d.uid !== user.uid);

    if (candidates.length > 0) {
      // Choose first available opponent
      const opponent = candidates[0];

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const initialBoard = createInitialBoardData();

      // Create room: opponent = Player 1, current user = Player 2
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        roomId,
        player1Uid: opponent.uid,
        player1Username: opponent.username,
        player2Uid: user.uid,
        player2Username: myUsername,
        currentTurn: 1,
        board: JSON.stringify(initialBoard),
        p1Count: 12,
        p2Count: 12,
        totalMoves: 0,
        status: 'playing',
        winnerUid: null,
        winReason: null,
        rematchRequestedBy: [],
        player1DisconnectedAt: null,
        player2DisconnectedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update opponent's queue status
      const oppQueueRef = doc(db, 'matchmaking', opponent.uid);
      await updateDoc(oppQueueRef, {
        status: 'matched',
        roomId
      });

      // Update my queue status
      await updateDoc(myQueueRef, {
        status: 'matched',
        roomId
      });

      if (matchmakingQueueUnsub) {
        matchmakingQueueUnsub();
        matchmakingQueueUnsub = null;
      }

      await updatePresenceStatus('in_match');
      onMatched(roomId);
    }
  } catch (err: any) {
    console.error('Matchmaking scan error:', err);
  }
}

/**
 * Cancels active random matchmaking search
 */
export async function cancelRandomMatchmaking() {
  const user = await ensureAuth();
  if (matchmakingQueueUnsub) {
    matchmakingQueueUnsub();
    matchmakingQueueUnsub = null;
  }

  try {
    const myQueueRef = doc(db, 'matchmaking', user.uid);
    await deleteDoc(myQueueRef);
  } catch (e) {
    console.warn('Failed to delete matchmaking queue item:', e);
  }

  await updatePresenceStatus('online');
}
