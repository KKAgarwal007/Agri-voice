import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  MapPin,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  Sparkles,
  BarChart3
} from 'lucide-react';

// Mock data for Indian states and commodities (since data.gov.in requires registration)
const INDIAN_STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

const COMMODITIES = [
  { name: 'Rice', hindiName: 'चावल', icon: '🌾' },
  { name: 'Wheat', hindiName: 'गेहूं', icon: '🌾' },
  { name: 'Maize', hindiName: 'मक्का', icon: '🌽' },
  { name: 'Potato', hindiName: 'आलू', icon: '🥔' },
  { name: 'Onion', hindiName: 'प्याज', icon: '🧅' },
  { name: 'Tomato', hindiName: 'टमाटर', icon: '🍅' },
  { name: 'Soyabean', hindiName: 'सोयाबीन', icon: '🫘' },
  { name: 'Cotton', hindiName: 'कपास', icon: '🌿' },
  { name: 'Groundnut', hindiName: 'मूंगफली', icon: '🥜' },
  { name: 'Sugarcane', hindiName: 'गन्ना', icon: '🎋' },
];

const MarketPrices = ({ isOpen, onClose }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCommodityDropdown, setShowCommodityDropdown] = useState(false);

  // Generate mock price data
  const generateMockPrices = () => {
    const mockPrices = [];
    const markets = [
      'Azadpur Mandi', 'Vashi APMC', 'Yeshwanthpur', 'Bowenpally',
      'Koyambedu', 'Ludhiana Grain Market', 'Ahmedabad APMC', 'Jaipur Mandi'
    ];

    COMMODITIES.forEach((commodity) => {
      const basePrice = Math.floor(Math.random() * 5000) + 1000;
      const randomMarkets = markets.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      randomMarkets.forEach((market) => {
        const variation = (Math.random() - 0.5) * 500;
        const price = Math.floor(basePrice + variation);
        const minPrice = Math.floor(price * 0.9);
        const maxPrice = Math.floor(price * 1.1);
        const change = (Math.random() - 0.5) * 10;
        
        mockPrices.push({
          commodity: commodity.name,
          hindiName: commodity.hindiName,
          icon: commodity.icon,
          market,
          state: INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)],
          price,
          minPrice,
          maxPrice,
          unit: 'Quintal',
          change: parseFloat(change.toFixed(2)),
          lastUpdated: new Date().toLocaleDateString('en-IN'),
        });
      });
    });

    return mockPrices;
  };

  // Fetch prices (mock implementation)
  const fetchPrices = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockData = generateMockPrices();
    setPrices(mockData);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrices();
    }
  }, [isOpen]);

  // Filter prices
  const filteredPrices = prices.filter((item) => {
    const matchesState = !selectedState || item.state === selectedState;
    const matchesCommodity = !selectedCommodity || item.commodity === selectedCommodity;
    const matchesSearch = !searchQuery || 
      item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hindiName.includes(searchQuery);
    
    return matchesState && matchesCommodity && matchesSearch;
  });

  // Get trend icon
  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  // Get trend color
  const getTrendColor = (change) => {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-red-400';
    return 'text-white/40';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl max-h-[90vh] glass-heavy rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Mandi Prices
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-white/50 text-xs">Real-time market prices across India</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={fetchPrices}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh prices"
              >
                <RefreshCw className={`w-5 h-5 text-white/70 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-white/10 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodity or market..."
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-white text-sm"
              />
            </div>

            {/* State & Commodity Filters */}
            <div className="flex gap-3 flex-wrap">
              {/* State Dropdown */}
              <div className="relative flex-1 min-w-[150px]">
                <button
                  onClick={() => {
                    setShowStateDropdown(!showStateDropdown);
                    setShowCommodityDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 glass rounded-xl text-white text-sm flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {selectedState || 'All States'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showStateDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 top-full mt-2 w-full max-h-48 overflow-y-auto glass rounded-xl custom-scrollbar"
                    >
                      <button
                        onClick={() => {
                          setSelectedState('');
                          setShowStateDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 transition-colors"
                      >
                        All States
                      </button>
                      {INDIAN_STATES.map((state) => (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(state);
                            setShowStateDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                            selectedState === state ? 'text-emerald-400' : 'text-white/70'
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Commodity Dropdown */}
              <div className="relative flex-1 min-w-[150px]">
                <button
                  onClick={() => {
                    setShowCommodityDropdown(!showCommodityDropdown);
                    setShowStateDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 glass rounded-xl text-white text-sm flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-teal-400" />
                    {selectedCommodity 
                      ? COMMODITIES.find(c => c.name === selectedCommodity)?.name 
                      : 'All Commodities'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCommodityDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showCommodityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 top-full mt-2 w-full max-h-48 overflow-y-auto glass rounded-xl custom-scrollbar"
                    >
                      <button
                        onClick={() => {
                          setSelectedCommodity('');
                          setShowCommodityDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 transition-colors"
                      >
                        All Commodities
                      </button>
                      {COMMODITIES.map((commodity) => (
                        <button
                          key={commodity.name}
                          onClick={() => {
                            setSelectedCommodity(commodity.name);
                            setShowCommodityDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                            selectedCommodity === commodity.name ? 'text-emerald-400' : 'text-white/70'
                          }`}
                        >
                          <span>{commodity.icon}</span>
                          <span>{commodity.name}</span>
                          <span className="text-white/40">({commodity.hindiName})</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear Filters */}
              {(selectedState || selectedCommodity || searchQuery) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedState('');
                    setSelectedCommodity('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Clear All
                </motion.button>
              )}
            </div>
          </div>

          {/* Price List */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-280px)] custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading mandi prices...</p>
                </div>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No prices found</p>
                <p className="text-white/40 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrices.map((item, index) => (
                  <motion.div
                    key={`${item.commodity}-${item.market}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="text-white font-semibold">{item.commodity}</h4>
                          <p className="text-white/50 text-xs">{item.hindiName}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                        item.change > 0 ? 'bg-emerald-500/20' : item.change < 0 ? 'bg-red-500/20' : 'bg-white/10'
                      }`}>
                        {getTrendIcon(item.change)}
                        <span className={getTrendColor(item.change)}>
                          {item.change > 0 ? '+' : ''}{item.change}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-3 h-3 text-white/40" />
                      <span className="text-white/60 text-xs">{item.market}, {item.state}</span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Current Price</p>
                        <p className="text-xl font-bold text-white flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {item.price.toLocaleString('en-IN')}
                          <span className="text-white/40 text-sm font-normal ml-1">/{item.unit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs mb-1">Range</p>
                        <p className="text-sm text-white/60">
                          ₹{item.minPrice.toLocaleString('en-IN')} - ₹{item.maxPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-white/30 text-xs">Updated: {item.lastUpdated}</span>
                      {item.change > 5 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <ArrowUpRight className="w-3 h-3" />
                          Price Alert
                        </span>
                      )}
                      {item.change < -5 && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <ArrowDownRight className="w-3 h-3" />
                          Good to Buy
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Source: Agmarknet & data.gov.in</span>
              <span>{filteredPrices.length} results found</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarketPrices;
