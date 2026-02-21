import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LabourNeeded = () => {
    const [formData, setFormData] = useState({
        workType: '',
        location: '',
        duration: '',
        offeredWage: '',
        labourCount: '',
        notes: ''
    });
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recentPosts, setRecentPosts] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [notification, setNotification] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('labour-applied', (data) => {
            // Update local count if job is visible
            setRecentPosts(prev => prev.map(post =>
                post.id === data.postId ? { ...post, labourCount: data.remainingCount } : post
            ));

            // Show notification if it's for this "farmer" (Guest for demo)
            setNotification(data);
            setTimeout(() => setNotification(null), 5000);
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/labour/posts').then(r => r.json());
            if (res.data) setRecentPosts(res.data);
        } catch (err) {
            console.error('Fetch labour posts error:', err);
        }
    };

    const handleSubmit = async () => {
        if (!formData.workType || !formData.location || !formData.offeredWage) return;
        setLoading(true);
        setAnalysis(null);
        try {
            const res = await fetch('/api/labour/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmerName: 'Guest',
                    workType: formData.workType,
                    location: formData.location,
                    duration: formData.duration,
                    offeredWage: parseInt(formData.offeredWage),
                    labourCount: parseInt(formData.labourCount) || 1,
                    notes: formData.notes
                })
            });
            const result = await res.json();
            if (result.data?.analysis) {
                setAnalysis(result.data.analysis);
                fetchPosts();
            }
        } catch (err) {
            console.error('Labour analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (postId) => {
        try {
            const res = await fetch(`/api/labour/posts/${postId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantName: 'Demo User' })
            });
            const result = await res.json();
            if (result.success) {
                setRecentPosts(prev => prev.map(post =>
                    post.id === postId ? { ...post, labourCount: result.remainingCount } : post
                ));
            } else {
                alert(result.error || 'Failed to apply');
            }
        } catch (err) {
            console.error('Apply error:', err);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-emerald-400 bg-emerald-500/20';
        if (score >= 5) return 'text-amber-400 bg-amber-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
        >
            <h3 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
                👷 Labour Needed
            </h3>

            <div className="glass-heavy rounded-3xl p-6 md:p-8">
                {/* Toggle Form/Results */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setShowForm(true)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${showForm ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'bg-white/10 text-muted hover:text-main'}`}
                    >
                        📝 Post Job
                    </button>
                    <button
                        onClick={() => setShowForm(false)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!showForm ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'bg-white/10 text-muted hover:text-main'}`}
                    >
                        📋 Recent Posts ({recentPosts.length})
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {showForm ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {/* Input Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Work Type *</label>
                                    <select
                                        value={formData.workType}
                                        onChange={(e) => setFormData(p => ({ ...p, workType: e.target.value }))}
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors"
                                    >
                                        <option value="" className="bg-gray-900">Select work type...</option>
                                        <option value="Harvesting" className="bg-gray-900">🌾 Harvesting</option>
                                        <option value="Planting" className="bg-gray-900">🌱 Planting</option>
                                        <option value="Weeding" className="bg-gray-900">🌿 Weeding</option>
                                        <option value="Irrigation" className="bg-gray-900">💧 Irrigation</option>
                                        <option value="Spraying" className="bg-gray-900">🧴 Spraying</option>
                                        <option value="Loading/Unloading" className="bg-gray-900">📦 Loading/Unloading</option>
                                        <option value="Tractor Driving" className="bg-gray-900">🚜 Tractor Driving</option>
                                        <option value="General Labour" className="bg-gray-900">⚒️ General Labour</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Location *</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                                        placeholder="e.g. Village, District, State"
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors placeholder:text-muted/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))}
                                        placeholder="e.g. 3 days, 1 week"
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors placeholder:text-muted/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Offered Wage (₹/day) *</label>
                                    <input
                                        type="number"
                                        value={formData.offeredWage}
                                        onChange={(e) => setFormData(p => ({ ...p, offeredWage: e.target.value }))}
                                        placeholder="e.g. 400"
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors placeholder:text-muted/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Number of Labourers</label>
                                    <input
                                        type="number"
                                        value={formData.labourCount}
                                        onChange={(e) => setFormData(p => ({ ...p, labourCount: e.target.value }))}
                                        placeholder="e.g. 5"
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors placeholder:text-muted/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Additional Notes</label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="e.g. Meals provided, transport available"
                                        className="w-full px-4 py-3 glass rounded-xl text-main bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-colors placeholder:text-muted/40"
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={loading || !formData.workType || !formData.location || !formData.offeredWage}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold text-lg disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Analyzing with AI...
                                    </>
                                ) : (
                                    '🔍 Analyze & Post Job'
                                )}
                            </motion.button>

                            {/* Analysis Results */}
                            <AnimatePresence>
                                {analysis && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 space-y-4"
                                    >
                                        <h4 className="text-main font-semibold text-lg flex items-center gap-2">
                                            🤖 AI Analysis Results
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Fairness Score */}
                                            <div className="glass rounded-2xl p-5 text-center">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-2">Fairness Score</p>
                                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${getScoreColor(analysis.fairnessScore)}`}>
                                                    {analysis.fairnessScore}
                                                </div>
                                                <p className="text-muted text-xs mt-2">/10</p>
                                            </div>

                                            {/* Suggested Wage */}
                                            <div className="glass rounded-2xl p-5 text-center">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-2">Suggested Wage</p>
                                                <p className="text-emerald-400 font-bold text-lg">{analysis.suggestedWageRange}</p>
                                            </div>

                                            {/* Response Rate */}
                                            <div className="glass rounded-2xl p-5 text-center">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-2">Expected Response</p>
                                                <p className="text-amber-400 font-medium text-sm">{analysis.expectedResponseRate}</p>
                                            </div>
                                        </div>

                                        {/* Improvements */}
                                        {analysis.improvements?.length > 0 && (
                                            <div className="glass rounded-2xl p-5">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-3">💡 Improvements</p>
                                                <ul className="space-y-2">
                                                    {analysis.improvements.map((imp, i) => (
                                                        <li key={i} className="text-main text-sm flex items-start gap-2">
                                                            <span className="text-amber-400 mt-0.5">▸</span>
                                                            {imp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Optimized Description */}
                                        {analysis.optimizedDescription && (
                                            <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-3">✨ Optimized Job Listing</p>
                                                <p className="text-main text-sm leading-relaxed">{analysis.optimizedDescription}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="posts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            {recentPosts.length === 0 && (
                                <p className="text-muted text-center py-8">No job posts yet. Create the first one!</p>
                            )}
                            {recentPosts.map((post) => (
                                <div key={post.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-amber-500/20 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-main font-semibold">{post.workType}</p>
                                            <p className="text-muted text-sm">📍 {post.location} • ⏱ {post.duration}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 font-bold">₹{post.offeredWage}/day</p>
                                            <p className="text-muted text-xs">{post.labourCount} workers • {post.time}</p>
                                        </div>
                                    </div>
                                    {post.analysis && (
                                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(post.analysis.fairnessScore)}`}>
                                                Score: {post.analysis.fairnessScore}/10
                                            </span>
                                            <span className="text-muted text-xs">{post.analysis.suggestedWageRange}</span>
                                        </div>
                                    )}
                                    <div className="mt-4 flex justify-end">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleApply(post.id)}
                                            disabled={post.labourCount <= 0}
                                            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:bg-gray-600 transition-all"
                                        >
                                            {post.labourCount > 0 ? 'Apply Now' : 'Job Filled'}
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification Popup */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 20, x: '-50%' }}
                            className="fixed bottom-10 left-1/2 z-50 glass-heavy p-6 rounded-2xl border-2 border-amber-500/50 shadow-2xl min-w-[300px]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-2xl">
                                    👷
                                </div>
                                <div>
                                    <p className="text-main font-bold">New Applicant!</p>
                                    <p className="text-muted text-sm">
                                        <span className="text-amber-400">{notification.applicantName}</span> applied for <span className="text-main">{notification.workType}</span>
                                    </p>
                                    <p className="text-xs text-muted mt-1">Remaining: {notification.remainingCount} workers</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.section>
    );
};

export default LabourNeeded;
