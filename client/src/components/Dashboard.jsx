import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Leaf, CloudSun } from 'lucide-react';
import WeatherWidget from './WeatherWidget';
import NewsWidget from './NewsWidget';
import LabourNeeded from './LabourNeeded';
import FarmingPractices from './FarmingPractices';

const Dashboard = ({ onFeatureClick }) => {
  const currentHour = new Date().getHours();
  let greeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good Afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good Evening';
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Hero/Dashboard Section */}
      <motion.section id="dashboard" variants={itemVariants} className="relative overflow-hidden scroll-mt-24">
        <div className="glass-heavy rounded-3xl p-8 md:p-12 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-pink-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">
                AI-Powered Dashboard
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-bold font-['Outfit'] mb-4"
            >
              <span className="text-main">{greeting}, </span>
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Kisan!
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted text-lg max-w-2xl mb-8"
            >
              Your personalized farming assistant is ready. Check weather alerts,
              explore government schemes, and get AI-powered advice for better yields.
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <QuickStat
                icon={<CloudSun className="w-5 h-5" />}
                label="Weather"
                value="Clear"
                color="cyan"
              />
              <QuickStat
                icon={<Leaf className="w-5 h-5" />}
                label="Soil Health"
                value="Good"
                color="emerald"
              />
              <QuickStat
                icon={<TrendingUp className="w-5 h-5" />}
                label="Market Trend"
                value="↑ 2.3%"
                color="violet"
              />
              <QuickStat
                icon={<Sparkles className="w-5 h-5" />}
                label="AI Insights"
                value="3 New"
                color="amber"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <motion.div id="weather" variants={itemVariants} className="scroll-mt-24">
          <WeatherWidget />
        </motion.div>

        {/* Farming Practices Section */}
        <motion.div variants={itemVariants}>
          <FarmingPractices />
        </motion.div>

        {/* News/Schemes Widget */}
        <motion.div id="schemes" variants={itemVariants} className="scroll-mt-24 md:col-span-2 lg:col-span-1">
          <NewsWidget />
        </motion.div>
      </div>

      {/* Feature Cards */}
      <motion.section variants={itemVariants}>
        <h3 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            title="Crop Disease Scanner"
            description="Upload a photo of your crop to identify diseases instantly"
            icon="🔬"
            gradient="from-rose-500/20 to-orange-500/20"
            borderGradient="from-rose-500 to-orange-500"
            onClick={() => onFeatureClick?.('disease-scanner')}
          />
          <FeatureCard
            title="Voice Assistant"
            description="Ask farming questions in your language using voice"
            icon="🎙️"
            gradient="from-violet-500/20 to-purple-500/20"
            borderGradient="from-violet-500 to-purple-500"
            onClick={() => onFeatureClick?.('voice-assistant')}
          />
          <FeatureCard
            title="Market Prices"
            description="Check real-time mandi prices for your crops"
            icon="📊"
            gradient="from-emerald-500/20 to-teal-500/20"
            borderGradient="from-emerald-500 to-teal-500"
            onClick={() => onFeatureClick?.('market-prices')}
          />
          <FeatureCard
            title="Community Hub"
            description="Connect, chat, pay, and call fellow farmers"
            icon="👥"
            gradient="from-indigo-500/20 to-purple-500/20"
            borderGradient="from-indigo-500 to-purple-500"
            onClick={() => onFeatureClick?.('community-hub')}
          />
          <FeatureCard
            title="Expert Advice"
            description="Get personalized farming advice from agriculture experts"
            icon="🎓"
            gradient="from-blue-500/20 to-cyan-500/20"
            borderGradient="from-blue-500 to-cyan-500"
            onClick={() => onFeatureClick?.('expert-advice')}
          />
        </div>
      </motion.section>

      {/* Labour Needed Section */}
      <motion.section variants={itemVariants}>
        <LabourNeeded />
      </motion.section>
    </motion.div>
  );
};

const QuickStat = ({ icon, label, value, color }) => {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    violet: 'text-violet-400 bg-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-muted text-xs">{label}</p>
          <p className={`font-semibold ${colorClasses[color].split(' ')[0]}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon, gradient, borderGradient, onClick }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`glass rounded-2xl p-6 bg-gradient-to-br ${gradient} cursor-pointer group relative overflow-hidden`}
  >
    {/* Animated border */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${borderGradient} opacity-20`} />
    </div>

    <div className="relative z-10">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h4 className="text-main font-semibold text-lg mb-2">{title}</h4>
      <p className="text-muted text-sm">{description}</p>
    </div>
  </motion.div>
);

export default Dashboard;
