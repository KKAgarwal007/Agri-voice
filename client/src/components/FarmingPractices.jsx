import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Droplets,
    IndianRupee,
    TrendingUp,
    Sparkles,
    ChevronRight,
    Info,
    Loader2,
    X
} from 'lucide-react';
import { sendChatMessage } from '../utils/api';

const RECOMMENDED_CROPS = [
    {
        id: 'rice',
        name: 'Rice (Basmati)',
        image: '/images/rice.png',
        mandiPrice: '₹4,500/Quintal',
        estimatedProfit: '₹45,000/Acre',
        waterRequirement: 'High',
        suitability: 'High',
        description: 'Perfect for clay soil with high water availability.'
    },
    {
        id: 'wheat',
        name: 'Wheat (Sharbati)',
        image: '/images/wheat.png',
        mandiPrice: '₹2,800/Quintal',
        estimatedProfit: '₹32,000/Acre',
        waterRequirement: 'Medium',
        suitability: 'Optimal',
        description: 'Thrives in loamy soil during the Rabi season.'
    },
    {
        id: 'cotton',
        name: 'Cotton (Long Staple)',
        image: '/images/cotton.png',
        mandiPrice: '₹7,200/Quintal',
        estimatedProfit: '₹55,000/Acre',
        waterRequirement: 'Medium',
        suitability: 'Excellent',
        description: 'Best suited for black soil with moderate irrigation.'
    }
];

const FarmingPractices = () => {
    const [waterLevel, setWaterLevel] = useState('Medium');
    const [selectedPractice, setSelectedPractice] = useState(null);
    const [aiAdvice, setAiAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const getAIAdvice = async (crop) => {
        setSelectedPractice(crop);
        setLoading(true);
        setAiAdvice('');

        try {
            const prompt = `Provide farming best practices for growing ${crop.name}. 
      Details to include:
      1. Why is it suitable for ${waterLevel} water availability?
      2. Estimated profit analysis (approx ₹${crop.estimatedProfit}).
      3. Soil management tips.
      4. Current market trend (Mandi price: ${crop.mandiPrice}).
      Keep it concise and encouraging for a farmer.`;

            const response = await sendChatMessage(prompt);
            setAiAdvice(response.response);
        } catch (error) {
            console.error('Error fetching AI advice:', error);
            setAiAdvice("Sorry, I couldn't fetch the AI advice right now. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 h-full flex flex-col"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-main">Farming Best Practices</h3>
                    <p className="text-muted text-xs">AI-driven recommendations for your soil</p>
                </div>
            </div>

            {/* Water Availability Input */}
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        Water Availability
                    </label>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${waterLevel === 'High' ? 'bg-cyan-500/20 text-cyan-400' :
                            waterLevel === 'Medium' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-amber-500/20 text-amber-400'
                        }`}>
                        {waterLevel}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map((level) => (
                        <button
                            key={level}
                            onClick={() => setWaterLevel(level)}
                            className={`py-2 rounded-lg text-xs font-medium transition-all ${waterLevel === level
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Practice Cards */}
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {RECOMMENDED_CROPS.filter(crop =>
                    waterLevel === 'High' ? true :
                        waterLevel === 'Medium' ? crop.waterRequirement !== 'High' :
                            crop.waterRequirement === 'Low' || crop.id === 'wheat' // Simple logic for mock
                ).map((crop) => (
                    <motion.div
                        key={crop.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => getAIAdvice(crop)}
                    >
                        <div className="flex gap-4 p-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={crop.image} alt={crop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-white font-semibold text-sm truncate">{crop.name}</h4>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-white/50 mb-2">
                                    <span className="flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3 text-emerald-400" />
                                        {crop.mandiPrice}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-cyan-400" />
                                        {crop.estimatedProfit}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70">
                                        {crop.suitability} Suitability
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Advice Modal/Expansion */}
            <AnimatePresence>
                {selectedPractice && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 relative"
                    >
                        <button
                            onClick={() => setSelectedPractice(null)}
                            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-white/40" />
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                            <BotIcon />
                            <h5 className="text-sm font-bold text-emerald-400">AI Analysis: {selectedPractice.name}</h5>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 py-4">
                                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                <span className="text-xs text-muted">Analyzing crop suitability...</span>
                            </div>
                        ) : (
                            <div className="text-xs text-white/80 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                                {aiAdvice}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const BotIcon = () => (
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-white" />
    </div>
);

export default FarmingPractices;
