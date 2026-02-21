const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MONGODB CONNECTION ====================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrivoice';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.log('⚠️ MongoDB connection failed:', error.message);
    console.log('📝 Running without database - user features disabled');
  }
};

connectDB();

// ==================== MONGOOSE SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google auth users
  googleId: { type: String }, // Google UID for OAuth users
  photoURL: { type: String }, // Profile photo from Google
  phone: { type: String },
  location: {
    city: String,
    state: String,
    lat: Number,
    lon: Number
  },
  farmDetails: {
    farmSize: String,
    mainCrops: [String],
    farmingType: { type: String, enum: ['organic', 'conventional', 'mixed'] }
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Activity Schema - tracks all user activities
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  activityType: {
    type: String,
    enum: ['search', 'chat', 'weather_check', 'news_view', 'crop_view', 'disease_scan', 'voice_query', 'login', 'register']
  },
  details: {
    query: String,
    cropName: String,
    response: String,
    imageAnalysis: Boolean,
    weatherLocation: String
  },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});

const Activity = mongoose.model('Activity', activitySchema);

// Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    hasImage: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Community Post Schema
const communityPostSchema = new mongoose.Schema({
  authorId: { type: String },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, default: '' },
  image: { type: String },
  votes: { type: Number, default: 0 },
  voterMap: { type: Map, of: Number, default: {} },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

// Community Message Schema
const communityMessageSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CommunityMessage = mongoose.model('CommunityMessage', communityMessageSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderId: { type: String },
  recipientName: { type: String, required: true },
  recipientId: { type: String },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Loan Schema
const loanSchema = new mongoose.Schema({
  lender: { type: String, required: true },
  lenderId: { type: String },
  borrower: { type: String },
  borrowerId: { type: String },
  amount: { type: Number, required: true },
  interest: { type: Number, default: 5 },
  duration: { type: Number, default: 30 },
  status: { type: String, default: 'available', enum: ['available', 'pending', 'taken', 'repaid'] },
  collateral: { type: String, default: 'Crop Bond' },
  createdAt: { type: Date, default: Date.now }
});

const Loan = mongoose.model('Loan', loanSchema);

// Call Log Schema
const callLogSchema = new mongoose.Schema({
  callerName: { type: String, required: true },
  callerId: { type: String },
  receiverName: { type: String, required: true },
  receiverId: { type: String },
  callType: { type: String, enum: ['audio', 'video'], default: 'audio' },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'missed', 'rejected'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

const CallLog = mongoose.model('CallLog', callLogSchema);

// Scheduled Call Schema
const scheduledCallSchema = new mongoose.Schema({
  schedulerName: { type: String, required: true },
  schedulerId: { type: String },
  targetName: { type: String, required: true },
  targetId: { type: String },
  callType: { type: String, enum: ['audio', 'video'], default: 'audio' },
  scheduledTime: { type: Date, required: true },
  note: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});

const ScheduledCall = mongoose.model('ScheduledCall', scheduledCallSchema);

// Labour Post Schema
const labourPostSchema = new mongoose.Schema({
  farmerName: { type: String, required: true },
  farmerId: { type: String },
  workType: { type: String, required: true },
  location: { type: String, required: true },
  duration: { type: String, required: true },
  offeredWage: { type: Number, required: true },
  labourCount: { type: Number, default: 1 },
  notes: { type: String },
  analysis: {
    fairnessScore: Number,
    suggestedWageRange: String,
    improvements: [String],
    expectedResponseRate: String,
    optimizedDescription: String
  },
  status: { type: String, enum: ['active', 'closed', 'filled'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const LabourPost = mongoose.model('LabourPost', labourPostSchema);

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'agri-voice-secret-key-2024';

// Initialize Gemini AI
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

app.use(authMiddleware);

// Activity logging helper
const logActivity = async (req, activityType, details = {}) => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    await Activity.create({
      userId: req.userId || null,
      sessionId: req.header('X-Session-ID') || 'anonymous',
      activityType,
      details,
      ipAddress: req.ip,
      userAgent: req.header('User-Agent')
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is down. Please check MongoDB IP allowlist or connection string.' });
    }
    const { name, email, password, phone, location, farmDetails } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      location,
      farmDetails
    });

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Log activity
    await logActivity({ userId: user._id }, 'register', { email });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        farmDetails: user.farmDetails
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is down. Please check MongoDB IP allowlist or connection string.' });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    await logActivity({ userId: user._id }, 'login', { email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        location: user.location,
        farmDetails: user.farmDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth Login/Register
app.post('/api/auth/google', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is down. Please check your MongoDB Atlas IP allowlist.' });
    }
    const { uid, name, email, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info
      user.googleId = uid;
      user.photoURL = photoURL || user.photoURL;
      user.lastLogin = new Date();
      if (!user.authProvider) user.authProvider = 'google';
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        photoURL,
        authProvider: 'google'
      });
      await logActivity({ userId: user._id }, 'register', { email, provider: 'google' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    await logActivity({ userId: user._id }, 'login', { email, provider: 'google' });

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        location: user.location,
        farmDetails: user.farmDetails
      }
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      location: req.user.location,
      farmDetails: req.user.farmDetails,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt
    }
  });
});

// Update user profile
app.put('/api/auth/profile', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { name, phone, location, farmDetails, preferences } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    if (farmDetails) updates.farmDetails = farmDetails;
    if (preferences) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        farmDetails: user.farmDetails,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ==================== ACTIVITY ROUTES ====================

// Get user activities
app.get('/api/activities', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const activities = await Activity.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ data: activities });
  } catch (error) {
    console.error('Activities fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Agri-Voice API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ==================== CROP SEARCH API ====================
app.get('/api/crop-search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Log activity
    await logActivity(req, 'search', { query });

    if (!process.env.TREFLE_API_KEY) {
      return res.json({
        data: getMockCropData(query),
        source: 'mock'
      });
    }

    const response = await axios.get(`https://trefle.io/api/v1/plants/search`, {
      params: {
        token: process.env.TREFLE_API_KEY,
        q: query
      }
    });

    const crops = response.data.data.map(plant => ({
      id: plant.id,
      commonName: plant.common_name || plant.scientific_name,
      scientificName: plant.scientific_name,
      family: plant.family,
      imageUrl: plant.image_url,
      genus: plant.genus
    }));

    res.json({ data: crops, source: 'trefle' });
  } catch (error) {
    console.error('Crop search error:', error.message);
    res.json({
      data: getMockCropData(req.query.query),
      source: 'mock'
    });
  }
});

// Get detailed crop information
app.get('/api/crop/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await logActivity(req, 'crop_view', { cropName: id });

    if (!process.env.TREFLE_API_KEY) {
      return res.json({ data: getMockCropDetails(id), source: 'mock' });
    }

    const response = await axios.get(`https://trefle.io/api/v1/plants/${id}`, {
      params: { token: process.env.TREFLE_API_KEY }
    });

    const plant = response.data.data;
    res.json({
      data: {
        id: plant.id,
        commonName: plant.common_name,
        scientificName: plant.scientific_name,
        family: plant.family,
        imageUrl: plant.image_url,
        growth: plant.growth,
        specifications: plant.specifications,
        distribution: plant.distribution
      },
      source: 'trefle'
    });
  } catch (error) {
    console.error('Crop details error:', error.message);
    res.json({ data: getMockCropDetails(req.params.id), source: 'mock' });
  }
});

