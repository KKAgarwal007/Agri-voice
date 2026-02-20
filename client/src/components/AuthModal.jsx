import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, Loader2, AlertCircle } from 'lucide-react';
import { signInWithGoogle, isFirebaseAvailable } from '../utils/firebase';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firebaseReady = isFirebaseAvailable();

  const handleGoogleSignIn = async () => {
    if (!firebaseReady) {
      setError('Google Sign-in not configured. Click "Continue as Guest" to use the app.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();
      
      localStorage.setItem('agri_token', result.idToken);
      localStorage.setItem('agri_user', JSON.stringify(result.user));
      
      // Sync with backend
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.idToken}`
          },
          body: JSON.stringify({
            uid: result.user.uid,
            name: result.user.name,
            email: result.user.email,
            photoURL: result.user.photoURL
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.token) localStorage.setItem('agri_token', data.token);
          if (data.user) localStorage.setItem('agri_user', JSON.stringify(data.user));
        }
      } catch (backendError) {
        console.log('Backend sync skipped');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        setError('Firebase not configured. Please continue as guest.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else {
        setError('Sign-in failed. Please continue as guest.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick guest login with demo data
  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest Farmer',
      email: 'guest@agrivoice.app',
      isGuest: true
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
              animate={{ boxShadow: ['0 0 20px rgba(16, 185, 129, 0.3)', '0 0 40px rgba(16, 185, 129, 0.5)', '0 0 20px rgba(16, 185, 129, 0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Leaf className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white font-['Outfit'] mb-2">
              Welcome to Agri-Voice
            </h2>
            <p className="text-white/60 text-sm">
              Sign in to save preferences and chat history
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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Firebase not configured notice */}
            {!firebaseReady && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs">
                <p className="font-medium mb-1">ℹ️ Demo Mode</p>
                <p>Firebase not configured. Use "Continue as Guest" to explore all features!</p>
              </div>
            )}

            {/* Google Sign-In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading || !firebaseReady}
              whileHover={{ scale: firebaseReady ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold shadow-lg transition-all ${
                firebaseReady 
                  ? 'bg-white text-gray-800 hover:shadow-xl' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
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

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Continue as Guest - always works */}
            <motion.button
              onClick={handleGuestLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-white text-sm font-medium transition-colors hover:from-emerald-500/30 hover:to-cyan-500/30"
            >
              ✨ Continue as Guest
            </motion.button>

            <p className="mt-6 text-center text-white/40 text-xs">
              All features work in guest mode!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
