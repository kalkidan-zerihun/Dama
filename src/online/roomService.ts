import { 
  doc, onSnapshot, updateDoc, serverTimestamp, Unsubscribe, getDoc 
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { updatePresenceStatus } from './userService';
import { createInitialBoardData } from './matchmakingService';

export interface RoomState {
  roomId: string;
  player1Uid: string;
  player1Username: string;
  player1Rating?: number;
  player2Uid: string;
  player2Username: string;
  player2Rating?: number;
  currentTurn: number; // 1 = Player 1, -1 = Player 2
  board: number[][];
  p1Count: number;
  p2Count: number;
  totalMoves: number;
  status: 'playing' | 'ended' | 'abandoned';
  timeControl?: number; // 0 = No timer, 15 = 15s, 30 = 30s, 60 = 1m, 120 = 2m
  turnStartedAt?: number; // Timestamp in ms when turn started
  winnerUid?: string | null;
  winReason?: string | null;
  rematchRequestedBy: string[];
  player1DisconnectedAt?: number | null;
  player2DisconnectedAt?: number | null;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Subscribes to real-time room updates in Firestore
 */
export function subscribeToRoom(
  roomId: string, 
  onRoomUpdated: (room: RoomState) => void,
  onDisconnectionTimeout: (winnerUid: string) => void
): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomId);

  let disconnectTimer: any = null;

  const unsub = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    let parsedBoard: number[][] = [];
    try {
      parsedBoard = typeof data.board === 'string' ? JSON.parse(data.board) : data.board;
    } catch (e) {
      console.error('Failed to parse board matrix:', e);
    }

    const roomState: RoomState = {
      roomId: data.roomId,
      player1Uid: data.player1Uid,
      player1Username: data.player1Username,
      player1Rating: data.player1Rating,
      player2Uid: data.player2Uid,
      player2Username: data.player2Username,
      player2Rating: data.player2Rating,
      currentTurn: data.currentTurn,
      board: parsedBoard,
      p1Count: data.p1Count,
      p2Count: data.p2Count,
      totalMoves: data.totalMoves,
      status: data.status,
      timeControl: data.timeControl ?? 30,
      turnStartedAt: data.turnStartedAt || (data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()),
      winnerUid: data.winnerUid,
      winReason: data.winReason,
      rematchRequestedBy: data.rematchRequestedBy || [],
      player1DisconnectedAt: data.player1DisconnectedAt,
      player2DisconnectedAt: data.player2DisconnectedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };

    onRoomUpdated(roomState);

    // Handle 60s disconnection timeout check
    ensureAuth().then((user) => {
      const isP1 = user.uid === roomState.player1Uid;
      const opponentDisconnectedAt = isP1 ? roomState.player2DisconnectedAt : roomState.player1DisconnectedAt;

      if (opponentDisconnectedAt && roomState.status === 'playing') {
        if (!disconnectTimer) {
          const elapsed = Date.now() - opponentDisconnectedAt;
          const remainingMs = Math.max(0, 60000 - elapsed);

          disconnectTimer = setTimeout(async () => {
            // Declare remaining player winner
            try {
              await updateDoc(roomRef, {
                status: 'ended',
                winnerUid: user.uid,
                winReason: 'disconnection'
              });
              onDisconnectionTimeout(user.uid);
            } catch (err) {
              console.warn('Failed to declare winner on disconnection timeout:', err);
            }
          }, remainingMs);
        }
      } else {
        if (disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
        }
      }
    });
  }, (err) => {
    console.warn("Room subscription snapshot error:", err);
  });

  return () => {
    unsub();
    if (disconnectTimer) clearTimeout(disconnectTimer);
  };
}

/**
 * Validates turn and submits new move state to Firestore
 */
export async function sendOnlineMove(
  roomId: string,
  newBoard: number[][],
  p1Count: number,
  p2Count: number,
  nextTurn: number,
  totalMoves: number,
  winnerUid?: string | null,
  winReason?: string | null
): Promise<boolean> {
  const user = await ensureAuth();
  const roomRef = doc(db, 'rooms', roomId);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return false;

  const roomData = snap.data();

  // Validate turn & permissions
  const isP1 = user.uid === roomData.player1Uid;
  const isP2 = user.uid === roomData.player2Uid;

  if (!isP1 && !isP2) {
    console.error('Unauthorized move attempt: player not in room.');
    return false;
  }

  const expectedTurn = isP1 ? 1 : -1;
  if (roomData.currentTurn !== expectedTurn) {
    console.warn('It is not your turn!');
    return false;
  }

  const updatePayload: any = {
    board: JSON.stringify(newBoard),
    p1Count,
    p2Count,
    currentTurn: nextTurn,
    totalMoves,
    turnStartedAt: Date.now(),
    updatedAt: serverTimestamp()
  };

  if (winnerUid) {
    updatePayload.status = 'ended';
    if (winnerUid === 'p1') {
      updatePayload.winnerUid = roomData.player1Uid;
    } else if (winnerUid === 'p2') {
      updatePayload.winnerUid = roomData.player2Uid;
    } else {
      updatePayload.winnerUid = winnerUid;
    }
    updatePayload.winReason = winReason || 'capture';
  }

  await updateDoc(roomRef, updatePayload);
  return true;
}

/**
 * Handles voluntary leave match
 */
export async function leaveOnlineRoom(roomId: string) {
  const user = await ensureAuth();
  const roomRef = doc(db, 'rooms', roomId);

  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    const data = snap.data();
    const isP1 = user.uid === data.player1Uid;
    const winnerUid = isP1 ? data.player2Uid : data.player1Uid;

    await updateDoc(roomRef, {
      status: 'abandoned',
      winnerUid,
      winReason: 'resignation',
      updatedAt: serverTimestamp()
    });
  }

  await updatePresenceStatus('online');
}

/**
 * Requests or confirms rematch
 */
export async function requestOnlineRematch(roomId: string): Promise<boolean> {
  const user = await ensureAuth();
  const roomRef = doc(db, 'rooms', roomId);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return false;

  const data = snap.data();
  const currentRematches: string[] = data.rematchRequestedBy || [];

  if (!currentRematches.includes(user.uid)) {
    currentRematches.push(user.uid);
  }

  if (currentRematches.length >= 2) {
    // Both accepted: reset room
    const initialBoard = createInitialBoardData();
    await updateDoc(roomRef, {
      board: JSON.stringify(initialBoard),
      currentTurn: 1,
      p1Count: 12,
      p2Count: 12,
      totalMoves: 0,
      status: 'playing',
      winnerUid: null,
      winReason: null,
      rematchRequestedBy: [],
      turnStartedAt: Date.now(),
      updatedAt: serverTimestamp()
    });
    return true;
  } else {
    await updateDoc(roomRef, {
      rematchRequestedBy: currentRematches,
      updatedAt: serverTimestamp()
    });
    return false;
  }
}

/**
 * Updates player disconnection timestamp in room
 */
export async function setRoomDisconnection(roomId: string, isDisconnected: boolean) {
  const user = await ensureAuth();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const isP1 = user.uid === data.player1Uid;

    const payload: any = {};
    if (isP1) {
      payload.player1DisconnectedAt = isDisconnected ? Date.now() : null;
    } else {
      payload.player2DisconnectedAt = isDisconnected ? Date.now() : null;
    }

    await updateDoc(roomRef, payload);
  } catch (e) {
    console.warn('Failed to update room disconnection:', e);
  }
}
