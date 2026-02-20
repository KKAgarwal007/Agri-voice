import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  X,
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Bug,
  Pill,
  Shield,
  RotateCcw,
  ImageIcon,
  Sparkles
} from 'lucide-react';
import { analyzeImage } from '../utils/api';

const CropDiseaseScanner = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: 'environment' // Use back camera on mobile
  };

  // Capture from webcam
  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImagePreview(imageSrc);
      // Convert base64 to file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
        });
    }
  }, [webcamRef]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Analyze the image
  const analyzeDisease = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeImage(
        selectedFile,
        'Analyze this crop/plant image for diseases. Provide: 1) Disease name and type (if any), 2) Confidence score (%), 3) Detailed symptoms observed, 4) Recommended treatment with specific pesticides/fungicides, 5) Preventive measures for future. If the plant is healthy, state that clearly with care tips. Format response in clear sections.'
      );

      // Parse the AI response into structured data
      const analysisResult = parseAnalysisResponse(response.response);
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Parse AI response into structured format
  const parseAnalysisResponse = (text) => {
    const isHealthy = text.toLowerCase().includes('healthy') && !text.toLowerCase().includes('disease');
    
    // Extract confidence score if mentioned
    const confidenceMatch = text.match(/(\d{1,3})%|confidence[:\s]*(\d{1,3})/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1] || confidenceMatch[2]) : isHealthy ? 95 : 85;

    return {
      isHealthy,
      confidence,
      rawResponse: text,
      timestamp: new Date().toLocaleString()
    };
  };

  // Reset scanner
  const resetScanner = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          className="w-full max-w-2xl max-h-[90vh] glass-heavy rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-orange-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Crop Disease Scanner
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-white/50 text-xs">AI-powered disease detection</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
            {!result ? (
              <>
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setMode('upload')}
                    className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      mode === 'upload'
                        ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                  <button
                    onClick={() => setMode('camera')}
                    className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      mode === 'camera'
                        ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Use Camera
                  </button>
                </div>

                {/* Image Capture Area */}
                {!imagePreview ? (
                  mode === 'upload' ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-rose-500/50 hover:bg-rose-500/5 transition-all"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <ImageIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70 mb-2">Drag & drop your crop image here</p>
                      <p className="text-white/40 text-sm">or click to browse</p>
                      <p className="text-rose-400/70 text-xs mt-4">Supports JPG, PNG up to 10MB</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden bg-black/30">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full rounded-2xl"
                      />
                      <div className="p-4 flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={captureImage}
                          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg"
                        >
                          <Camera className="w-5 h-5" />
                          Capture Photo
                        </motion.button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Crop preview"
                        className="w-full max-h-64 object-contain bg-black/30 rounded-2xl"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={resetScanner}
                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-lg hover:bg-red-500/50 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </motion.button>
                    </div>

                    {/* Analyze Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={analyzeDisease}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Analyze for Diseases
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300">{error}</p>
                  </motion.div>
                )}
              </>
            ) : (
              /* Results Display */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Status Card */}
                <div className={`p-6 rounded-2xl ${
                  result.isHealthy 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30' 
                    : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-4 mb-4">
                    {result.isHealthy ? (
                      <div className="w-14 h-14 rounded-full bg-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-500/30 flex items-center justify-center">
                        <Bug className="w-8 h-8 text-red-400" />
                      </div>
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${result.isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.isHealthy ? 'Healthy Plant!' : 'Disease Detected'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/60 text-sm">Confidence:</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className={`h-full rounded-full ${result.isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${result.isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="glass rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-400" />
                    Detailed Analysis
                  </h4>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
                      {result.rawResponse}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetScanner}
                    className="flex-1 py-3 glass rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Scan Another
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl text-white font-medium"
                  >
                    Done
                  </motion.button>
                </div>

                {/* Timestamp */}
                <p className="text-center text-white/40 text-xs">
                  Analysis completed at {result.timestamp}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CropDiseaseScanner;
