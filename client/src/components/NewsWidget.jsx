import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  Loader2, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { getNews } from '../utils/api';

const NewsWidget = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getNews();
      setNews(response.data || []);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-full min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 h-full min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error}</p>
          <button onClick={fetchNews} className="btn-secondary text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Newspaper className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Government Schemes & News</h3>
        </div>
        <motion.button
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          onClick={fetchNews}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-white/50" />
        </motion.button>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {news.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No news available</p>
          </div>
        ) : (
          news.map((article, index) => (
            <motion.a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className="block p-4 glass-light rounded-xl hover:bg-white/10 transition-all group"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {article.imageUrl && (
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h4>
                  
                  {article.description && (
                    <p className="text-white/50 text-xs mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(article.publishedAt)}
                    </span>
                    {article.source && (
                      <span className="text-emerald-400/70 text-xs">
                        {article.source}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 flex-shrink-0 mt-1 transition-colors" />
              </div>
            </motion.a>
          ))
        )}
      </div>

      {/* View All Link */}
      {news.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <motion.a
            href="https://www.india.gov.in/topics/agriculture"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 4 }}
            className="flex items-center justify-center gap-2 text-white/60 hover:text-emerald-400 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View all government schemes
          </motion.a>
        </div>
      )}
    </motion.div>
  );
};

export default NewsWidget;
