import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Camera
} from 'lucide-react';
import { sendChatMessage, analyzeImage } from '../utils/api';

const VoiceAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "🌱 **Namaste!** I'm your Agri-Voice AI assistant.\n\nI can help you with:\n• Crop cultivation advice\n• Disease identification (upload photos!)\n• Weather-based recommendations\n• Government scheme information\n\nHow can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 380,
    height: 380,
    facingMode: 'environment' // Use back camera on mobile
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

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
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Clean the text (remove markdown)
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/•/g, '')
        .replace(/\n/g, ' ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImagePreview(imageSrc);
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setShowCamera(false);
        });
    }
  }, [webcamRef]);

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!input.trim() && !selectedImage) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      image: imagePreview,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;

      if (selectedImage) {
        // Send image for analysis
        response = await analyzeImage(selectedImage, input.trim() || 'Analyze this crop/plant image');
        removeImage();
      } else {
        // Send text message
        response = await sendChatMessage(input.trim());
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "🌱 Chat cleared! How can I help you today?",
      },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-2xl flex items-center justify-center z-50 glow-primary"
          >
            <MessageCircle className="w-7 h-7 text-white" />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/50 to-cyan-500/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] glass-heavy rounded-3xl flex flex-col overflow-hidden z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    Agri-Voice AI
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-white/50 text-xs">Ask me anything about farming</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={() => setIsOpen(false)}
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
                        ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white'
                        : 'glass text-white'
                    } rounded-2xl p-4 ${
                      message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                  >
                    {/* User avatar or bot icon */}
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Uploaded"
                            className="w-full max-h-40 object-cover rounded-lg mb-2"
                          />
                        )}
                        <div className="markdown-content text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <User className="w-4 h-4 text-white/80 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Speak button for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
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
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-white/60 text-sm">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Camera View */}
            <AnimatePresence>
              {showCamera && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 280 }}
                   exit={{ opacity: 0, height: 0 }}
                   className="bg-black relative overflow-hidden flex-shrink-0"
                 >
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={captureImage}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white flex items-center justify-center p-1"
                    >
                      <div className="w-full h-full bg-white rounded-full"></div>
                    </button>
                    <button
                      onClick={() => setShowCamera(false)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                 </motion.div>
              )}
            </AnimatePresence>

            {/* Image Preview */}
            <AnimatePresence>
              {imagePreview && !showCamera && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 border-t border-white/10"
                >
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 w-auto rounded-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex items-end gap-2">
                {/* Image Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCamera(!showCamera)}
                  className={`p-3 rounded-xl transition-colors flex-shrink-0 ${showCamera ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'}`}
                  title="Use Camera"
                >
                  <Camera className="w-5 h-5" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
                  title="Upload image"
                >
                  <ImageIcon className="w-5 h-5 text-white/60" />
                </motion.button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={showCamera ? "Capturing..." : "Ask questions..."}
                    rows={1}
                    disabled={showCamera}
                    className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none max-h-24 disabled:opacity-50"
                    style={{ minHeight: '48px' }}
                  />
                </div>

                {/* Voice Input */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                    isListening
                      ? 'bg-red-500 recording-indicator'
                      : 'hover:bg-white/10'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white/60" />
                  )}
                </motion.button>

                {/* Send Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className={`p-3 rounded-xl flex-shrink-0 transition-all ${
                    input.trim() || selectedImage
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg'
                      : 'bg-white/10'
                  }`}
                >
                  <Send className={`w-5 h-5 ${input.trim() || selectedImage ? 'text-white' : 'text-white/40'}`} />
                </motion.button>
              </div>

              {/* Voice indicator */}
              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-red-400 mt-2"
                >
                  🎙️ Listening... Speak now
                </motion.p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAIChat;
