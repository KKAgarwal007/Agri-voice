import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Leaf,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { getCurrentUser, logout, isAuthenticated } from '../utils/api';

const Navigation = ({ onSearch, onAuthClick, user, onLogout, theme, toggleTheme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
              <p className="text-[10px] md:text-xs text-muted md:text-muted hidden sm:block">
                Smart Farming Dashboard
              </p>
            </div>
          </motion.div>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex items-center flex-1 max-w-xl mx-8"
          >
            <div className="relative w-full flex items-center group">
              <div className="absolute left-4 pointer-events-none flex items-center">
                <Search className="w-5 h-5 text-muted group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crops, growing guides, disease info..."
                className="w-full pl-12 pr-28 py-3 glass-input rounded-xl text-main placeholder:text-muted/40 text-sm focus:ring-2 focus:ring-emerald-500/30"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="absolute right-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-sm font-medium shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
              >
                Search
              </motion.button>
            </div>
          </form>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            <NavLink sectionId="dashboard">Dashboard</NavLink>
            <NavLink sectionId="weather">Weather</NavLink>
            <NavLink sectionId="schemes">Schemes</NavLink>

            {/* Translate Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const widget = document.getElementById('google_translate_element');
                if (widget) {
                  widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
                  // Move the widget to be under the button if possible, or just let it appear top-left
                }
              }}
              className="p-2 rounded-xl glass hover:bg-black/5 transition-colors group relative"
              title="Translate Page"
            >
              <Globe className="w-5 h-5 text-emerald-400 group-hover:text-emerald-500 transition-colors" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </motion.button>

            {/* User Button */}
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium max-w-24 truncate text-main">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-heavy rounded-xl overflow-hidden border border-white/10"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="font-medium text-sm text-main">{user.name}</p>
                      <p className="text-muted text-xs truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAuthClick}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white text-sm font-medium shadow-lg"
              >
                <User className="w-4 h-4" />
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg glass"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn-icon"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
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
                  placeholder="Search crops..."
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-white text-sm"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <MobileNavLink sectionId="dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink sectionId="weather" onClick={() => setIsMobileMenuOpen(false)}>
                Weather
              </MobileNavLink>
              <MobileNavLink sectionId="schemes" onClick={() => setIsMobileMenuOpen(false)}>
                Schemes
              </MobileNavLink>

              {user ? (
                <>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="px-4 py-2 text-white/60 text-sm">
                      Signed in as <span className="text-white font-medium">{user.name}</span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                  className="mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  Sign In / Register
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
      className="text-muted hover:text-main text-sm font-medium transition-colors relative group"
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
      className="block w-full text-left py-2 px-4 text-muted hover:text-main hover:bg-white/5 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
};

export default Navigation;
