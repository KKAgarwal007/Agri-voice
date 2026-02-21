import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getWeather } from '../utils/api';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await getWeather(latitude, longitude);
            setWeather(response.data);
            setLoading(false);
          },
          async () => {
            // If geolocation fails, use default location
            const response = await getWeather(null, null, 'Delhi');
            setWeather(response.data);
            setLoading(false);
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        const response = await getWeather(null, null, 'Delhi');
        setWeather(response.data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return <Sun className="w-12 h-12 text-amber-400" />;

    const iconMap = {
      '01d': <Sun className="w-12 h-12 text-amber-400" />,
      '01n': <Sun className="w-12 h-12 text-amber-300" />,
      '02d': <Cloud className="w-12 h-12 text-white/80" />,
      '02n': <Cloud className="w-12 h-12 text-white/60" />,
      '03d': <Cloud className="w-12 h-12 text-white/70" />,
      '03n': <Cloud className="w-12 h-12 text-white/60" />,
      '04d': <Cloud className="w-12 h-12 text-white/60" />,
      '04n': <Cloud className="w-12 h-12 text-white/50" />,
      '09d': <CloudRain className="w-12 h-12 text-cyan-400" />,
      '09n': <CloudRain className="w-12 h-12 text-cyan-300" />,
      '10d': <CloudRain className="w-12 h-12 text-cyan-400" />,
      '10n': <CloudRain className="w-12 h-12 text-cyan-300" />,
      '13d': <CloudSnow className="w-12 h-12 text-blue-200" />,
      '13n': <CloudSnow className="w-12 h-12 text-blue-100" />,
    };

    return iconMap[iconCode] || <Cloud className="w-12 h-12 text-white/70" />;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'danger':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'border-cyan-500/30 bg-cyan-500/10';
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-full min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 h-full min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error}</p>
          <button onClick={fetchWeather} className="btn-secondary text-sm">
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
      className="glass rounded-2xl p-6 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Cloud className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-main">Weather & Soil Alerts</h3>
        </div>
        <motion.button
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          onClick={fetchWeather}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-white/50" />
        </motion.button>
      </div>

      {/* Current Weather */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {getWeatherIcon(weather?.icon)}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-muted text-sm mb-1">
            <MapPin className="w-4 h-4" />
            <span>{weather?.location}, {weather?.country}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-main">
              {weather?.temperature}°
            </span>
            <span className="text-muted text-lg pb-2">C</span>
          </div>
          <p className="text-muted capitalize">{weather?.description}</p>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
            <Thermometer className="w-3 h-3" />
            Feels Like
          </div>
          <p className="text-white font-semibold">{weather?.feelsLike}°C</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
            <Droplets className="w-3 h-3" />
            Humidity
          </div>
          <p className="text-white font-semibold">{weather?.humidity}%</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted text-xs mb-1">
            <Wind className="w-3 h-3" />
            Wind
          </div>
          <p className="text-main font-semibold">{weather?.windSpeed} m/s</p>
        </div>
      </div>

      {/* Soil Health Alerts */}
      <div>
        <h4 className="text-sm font-medium text-white/70 mb-3">Soil Health Alerts</h4>
        <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
          {weather?.soilAlerts?.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div>
                  <p className="text-main text-sm font-medium">{alert.title}</p>
                  <p className="text-muted text-xs mt-1">{alert.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
