import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Unsubscribe, doc, getDoc 
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { getSavedUsername, getSavedDisplayName, getSavedPhotoURL } from './userService';
import { 
  checkContentModeration, validateSpamAndRateLimit, recordUserMessageSent 
} from './chatModerationService';

export interface ChatMessage {
  id?: string;
  senderUid: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderPhotoURL?: string;
  text: string;
  timestamp: number;
  createdAt?: any;
}

/**
 * Escapes HTML characters to sanitize user input against XSS
 */
export function sanitizeChatMessage(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Subscribes to real-time chat messages for a specific room ordered by timestamp ascending
 */
export function subscribeToChatMessages(
  roomId: string,
  onMessagesUpdated: (messages: ChatMessage[]) => void
): Unsubscribe {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          senderUid: data.senderUid,
          senderUsername: data.senderUsername,
          senderDisplayName: data.senderDisplayName || data.senderUsername,
          senderPhotoURL: data.senderPhotoURL || '',
          text: data.text,
          timestamp: data.timestamp || Date.now(),
          createdAt: data.createdAt
        });
      });
      onMessagesUpdated(messages);
    },
    (err) => {
      console.warn('Error listening to chat messages:', err);
    }
  );

  return unsub;
}

/**
 * Sends a chat message in the specified room after validating room participation & message length
 */
export async function sendChatMessage(
  roomId: string,
  rawText: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await ensureAuth();
    const text = rawText.trim();

    if (!text) {
      return { success: false, message: 'Message cannot be empty.' };
    }

    // 1. Spam & Rate Limiting Check
    const spamCheck = validateSpamAndRateLimit(user.uid, text);
    if (!spamCheck.allowed) {
      return { success: false, message: spamCheck.warningMessage };
    }

    // 2. Content Moderation Check (offensive words, leet speak, hate speech, threats, harassment)
    const modCheck = checkContentModeration(text);
    if (modCheck.isProhibited) {
      return { 
        success: false, 
        message: modCheck.warningMessage || 'Your message contains inappropriate language. Please be respectful.' 
      };
    }

    // Verify player belongs to room
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      return { success: false, message: 'Room not found.' };
    }

    const roomData = roomSnap.data();
    const isParticipant = user.uid === roomData.player1Uid || user.uid === roomData.player2Uid;
    if (!isParticipant) {
      return { success: false, message: 'Only players in the match can chat.' };
    }

    const senderUsername = getSavedUsername() || (user.uid === roomData.player1Uid ? roomData.player1Username : roomData.player2Username) || 'Player';
    const senderDisplayName = getSavedDisplayName() || senderUsername;
    const senderPhotoURL = getSavedPhotoURL();
    const sanitizedText = sanitizeChatMessage(text);

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      senderUid: user.uid,
      senderUsername: senderUsername,
      senderDisplayName: senderDisplayName,
      senderPhotoURL: senderPhotoURL,
      text: sanitizedText,
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    });

    // Record message sent for rate limiting
    recordUserMessageSent(user.uid, text);

    return { success: true };
  } catch (err: any) {
    console.error('Failed to send chat message:', err);
    return { success: false, message: err?.message || 'Failed to send message.' };
  }
}