// ==================== WEATHER API ====================
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    await logActivity(req, 'weather_check', { weatherLocation: city || `${lat},${lon}` });

    if (!process.env.OPENWEATHER_API_KEY) {
      return res.json({
        data: getMockWeatherData(),
        source: 'mock'
      });
    }

    let url = 'https://api.openweathermap.org/data/2.5/weather';
    let params = {
      appid: process.env.OPENWEATHER_API_KEY,
      units: 'metric'
    };

    // Check if key is placeholder
    if (process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key') {
      return res.json({
        data: getMockWeatherData(),
        source: 'mock'
      });
    }

    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      params.q = 'Delhi,IN';
    }

    const response = await axios.get(url, { params, timeout: 5000 });
    const soilAlerts = generateSoilAlerts(response.data);

    res.json({
      data: {
        location: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        soilAlerts: soilAlerts
      },
      source: 'openweathermap'
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.json({
      data: getMockWeatherData(),
      source: 'mock'
    });
  }
});

// ==================== NEWS API ====================
app.get('/api/news', async (req, res) => {
  try {
    await logActivity(req, 'news_view', {});

    if (!process.env.NEWS_API_KEY) {
      return res.json({
        data: getMockNewsData(),
        source: 'mock'
      });
    }

    // Check if key is placeholder
    if (process.env.NEWS_API_KEY === 'your_news_api_key') {
      return res.json({
        data: getMockNewsData(),
        source: 'mock'
      });
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        apiKey: process.env.NEWS_API_KEY,
        q: 'agriculture farming government scheme India',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10
      },
      timeout: 5000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt
    }));

    res.json({ data: articles, source: 'newsapi' });
  } catch (error) {
    console.error('News API error:', error.message);
    res.json({
      data: getMockNewsData(),
      source: 'mock'
    });
  }
});

