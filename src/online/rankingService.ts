import { 
  doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, 
  onSnapshot, getDocs, where, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { RoomState } from './roomService';

export interface RankTier {
  title: string;
  badge: string;
  color: string;
  bgColor: string;
  minRating: number;
  maxRating: number;
}

export const RANK_TIERS: RankTier[] = [
  { title: 'Beginner', badge: '🌱', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.15)', minRating: 0, maxRating: 999 },
  { title: 'Bronze', badge: '🥉', color: '#cd7f32', bgColor: 'rgba(205, 127, 50, 0.15)', minRating: 1000, maxRating: 1199 },
  { title: 'Silver', badge: '🥈', color: '#c0c0c0', bgColor: 'rgba(192, 192, 192, 0.15)', minRating: 1200, maxRating: 1399 },
  { title: 'Gold', badge: '🥇', color: '#ffd700', bgColor: 'rgba(255, 215, 0, 0.15)', minRating: 1400, maxRating: 1599 },
  { title: 'Platinum', badge: '💎', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.15)', minRating: 1600, maxRating: 1799 },
  { title: 'Diamond', badge: '💠', color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.15)', minRating: 1800, maxRating: 1999 },
  { title: 'Master', badge: '👑', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', minRating: 2000, maxRating: 2199 },
  { title: 'Grandmaster', badge: '🔥', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', minRating: 2200, maxRating: Infinity },
];

export function getRankDetails(rating: number = 1200): RankTier {
  const r = Math.max(0, rating);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (r >= RANK_TIERS[i].minRating) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export interface UserRankProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName?: string;
  photoURL?: string;
  favoriteRule?: string;
  status: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winPercentage: number;
  currentStreak: number;
  highestStreak: number;
  highestRating: number;
  createdAt?: any;
  lastSeen?: any;
}

export interface MatchHistoryItem {
  id: string;
  roomId: string;
  playerUid: string;
  opponentUid: string;
  opponentUsername: string;
  opponentDisplayName?: string;
  opponentPhotoURL?: string;
  result: 'win' | 'loss' | 'draw';
  ratingBefore: number;
  ratingAfter: number;
  newRating?: number;
  ratingChange: number;
  totalMoves: number;
  winReason: string;
  createdAt: any;
}

/**
  Calculate Elo Rating Changes
  Formula:
  Expected outcome A = 1 / (1 + 10^((RatingB - RatingA) / 400))
  Expected outcome B = 1 / (1 + 10^((RatingA - RatingB) / 400))
  Rating Change = round(K * (ActualScore - ExpectedOutcome))
 */
export function calculateElo(
  ratingA: number, 
  ratingB: number, 
  scoreA: number, // 1 for win, 0.5 for draw, 0 for loss
  kFactor: number = 32
): { changeA: number; changeB: number; newRatingA: number; newRatingB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
  
  const scoreB = 1 - scoreA;

  const changeA = Math.round(kFactor * (scoreA - expectedA));
  const changeB = Math.round(kFactor * (scoreB - expectedB));

  const newRatingA = Math.max(100, ratingA + changeA);
  const newRatingB = Math.max(100, ratingB + changeB);

  return { changeA, changeB, newRatingA, newRatingB };
}

/**
 * Ensures user profile object has all default ranking properties
 */
export function sanitizeUserProfile(data: any, uid: string, defaultUsername = 'Player'): UserRankProfile {
  const wins = data?.wins || 0;
  const losses = data?.losses || 0;
  const draws = data?.draws || 0;
  const totalGames = data?.totalGames || (wins + losses + draws);
  const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const rating = data?.rating ?? 1200;

  return {
    uid: data?.uid || uid,
    username: data?.username || defaultUsername,
    usernameLower: data?.usernameLower || (data?.username || defaultUsername).toLowerCase(),
    displayName: data?.displayName || data?.username || defaultUsername,
    photoURL: data?.photoURL || '',
    favoriteRule: data?.favoriteRule || 'Ethiopian Damma (Forced Capture)',
    status: data?.status || 'online',
    rating,
    wins,
    losses,
    draws,
    totalGames,
    winPercentage,
    currentStreak: data?.currentStreak || 0,
    highestStreak: data?.highestStreak || 0,
    highestRating: data?.highestRating ? Math.max(data.highestRating, rating) : rating,
    createdAt: data?.createdAt,
    lastSeen: data?.lastSeen
  };
}

/**
 * Checks Fair Play rules before awarding rating changes
 */
async function checkFairPlay(
  room: RoomState, 
  p1Uid: string, 
  p2Uid: string
): Promise<{ isFair: boolean; reason?: string }> {
  // Real game completions (capture / no moves) are always fair & rated!
  if (room.winReason === 'capture' || room.winReason === 'no_moves') {
    return { isFair: true };
  }

  // 1. Minimum moves guard: immediate forfeit / quick disconnect before playing
  if (room.totalMoves < 1) {
    return { isFair: false, reason: 'Match ended before any moves were played.' };
  }

  // 2. Frequency / Repeat match abuse guard (in-memory filtering to avoid composite index requirements)
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentMatchesRef = collection(db, 'users', p1Uid, 'matches');
    const q = query(recentMatchesRef, orderBy('createdAt', 'desc'), limit(10));
    const snap = await getDocs(q);

    let recentCount = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.opponentUid === p2Uid && data.createdAt) {
        const matchTime = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (matchTime >= tenMinsAgo) {
          recentCount++;
        }
      }
    });

    if (recentCount >= 6) {
      return { isFair: false, reason: 'Fair play safeguard: Maximum consecutive match limit reached.' };
    }
  } catch (err) {
    console.warn('Fair play query check warning:', err);
  }

  return { isFair: true };
}

