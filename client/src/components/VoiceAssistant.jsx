import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  Languages,
  Wifi,
  WifiOff,
  Sparkles,
  Globe
} from 'lucide-react';
import { sendChatMessage } from '../utils/api';

const VoiceAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "🌾 **Namaste! Main aapka Krishi Sahayak hoon.**\n\nMujhse Hindi, English ya regional bhasha mein poochein:\n• Fasal ki dekhbhal ke tips\n• Mausam ki jaankari\n• Sarkari yojanaon ki jaankari\n• Rog aur keet niyantran\n\nAap mic button dabaakar bolein ya type karein!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLanguages, setShowLanguages] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const languages = [
    { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en-IN', name: 'English', flag: '🇬🇧' },
    { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te-IN', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'मराठी', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  ];

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, [selectedLanguage]);

  // Update language on recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('आपके browser में voice recognition supported नहीं है। Chrome या Edge use करें।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Clean the text
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/•/g, '')
        .replace(/\n/g, ' ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!input.trim()) return;
    if (!isOnline) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ **Offline Mode**: Internet connection nahi hai. Please network check karein.',
        },
      ]);
      return;
    }

    const userMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Add language context to the query
      const langName = languages.find(l => l.code === selectedLanguage)?.name || 'Hindi';
      const contextualMessage = `User is asking in ${langName}. Please respond in the same language naturally. Query: ${currentInput}`;
      
      const response = await sendChatMessage(contextualMessage);

      const assistantMessage = {
        role: 'assistant',
        content: response.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-speak the response
      speakText(response.response);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Kshama karein, kuch galat ho gaya. Kripya dobara try karein.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    setMessages([
      {
        role: 'assistant',
        content: '🌾 Chat clear ho gaya! Aap mujhse kuch bhi pooch sakte hain.',
      },
    ]);
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
          className="w-full max-w-md h-[80vh] glass-heavy rounded-3xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Voice Assistant
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-white/50 text-xs">बोलकर पूछें या टाइप करें</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Online Status */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              {/* Language Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
                  title="Change language"
                >
                  <Globe className="w-4 h-4 text-white/70" />
                  <span className="text-xs text-white/70">
                    {languages.find(l => l.code === selectedLanguage)?.flag}
                  </span>
                </motion.button>

                {/* Language Dropdown */}
                <AnimatePresence>
                  {showLanguages && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-40 glass rounded-xl overflow-hidden z-10"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setShowLanguages(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${
                            selectedLanguage === lang.code ? 'bg-violet-500/20 text-violet-400' : 'text-white/70'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4 text-white/50" />
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white'
                      : 'glass text-white'
                  } rounded-2xl p-4 ${
                    message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 text-violet-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.role === 'user' && (
                      <User className="w-4 h-4 text-white/80 flex-shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Speak button for assistant */}
                  {message.role === 'assistant' && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title={isSpeaking ? 'Stop' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-white/50" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-white/50" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="glass rounded-2xl rounded-bl-md p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className="text-white/60 text-sm">सोच रहा हूं...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            {/* Voice Indicator */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-3 p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center gap-2"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-violet-400 rounded-full"
                      animate={{ height: [8, 24, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
                <span className="text-violet-300 text-sm ml-2">🎙️ सुन रहा हूं...</span>
              </motion.div>
            )}

            <div className="flex items-end gap-2">
              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`${languages.find(l => l.code === selectedLanguage)?.name} में लिखें...`}
                  rows={1}
                  className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none max-h-24"
                  style={{ minHeight: '48px' }}
                />
              </div>

              {/* Voice Input Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                disabled={!isOnline}
                className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 recording-indicator'
                    : isOnline
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                    : 'bg-gray-500/50 cursor-not-allowed'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </motion.button>

              {/* Send Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading || !input.trim() || !isOnline}
                className={`p-3 rounded-xl flex-shrink-0 transition-all ${
                  input.trim() && isOnline
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg'
                    : 'bg-white/10'
                }`}
              >
                <Send className={`w-5 h-5 ${input.trim() && isOnline ? 'text-white' : 'text-white/40'}`} />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceAssistant;
