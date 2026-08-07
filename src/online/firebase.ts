import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Auth instance
export const auth = getAuth(app);

// Firestore instance with custom database ID support and long polling fallback
const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
  ? config.firestoreDatabaseId 
  : '(default)';

export const db: Firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, dbId);

export interface SimpleUser {
  uid: string;
}

function getOrCreateFallbackUid(): string {
  let uid = localStorage.getItem('damma-local-uid');
  if (!uid) {
    uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    localStorage.setItem('damma-local-uid', uid);
  }
  return uid;
}

let currentUser: SimpleUser | null = null;
let authInitPromise: Promise<SimpleUser> | null = null;

/**
 * Ensures user is authenticated with Firebase Auth or fallback device UID
 */
export function ensureAuth(): Promise<SimpleUser> {
  if (currentUser) return Promise.resolve(currentUser);
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = { uid: user.uid };
        resolve(currentUser);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = { uid: cred.user.uid };
          resolve(currentUser);
        } catch (err) {
          console.warn("Firebase Anonymous Auth not enabled, using device fallback UID:", err);
          currentUser = { uid: getOrCreateFallbackUid() };
          resolve(currentUser);
        }
      }
    });
  });

  return authInitPromise;
}

export function getCurrentUser(): SimpleUser | null {
  if (currentUser) return currentUser;
  if (auth.currentUser) return { uid: auth.currentUser.uid };
  const fallback = localStorage.getItem('damma-local-uid');
  return fallback ? { uid: fallback } : null;
}

(window as any).getCurrentUserUid = () => getCurrentUser()?.uid || null;