// ==================== COMMUNITY API ====================

// Get community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ data: [], source: 'offline' });
    }
    const posts = await CommunityPost.find().sort({ createdAt: -1 }).limit(50).lean();
    const formatted = posts.map(p => ({
      id: p._id,
      user: { name: p.authorName, avatar: p.authorAvatar },
      content: p.content,
      image: p.image || null,
      votes: p.votes,
      userVote: 0,
      comments: p.comments,
      time: timeAgo(p.createdAt)
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get posts error:', error.message);
    res.json({ data: [] });
  }
});

// Create a community post
app.post('/api/community/posts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { authorName, authorAvatar, content, image } = req.body;
    if (!content && !image) {
      return res.status(400).json({ error: 'Content or image is required' });
    }
    const post = await CommunityPost.create({
      authorId: req.userId || null,
      authorName: authorName || 'Guest',
      authorAvatar: authorAvatar || null,
      content: content || '',
      image: image || null
    });
    const formatted = {
      id: post._id,
      user: { name: post.authorName, avatar: post.authorAvatar },
      content: post.content,
      image: post.image,
      votes: 0,
      userVote: 0,
      comments: 0,
      time: 'Just now'
    };
    res.status(201).json({ data: formatted });
  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Vote on a post
app.post('/api/community/posts/:id/vote', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { id } = req.params;
    const { vote, odlerIdentifier } = req.body; // vote: 1 (up), -1 (down), 0 (remove)
    const voterId = odlerIdentifier || req.userId || req.ip;

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const previousVote = post.voterMap.get(voterId) || 0;
    const delta = vote - previousVote;
    post.votes += delta;
    if (vote === 0) {
      post.voterMap.delete(voterId);
    } else {
      post.voterMap.set(voterId, vote);
    }
    await post.save();
    res.json({ votes: post.votes, userVote: vote });
  } catch (error) {
    console.error('Vote error:', error.message);
    res.status(500).json({ error: 'Vote failed' });
  }
});

// Get community messages
app.get('/api/community/messages', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ data: [] });
    }
    const messages = await CommunityMessage.find().sort({ createdAt: -1 }).limit(100).lean();
    const formatted = messages.reverse().map(m => ({
      id: m._id,
      user: m.authorName,
      content: m.content,
      time: new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.json({ data: [] });
  }
});

// Get transactions for a user
app.get('/api/community/transactions/:userId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ data: [], balance: 10000 });
    }
    const { userId } = req.params;
    const txs = await Transaction.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    }).sort({ createdAt: -1 }).limit(50).lean();

    const formatted = txs.map(tx => ({
      id: tx._id,
      type: tx.senderId === userId ? 'sent' : 'received',
      from: tx.senderName,
      to: tx.recipientName,
      amount: tx.amount,
      time: timeAgo(tx.createdAt)
    }));

    // Calculate balance: start with 10000, subtract sent, add received
    let balance = 10000;
    const allTxs = await Transaction.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    }).lean();
    for (const tx of allTxs) {
      if (tx.senderId === userId) balance -= tx.amount;
      if (tx.recipientId === userId) balance += tx.amount;
    }

    res.json({ data: formatted, balance });
  } catch (error) {
    console.error('Get transactions error:', error.message);
    res.json({ data: [], balance: 10000 });
  }
});

// Create a transaction
app.post('/api/community/transactions', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { senderName, senderId, recipientName, recipientId, amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    const tx = await Transaction.create({
      senderName, senderId, recipientName, recipientId, amount
    });
    res.status(201).json({
      data: {
        id: tx._id,
        type: 'sent',
        to: recipientName,
        amount: tx.amount,
        time: 'Just now'
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error.message);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// Get all available loans
app.get('/api/community/loans', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ data: [] });
    }
    const loans = await Loan.find().sort({ createdAt: -1 }).limit(50).lean();
    const formatted = loans.map(l => ({
      id: l._id,
      lender: l.lender,
      lenderId: l.lenderId,
      borrower: l.borrower,
      amount: l.amount,
      interest: l.interest,
      duration: l.duration,
      status: l.status,
      collateral: l.collateral,
      time: timeAgo(l.createdAt)
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get loans error:', error.message);
    res.json({ data: [] });
  }
});

// Create a loan request
app.post('/api/community/loans', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { lender, lenderId, amount, interest, duration, collateral } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    const loan = await Loan.create({
      lender: lender || 'Anonymous',
      lenderId,
      amount,
      interest: interest || 5,
      duration: duration || 30,
      collateral: collateral || 'Crop Bond'
    });
    res.status(201).json({
      data: {
        id: loan._id,
        lender: loan.lender,
        lenderId: loan.lenderId,
        amount: loan.amount,
        interest: loan.interest,
        duration: loan.duration,
        status: loan.status,
        collateral: loan.collateral,
        time: 'Just now'
      }
    });
  } catch (error) {
    console.error('Create loan error:', error.message);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// Apply for a loan
app.post('/api/community/loans/:id/apply', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { id } = req.params;
    const { borrower, borrowerId } = req.body;
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status !== 'available') return res.status(400).json({ error: 'Loan is no longer available' });

    loan.status = 'taken';
    loan.borrower = borrower || 'Guest';
    loan.borrowerId = borrowerId || null;
    await loan.save();
    res.json({ success: true, status: loan.status });
  } catch (error) {
    console.error('Apply loan error:', error.message);
    res.status(500).json({ error: 'Failed to apply for loan' });
  }
});

