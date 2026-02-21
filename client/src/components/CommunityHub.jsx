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
  Video,
  VideoOff,
  Calendar,
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
  Shield,
  ArrowBigUp,
  ArrowBigDown
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
  const [callPartner, setCallPartner] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleNote, setScheduleNote] = useState('');
  const [scheduleCallType, setScheduleCallType] = useState('audio');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Create RTCPeerConnection with all event handlers
  const createPeerConnection = (targetId) => {
    const pc = new RTCPeerConnection(iceServers);

    // Send ICE candidates to the remote peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    // When remote audio/video track arrives, play it
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && isVideoCall) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => console.log('Video autoplay blocked:', e));
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(e => console.log('Audio autoplay blocked:', e));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

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
        // Show incoming call notification instead of auto-answering
        setIncomingCall(data);
      });

      newSocket.on('call-answer', async (data) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          }
        } catch (err) {
          console.error('Error handling call answer:', err);
        }
      });

      newSocket.on('ice-candidate', async (data) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      });

      newSocket.on('call-ended', () => {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        setInCall(false);
        setCallPartner(null);
        setIsMuted(false);
        setIsVideoCall(false);
        setIsVideoEnabled(true);
        setIncomingCall(null);
      });

      newSocket.on('vote-updated', ({ postId, votes, userVote, fromUserId }) => {
        setPosts((prev) => prev.map(p => {
          if (p.id === postId) {
            return { ...p, votes: votes };
          }
          return p;
        }));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Load real data from API
      loadCommunityData();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isOpen]);

  // Load community data from API (fallback to empty)
  const loadCommunityData = async () => {
    try {
      const userId = user?.id || user?.email || 'guest';
      const [postsRes, messagesRes, txRes, loansRes] = await Promise.all([
        fetch('/api/community/posts').then(r => r.json()),
        fetch('/api/community/messages').then(r => r.json()),
        fetch(`/api/community/transactions/${encodeURIComponent(userId)}`).then(r => r.json()),
        fetch('/api/community/loans').then(r => r.json())
      ]);
      if (postsRes.data && postsRes.data.length > 0) {
        setPosts(postsRes.data);
      }
      if (messagesRes.data && messagesRes.data.length > 0) {
        setMessages(messagesRes.data);
      }
      if (txRes.data) {
        setTransactions(txRes.data);
      }
      if (txRes.balance !== undefined) {
        setWalletBalance(txRes.balance);
      }
      if (loansRes.data) {
        setLoans(loansRes.data);
      }

      // Fetch call logs and scheduled calls
      const myId = user?.id || user?.email || 'guest';
      const [callLogsRes, scheduledRes] = await Promise.all([
        fetch(`/api/community/calls/${encodeURIComponent(myId)}`).then(r => r.json()),
        fetch(`/api/community/scheduled-calls/${encodeURIComponent(myId)}`).then(r => r.json())
      ]);
      if (callLogsRes.data) setCallLogs(callLogsRes.data);
      if (scheduledRes.data) setScheduledCalls(scheduledRes.data);
    } catch (err) {
      console.error('Failed to load community data:', err);
    }
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

  // Create post — persist via API then broadcast
  const createPost = async () => {
    if (!newPost.trim() && !postImage) return;

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: user?.name || 'Guest',
          authorAvatar: user?.photoURL || null,
          content: newPost,
          image: postImage
        })
      });
      const result = await res.json();
      if (result.data) {
        socket?.emit('new-post', result.data);
        setPosts((prev) => [result.data, ...prev]);
      } else {
        // Fallback: add locally if API fails
        const post = {
          id: Date.now(),
          user: { name: user?.name || 'Guest', avatar: user?.photoURL },
          content: newPost,
          image: postImage,
          votes: 0, userVote: 0, comments: 0,
          time: 'Just now'
        };
        socket?.emit('new-post', post);
        setPosts((prev) => [post, ...prev]);
      }
    } catch (err) {
      console.error('Create post error:', err);
      // Fallback: add locally
      const post = {
        id: Date.now(),
        user: { name: user?.name || 'Guest', avatar: user?.photoURL },
        content: newPost,
        image: postImage,
        votes: 0, userVote: 0, comments: 0,
        time: 'Just now'
      };
      socket?.emit('new-post', post);
      setPosts((prev) => [post, ...prev]);
    }
    setNewPost('');
    setPostImage(null);
  };

  const handleVote = async (postId, type) => {
    // Optimistic update locally
    let newVoteValue = 0;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let newVotes = post.votes;
        let newUserVote = post.userVote;

        if (type === 'up') {
          if (post.userVote === 1) { newVotes -= 1; newUserVote = 0; }
          else if (post.userVote === -1) { newVotes += 2; newUserVote = 1; }
          else { newVotes += 1; newUserVote = 1; }
        } else {
          if (post.userVote === -1) { newVotes += 1; newUserVote = 0; }
          else if (post.userVote === 1) { newVotes -= 2; newUserVote = -1; }
          else { newVotes -= 1; newUserVote = -1; }
        }

        newVoteValue = newUserVote;
        const voteData = { postId, votes: newVotes, userVote: newUserVote, fromUserId: socket?.id };
        socket?.emit('vote-post', voteData);
        return { ...post, votes: newVotes, userVote: newUserVote };
      }
      return post;
    }));

    // Persist vote to DB
    try {
      await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: newVoteValue,
          odlerIdentifier: user?.id || user?.email || 'guest'
        })
      });
    } catch (err) {
      console.error('Vote persist error:', err);
    }
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

  // Send payment — persist via API
  const sendPayment = async () => {
    if (!paymentAmount || !selectedUser) return;
    const amount = parseInt(paymentAmount);
    if (amount > walletBalance) {
      alert('Insufficient balance!');
      return;
    }

    try {
      const res = await fetch('/api/community/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: user?.name || 'Guest',
          senderId: user?.id || user?.email || 'guest',
          recipientName: selectedUser.userName || selectedUser.name,
          recipientId: selectedUser.userId || selectedUser.id,
          amount
        })
      });
      const result = await res.json();
      if (result.data) {
        setTransactions((prev) => [result.data, ...prev]);
      }
    } catch (err) {
      console.error('Transaction save error:', err);
      // Fallback: add locally
      const transaction = {
        id: Date.now(),
        type: 'sent',
        to: selectedUser.userName || selectedUser.name,
        amount,
        time: 'Just now'
      };
      setTransactions((prev) => [transaction, ...prev]);
    }

    setWalletBalance((prev) => prev - amount);
    socket?.emit('send-payment', { to: selectedUser.userId || selectedUser.id, amount, fromName: user?.name || 'Guest' });
    setPaymentAmount('');
    setSelectedUser(null);
  };

  // Request loan — persist via API
  const requestLoan = async () => {
    if (!newLoanAmount) return;

    try {
      const res = await fetch('/api/community/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender: user?.name || 'Guest',
          lenderId: user?.id || user?.email || 'guest',
          amount: parseInt(newLoanAmount),
          interest: parseInt(newLoanInterest),
          duration: parseInt(newLoanDuration),
          collateral: 'Crop Bond'
        })
      });
      const result = await res.json();
      if (result.data) {
        setLoans((prev) => [result.data, ...prev]);
        socket?.emit('loan-request', result.data);
      }
    } catch (err) {
      console.error('Loan create error:', err);
      // Fallback: add locally
      const loan = {
        id: Date.now(),
        lender: user?.name || 'Guest',
        amount: parseInt(newLoanAmount),
        interest: parseInt(newLoanInterest),
        duration: parseInt(newLoanDuration),
        status: 'available',
        collateral: 'Crop Bond'
      };
      setLoans((prev) => [loan, ...prev]);
      socket?.emit('loan-request', loan);
    }
    setNewLoanAmount('');
  };

  // Apply for a loan
  const applyForLoan = async (loanId) => {
    try {
      const res = await fetch(`/api/community/loans/${loanId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower: user?.name || 'Guest',
          borrowerId: user?.id || user?.email || 'guest'
        })
      });
      const result = await res.json();
      if (result.success) {
        setLoans(prev => prev.map(l =>
          l.id === loanId ? { ...l, status: 'taken', borrower: user?.name || 'Guest' } : l
        ));
      }
    } catch (err) {
      console.error('Apply loan error:', err);
    }
  };

  // Start voice call
  const startCall = async (partner, withVideo = false) => {
    try {
      const constraints = { audio: true };
      if (withVideo) constraints.video = true;
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (withVideo && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => { });
      }

      const pc = createPeerConnection(partner.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setIsVideoCall(withVideo);
      setInCall(true);
      setCallPartner(partner);
      setCallStartTime(Date.now());
      socket?.emit('call-offer', {
        to: partner.id,
        from: user?.id,
        offer: offer,
        callType: withVideo ? 'video' : 'audio'
      });
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access microphone' + (withVideo ? '/camera' : ''));
    }
  };

  // Accept incoming call
  const acceptCall = async (data) => {
    try {
      const withVideo = data.callType === 'video';
      const constraints = { audio: true };
      if (withVideo) constraints.video = true;
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (withVideo && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => { });
      }

      const pc = createPeerConnection(data.from.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('call-answer', { to: data.from.id, answer });

      setIsVideoCall(withVideo);
      setCallPartner(data.from);
      setInCall(true);
      setCallStartTime(Date.now());
      setIncomingCall(null);
    } catch (err) {
      console.error('Error accepting call:', err);
      setIncomingCall(null);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall) {
      socket?.emit('call-end', { partner: incomingCall.from?.id });
      setIncomingCall(null);
    }
  };

  // End call
  const endCall = () => {
    // Save call log
    const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    if (callPartner) {
      saveCallLog(callPartner, isVideoCall ? 'video' : 'audio', duration, 'completed');
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    socket?.emit('call-end', { partner: callPartner?.id });
    setInCall(false);
    setCallPartner(null);
    setIsMuted(false);
    setIsVideoCall(false);
    setIsVideoEnabled(true);
    setCallStartTime(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  // Save call log to MongoDB
  const saveCallLog = async (partner, callType, duration, status) => {
    try {
      await fetch('/api/community/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerName: user?.name || 'Guest',
          callerId: user?.id || user?.email || 'guest',
          receiverName: partner?.userName || partner?.name || 'User',
          receiverId: partner?.userId || partner?.id,
          callType,
          duration,
          status
        })
      });
      // Refresh call logs
      const myId = user?.id || user?.email || 'guest';
      const res = await fetch(`/api/community/calls/${encodeURIComponent(myId)}`).then(r => r.json());
      if (res.data) setCallLogs(res.data);
    } catch (err) {
      console.error('Save call log error:', err);
    }
  };

  // Schedule a call
  const scheduleCallHandler = async () => {
    if (!scheduleTarget || !scheduleDate) return;
    try {
      const res = await fetch('/api/community/scheduled-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedulerName: user?.name || 'Guest',
          schedulerId: user?.id || user?.email || 'guest',
          targetName: scheduleTarget.userName || scheduleTarget.name,
          targetId: scheduleTarget.userId || scheduleTarget.id,
          callType: scheduleCallType,
          scheduledTime: new Date(scheduleDate).toISOString(),
          note: scheduleNote
        })
      });
      const result = await res.json();
      if (result.data) {
        setScheduledCalls(prev => [...prev, result.data]);
      }
      setScheduleDate('');
      setScheduleTarget(null);
      setScheduleNote('');
    } catch (err) {
      console.error('Schedule call error:', err);
    }
  };

  // Cancel a scheduled call
  const cancelScheduledCall = async (callId) => {
    try {
      await fetch(`/api/community/scheduled-calls/${callId}`, { method: 'DELETE' });
      setScheduledCalls(prev => prev.filter(c => c.id !== callId));
    } catch (err) {
      console.error('Cancel scheduled call error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden audio element for WebRTC remote audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
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
                  <h2 className="text-lg font-bold text-main flex items-center gap-2">
                    Community Hub
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-muted text-xs flex items-center gap-2">
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
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-main' : 'text-muted hover:text-main'
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
                        className="w-full bg-transparent text-main placeholder:text-muted/40 resize-none outline-none"
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
                            {(post.user.name || post.user.userName || '?').charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-main font-medium">{post.user.name || post.user.userName}</p>
                            <p className="text-muted text-xs">{post.time}</p>
                          </div>
                          <button className="p-1 hover:bg-black/5 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-muted" />
                          </button>
                        </div>
                        <p className="text-white/80 mb-3">{post.content}</p>
                        {post.image && (
                          <img src={post.image} alt="Post" className="w-full rounded-xl mb-3" />
                        )}
                        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleVote(post.id, 'up')}
                              className={`p-1 rounded-lg transition-colors ${post.userVote === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/40 hover:text-emerald-400'}`}
                            >
                              <ArrowBigUp className={`w-6 h-6 ${post.userVote === 1 ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`text-xs font-bold ${post.votes > 0 ? 'text-emerald-400' : post.votes < 0 ? 'text-rose-400' : 'text-white/40'}`}>
                              {post.votes}
                            </span>
                            <button
                              onClick={() => handleVote(post.id, 'down')}
                              className={`p-1 rounded-lg transition-colors ${post.userVote === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-muted hover:text-rose-400'}`}
                            >
                              <ArrowBigDown className={`w-6 h-6 ${post.userVote === -1 ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 ml-2">
                            <button className="flex items-center gap-2 text-muted hover:text-indigo-400 transition-colors">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm">{post.comments}</span>
                            </button>
                          </div>
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
                      <p className="text-muted text-sm mb-2">Wallet Balance</p>
                      <p className="text-3xl font-bold text-main flex items-center">
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
                            const found = onlineUsers.find((u) => u.id === e.target.value);
                            setSelectedUser(found);
                          }}
                          className="w-full px-4 py-3 glass-input rounded-xl text-main"
                        >
                          <option value="" className="bg-app text-main">Select recipient...</option>
                          {onlineUsers.map((u) => (
                            <option key={u.id} value={u.id} className="bg-app text-main">
                              {u.userName || u.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Amount (₹)"
                          className="w-full px-4 py-3 glass-input rounded-xl text-main placeholder:text-muted/40"
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
                      <h4 className="text-main font-semibold mb-4">Recent Transactions</h4>
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'received' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                }`}>
                                {tx.type === 'received' ? (
                                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
                                )}
                              </div>
                              <div>
                                <p className="text-main text-sm">
                                  {tx.type === 'received' ? `From ${tx.from}` : `To ${tx.to}`}
                                </p>
                                <p className="text-muted text-xs">{tx.time}</p>
                              </div>
                            </div>
                            <p className={`font-semibold ${tx.type === 'received' ? 'text-emerald-400' : 'text-red-400'
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
                      <h4 className="text-main font-semibold mb-4 flex items-center gap-2">
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
                          className="px-4 py-3 glass-input rounded-xl text-main placeholder:text-muted/40"
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
                      <h4 className="text-main font-semibold mb-4">Available Loan Bonds</h4>
                      <div className="space-y-3">
                        {loans.map((loan) => (
                          <motion.div
                            key={loan.id}
                            whileHover={{ scale: 1.01 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-main font-semibold">₹{loan.amount.toLocaleString('en-IN')}</p>
                                <p className="text-muted text-sm">By {loan.lender}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${loan.status === 'available'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {loan.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">Interest</p>
                                <p className="text-main font-medium">{loan.interest}%</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">Duration</p>
                                <p className="text-main font-medium">{loan.duration} days</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">Collateral</p>
                                <p className="text-amber-400 font-medium">{loan.collateral}</p>
                              </div>
                            </div>
                            {loan.status === 'available' && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => applyForLoan(loan.id)}
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

                {/* Voice/Video Call Tab */}
                {activeTab === 'call' && (
                  <div className="space-y-4">
                    {/* Incoming Call Notification */}
                    {incomingCall && !inCall && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-6 text-center border border-emerald-500/30"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <Phone className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-main font-semibold text-lg">{incomingCall.from?.userName || 'Someone'}</h4>
                        <p className="text-muted text-sm mb-4">
                          Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call...
                        </p>
                        <div className="flex justify-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => acceptCall(incomingCall)}
                            className="px-6 py-3 rounded-full bg-emerald-500 text-white font-medium flex items-center gap-2"
                          >
                            <Phone className="w-5 h-5" /> Accept
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={rejectCall}
                            className="px-6 py-3 rounded-full bg-red-500 text-white font-medium flex items-center gap-2"
                          >
                            <PhoneOff className="w-5 h-5" /> Reject
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {inCall ? (
                      /* Active Call UI */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-2xl p-6 text-center"
                      >
                        {isVideoCall ? (
                          <div className="relative mb-4">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-xl bg-black/50" style={{ maxHeight: '300px' }} />
                            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-2 right-2 w-24 h-18 rounded-lg border-2 border-white/30" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl text-white font-bold">
                              {(callPartner?.userName || callPartner?.name || 'U').charAt(0)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-main mb-2">{callPartner?.userName || callPartner?.name || 'User'}</h3>
                        <p className="text-emerald-400 text-sm mb-6 flex items-center justify-center gap-2">
                          <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" />
                          {isVideoCall ? 'Video' : 'Voice'} call in progress...
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleMute}
                            className={`p-3 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
                          >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </motion.button>
                          {isVideoCall && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={toggleVideo}
                              className={`p-3 rounded-full ${!isVideoEnabled ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
                            >
                              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={endCall}
                            className="p-3 rounded-full bg-red-500 text-white"
                          >
                            <PhoneOff className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        {/* Online Users - Call buttons */}
                        <div className="glass rounded-2xl p-4">
                          <h4 className="text-main font-semibold mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-400" />
                            Call a Member
                          </h4>
                          <div className="space-y-2">
                            {onlineUsers.filter(u => u.id !== socket?.id).length === 0 && (
                              <p className="text-muted text-sm text-center py-4">No other members online right now</p>
                            )}
                            {onlineUsers.filter(u => u.id !== socket?.id).map((u) => (
                              <motion.div
                                key={u.id}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {(u.userName || u.name || '?').charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-main text-sm">{u.userName || u.name}</p>
                                    <p className="text-white/40 text-xs flex items-center gap-1">
                                      <Circle className="w-2 h-2 fill-emerald-400" />
                                      online
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => startCall(u, false)}
                                    title="Voice Call"
                                    className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => startCall(u, true)}
                                    title="Video Call"
                                    className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                                  >
                                    <Video className="w-5 h-5" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Schedule Call */}
                        <div className="glass rounded-2xl p-4">
                          <h4 className="text-main font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Schedule a Call
                          </h4>
                          <div className="space-y-3">
                            <select
                              value={scheduleTarget?.id || ''}
                              onChange={(e) => {
                                const found = onlineUsers.find(u => u.id === e.target.value);
                                setScheduleTarget(found);
                              }}
                              className="w-full px-4 py-3 glass-input rounded-xl text-main"
                            >
                              <option value="" className="bg-app text-main">Select person...</option>
                              {onlineUsers.filter(u => u.id !== socket?.id).map(u => (
                                <option key={u.id} value={u.id} className="bg-app text-main">{u.userName || u.name}</option>
                              ))}
                            </select>
                            <input
                              type="datetime-local"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full px-4 py-3 glass-input rounded-xl text-main"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setScheduleCallType('audio')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${scheduleCallType === 'audio' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-muted'}`}
                              >
                                🎙️ Audio
                              </button>
                              <button
                                onClick={() => setScheduleCallType('video')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${scheduleCallType === 'video' ? 'bg-blue-500 text-white' : 'bg-white/10 text-muted'}`}
                              >
                                📹 Video
                              </button>
                            </div>
                            <input
                              type="text"
                              value={scheduleNote}
                              onChange={(e) => setScheduleNote(e.target.value)}
                              placeholder="Add a note (optional)"
                              className="w-full px-4 py-3 glass-input rounded-xl text-main placeholder:text-muted/40"
                            />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={scheduleCallHandler}
                              disabled={!scheduleTarget || !scheduleDate}
                              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white font-medium disabled:opacity-50"
                            >
                              Schedule Call
                            </motion.button>
                          </div>

                          {/* Scheduled Calls List */}
                          {scheduledCalls.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-muted text-xs uppercase tracking-wider">Upcoming</p>
                              {scheduledCalls.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                  <div>
                                    <p className="text-main text-sm">{c.targetName}</p>
                                    <p className="text-muted text-xs">
                                      {new Date(c.scheduledTime).toLocaleString('en-IN')} • {c.callType}
                                    </p>
                                    {c.note && <p className="text-muted text-xs mt-1">📝 {c.note}</p>}
                                  </div>
                                  <button
                                    onClick={() => cancelScheduledCall(c.id)}
                                    className="p-1 rounded-full hover:bg-red-500/20 text-red-400"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Call History */}
                        {callLogs.length > 0 && (
                          <div className="glass rounded-2xl p-4">
                            <h4 className="text-main font-semibold mb-4 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-muted" />
                              Call History
                            </h4>
                            <div className="space-y-2">
                              {callLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                  <div className="flex items-center gap-3">
                                    {log.callType === 'video' ? (
                                      <Video className="w-4 h-4 text-blue-400" />
                                    ) : (
                                      <Phone className="w-4 h-4 text-emerald-400" />
                                    )}
                                    <div>
                                      <p className="text-main text-sm">{log.receiverName}</p>
                                      <p className="text-muted text-xs">{log.time} • {log.duration}s</p>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {log.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                    <div key={u.id || u.socketId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {(u.name || u.userName || '?').charAt(0)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${u.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`} />
                      </div>
                      <span className="text-white/70 text-sm truncate">{u.name || u.userName}</span>
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
    </>
  );
};

export default CommunityHub;
