import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import {
  X,
  Send,
  Image,
  Heart,
  MessageCircle,
  Users,
  Wallet,
  HandCoins,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  MoreVertical,
  Search,
  Plus,
  Sparkles,
  Circle,
  Camera,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CommunityHub = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('feed'); // feed, payments, loans, call
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Payment states
  const [walletBalance, setWalletBalance] = useState(10000);
  const [transactions, setTransactions] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Loan states
  const [loans, setLoans] = useState([]);
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanInterest, setNewLoanInterest] = useState('5');
  const [newLoanDuration, setNewLoanDuration] = useState('30');
  
  // Call states
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callPartner, setCallPartner] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join-community', {
          userId: user?.id || 'guest_' + Date.now(),
          userName: user?.name || 'Guest Farmer',
          avatar: user?.photoURL || null
        });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('online-users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('new-message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('new-post', (post) => {
        setPosts((prev) => [post, ...prev]);
      });

      newSocket.on('payment-received', (payment) => {
        setWalletBalance((prev) => prev + payment.amount);
        setTransactions((prev) => [payment, ...prev]);
      });

      newSocket.on('loan-request', (loan) => {
        setLoans((prev) => [loan, ...prev]);
      });

      // WebRTC signaling
      newSocket.on('call-offer', async (data) => {
        setCallPartner(data.from);
        // Handle incoming call
      });

      newSocket.on('call-answer', async (data) => {
        // Handle call answer
      });

      newSocket.on('ice-candidate', async (data) => {
        // Handle ICE candidate
      });

      setSocket(newSocket);

      // Load mock data
      loadMockData();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isOpen]);

  // Load mock community data
  const loadMockData = () => {
    setPosts([
      {
        id: 1,
        user: { name: 'Ramesh Kumar', avatar: null },
        content: '🌾 आज की धान की फसल बहुत अच्छी है! किसान भाइयों, अपनी फसल की photos share करें।',
        image: null,
        likes: 24,
        comments: 8,
        time: '2 hours ago'
      },
      {
        id: 2,
        user: { name: 'Sunita Devi', avatar: null },
        content: 'बारिश के बाद टमाटर की खेती में सड़न की समस्या आ रही है। कोई solution बता सकता है?',
        image: null,
        likes: 15,
        comments: 12,
        time: '4 hours ago'
      },
      {
        id: 3,
        user: { name: 'Mohit Singh', avatar: null },
        content: '🚜 नई ट्रैक्टर खरीदी! Mahindra 575 DI - खेती अब और भी आसान',
        image: null,
        likes: 56,
        comments: 23,
        time: 'Yesterday'
      }
    ]);

    setLoans([
      {
        id: 1,
        lender: 'Suresh Patel',
        amount: 50000,
        interest: 8,
        duration: 90,
        status: 'available',
        collateral: 'Land Bond'
      },
      {
        id: 2,
        lender: 'Cooperative Bank',
        amount: 100000,
        interest: 6,
        duration: 180,
        status: 'available',
        collateral: 'Crop Insurance'
      }
    ]);

    setTransactions([
      { id: 1, type: 'received', from: 'Ramesh Kumar', amount: 5000, time: 'Today' },
      { id: 2, type: 'sent', to: 'Seed Supplier', amount: 2000, time: 'Yesterday' }
    ]);

    setOnlineUsers([
      { id: 1, name: 'Ramesh Kumar', status: 'online' },
      { id: 2, name: 'Sunita Devi', status: 'online' },
      { id: 3, name: 'Mohit Singh', status: 'away' }
    ]);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      user: user?.name || 'Guest',
      content: newMessage,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    socket?.emit('send-message', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  // Create post
  const createPost = () => {
    if (!newPost.trim() && !postImage) return;

    const post = {
      id: Date.now(),
      user: { name: user?.name || 'Guest', avatar: user?.photoURL },
      content: newPost,
      image: postImage,
      likes: 0,
      comments: 0,
      time: 'Just now'
    };

    socket?.emit('new-post', post);
    setPosts((prev) => [post, ...prev]);
    setNewPost('');
    setPostImage(null);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPostImage(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send payment
  const sendPayment = () => {
    if (!paymentAmount || !selectedUser) return;
    const amount = parseInt(paymentAmount);
    if (amount > walletBalance) {
      alert('Insufficient balance!');
      return;
    }

    setWalletBalance((prev) => prev - amount);
    const transaction = {
      id: Date.now(),
      type: 'sent',
      to: selectedUser.name,
      amount,
      time: 'Just now'
    };
    setTransactions((prev) => [transaction, ...prev]);
    socket?.emit('send-payment', { to: selectedUser.id, amount });
    setPaymentAmount('');
    setSelectedUser(null);
  };

  // Request loan
  const requestLoan = () => {
    if (!newLoanAmount) return;

    const loan = {
      id: Date.now(),
      borrower: user?.name || 'Guest',
      amount: parseInt(newLoanAmount),
      interest: parseInt(newLoanInterest),
      duration: parseInt(newLoanDuration),
      status: 'pending',
      collateral: 'Crop Bond'
    };

    socket?.emit('loan-request', loan);
    setNewLoanAmount('');
  };

  // Start voice call
  const startCall = async (partner) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setInCall(true);
      setCallPartner(partner);
      socket?.emit('call-offer', { to: partner.id, from: user?.id });
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access microphone');
    }
  };

  // End call
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setInCall(false);
    setCallPartner(null);
    socket?.emit('call-end', { partner: callPartner?.id });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
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
          className="w-full max-w-5xl h-[85vh] glass-heavy rounded-3xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Community Hub
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-white/50 text-xs flex items-center gap-2">
                  <Circle className={`w-2 h-2 ${isConnected ? 'fill-emerald-400 text-emerald-400' : 'fill-red-400 text-red-400'}`} />
                  {isConnected ? `${onlineUsers.length} online` : 'Connecting...'}
                </p>
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

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-4">
            {[
              { id: 'feed', icon: MessageCircle, label: 'Feed' },
              { id: 'payments', icon: Wallet, label: 'Payments' },
              { id: 'loans', icon: HandCoins, label: 'Loans' },
              { id: 'call', icon: Phone, label: 'Voice Call' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/70'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* Feed Tab */}
              {activeTab === 'feed' && (
                <div className="space-y-4">
                  {/* Create Post */}
                  <div className="glass rounded-2xl p-4">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share with the community..."
                      className="w-full bg-transparent text-white placeholder-white/40 resize-none outline-none"
                      rows={3}
                    />
                    {postImage && (
                      <div className="relative mt-2">
                        <img src={postImage} alt="Upload preview" className="max-h-40 rounded-xl" />
                        <button
                          onClick={() => setPostImage(null)}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-sm">Photo</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={createPost}
                        disabled={!newPost.trim() && !postImage}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                      >
                        Post
                      </motion.button>
                    </div>
                  </div>

                  {/* Posts */}
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {post.user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{post.user.name}</p>
                          <p className="text-white/40 text-xs">{post.time}</p>
                        </div>
                        <button className="p-1 hover:bg-white/10 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-white/40" />
                        </button>
                      </div>
                      <p className="text-white/80 mb-3">{post.content}</p>
                      {post.image && (
                        <img src={post.image} alt="Post" className="w-full rounded-xl mb-3" />
                      )}
                      <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                        <button className="flex items-center gap-2 text-white/50 hover:text-rose-400 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-white/50 hover:text-indigo-400 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {/* Wallet Balance */}
                  <div className="glass rounded-2xl p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <p className="text-white/60 text-sm mb-2">Wallet Balance</p>
                    <p className="text-3xl font-bold text-white flex items-center">
                      ₹{walletBalance.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Send Payment */}
                  <div className="glass rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Send Payment
                    </h4>
                    <div className="space-y-3">
                      <select
                        value={selectedUser?.id || ''}
                        onChange={(e) => {
                          const user = onlineUsers.find((u) => u.id === parseInt(e.target.value));
                          setSelectedUser(user);
                        }}
                        className="w-full px-4 py-3 glass-input rounded-xl text-white"
                      >
                        <option value="">Select recipient...</option>
                        {onlineUsers.map((u) => (
                          <option key={u.id} value={u.id} className="bg-slate-900">
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Amount (₹)"
                        className="w-full px-4 py-3 glass-input rounded-xl text-white"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={sendPayment}
                        disabled={!paymentAmount || !selectedUser}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium disabled:opacity-50"
                      >
                        Send Payment
                      </motion.button>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="glass rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-4">Recent Transactions</h4>
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === 'received' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                            }`}>
                              {tx.type === 'received' ? (
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm">
                                {tx.type === 'received' ? `From ${tx.from}` : `To ${tx.to}`}
                              </p>
                              <p className="text-white/40 text-xs">{tx.time}</p>
                            </div>
                          </div>
                          <p className={`font-semibold ${
                            tx.type === 'received' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'received' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loans Tab */}
              {activeTab === 'loans' && (
                <div className="space-y-4">
                  {/* Request Loan */}
                  <div className="glass rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400" />
                      Create Loan Request (Bond-based)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={newLoanAmount}
                        onChange={(e) => setNewLoanAmount(e.target.value)}
                        placeholder="Amount (₹)"
                        className="px-4 py-3 glass-input rounded-xl text-white"
                      />
                      <input
                        type="number"
                        value={newLoanInterest}
                        onChange={(e) => setNewLoanInterest(e.target.value)}
                        placeholder="Interest %"
                        className="px-4 py-3 glass-input rounded-xl text-white"
                      />
                      <input
                        type="number"
                        value={newLoanDuration}
                        onChange={(e) => setNewLoanDuration(e.target.value)}
                        placeholder="Duration (days)"
                        className="px-4 py-3 glass-input rounded-xl text-white"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={requestLoan}
                      disabled={!newLoanAmount}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium disabled:opacity-50"
                    >
                      Request Loan with Crop Bond
                    </motion.button>
                  </div>

                  {/* Available Loans */}
                  <div className="glass rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-4">Available Loan Bonds</h4>
                    <div className="space-y-3">
                      {loans.map((loan) => (
                        <motion.div
                          key={loan.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-white font-semibold">₹{loan.amount.toLocaleString('en-IN')}</p>
                              <p className="text-white/50 text-sm">By {loan.lender}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              loan.status === 'available' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-white/40">Interest</p>
                              <p className="text-white">{loan.interest}%</p>
                            </div>
                            <div>
                              <p className="text-white/40">Duration</p>
                              <p className="text-white">{loan.duration} days</p>
                            </div>
                            <div>
                              <p className="text-white/40">Collateral</p>
                              <p className="text-amber-400">{loan.collateral}</p>
                            </div>
                          </div>
                          {loan.status === 'available' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-medium"
                            >
                              Apply for this Loan
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Voice Call Tab */}
              {activeTab === 'call' && (
                <div className="space-y-4">
                  {inCall ? (
                    /* Active Call UI */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-2xl p-8 text-center"
                    >
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-white font-bold">
                          {callPartner?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{callPartner?.name || 'User'}</h3>
                      <p className="text-emerald-400 text-sm mb-8 flex items-center justify-center gap-2">
                        <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" />
                        Call in progress...
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={toggleMute}
                          className={`p-4 rounded-full ${
                            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                          }`}
                        >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={endCall}
                          className="p-4 rounded-full bg-red-500 text-white"
                        >
                          <PhoneOff className="w-6 h-6" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Call Users List */
                    <div className="glass rounded-2xl p-4">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-emerald-400" />
                        Start Voice Call
                      </h4>
                      <div className="space-y-2">
                        {onlineUsers.map((u) => (
                          <motion.div
                            key={u.id}
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white text-sm">{u.name}</p>
                                <p className="text-white/40 text-xs flex items-center gap-1">
                                  <Circle className={`w-2 h-2 ${
                                    u.status === 'online' ? 'fill-emerald-400' : 'fill-amber-400'
                                  }`} />
                                  {u.status}
                                </p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startCall(u)}
                              disabled={u.status !== 'online'}
                              className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Phone className="w-5 h-5" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Online Users Sidebar (Desktop) */}
            <div className="hidden lg:block w-64 border-l border-white/10 p-4 overflow-y-auto custom-scrollbar">
              <h4 className="text-white/70 text-sm font-medium mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Online Members
              </h4>
              <div className="space-y-2">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        u.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                    </div>
                    <span className="text-white/70 text-sm truncate">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input (only on Feed tab) */}
          {activeTab === 'feed' && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send a message to the community..."
                  className="flex-1 px-4 py-3 glass-input rounded-xl text-white text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl"
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommunityHub;