/**
 * Processes ranked match outcome and updates ratings, stats, and match history atomically in Firestore
 */
export async function processRankedMatchRating(room: RoomState): Promise<{
  processed: boolean;
  isFair: boolean;
  fairReason?: string;
  p1RatingChange: number;
  p2RatingChange: number;
  p1NewRating: number;
  p2NewRating: number;
  p1OldRating: number;
  p2OldRating: number;
}> {
  const user = await ensureAuth();
  const myUid = user.uid;

  const roomRef = doc(db, 'rooms', room.roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error(`Room ${room.roomId} does not exist.`);
  }

  const roomData = roomSnap.data();

  const p1Uid = room.player1Uid;
  const p2Uid = room.player2Uid;
  const winnerUid = roomData.winnerUid || room.winnerUid;

  let p1RatingChange = 0;
  let p2RatingChange = 0;
  let p1NewRating = 1200;
  let p2NewRating = 1200;
  let p1OldRating = 1200;
  let p2OldRating = 1200;
  let isFair = true;
  let fairReason: string | undefined = undefined;

  if (roomData.ratingProcessed) {
    // Already calculated on room document
    p1RatingChange = roomData.p1RatingChange || 0;
    p2RatingChange = roomData.p2RatingChange || 0;
    p1NewRating = roomData.p1NewRating || 1200;
    p2NewRating = roomData.p2NewRating || 1200;
    p1OldRating = roomData.p1OldRating || 1200;
    p2OldRating = roomData.p2OldRating || 1200;
    isFair = !roomData.unratedReason;
    fairReason = roomData.unratedReason || undefined;
  } else {
    // Read current player profiles
    const p1Ref = doc(db, 'users', p1Uid);
    const p2Ref = doc(db, 'users', p2Uid);

    const [p1Snap, p2Snap] = await Promise.all([getDoc(p1Ref), getDoc(p2Ref)]);

    const p1Profile = sanitizeUserProfile(p1Snap.data(), p1Uid, room.player1Username);
    const p2Profile = sanitizeUserProfile(p2Snap.data(), p2Uid, room.player2Username);

    p1OldRating = p1Profile.rating;
    p2OldRating = p2Profile.rating;

    // Determine scores (1 = Win, 0.5 = Draw, 0 = Loss)
    let scoreP1 = 0.5;
    if (winnerUid === p1Uid || winnerUid === 'p1') {
      scoreP1 = 1;
    } else if (winnerUid === p2Uid || winnerUid === 'p2') {
      scoreP1 = 0;
    }

    // Check Fair Play
    const fairCheck = await checkFairPlay(room, p1Uid, p2Uid);
    isFair = fairCheck.isFair;
    fairReason = fairCheck.reason;

    if (isFair) {
      const elo = calculateElo(p1OldRating, p2OldRating, scoreP1);
      p1RatingChange = elo.changeA;
      p2RatingChange = elo.changeB;
      p1NewRating = elo.newRatingA;
      p2NewRating = elo.newRatingB;
    } else {
      p1NewRating = p1OldRating;
      p2NewRating = p2OldRating;
    }

    // Save calculation to room document
    try {
      await updateDoc(roomRef, {
        ratingProcessed: true,
        p1RatingChange,
        p2RatingChange,
        p1NewRating,
        p2NewRating,
        p1OldRating,
        p2OldRating,
        unratedReason: isFair ? null : fairReason,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to update room rating state:', err);
    }
  }

  // Update own player profile and match history (each user updates their own profile to respect security rules)
  if (myUid === p1Uid || myUid === p2Uid) {
    const isP1 = myUid === p1Uid;
    const isWinner = (winnerUid === myUid) || (isP1 && winnerUid === 'p1') || (!isP1 && winnerUid === 'p2');
    const myResult = isWinner ? 'win' : (winnerUid === 'draw' ? 'draw' : 'loss');
    const myOldRating = isP1 ? p1OldRating : p2OldRating;
    const myNewRating = isP1 ? p1NewRating : p2NewRating;
    const myRatingChange = isP1 ? p1RatingChange : p2RatingChange;
    const myUsername = isP1 ? room.player1Username : room.player2Username;
    const oppUid = isP1 ? p2Uid : p1Uid;
    const oppUsername = isP1 ? room.player2Username : room.player1Username;

    const myMatchRef = doc(db, 'users', myUid, 'matches', `${room.roomId}_${myUid}`);
    const myMatchSnap = await getDoc(myMatchRef);

    if (!myMatchSnap.exists()) {
      const myRef = doc(db, 'users', myUid);
      const mySnap = await getDoc(myRef);
      const myProfile = sanitizeUserProfile(mySnap.data(), myUid, myUsername);

      const wins = myProfile.wins + (myResult === 'win' ? 1 : 0);
      const losses = myProfile.losses + (myResult === 'loss' ? 1 : 0);
      const draws = myProfile.draws + (myResult === 'draw' ? 1 : 0);
      const totalGames = myProfile.totalGames + 1;
      const winPercentage = Math.round((wins / totalGames) * 100);
      const streak = myResult === 'win' ? myProfile.currentStreak + 1 : 0;
      const highestStreak = Math.max(myProfile.highestStreak, streak);
      const highestRating = Math.max(myProfile.highestRating, myNewRating);

      try {
        await setDoc(myRef, {
          uid: myUid,
          username: myUsername,
          usernameLower: myUsername.toLowerCase(),
          status: 'online',
          rating: myNewRating,
          wins,
          losses,
          draws,
          totalGames,
          winPercentage,
          currentStreak: streak,
          highestStreak,
          highestRating,
          lastSeen: serverTimestamp()
        }, { merge: true });

        await setDoc(myMatchRef, {
          id: `${room.roomId}_${myUid}`,
          roomId: room.roomId,
          playerUid: myUid,
          opponentUid: oppUid,
          opponentUsername: oppUsername,
          result: myResult,
          ratingBefore: myOldRating,
          ratingAfter: myNewRating,
          ratingChange: myRatingChange,
          totalMoves: room.totalMoves,
          winReason: room.winReason || 'regular',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Failed to update own profile/matches:', err);
      }
    }
  }

  return {
    processed: true,
    isFair,
    fairReason,
    p1RatingChange,
    p2RatingChange,
    p1NewRating,
    p2NewRating,
    p1OldRating,
    p2OldRating
  };
}

/**
 * Subscribes to Real-Time Leaderboard for all Players
 */
export function subscribeToLeaderboard(onUpdate: (players: UserRankProfile[]) => void): () => void {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('rating', 'desc'), limit(500));

  return onSnapshot(q, (snapshot) => {
    const players: UserRankProfile[] = [];
    snapshot.forEach((docSnap) => {
      players.push(sanitizeUserProfile(docSnap.data(), docSnap.id));
    });
    onUpdate(players);
  }, (err) => {
    console.error('Leaderboard snapshot error:', err);
  });
}

/**
 * Fetches single player profile by UID
 */
export async function getUserRankProfile(uid: string): Promise<UserRankProfile | null> {
  await ensureAuth();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return null;
  return sanitizeUserProfile(snap.data(), uid);
}

/**
 * Calculates global rank of a given user rating
 */
export async function getUserGlobalRank(userRating: number): Promise<number> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rating', '>', userRating));
    const snap = await getDocs(q);
    return snap.size + 1;
  } catch (err) {
    console.warn('Error fetching global rank:', err);
    return 1;
  }
}

/**
 * Fetches player's match history list
 */
export async function getUserMatchHistory(uid: string, limitCount: number = 20): Promise<MatchHistoryItem[]> {
  await ensureAuth();
  try {
    const matchesRef = collection(db, 'users', uid, 'matches');
    const q = query(matchesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);

    const list: MatchHistoryItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        roomId: data.roomId,
        playerUid: data.playerUid,
        opponentUid: data.opponentUid,
        opponentUsername: data.opponentUsername,
        result: data.result,
        ratingBefore: data.ratingBefore || 1200,
        ratingAfter: data.ratingAfter || 1200,
        newRating: data.ratingAfter || 1200,
        ratingChange: data.ratingChange || 0,
        totalMoves: data.totalMoves || 0,
        winReason: data.winReason || 'regular',
        createdAt: data.createdAt
      });
    });

    return list;
  } catch (err) {
    console.warn('Error fetching match history:', err);
    return [];
  }
}

/**
 * Searches users by username prefix or exact string
 */
export async function searchPlayersByUsername(searchQuery: string): Promise<UserRankProfile[]> {
  await ensureAuth();
  const lower = searchQuery.trim().toLowerCase();
  if (!lower) return [];

  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('usernameLower', '>=', lower), 
      where('usernameLower', '<=', lower + '\uf8ff'),
      limit(20)
    );
    const snap = await getDocs(q);

    const list: UserRankProfile[] = [];
    snap.forEach((docSnap) => {
      list.push(sanitizeUserProfile(docSnap.data(), docSnap.id));
    });

    return list;
  } catch (err) {
    console.warn('Search players error:', err);
    return [];
  }
}
