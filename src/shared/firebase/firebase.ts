// src/shared/firebase/firebase.ts
// Firebase 초기화 및 로컬 모드 폴백 지원
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  Auth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  nickname: string;
  provider: 'guest' | 'google' | 'email' | 'phone';
  email: string | null;
  phoneE164: string | null;
  selectedCharacterSlot: number;
  createdAt: number;
  lastLoginAt: number;
}

export interface SessionRecord {
  sessionId?: string;
  uid: string;
  nickname: string;
  duration: number;
  difficulty: string;
  missLimit: number;
  score: number;
  maxCombo: number;
  hits: number;
  misses: number;
  centerHits: number;
  echoHits: number;
  clayHits: number;
  copterHits: number;
  boomHits: number;
  ufoHits: number;
  chickHits: number;
  outcome: 'success' | 'failure';
  completed: boolean;
  startedAt: number;
  endedAt: number;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDikamnG3FNfvF_6oh11gCCsEypFE4nUUA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "claypop-c5eaf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "claypop-c5eaf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "claypop-c5eaf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "978133657237",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:978133657237:web:4ffc85537d3fe0a2b39d9c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J1LDK6B95K",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Firebase init failed, fallback to local guest mode:', err);
  }
}

// 로컬 게스트 스토리지 관리 (Firebase 미설정 시)
const LOCAL_USER_KEY = 'claypop.local_user';
const LOCAL_SESSIONS_KEY = 'claypop.local_sessions';

export function getLocalUser(): UserProfile | null {
  const data = localStorage.getItem(LOCAL_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveLocalUser(user: UserProfile): void {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

export function removeLocalUser(): void {
  localStorage.removeItem(LOCAL_USER_KEY);
}

export function getLocalSessions(): SessionRecord[] {
  const data = localStorage.getItem(LOCAL_SESSIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLocalSession(session: SessionRecord): void {
  const list = getLocalSessions();
  list.unshift(session);
  localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(list.slice(0, 50)));
}

export {
  app,
  auth,
  db,
  analytics,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
};
export type { User };
