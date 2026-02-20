import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Leaf, Droplets, Sun, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { searchCrops, getCropDetails } from '../utils/api';

// Crop-specific SVG Icons
const CropIcons = {
  // Wheat icon
  wheat: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v18M12 6c-2-2-4-2-4 0s2 4 4 4M12 6c2-2 4-2 4 0s-2 4-4 4M12 10c-2-2-4-2-4 0s2 4 4 4M12 10c2-2 4-2 4 0s-2 4-4 4M12 14c-2-2-4-2-4 0s2 4 4 4M12 14c2-2 4-2 4 0s-2 4-4 4" strokeLinecap="round" />
    </svg>
  ),
  // Rice icon
  rice: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21V8M8 21V12M16 21V12" strokeLinecap="round" />
      <ellipse cx="12" cy="5" rx="2" ry="3" fill="currentColor" opacity="0.3" />
      <ellipse cx="8" cy="9" rx="1.5" ry="2.5" fill="currentColor" opacity="0.3" />
      <ellipse cx="16" cy="9" rx="1.5" ry="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  // Tomato icon
  tomato: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="13" r="8" fill="#ef4444" opacity="0.8" />
      <path d="M12 5c-1 0-2 1-2 2M12 5c1 0 2 1 2 2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 4l2-2 2 2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // Potato icon
  potato: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <ellipse cx="12" cy="12" rx="9" ry="7" fill="#d97706" opacity="0.8" />
      <circle cx="9" cy="10" r="1" fill="#92400e" opacity="0.5" />
      <circle cx="14" cy="11" r="0.8" fill="#92400e" opacity="0.5" />
      <circle cx="11" cy="14" r="0.6" fill="#92400e" opacity="0.5" />
    </svg>
  ),
  // Cotton icon
  cotton: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="10" r="4" fill="white" opacity="0.9" />
      <circle cx="8" cy="12" r="3" fill="white" opacity="0.9" />
      <circle cx="16" cy="12" r="3" fill="white" opacity="0.9" />
      <circle cx="10" cy="14" r="2.5" fill="white" opacity="0.9" />
      <circle cx="14" cy="14" r="2.5" fill="white" opacity="0.9" />
      <path d="M12 17v4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  // Sugarcane icon
  sugarcane: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20" strokeLinecap="round" />
      <path d="M12 4h3M12 8h-3M12 12h3M12 16h-3" strokeLinecap="round" />
      <path d="M8 2c2 1 2 3 4 3M16 2c-2 1-2 3-4 3" stroke="#22c55e" strokeLinecap="round" />
    </svg>
  ),
  // Maize/Corn icon
  maize: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <ellipse cx="12" cy="12" rx="4" ry="8" fill="#fbbf24" opacity="0.9" />
      <path d="M8 6c-2-1-4 0-4 2M16 6c2-1 4 0 4 2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 4c-3-1-5 1-5 3M16 4c3-1 5 1 5 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="9" r="1" fill="#f59e0b" /><circle cx="14" cy="9" r="1" fill="#f59e0b" />
      <circle cx="10" cy="12" r="1" fill="#f59e0b" /><circle cx="14" cy="12" r="1" fill="#f59e0b" />
      <circle cx="10" cy="15" r="1" fill="#f59e0b" /><circle cx="14" cy="15" r="1" fill="#f59e0b" />
    </svg>
  ),
  // Soybean icon
  soybean: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <ellipse cx="8" cy="12" rx="3" ry="5" fill="#84cc16" opacity="0.8" transform="rotate(-20 8 12)" />
      <ellipse cx="16" cy="12" rx="3" ry="5" fill="#84cc16" opacity="0.8" transform="rotate(20 16 12)" />
      <ellipse cx="12" cy="12" rx="3" ry="5" fill="#a3e635" opacity="0.9" />
    </svg>
  ),
  // Onion icon
  onion: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <ellipse cx="12" cy="14" rx="7" ry="6" fill="#a855f7" opacity="0.8" />
      <path d="M12 8V3M10 4l2-2 2 2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14c0-3 4-5 4-5s4 2 4 5" stroke="#7c3aed" strokeWidth="0.5" opacity="0.5" />
    </svg>
  ),
  // Carrot icon
  carrot: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <path d="M12 6L8 22c0 0 3 1 4 1s4-1 4-1L12 6z" fill="#f97316" opacity="0.9" />
      <path d="M12 6c-2-1-3-3-1-5M12 6c0-2 1-4 3-4M12 6c2-1 4-2 4 0" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // Chili icon
  chili: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <path d="M10 6c-4 2-6 8-5 14 0 0 3-1 4-4s2-8 1-10z" fill="#dc2626" opacity="0.9" />
      <path d="M10 6c0-2 2-4 4-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  // Mango icon
  mango: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <ellipse cx="12" cy="13" rx="6" ry="8" fill="#fbbf24" opacity="0.9" transform="rotate(-15 12 13)" />
      <path d="M14 5c1-2 3-3 5-2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // Default leaf icon
  default: (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21c-4-4-8-8-8-13 0-4 4-6 8-6s8 2 8 6c0 5-4 9-8 13z" fill="currentColor" opacity="0.2" />
      <path d="M12 21V8M8 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

// Get appropriate icon based on crop name
const getCropIcon = (cropName) => {
  if (!cropName) return CropIcons.default;
  
  const name = cropName.toLowerCase();
  
  if (name.includes('wheat') || name.includes('triticum')) return CropIcons.wheat;
  if (name.includes('rice') || name.includes('oryza') || name.includes('paddy')) return CropIcons.rice;
  if (name.includes('tomato') || name.includes('lycopersicum')) return CropIcons.tomato;
  if (name.includes('potato') || name.includes('tuberosum')) return CropIcons.potato;
  if (name.includes('cotton') || name.includes('gossypium')) return CropIcons.cotton;
  if (name.includes('sugarcane') || name.includes('saccharum')) return CropIcons.sugarcane;
  if (name.includes('maize') || name.includes('corn') || name.includes('zea')) return CropIcons.maize;
  if (name.includes('soy') || name.includes('glycine')) return CropIcons.soybean;
  if (name.includes('onion') || name.includes('allium')) return CropIcons.onion;
  if (name.includes('carrot') || name.includes('daucus')) return CropIcons.carrot;
  if (name.includes('chili') || name.includes('chilli') || name.includes('pepper') || name.includes('capsicum')) return CropIcons.chili;
  if (name.includes('mango') || name.includes('mangifera')) return CropIcons.mango;
  
  return CropIcons.default;
};

// Get gradient colors based on crop type
const getCropGradient = (cropName) => {
  if (!cropName) return 'from-emerald-500/30 to-cyan-500/30';
  
  const name = cropName.toLowerCase();
  
  if (name.includes('wheat') || name.includes('triticum')) return 'from-amber-500/30 to-yellow-500/30';
  if (name.includes('rice') || name.includes('oryza')) return 'from-lime-500/30 to-emerald-500/30';
  if (name.includes('tomato')) return 'from-red-500/30 to-orange-500/30';
  if (name.includes('potato')) return 'from-amber-600/30 to-yellow-600/30';
  if (name.includes('cotton')) return 'from-gray-300/30 to-white/30';
  if (name.includes('sugarcane')) return 'from-green-500/30 to-lime-500/30';
  if (name.includes('maize') || name.includes('corn')) return 'from-yellow-400/30 to-amber-400/30';
  if (name.includes('soy')) return 'from-lime-400/30 to-green-400/30';
  if (name.includes('onion')) return 'from-purple-500/30 to-violet-500/30';
  if (name.includes('carrot')) return 'from-orange-500/30 to-amber-500/30';
  if (name.includes('chili') || name.includes('pepper')) return 'from-red-600/30 to-red-400/30';
  if (name.includes('mango')) return 'from-yellow-500/30 to-orange-400/30';
  
  return 'from-emerald-500/30 to-cyan-500/30';
};

const CropSearch = ({ initialQuery, onClose }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await searchCrops(searchQuery);
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleCropSelect = async (crop) => {
    setSelectedCrop(crop);
    setDetailsLoading(true);
    try {
      const response = await getCropDetails(crop.id);
      setCropDetails(response.data);
    } catch (error) {
      console.error('Details error:', error);
      setCropDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedCrop(null);
    setCropDetails(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-heavy rounded-3xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedCrop && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white rotate-180" />
                </motion.button>
              )}
              <h2 className="text-xl font-bold font-['Outfit'] text-white">
                {selectedCrop ? selectedCrop.commonName : 'Global Crop Search'}
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>

          {/* Search Input */}
          {!selectedCrop && (
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for any crop (e.g., Wheat, Rice, Tomato...)"
                  className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-white text-base"
                  autoFocus
                />
              </div>
            </form>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {selectedCrop ? (
            <CropDetailsView crop={selectedCrop} details={cropDetails} loading={detailsLoading} />
          ) : (
            <CropResultsList
              results={results}
              loading={loading}
              onSelect={handleCropSelect}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const CropResultsList = ({ results, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-white/60">Searching crops...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
          <Search className="w-8 h-8 text-white/40" />
        </div>
        <p className="text-white/60 mb-2">No crops found</p>
        <p className="text-white/40 text-sm">Try searching for wheat, rice, tomato, or cotton</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {results.map((crop, index) => (
        <motion.button
          key={crop.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(crop)}
          className="w-full text-left p-4 glass rounded-xl hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCropGradient(crop.commonName)} flex items-center justify-center flex-shrink-0 text-emerald-400`}>
              {crop.imageUrl ? (
                <img
                  src={crop.imageUrl}
                  alt={crop.commonName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                getCropIcon(crop.commonName)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors">
                {crop.commonName || crop.scientificName}
              </h3>
              <p className="text-white/50 text-sm italic truncate">
                {crop.scientificName}
              </p>
              <p className="text-white/40 text-xs mt-1">
                Family: {crop.family || 'Unknown'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};

const CropDetailsView = ({ crop, details, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-white/60">Loading crop details...</p>
      </div>
    );
  }

  const growthInfo = details?.growth || {
    soilTexture: 'Loamy to clay loam',
    soilPh: '6.0 - 7.5',
    waterRequirement: 'Moderate',
    sunExposure: 'Full sun (6-8 hours)',
    growingSeason: 'Varies by region',
    harvestTime: '90-120 days'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getCropGradient(crop.commonName)} flex items-center justify-center flex-shrink-0 text-emerald-400`}>
            <div className="scale-150">
              {getCropIcon(crop.commonName)}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {crop.commonName}
            </h3>
            <p className="text-emerald-400 italic mb-2">{crop.scientificName}</p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-success">
                {crop.family}
              </span>
              <span className="badge badge-info">
                {crop.genus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Growing Requirements */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-400" />
          Growing Requirements
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            icon={<Droplets className="w-5 h-5" />}
            label="Soil Type"
            value={growthInfo.soilTexture}
            color="cyan"
          />
          <InfoCard
            icon={<div className="text-sm font-bold">pH</div>}
            label="Soil pH"
            value={growthInfo.soilPh}
            color="violet"
          />
          <InfoCard
            icon={<Droplets className="w-5 h-5" />}
            label="Water Needs"
            value={growthInfo.waterRequirement}
            color="blue"
          />
          <InfoCard
            icon={<Sun className="w-5 h-5" />}
            label="Sun Exposure"
            value={growthInfo.sunExposure}
            color="amber"
          />
          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            label="Growing Season"
            value={growthInfo.growingSeason}
            color="emerald"
          />
          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            label="Harvest Time"
            value={growthInfo.harvestTime}
            color="orange"
          />
        </div>
      </div>

      {/* Tips Section */}
      <div className="glass rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">💡 Quick Tips</h4>
        <ul className="space-y-2 text-white/70 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            Ensure proper soil preparation before sowing for best results
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            Regular monitoring for pests and diseases is essential
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            Use our AI assistant for personalized growing advice
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

const InfoCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
    violet: 'from-violet-500/20 to-violet-500/5 text-violet-400',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400',
  };

  return (
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={colorClasses[color].split(' ').pop()}>{icon}</span>
        <span className="text-white/50 text-sm">{label}</span>
      </div>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
};

export default CropSearch;
