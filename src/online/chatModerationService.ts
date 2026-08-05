import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { getSavedUsername } from './userService';

export interface ChatReportInput {
  roomId: string;
  messageId?: string;
  reportedUid: string;
  reportedUsername: string;
  reportedDisplayName?: string;
  messageText: string;
  reason: string;
}

// Leet speak character substitution map
const LEET_MAP: Record<string, string> = {
  '@': 'a', '4': 'a', '^': 'a',
  '8': 'b',
  '3': 'e', '€': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '$': 's', '5': 's',
  '7': 't', '+': 't',
  '9': 'g',
  'v': 'u'
};

// List of prohibited words and patterns covering profanity, hate speech, threats, harassment, and explicit content
const PROHIBITED_WORDS: string[] = [
  // Profanity & Vulgarity
  'fuck', 'fucking', 'fucker', 'fuckin', 'fck', 'fuk', 'fuking',
  'shit', 'shitty', 'shiting', 'sht',
  'bitch', 'bitches', 'bitchy', 'btch',
  'asshole', 'ass', 'arse', 'arsehole',
  'bastard', 'cunt', 'dick', 'cock', 'pussy', 'prick',
  'motherfucker', 'motherfucking', 'mf',
  'bullshit', 'dipshit', 'jackass',

  // Insults & Harassment
  'idiot', 'retard', 'retarded', 'moron', 'dumbass', 'dumb',
  'loser', 'scum', 'trash', 'whore', 'slut', 'hoe',
  'suck my', 'suck a', 'eat shit', 'uninstall',
  'kys', 'kill yourself', 'kill urself', 'go die', 'die in a fire',

  // Hate Speech & Slurs (Racist, Homophobic, Misogynistic)
  'nigger', 'nigga', 'niga', 'niggah', 'nigger',
  'faggot', 'fag', 'homo', 'dyke', 'tranny',
  'chink', 'spic', 'kike', 'wetback', 'gook',
  'retard', 'crap',

  // Threats & Violence
  'kill you', 'i will kill', 'going to kill', 'stab you', 'shoot you',
  'i will find you', 'bomb', 'murder you',

  // Sexually Explicit
  'porn', 'porno', 'pornography', 'hentai', 'nude', 'nudes',
  'naked', 'horny', 'sex', 'sexual', 'cum', 'ejaculate', 'orgasm'
];

// In-memory rate limiting and duplicate tracking per user
interface UserMessageTracker {
  lastText: string;
  lastTimestamp: number;
  messageTimestamps: number[];
}

const userTrackers = new Map<string, UserMessageTracker>();

/**
 * Normalizes input text by converting to lowercase, replacing leet-speak characters,
 * stripping non-alphanumeric noise between letters, and collapsing repeated characters.
 */
export function normalizeTextForModeration(input: string): string {
  if (!input) return '';

  let text = input.toLowerCase();

  // 1. Convert leet speak
  let leetConverted = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    leetConverted += LEET_MAP[ch] || ch;
  }

  // 2. Remove space or symbol separators between single letters (e.g., "f u c k" or "f.u.c.k" or "f*u*c*k")
  const strippedSeparators = leetConverted.replace(/([a-z0-9])[\s\._\-\*\+\=]+(?=[a-z0-9])/g, '$1');

  // 3. Collapse repeated letters (e.g. "fuuuuuuck" -> "fuck", "shiiiiit" -> "shit")
  const collapsed = strippedSeparators.replace(/([a-z0-9])\1{2,}/g, '$1');

  return collapsed;
}

/**
 * Checks if a chat message contains prohibited content (profanity, hate speech, insults, threats, explicit)
 */