// ==================== CALL API ====================

// Get call logs for a user
app.get('/api/community/calls/:userId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ data: [] });
    const { userId } = req.params;
    const logs = await CallLog.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 }).limit(30).lean();
    const formatted = logs.map(l => ({
      id: l._id,
      callerName: l.callerName,
      receiverName: l.receiverName,
      callType: l.callType,
      duration: l.duration,
      status: l.status,
      time: timeAgo(l.createdAt)
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get call logs error:', error.message);
    res.json({ data: [] });
  }
});

// Save a call log
app.post('/api/community/calls', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'DB offline' });
    const log = await CallLog.create(req.body);
    res.status(201).json({ data: { id: log._id } });
  } catch (error) {
    console.error('Save call log error:', error.message);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Get scheduled calls for a user
app.get('/api/community/scheduled-calls/:userId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ data: [] });
    const { userId } = req.params;
    const calls = await ScheduledCall.find({
      $or: [{ schedulerId: userId }, { targetId: userId }],
      status: 'scheduled',
      scheduledTime: { $gte: new Date() }
    }).sort({ scheduledTime: 1 }).lean();
    const formatted = calls.map(c => ({
      id: c._id,
      schedulerName: c.schedulerName,
      targetName: c.targetName,
      targetId: c.targetId,
      callType: c.callType,
      scheduledTime: c.scheduledTime,
      note: c.note,
      status: c.status
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get scheduled calls error:', error.message);
    res.json({ data: [] });
  }
});

// Create a scheduled call
app.post('/api/community/scheduled-calls', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'DB offline' });
    const call = await ScheduledCall.create(req.body);
    res.status(201).json({
      data: {
        id: call._id,
        schedulerName: call.schedulerName,
        targetName: call.targetName,
        targetId: call.targetId,
        callType: call.callType,
        scheduledTime: call.scheduledTime,
        note: call.note,
        status: call.status
      }
    });
  } catch (error) {
    console.error('Create scheduled call error:', error.message);
    res.status(500).json({ error: 'Failed to schedule' });
  }
});

// Cancel a scheduled call
app.delete('/api/community/scheduled-calls/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'DB offline' });
    await ScheduledCall.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel scheduled call error:', error.message);
    res.status(500).json({ error: 'Failed to cancel' });
  }
});

// ==================== LABOUR API ====================

