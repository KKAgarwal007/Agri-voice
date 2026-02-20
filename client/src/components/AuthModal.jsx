import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  signInWithGoogle,
  handleRedirectResult,
  signOutUser,
  isFirebaseAvailable,
  getIdToken,
} from '../utils/firebase';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Sync Firebase user with our backend and persist tokens
async function syncWithBackend(userData) {
  try {
    const idToken = await getIdToken();

    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Store our backend JWT (preferred) or fallback to Firebase token
      if (data.token) localStorage.setItem('agri_token', data.token);
      if (data.user) localStorage.setItem('agri_user', JSON.stringify(data.user));
      return data.user || userData;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Backend sync failed with status ' + response.status);
    }
  } catch (err) {
    console.error('Backend sync error:', err.message);
    // Throw the error so the UI can display it
    throw new Error('Backend auth error: ' + err.message);
  }
}

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const firebaseReady = isFirebaseAvailable();

  // Handle redirect-based sign-in result (mobile / popup-blocked flow)
  useEffect(() => {
    if (!firebaseReady) return;

    handleRedirectResult()
      .then(async (result) => {
        if (!result) return;
        setLoading(true);
        try {
          const syncedUser = await syncWithBackend(result.user);
          setSuccessMsg(`Welcome, ${syncedUser.name || syncedUser.email}! 🎉`);
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1200);
        } finally {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
        setError('Sign-in failed after redirect. Please try again.');
      });
  }, [firebaseReady]);

  const handleGoogleSignIn = async () => {
    if (!firebaseReady) {
      setError('Firebase is not configured properly. Please check your .env file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await signInWithGoogle();

      // result is null when redirect was triggered (mobile fallback)
      if (!result) return;

      const syncedUser = await syncWithBackend(result.user);
      setSuccessMsg(`Welcome, ${syncedUser.name || syncedUser.email}! 🎉`);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Google sign-in error:', err);

      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        setError('Firebase is not configured. Please check your .env file.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Silently ignore – another popup was opened
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not authorized in Firebase Console. Add "localhost" to Authorized Domains in Authentication → Settings.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled. Enable it in Firebase Console → Authentication → Sign-in Method.');
      } else {
        setError(`Sign-in error: ${err.message || 'Unknown error. Please try again.'}`);
      }
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest Farmer',
      email: 'guest@agrivoice.app',
      isGuest: true,
    };
    localStorage.setItem('agri_user', JSON.stringify(guestUser));
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm glass-heavy rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 text-center bg-gradient-to-b from-emerald-500/10 to-transparent">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(16,185,129,0.3)',
                  '0 0 40px rgba(16,185,129,0.5)',
                  '0 0 20px rgba(16,185,129,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Leaf className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white font-['Outfit'] mb-2">
              Welcome to Agri-Voice
            </h2>
            <p className="text-white/60 text-sm">
              Sign in to save your preferences and chat history
            </p>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>

          <div className="p-6 pt-0">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading || !!successMsg}
              whileHover={{ scale: firebaseReady && !loading ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold shadow-lg transition-all ${firebaseReady && !loading && !successMsg
                ? 'bg-white text-gray-800 hover:shadow-xl cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </motion.button>

            {!firebaseReady && (
              <p className="text-center text-amber-400/80 text-xs mt-2">
                ⚠️ Firebase not ready – check your .env configuration
              </p>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Guest Login */}
            <motion.button
              onClick={handleGuestLogin}
              disabled={loading || !!successMsg}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-white text-sm font-medium transition-colors hover:from-emerald-500/30 hover:to-cyan-500/30 disabled:opacity-50"
            >
              ✨ Continue as Guest
            </motion.button>

            <p className="mt-4 text-center text-white/40 text-xs">
              All features are available in guest mode!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
