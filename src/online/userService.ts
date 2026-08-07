import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth } from './firebase';

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName?: string;
  photoURL?: string;
  favoriteRule?: string;
  status: 'online' | 'offline' | 'searching' | 'in_match' | 'disconnected';
  rating?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  totalGames?: number;
  winPercentage?: number;
  currentStreak?: number;
  highestStreak?: number;
  highestRating?: number;
  lastSeen?: any;
  createdAt?: any;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,15}$/;
const DISPLAYNAME_REGEX = /^[a-zA-Z0-9_ ]{3,20}$/;

/**
 * Validates format of display name (3-20 chars, letters, numbers, spaces, underscores)
 */
export function validateDisplayNameFormat(displayName: string): { valid: boolean; message: string } {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return { valid: false, message: 'Display name cannot be empty.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, message: 'Display name must be at least 3 characters long.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, message: 'Display name cannot exceed 20 characters.' };
  }
  if (!DISPLAYNAME_REGEX.test(trimmed)) {
    return { valid: false, message: 'Display name can only contain letters, numbers, spaces, and underscores.' };
  }
  return { valid: true, message: 'Valid display name.' };
}

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
 * Returns default SVG avatar Data URL with a modern gradient and initial
 */
export function getDefaultAvatarSvg(name: string): string {
  const initial = (name || 'P').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><text x="50" y="64" font-size="46" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Gets user avatar photo URL or fallback SVG
 */
export function getUserAvatarUrl(user?: { photoURL?: string; displayName?: string; username?: string }): string {
  if (user?.photoURL && user.photoURL.trim().length > 0) {
    return user.photoURL;
  }
  const name = user?.displayName || user?.username || 'Player';
  return getDefaultAvatarSvg(name);
}

/**
 * Returns saved local user details
 */
export function getSavedUsername(): string {
  return localStorage.getItem('damma-online-username') || '';
}

export function getSavedDisplayName(): string {
  return localStorage.getItem('damma-online-displayname') || getSavedUsername();
}

export function getSavedPhotoURL(): string {
  return localStorage.getItem('damma-online-photourl') || '';
}

export function getSavedFavoriteRule(): string {
  return localStorage.getItem('damma-online-favoriterule') || 'Ethiopian Damma (Forced Capture)';
}

/**
 * Fetches user profile by UID from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  await ensureAuth();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
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
 * Updates full user profile (Display Name, Photo URL, Favorite Rule, Username)
 */
export async function updateUserProfile(updates: {
  displayName?: string;
  photoURL?: string;
  favoriteRule?: string;
  username?: string;
}): Promise<{ success: boolean; message: string }> {
  const user = await ensureAuth();
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const existing = userSnap.exists() ? userSnap.data() : {};

  const payload: any = {};

  // 1. Handle Display Name update if provided
  if (updates.displayName !== undefined) {
    const trimmedDN = updates.displayName.trim();
    const dnValidation = validateDisplayNameFormat(trimmedDN);
    if (!dnValidation.valid) {
      return { success: false, message: dnValidation.message };
    }
    payload.displayName = trimmedDN;
    localStorage.setItem('damma-online-displayname', trimmedDN);
  }

  // 2. Handle Photo URL update if provided
  if (updates.photoURL !== undefined) {
    payload.photoURL = updates.photoURL;
    localStorage.setItem('damma-online-photourl', updates.photoURL);
  }

  // 3. Handle Favorite Rule update if provided
  if (updates.favoriteRule !== undefined) {
    payload.favoriteRule = updates.favoriteRule;
    localStorage.setItem('damma-online-favoriterule', updates.favoriteRule);
  }

  // 4. Handle Username change if provided
  if (updates.username !== undefined) {
    const trimmedUN = updates.username.trim();
    const currentUN = existing.username || getSavedUsername();

    if (trimmedUN.toLowerCase() !== currentUN.toLowerCase()) {
      const unValidation = validateUsernameFormat(trimmedUN);
      if (!unValidation.valid) {
        return { success: false, message: unValidation.message };
      }

      const available = await isUsernameAvailable(trimmedUN);
      if (!available) {
        return { success: false, message: 'Username is already taken by another player.' };
      }

      const newLower = trimmedUN.toLowerCase();
      const oldLower = currentUN ? currentUN.toLowerCase() : null;

      // Claim new username
      const newUsernameRef = doc(db, 'usernames', newLower);
      await setDoc(newUsernameRef, {
        uid: user.uid,
        username: trimmedUN,
        createdAt: serverTimestamp()
      });

      // Delete old username registry
      if (oldLower && oldLower !== newLower) {
        try {
          const oldRef = doc(db, 'usernames', oldLower);
          await deleteDoc(oldRef);
        } catch (err) {
          console.warn('Failed to remove old username registry:', err);
        }
      }

      payload.username = trimmedUN;
      payload.usernameLower = newLower;
      localStorage.setItem('damma-online-username', trimmedUN);
    }
  }

  payload.lastSeen = serverTimestamp();

  try {
    await updateDoc(userRef, payload);
    return { success: true, message: 'Profile updated successfully!' };
  } catch (err: any) {
    console.error('Failed to update profile:', err);
    return { success: false, message: err?.message || 'Failed to update profile.' };
  }
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

/**
 * Saves completed daily challenge result to Firestore user profile & subcollection
 */
export async function saveDailyChallengeToFirestore(
  dateStr: string,
  data: { puzzleId: string; title: string; difficulty: string; moves: number; timeMs: number },
  streakCount: number
) {
  try {
    const user = await ensureAuth();
    if (!user || !user.uid) {
      queuePendingDailySync(dateStr, data, streakCount);
      return;
    }

    // 1. Save detail document in subcollection users/{uid}/dailyChallenges/{dateStr}
    const challengeRef = doc(db, 'users', user.uid, 'dailyChallenges', dateStr);
    await setDoc(challengeRef, {
      dateStr,
      puzzleId: data.puzzleId,
      title: data.title,
      difficulty: data.difficulty,
      moves: data.moves,
      timeMs: data.timeMs,
      completedAt: serverTimestamp()
    }, { merge: true });

    // 2. Update summary metrics on user document
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const currentStats = snap.data();
      const highestStreak = Math.max(streakCount, currentStats.highestDailyStreak || 0);
      const totalSolved = (currentStats.totalDailySolved || 0) + 1;

      await updateDoc(userRef, {
        dailyStreak: streakCount,
        highestDailyStreak: highestStreak,
        totalDailySolved: totalSolved,
        lastDailySolvedDate: dateStr
      });
    }

    // After successful sync, trigger flush for any older pending syncs
    syncPendingDailyChallenges();
  } catch (e) {
    console.warn('Non-critical: Failed to sync daily challenge to Firestore, saving offline:', e);
    queuePendingDailySync(dateStr, data, streakCount);
  }
}

function queuePendingDailySync(dateStr: string, data: any, streakCount: number) {
  try {
    const raw = localStorage.getItem('damma_pending_daily_sync') || '[]';
    const list = JSON.parse(raw);
    if (!list.some((item: any) => item.dateStr === dateStr)) {
      list.push({ dateStr, data, streakCount });
      localStorage.setItem('damma_pending_daily_sync', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to queue pending daily sync:', e);
  }
}

export async function syncPendingDailyChallenges() {
  try {
    const raw = localStorage.getItem('damma_pending_daily_sync');
    if (!raw) return;
    const pendingList = JSON.parse(raw);
    if (!Array.isArray(pendingList) || pendingList.length === 0) return;

    const remaining: any[] = [];
    for (const item of pendingList) {
      try {
        const user = getCurrentUser();
        if (user && user.uid) {
          const challengeRef = doc(db, 'users', user.uid, 'dailyChallenges', item.dateStr);
          await setDoc(challengeRef, {
            dateStr: item.dateStr,
            puzzleId: item.data.puzzleId,
            title: item.data.title,
            difficulty: item.data.difficulty,
            moves: item.data.moves,
            timeMs: item.data.timeMs,
            completedAt: serverTimestamp()
          }, { merge: true });
        } else {
          remaining.push(item);
        }
      } catch (e) {
        remaining.push(item);
      }
    }
    if (remaining.length > 0) {
      localStorage.setItem('damma_pending_daily_sync', JSON.stringify(remaining));
    } else {
      localStorage.removeItem('damma_pending_daily_sync');
    }
  } catch (e) {
    console.warn('Failed to sync pending daily challenges:', e);
  }
}

(window as any).syncDailyChallengeToFirestore = saveDailyChallengeToFirestore;
(window as any).syncPendingDailyChallenges = syncPendingDailyChallenges;

