import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CropSearch from './components/CropSearch';
import VoiceAIChat from './components/VoiceAIChat';
import AuthModal from './components/AuthModal';
import CropDiseaseScanner from './components/CropDiseaseScanner';
import VoiceAssistant from './components/VoiceAssistant';
import MarketPrices from './components/MarketPrices';
import CommunityHub from './components/CommunityHub';
import { getCurrentUser, isAuthenticated } from './utils/api';

function App() {
  const [showCropSearch, setShowCropSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  
  // New modal states
  const [showDiseaseScanner, setShowDiseaseScanner] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showMarketPrices, setShowMarketPrices] = useState(false);
  const [showCommunityHub, setShowCommunityHub] = useState(false);

  // Check for existing user session on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const storedUser = getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowCropSearch(true);
  };

  const handleAuthSuccess = () => {
    const storedUser = getCurrentUser();
    setUser(storedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Handle feature card clicks
  const handleFeatureClick = (feature) => {
    switch (feature) {
      case 'disease-scanner':
        setShowDiseaseScanner(true);
        break;
      case 'voice-assistant':
        setShowVoiceAssistant(true);
        break;
      case 'market-prices':
        setShowMarketPrices(true);
        break;
      case 'community-hub':
        setShowCommunityHub(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-orb w-[600px] h-[600px] -top-48 -left-48 bg-emerald-500/30" />
        <div className="ambient-orb w-[500px] h-[500px] top-1/2 -right-32 bg-cyan-500/20" style={{ animationDelay: '-2s' }} />
        <div className="ambient-orb w-[400px] h-[400px] bottom-0 left-1/4 bg-violet-500/20" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Navigation */}
      <Navigation 
        onSearch={handleSearch} 
        onAuthClick={() => setShowAuthModal(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6">
        <Dashboard user={user} onFeatureClick={handleFeatureClick} />
      </main>

      {/* Crop Search Modal */}
      <AnimatePresence>
        {showCropSearch && (
          <CropSearch
            initialQuery={searchQuery}
            onClose={() => {
              setShowCropSearch(false);
              setSearchQuery('');
            }}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Crop Disease Scanner Modal */}
      <CropDiseaseScanner
        isOpen={showDiseaseScanner}
        onClose={() => setShowDiseaseScanner(false)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistant
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
      />

      {/* Market Prices Modal */}
      <MarketPrices
        isOpen={showMarketPrices}
        onClose={() => setShowMarketPrices(false)}
      />

      {/* Community Hub Modal */}
      <CommunityHub
        isOpen={showCommunityHub}
        onClose={() => setShowCommunityHub(false)}
        user={user}
      />

      {/* Voice AI Chat Widget */}
      <VoiceAIChat user={user} />
    </div>
  );
}

export default App;
