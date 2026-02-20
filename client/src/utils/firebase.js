// Firebase configuration for Google Authentication

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Verify all required keys exist and are real values
const isFirebaseConfigured = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every(
    (key) =>
      firebaseConfig[key] &&
      firebaseConfig[key] !== 'undefined' &&
      !String(firebaseConfig[key]).startsWith('your_')
  );
};

// Initialize Firebase
let app = null;
let auth = null;
let googleProvider = null;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);

    // Persist session across tabs/refreshes
    // (Firebase default is 'local' – persists across browser sessions)

    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase not configured – add VITE_FIREBASE_* keys to .env');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// ─── Sign in with Google (popup, falls back to redirect on mobile) ────────────
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return extractUserData(result);
  } catch (error) {
    // Popup blocked (common on mobile/Safari) → fall back to redirect
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-cancelled-by-browser'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null; // page will redirect; result handled in handleRedirectResult
    }
    throw error;
  }
};

// ─── Handle redirect result (call this on app startup) ───────────────────────
export const handleRedirectResult = async () => {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (result) return extractUserData(result);
    return null;
  } catch (error) {
    console.error('Redirect result error:', error);
    throw error;
  }
};

// ─── Sign out ─────────────────────────────────────────────────────────────────
export const signOutUser = async () => {
  try {
    if (auth) await signOut(auth);
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// ─── Auth state listener ──────────────────────────────────────────────────────
export const onAuthChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => { };
  }
  return onAuthStateChanged(auth, callback);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const isFirebaseAvailable = () => !!auth && !!googleProvider;
export const getCurrentFirebaseUser = () => auth?.currentUser || null;

function extractUserData(result) {
  const user = result.user;
  return {
    firebaseUser: user,
    user: {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    },
    idToken: null, // fetched separately when needed
  };
}

// Async helper used by AuthModal to get a fresh ID token
export const getIdToken = async () => {
  const user = auth?.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
};

export { auth };