// Analyze and create a labour post
app.post('/api/labour/analyze', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { farmerName, farmerId, workType, location, duration, offeredWage, labourCount, notes } = req.body;
    if (!workType || !location || !offeredWage) {
      return res.status(400).json({ error: 'Work type, location, and wage are required' });
    }

    let analysis = null;

    // Try Gemini AI analysis
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `You are an agricultural labour market expert in India. Analyze this farmer's job post and respond ONLY in valid JSON (no markdown, no code fences).

Job Details:
- Work Type: ${workType}
- Location: ${location}
- Duration: ${duration}
- Offered Wage: ₹${offeredWage}/day
- Number of Labour Required: ${labourCount}
- Additional Notes: ${notes || 'None'}

Respond with this exact JSON structure:
{
  "fairnessScore": <number 1-10>,
  "suggestedWageRange": "₹<min> - ₹<max>/day",
  "improvements": ["improvement1", "improvement2"],
  "expectedResponseRate": "<Low/Medium/High> - <explanation>",
  "optimizedDescription": "<optimized job listing text in 2-3 sentences>"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Clean any markdown fencing
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(clean);
      } catch (aiErr) {
        console.error('Gemini labour analysis error:', aiErr.message);
      }
    }

    // Fallback analysis if Gemini fails
    if (!analysis) {
      const wage = parseInt(offeredWage);
      let score = 5;
      if (wage >= 300 && wage <= 600) score = 7;
      if (wage >= 400 && wage <= 500) score = 9;
      if (wage < 200) score = 3;
      if (wage > 800) score = 6;
      analysis = {
        fairnessScore: score,
        suggestedWageRange: '₹300 - ₹500/day',
        improvements: [
          'Specify exact working hours',
          'Mention if meals are provided',
          'Add nearby landmark for location clarity'
        ],
        expectedResponseRate: wage >= 350 ? 'High - competitive wage for this region' : 'Low - consider increasing the wage',
        optimizedDescription: `Urgent: ${labourCount} skilled ${workType} workers needed in ${location} for ${duration}. Wage: ₹${offeredWage}/day. ${notes || 'Contact for details.'}`
      };
    }

    // Save to MongoDB
    const post = await LabourPost.create({
      farmerName: farmerName || 'Guest',
      farmerId,
      workType,
      location,
      duration,
      offeredWage: parseInt(offeredWage),
      labourCount: parseInt(labourCount) || 1,
      notes,
      analysis
    });

    res.status(201).json({
      data: {
        id: post._id,
        workType: post.workType,
        location: post.location,
        duration: post.duration,
        offeredWage: post.offeredWage,
        labourCount: post.labourCount,
        analysis: post.analysis,
        time: 'Just now'
      }
    });
  } catch (error) {
    console.error('Labour analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze job post' });
  }
});

// Get labour posts
app.get('/api/labour/posts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ data: [] });
    const posts = await LabourPost.find({ status: 'active' }).sort({ createdAt: -1 }).limit(20).lean();
    const formatted = posts.map(p => ({
      id: p._id,
      farmerName: p.farmerName,
      workType: p.workType,
      location: p.location,
      duration: p.duration,
      offeredWage: p.offeredWage,
      labourCount: p.labourCount,
      analysis: p.analysis,
      time: timeAgo(p.createdAt)
    }));
    res.json({ data: formatted });
  } catch (error) {
    console.error('Get labour posts error:', error.message);
    res.json({ data: [] });
  }
});

// Apply for a labour job
app.post('/api/labour/posts/:id/apply', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'DB offline' });

    const post = await LabourPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Job post not found' });

    if (post.labourCount <= 0) {
      return res.status(400).json({ error: 'Job is already filled' });
    }

    post.labourCount -= 1;
    if (post.labourCount === 0) {
      post.status = 'filled';
    }
    await post.save();

    // Notify farmer via Socket.io
    const applicantName = req.body.applicantName || 'A worker';
    io.emit('labour-applied', {
      postId: post._id,
      farmerId: post.farmerId,
      farmerName: post.farmerName,
      workType: post.workType,
      applicantName,
      remainingCount: post.labourCount,
      timestamp: new Date()
    });

    res.json({
      success: true,
      remainingCount: post.labourCount,
      status: post.status
    });
  } catch (error) {
    console.error('Apply for job error:', error.message);
    res.status(500).json({ error: 'Failed to apply for job' });
  }
});

// Helper: human-readable time ago
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

// ==================== GEMINI AI API ====================
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await logActivity(req, 'chat', { query: message });

    // Save to chat history if user is logged in
    if (req.userId && mongoose.connection.readyState === 1) {
      try {
        let chatHistory = await ChatHistory.findOne({ userId: req.userId }).sort({ createdAt: -1 });

        if (!chatHistory || Date.now() - chatHistory.createdAt > 24 * 60 * 60 * 1000) {
          chatHistory = new ChatHistory({ userId: req.userId, messages: [] });
        }

        chatHistory.messages.push({ role: 'user', content: message });
        chatHistory.updatedAt = new Date();
        await chatHistory.save();
      } catch (err) {
        console.error('Chat history save error:', err.message);
      }
    }

    if (!genAI) {
      const response = getMockAIResponse(message);
      return res.json({ response, source: 'mock' });
    }

    const systemPrompt = `You are Agri-Voice AI, a helpful agricultural assistant for Indian farmers. 
You provide advice on:
- Crop cultivation and best practices
- Pest and disease management
- Weather-based farming decisions
- Government schemes and subsidies
- Organic farming techniques
- Soil health management
- Water conservation

Keep responses concise, practical, and farmer-friendly. Use simple language.
If asked about crop diseases from images, provide detailed diagnosis and treatment options.`;

    // Try models in order with retry
    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
          }

          const model = genAI.getGenerativeModel({ model: modelName });
          const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 1000 },
          });

          const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
          const response = result.response.text();

          // Save assistant response
          if (req.userId && mongoose.connection.readyState === 1) {
            try {
              const chatHistory = await ChatHistory.findOne({ userId: req.userId }).sort({ updatedAt: -1 });
              if (chatHistory) {
                chatHistory.messages.push({ role: 'assistant', content: response });
                await chatHistory.save();
              }
            } catch (err) {
              console.error('Chat history save error:', err.message);
            }
          }

          return res.json({ response, source: 'gemini' });
        } catch (err) {
          lastError = err;
          console.error(`Gemini ${modelName} attempt ${attempt + 1} error:`, err.message?.substring(0, 120));
          // Only retry on rate limit (429) errors
          if (!err.message?.includes('429') && !err.message?.includes('quota')) break;
        }
      }
    }

    // All models and retries exhausted — fallback to mock
    console.error('All Gemini models failed, using mock. Last error:', lastError?.message?.substring(0, 100));
    res.json({
      response: getMockAIResponse(req.body.message || "hello"),
      source: 'mock'
    });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    // Fallback to mock on error
    res.json({
      response: getMockAIResponse(req.body.message || "hello"),
      source: 'mock'
    });
  }
});

// Image analysis for crop disease diagnosis
app.post('/api/gemini/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const { message } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'Image is required' });
    }

    await logActivity(req, 'disease_scan', { query: message, imageAnalysis: true });

    if (!genAI) {
      return res.json({
        response: "🔬 **Mock Disease Analysis**\n\nBased on the image, this appears to be a common leaf condition. For accurate diagnosis, please ensure your Gemini API key is configured.\n\n**General Recommendations:**\n- Ensure proper drainage\n- Maintain optimal spacing\n- Apply organic fungicides if needed\n- Consult local agricultural officer",
        source: 'mock'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const imagePart = {
      inlineData: {
        data: imageFile.buffer.toString('base64'),
        mimeType: imageFile.mimetype
      }
    };

    const prompt = message || "Analyze this crop/plant image. Identify any diseases, pests, or health issues. Provide diagnosis and treatment recommendations in a farmer-friendly way.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response.text();

    res.json({ response, source: 'gemini' });
  } catch (error) {
    console.error('Image analysis error:', error.message);
    // Fallback to mock on error
    res.json({
      response: "🔬 **Mock Disease Analysis**\n\n(Fallback due to API Error)\n\nBased on the image, this appears to be a common leaf condition. For accurate diagnosis, please ensure your Gemini API key is properly configured.\n\n**General Recommendations:**\n- Ensure proper drainage\n- Maintain optimal spacing\n- Apply organic fungicides if needed\n- Consult local agricultural officer",
      source: 'mock'
    });
  }
});

// Get chat history
app.get('/api/chat-history', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const histories = await ChatHistory.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({ data: histories });
  } catch (error) {
    console.error('Chat history fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateSoilAlerts(weatherData) {
  const alerts = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const description = weatherData.weather[0].main.toLowerCase();

  if (humidity > 80) {
    alerts.push({
      type: 'warning',
      title: 'High Humidity Alert',
      message: 'Risk of fungal diseases. Ensure proper drainage and ventilation.'
    });
  }

  if (humidity < 30) {
    alerts.push({
      type: 'warning',
      title: 'Low Humidity Alert',
      message: 'Soil may be dry. Consider irrigation and mulching.'
    });
  }

  if (temp > 35) {
    alerts.push({
      type: 'danger',
      title: 'Heat Stress Warning',
      message: 'Extreme heat may stress crops. Provide shade and extra watering.'
    });
  }

  if (temp < 10) {
    alerts.push({
      type: 'info',
      title: 'Cold Weather Advisory',
      message: 'Protect sensitive crops from frost. Consider covering plants.'
    });
  }

  if (description.includes('rain')) {
    alerts.push({
      type: 'info',
      title: 'Rain Expected',
      message: 'Good time for sowing. Delay fertilizer application until after rain.'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: 'Favorable Conditions',
      message: 'Weather conditions are optimal for most farming activities.'
    });
  }

  return alerts;
}

function getMockCropData(query) {
  const crops = [
    { id: 1, commonName: 'Wheat', scientificName: 'Triticum aestivum', family: 'Poaceae', imageUrl: null, genus: 'Triticum' },
    { id: 2, commonName: 'Rice', scientificName: 'Oryza sativa', family: 'Poaceae', imageUrl: null, genus: 'Oryza' },
    { id: 3, commonName: 'Tomato', scientificName: 'Solanum lycopersicum', family: 'Solanaceae', imageUrl: null, genus: 'Solanum' },
    { id: 4, commonName: 'Potato', scientificName: 'Solanum tuberosum', family: 'Solanaceae', imageUrl: null, genus: 'Solanum' },
    { id: 5, commonName: 'Cotton', scientificName: 'Gossypium hirsutum', family: 'Malvaceae', imageUrl: null, genus: 'Gossypium' },
    { id: 6, commonName: 'Sugarcane', scientificName: 'Saccharum officinarum', family: 'Poaceae', imageUrl: null, genus: 'Saccharum' },
    { id: 7, commonName: 'Maize', scientificName: 'Zea mays', family: 'Poaceae', imageUrl: null, genus: 'Zea' },
    { id: 8, commonName: 'Soybean', scientificName: 'Glycine max', family: 'Fabaceae', imageUrl: null, genus: 'Glycine' },
    { id: 9, commonName: 'Onion', scientificName: 'Allium cepa', family: 'Amaryllidaceae', imageUrl: null, genus: 'Allium' },
    { id: 10, commonName: 'Carrot', scientificName: 'Daucus carota', family: 'Apiaceae', imageUrl: null, genus: 'Daucus' },
    { id: 11, commonName: 'Chili Pepper', scientificName: 'Capsicum annuum', family: 'Solanaceae', imageUrl: null, genus: 'Capsicum' },
    { id: 12, commonName: 'Mango', scientificName: 'Mangifera indica', family: 'Anacardiaceae', imageUrl: null, genus: 'Mangifera' }
  ];

  if (query) {
    return crops.filter(c =>
      c.commonName.toLowerCase().includes(query.toLowerCase()) ||
      c.scientificName.toLowerCase().includes(query.toLowerCase())
    );
  }
  return crops;
}

function getMockCropDetails(id) {
  return {
    id: id,
    commonName: 'Wheat',
    scientificName: 'Triticum aestivum',
    family: 'Poaceae',
    growth: {
      soilTexture: 'Loamy',
      soilPh: '6.0-7.0',
      waterRequirement: 'Moderate',
      sunExposure: 'Full sun',
      growingSeason: 'Rabi (Winter)',
      harvestTime: '120-150 days'
    },
    specifications: {
      height: '60-120 cm',
      spacing: '20-25 cm between rows'
    }
  };
}

function getMockWeatherData() {
  return {
    location: 'New Delhi',
    country: 'IN',
    temperature: 28,
    feelsLike: 30,
    humidity: 65,
    pressure: 1012,
    windSpeed: 3.5,
    description: 'partly cloudy',
    icon: '02d',
    soilAlerts: [
      {
        type: 'success',
        title: 'Favorable Conditions',
        message: 'Weather conditions are optimal for most farming activities.'
      }
    ]
  };
}

function getMockNewsData() {
  return [
    {
      title: 'PM-KISAN: 17th Installment Released for Farmers',
      description: 'The government has released the 17th installment of PM-KISAN scheme, benefiting over 9 crore farmers across the country.',
      url: 'https://www.india.gov.in',
      imageUrl: null,
      source: 'Agriculture Today',
      publishedAt: new Date().toISOString()
    },
    {
      title: 'New Soil Health Card Scheme Updates',
      description: 'Ministry of Agriculture announces enhanced soil testing facilities in all districts.',
      url: 'https://www.india.gov.in',
      imageUrl: null,
      source: 'Farming News',
      publishedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      title: 'Organic Farming Subsidies Increased by 25%',
      description: 'Government boosts support for organic farmers with increased subsidies and training programs.',
      url: 'https://www.india.gov.in',
      imageUrl: null,
      source: 'Rural India',
      publishedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      title: 'Crop Insurance Claims Process Simplified',
      description: 'PMFBY claim process made easier with new mobile app and reduced documentation.',
      url: 'https://www.india.gov.in',
      imageUrl: null,
      source: 'Kisan Times',
      publishedAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];
}

function getMockAIResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('wheat')) {
    return "🌾 **Wheat Cultivation Tips:**\n\n1. **Best Season:** Rabi (Oct-Nov sowing)\n2. **Soil:** Well-drained loamy soil, pH 6-7\n3. **Irrigation:** 4-6 irrigations needed\n4. **Varieties:** HD-2967, PBW-343 are popular\n\n💡 Apply first irrigation 21 days after sowing for best results!";
  }

  if (lowerMessage.includes('disease') || lowerMessage.includes('pest')) {
    return "🔬 **Disease Management:**\n\n1. **Prevention:** Use certified seeds and crop rotation\n2. **Early Detection:** Check leaves regularly for spots or discoloration\n3. **Treatment:** Neem-based organic pesticides work well\n4. **Consult:** Visit your local Krishi Vigyan Kendra for specific diagnosis\n\n📸 You can also upload an image for AI-powered disease identification!";
  }

  if (lowerMessage.includes('scheme') || lowerMessage.includes('subsidy')) {
    return "📋 **Key Government Schemes for Farmers:**\n\n1. **PM-KISAN:** ₹6,000/year direct benefit\n2. **PMFBY:** Crop insurance at low premium\n3. **Soil Health Card:** Free soil testing\n4. **Kisan Credit Card:** Easy agricultural loans\n\n🔗 Apply at your nearest CSC or bank!";
  }

  return "🌱 **Namaste Kisan!**\n\nI'm your Agri-Voice AI assistant. I can help you with:\n\n• Crop cultivation advice\n• Disease identification (upload photos!)\n• Weather-based recommendations\n• Government scheme information\n• Organic farming tips\n\nHow can I assist you today?";
}

// ==================== START SERVER ====================
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Connected users map
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join community
  socket.on('join-community', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      ...userData,
      status: 'online'
    });
    io.emit('online-users', Array.from(connectedUsers.values()));
    console.log(`👤 ${userData.userName} joined the community`);
  });

  // Handle messages — broadcast + persist
  socket.on('send-message', async (message) => {
    socket.broadcast.emit('new-message', message);
    try {
      if (mongoose.connection.readyState === 1) {
        await CommunityMessage.create({
          authorName: message.user || 'Guest',
          content: message.content
        });
      }
    } catch (err) {
      console.error('Message persist error:', err.message);
    }
  });

  // Handle posts — broadcast (post is already saved via REST API)
  socket.on('new-post', (post) => {
    socket.broadcast.emit('new-post', post);
  });

  // Handle post voting
  socket.on('vote-post', (voteData) => {
    socket.broadcast.emit('vote-updated', voteData);
  });

  // Handle payments
  socket.on('send-payment', (payment) => {
    const recipient = Array.from(connectedUsers.entries())
      .find(([_, user]) => user.userId === payment.to);
    if (recipient) {
      io.to(recipient[0]).emit('payment-received', payment);
    }
  });

  // Handle loan requests
  socket.on('loan-request', (loan) => {
    socket.broadcast.emit('loan-request', loan);
  });

  // WebRTC signaling
  socket.on('call-offer', (data) => {
    const target = Array.from(connectedUsers.entries())
      .find(([_, user]) => user.id === data.to);
    if (target) {
      io.to(target[0]).emit('call-offer', { ...data, from: connectedUsers.get(socket.id) });
    }
  });

  socket.on('call-answer', (data) => {
    const target = Array.from(connectedUsers.entries())
      .find(([_, user]) => user.id === data.to);
    if (target) {
      io.to(target[0]).emit('call-answer', data);
    }
  });

  socket.on('ice-candidate', (data) => {
    const target = Array.from(connectedUsers.entries())
      .find(([_, user]) => user.id === data.to);
    if (target) {
      io.to(target[0]).emit('ice-candidate', data);
    }
  });

  socket.on('call-end', (data) => {
    const target = Array.from(connectedUsers.entries())
      .find(([_, user]) => user.id === data.partner);
    if (target) {
      io.to(target[0]).emit('call-ended');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    io.emit('online-users', Array.from(connectedUsers.values()));
    console.log(`👋 ${user?.userName || 'User'} left the community`);
  });
});

server.listen(PORT, () => {
  console.log(`
  🌱 Agri-Voice Server Running!
  ============================
  📍 Local:    http://localhost:${PORT}
  📍 Health:   http://localhost:${PORT}/api/health
  🔌 Socket.io: Enabled
  
  Database Status:
  ----------------
  💾 MongoDB:   ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️ Not connected'}
  
  API Status:
  -----------
  🌤️  Weather API: ${process.env.OPENWEATHER_API_KEY ? '✅ Configured' : '⚠️ Using mock data'}
  📰 News API:    ${process.env.NEWS_API_KEY ? '✅ Configured' : '⚠️ Using mock data'}
  🤖 Gemini API:  ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️ Using mock data'}
  🌿 Trefle API:  ${process.env.TREFLE_API_KEY ? '✅ Configured' : '⚠️ Using mock data'}
  `);
});
