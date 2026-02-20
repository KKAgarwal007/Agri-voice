// Firebase configuration for Google Authentication
// The app works WITHOUT Firebase - users can continue as guest
// To enable Google Auth, follow setup instructions below

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== 'undefined' && 
         !firebaseConfig.apiKey.includes('your_');
};

// Initialize Firebase only if configured
let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
  }
} else {
  console.log('ℹ️ Firebase not configured - Google Sign-in disabled');
}

// Sign in with Google
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return {
      user: {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      },
      idToken
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    if (auth) {
      await signOut(auth);
    }
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Check if Firebase is available
export const isFirebaseAvailable = () => {
  return !!auth && !!googleProvider;
};

// Get current user
export const getCurrentFirebaseUser = () => {
  return auth?.currentUser || null;
};

// Auth state listener
export const onAuthChange = (callback) => {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {}; // No-op unsubscribe
};

export { auth };