export function checkContentModeration(rawText: string): { isProhibited: boolean; warningMessage?: string; matchedWord?: string } {
  if (!rawText || !rawText.trim()) {
    return { isProhibited: false };
  }

  const rawLower = rawText.toLowerCase();
  const normalized = normalizeTextForModeration(rawText);

  for (const word of PROHIBITED_WORDS) {
    // Check direct substring in raw lower or normalized text
    const wordPattern = new RegExp(`\\b${word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');

    if (
      wordPattern.test(rawLower) || 
      wordPattern.test(normalized) || 
      (word.length > 3 && (rawLower.includes(word) || normalized.includes(word)))
    ) {
      return {
        isProhibited: true,
        warningMessage: 'Your message contains inappropriate language. Please be respectful.',
        matchedWord: word
      };
    }
  }

  return { isProhibited: false };
}

/**
 * Replaces prohibited words in text with asterisks (*****).
 * Useful for optional censored display mode.
 */
export function maskOffensiveWords(text: string): string {
  if (!text) return '';
  let result = text;

  for (const word of PROHIBITED_WORDS) {
    const pattern = new RegExp(`\\b${word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(pattern, (match) => '*'.repeat(match.length));
  }

  return result;
}

/**
 * Validates message against rate limiting, duplicate message spam, and character length limit.
 */
export function validateSpamAndRateLimit(
  uid: string,
  rawText: string
): { allowed: boolean; warningMessage?: string } {
  const text = rawText.trim();

  // 1. Max length check
  if (text.length > 300) {
    return {
      allowed: false,
      warningMessage: 'Message exceeds maximum length of 300 characters.'
    };
  }

  const now = Date.now();
  const tracker = userTrackers.get(uid) || {
    lastText: '',
    lastTimestamp: 0,
    messageTimestamps: []
  };

  // 2. Duplicate message check within 45 seconds
  if (tracker.lastText && tracker.lastText.toLowerCase() === text.toLowerCase() && (now - tracker.lastTimestamp < 45000)) {
    return {
      allowed: false,
      warningMessage: 'Spam prevention: You cannot send duplicate messages.'
    };
  }

  // 3. Minimum gap between messages (1.2 seconds)
  if (now - tracker.lastTimestamp < 1200) {
    return {
      allowed: false,
      warningMessage: 'You are sending messages too fast. Please slow down.'
    };
  }

  // 4. Rate limit: max 4 messages per 6 seconds
  const recentTimestamps = tracker.messageTimestamps.filter(t => now - t < 6000);
  if (recentTimestamps.length >= 4) {
    return {
      allowed: false,
      warningMessage: 'You are sending messages too fast. Please wait a few seconds.'
    };
  }

  return { allowed: true };
}

/**
 * Records a successfully sent message to update user rate limiting tracker.
 */
export function recordUserMessageSent(uid: string, rawText: string) {
  const now = Date.now();
  const tracker = userTrackers.get(uid) || {
    lastText: '',
    lastTimestamp: 0,
    messageTimestamps: []
  };

  const text = rawText.trim();
  const recentTimestamps = tracker.messageTimestamps.filter(t => now - t < 6000);
  recentTimestamps.push(now);

  userTrackers.set(uid, {
    lastText: text,
    lastTimestamp: now,
    messageTimestamps: recentTimestamps
  });
}

/**
 * Submits a report for an inappropriate chat message or player to Firestore
 */
export async function submitChatReport(
  input: ChatReportInput
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await ensureAuth();
    const reporterUsername = getSavedUsername() || 'Player';

    const reportsRef = collection(db, 'chatReports');
    await addDoc(reportsRef, {
      roomId: input.roomId,
      messageId: input.messageId || null,
      reporterUid: user.uid,
      reporterUsername: reporterUsername,
      reportedUid: input.reportedUid,
      reportedUsername: input.reportedUsername,
      reportedDisplayName: input.reportedDisplayName || input.reportedUsername,
      messageText: input.messageText,
      reason: input.reason,
      status: 'pending',
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Thank you. The report has been submitted for review.'
    };
  } catch (err: any) {
    console.error('Failed to submit chat report:', err);
    return {
      success: false,
      message: err?.message || 'Failed to submit report. Please try again.'
    };
  }
}
