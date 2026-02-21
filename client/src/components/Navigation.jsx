import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { Search, Leaf, Menu, X, User, LogOut, ChevronDown, Globe } from 'lucide-react';
import { getCurrentUser, logout, isAuthenticated } from '../utils/api';

const Navigation = ({ onSearch, onAuthClick, user, onLogout }) => {
  const { currentLanguage, setCurrentLanguage, t, languages } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    onLogout?.();
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass border-b border-white/10"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg glow-primary">
                <Leaf className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 blur-lg"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-['Outfit'] bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Agri-Voice
              </h1>
              <p className="text-[10px] md:text-xs text-white/50 hidden sm:block">
                {t('smart_farming')}
              </p>
            </div>
          </motion.div>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSubmit}
            className="hidden lg:flex items-center flex-1 max-w-xl mx-8"
          >
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-emerald-500/30"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-sm font-medium shadow-lg"
              >
                {t('search_btn')}
              </motion.button>
            </div>
          </form>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <NavLink sectionId="dashboard">{t('dashboard')}</NavLink>
            <NavLink sectionId="weather">{t('weather')}</NavLink>
            <NavLink sectionId="schemes">{t('schemes')}</NavLink>

            {/* Language Selection Section */}
            <div className="flex items-center gap-3">
              {/* Google Translate Container */}
              <div id="google_translate_element" className="google-translate-container"></div>

              {/* Custom Language Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium uppercase">{currentLanguage}</span>
                  <ChevronDown className={`w-3 h-3 text-white/60 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-32 glass-heavy rounded-xl overflow-hidden border border-white/10 z-[60]"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${currentLanguage === lang.code ? 'text-emerald-400 font-bold' : 'text-white/70'
                            }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* User Button */}
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium max-w-24 truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 glass-heavy rounded-xl overflow-hidden border border-white/10 z-[60]"
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-white/50 text-xs truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('sign_out')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAuthClick}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white text-sm font-medium shadow-lg"
              >
                <User className="w-4 h-4" />
                {t('sign_in')}
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden btn-icon"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-white/10"
          >
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_btn') + '...'}
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-white text-sm"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <MobileNavLink sectionId="dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                {t('dashboard')}
              </MobileNavLink>
              <MobileNavLink sectionId="weather" onClick={() => setIsMobileMenuOpen(false)}>
                {t('weather')}
              </MobileNavLink>
              <MobileNavLink sectionId="schemes" onClick={() => setIsMobileMenuOpen(false)}>
                {t('schemes')}
              </MobileNavLink>

              <div className="mt-4 p-4 glass rounded-xl">
                <p className="text-white/50 text-xs uppercase mb-3 px-1 font-semibold tracking-wider">Select Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLanguage(lang.code);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLanguage === lang.code
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {user ? (
                <>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="px-4 py-2 text-white/60 text-sm">
                      {t('welcome')}, <span className="text-white font-medium">{user.name}</span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('sign_out')}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                  className="mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  {t('sign_in')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

const NavLink = ({ children, sectionId }) => {
  const handleClick = (e) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -2 }}
      className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
    </motion.button>
  );
};

const MobileNavLink = ({ children, onClick, sectionId }) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className="block w-full text-left py-2 px-4 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
};

export default Navigation;
