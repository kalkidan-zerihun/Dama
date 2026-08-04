import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth } from './firebase';

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  status: 'online' | 'offline' | 'searching' | 'in_match' | 'disconnected';
  lastSeen?: any;
  createdAt?: any;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,15}$/;

/**
 * Validates format of username (3-15 chars, alphanumeric and underscore)
 */
export function validateUsernameFormat(username: string): { valid: boolean; message: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { valid: false, message: 'Username cannot be empty.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long.' };
  }
  if (trimmed.length > 15) {
    return { valid: false, message: 'Username cannot exceed 15 characters.' };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { valid: true, message: 'Valid username.' };
}

/**
 * Checks if username is taken in Firebase Firestore
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  await ensureAuth();
  const lower = username.trim().toLowerCase();
  const docRef = doc(db, 'usernames', lower);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return true;

  // Check if it belongs to current user
  const user = await ensureAuth();
  return snap.data()?.uid === user.uid;
}

/**
 * Returns saved local username
 */
export function getSavedUsername(): string {
  return localStorage.getItem('damma-online-username') || '';
}

/**
 * Registers or updates user's profile and claims username in Firestore
 */
export async function setUsername(newUsername: string): Promise<{ success: boolean; message: string }> {
  const user = await ensureAuth();
  const trimmed = newUsername.trim();
  const validation = validateUsernameFormat(trimmed);
  
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const newLower = trimmed.toLowerCase();
  const available = await isUsernameAvailable(trimmed);
  if (!available) {
    return { success: false, message: 'Username is already taken by another player.' };
  }

  const oldUsername = getSavedUsername();
  const oldLower = oldUsername ? oldUsername.toLowerCase() : null;

  try {
    // 1. Claim new username
    const newUsernameRef = doc(db, 'usernames', newLower);
    await setDoc(newUsernameRef, {
      uid: user.uid,
      username: trimmed,
      createdAt: serverTimestamp()
    });

    // 2. Update user profile
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const existing = userDoc.exists() ? userDoc.data() : {};
    const currentRating = existing.rating ?? 1200;

    await setDoc(userRef, {
      uid: user.uid,
      username: trimmed,
      usernameLower: newLower,
      status: 'online',
      rating: currentRating,
      wins: existing.wins ?? 0,
      losses: existing.losses ?? 0,
      draws: existing.draws ?? 0,
      totalGames: existing.totalGames ?? 0,
      winPercentage: existing.winPercentage ?? 0,
      currentStreak: existing.currentStreak ?? 0,
      highestStreak: existing.highestStreak ?? 0,
      highestRating: existing.highestRating ? Math.max(existing.highestRating, currentRating) : currentRating,
      createdAt: existing.createdAt || serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });

    // 3. Delete old username registry if changing
    if (oldLower && oldLower !== newLower) {
      try {
        const oldRef = doc(db, 'usernames', oldLower);
        await deleteDoc(oldRef);
      } catch (err) {
        console.warn('Could not remove old username registry:', err);
      }
    }

    // Save locally
    localStorage.setItem('damma-online-username', trimmed);
    return { success: true, message: 'Username saved successfully!' };
  } catch (err: any) {
    console.error('Failed to set username:', err);
    return { success: false, message: err?.message || 'Failed to update username. Try again.' };
  }
}

let heartbeatInterval: any = null;

/**
 * Starts presence heartbeat and status updates
 */
export async function initPresence(status: 'online' | 'searching' | 'in_match' = 'online') {
  const user = await ensureAuth();
  const username = getSavedUsername();
  const userRef = doc(db, 'users', user.uid);

  const updateStatus = async (s: string) => {
    try {
      const userDoc = await getDoc(userRef);
      const existing = userDoc.exists() ? userDoc.data() : {};
      const uname = username || existing.username || `Player_${user.uid.substring(0, 5)}`;
      const currentRating = existing.rating ?? 1200;

      await setDoc(userRef, {
        uid: user.uid,
        username: uname,
        usernameLower: uname.toLowerCase(),
        status: s,
        rating: currentRating,
        wins: existing.wins ?? 0,
        losses: existing.losses ?? 0,
        draws: existing.draws ?? 0,
        totalGames: existing.totalGames ?? 0,
        winPercentage: existing.winPercentage ?? 0,
        currentStreak: existing.currentStreak ?? 0,
        highestStreak: existing.highestStreak ?? 0,
        highestRating: existing.highestRating ? Math.max(existing.highestRating, currentRating) : currentRating,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Presence update error:', e);
    }
  };

  await updateStatus(status);

  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    updateStatus(status);
  }, 15000);

  // Set offline on window unload
  window.addEventListener('beforeunload', () => {
    updateStatus('offline');
  });
}

/**
 * Updates presence status specifically
 */
export async function updatePresenceStatus(status: 'online' | 'offline' | 'searching' | 'in_match' | 'disconnected') {
  const user = await ensureAuth();
  const username = getSavedUsername();
  if (!username) return;

  const userRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(userRef, {
      status,
      lastSeen: serverTimestamp()
    });
  } catch (e) {
    console.warn('Failed to update presence status:', e);
  }
}

/**
 * Finds user profile by exact username (case-insensitive)
 */
export async function findUserByUsername(searchUsername: string): Promise<UserProfile | null> {
  await ensureAuth();
  const lower = searchUsername.trim().toLowerCase();
  const registryRef = doc(db, 'usernames', lower);
  const snap = await getDoc(registryRef);

  if (!snap.exists()) return null;

  const uid = snap.data().uid;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  return userSnap.data() as UserProfile;
}
