import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Users, Clock, SkipForward, Coins } from 'lucide-react';
import { toast } from 'sonner';

import socketService from '../lib/socket';

import {
  MicrophoneIcon,
  MicrophoneOffIcon,
  CameraIcon,
  CameraOffIcon,
  ChatIcon,
  PhoneEndIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  SendIcon,
  CloseIcon,
  LoadingSpinnerIcon
} from './icons/VideoCallIcons';

export function VideoChat({ match, currentUser, onEndCall, onTokenUpdate, matchingService }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimer, setControlsTimer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const callStartTime = useRef(Date.now());
  const iceCandidatesBuffer = useRef([]);
  const cleanupDone = useRef(false);

  // Robust partner/initiator assignment
  let partner, isInitiator;
  if (match.partner) {
    partner = match.partner;
    isInitiator = !!match.isInitiator;
  } else if (match.user1 && match.user2) {
    if (match.user1_id && currentUser.id) {
      partner = match.user1_id === currentUser.id ? match.user2 : match.user1;
      isInitiator = match.user1_id === currentUser.id;
    } else {
      partner = match.user2 || match.user1 || { id: 'unknown', name: 'Your Match' };
      isInitiator = false;
    }
  } else if (match.partner_id && match.partner_name) {
    partner = { id: match.partner_id, name: match.partner_name };
    isInitiator = !!match.isInitiator;
  } else {
    partner = { id: 'unknown', name: 'Your Match' };
    isInitiator = false;
  }
  // Add error handling for socket connection
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      toast.error('Socket not connected. Please refresh or check your network.');
    }
  }, []);

  useEffect(() => {
    console.log('🎬 VideoChat mounted');
    cleanupDone.current = false;
    initializeVideoChat();
    setupChatListeners();
    startCallTimer();

    return () => {
      console.log('🔄 Unmounting');
      if (!cleanupDone.current) {
        cleanup();
      }
    };
  }, [match.id, match.matchId]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimer) clearTimeout(controlsTimer);
      const timer = setTimeout(() => setShowControls(false), 3000);
      setControlsTimer(timer);
    }
    return () => {
      if (controlsTimer) clearTimeout(controlsTimer);
    };
  }, [showControls]);

  const cleanup = async () => {
    if (cleanupDone.current) return;
    console.log('🧹 Cleanup');
    cleanupDone.current = true;
    
    try {
      if (socketService.socket) {
        const events = ['roomReady', 'webrtc-offer', 'webrtc-answer', 'ice-candidate', 'participantLeft', 'partnerSkipped'];
        events.forEach(event => socketService.removeAllListeners(event));
        
        const roomId = match.roomId || match.room_id || match.id;
        if (socketService.isSocketConnected()) {
          socketService.socket.emit('leaveVideoRoom', { roomId, matchId: match.matchId || match.id });
        }
      }
    } catch (error) {
      console.error('Socket cleanup err:', error);
    }

    if (window.peerConnection) {
      try {
        window.peerConnection.getSenders().forEach(s => s.track?.stop());
        window.peerConnection.getReceivers().forEach(r => r.track?.stop());
        window.peerConnection.close();
        window.peerConnection = null;
      } catch (error) {
        console.error('Peer err:', error);
      }
    }

    stopAllStreams();
    iceCandidatesBuffer.current = [];
    
    if (localVideoRef.current) {
      try {
        localVideoRef.current.srcObject = null;
        if (!localVideoRef.current.paused) localVideoRef.current.pause();
      } catch (e) {
        console.warn('Local video cleanup error:', e);
      }
    }
    if (remoteVideoRef.current) {
      try {
        remoteVideoRef.current.srcObject = null;
        if (!remoteVideoRef.current.paused) remoteVideoRef.current.pause();
      } catch (e) {
        console.warn('Remote video cleanup error:', e);
      }
    }
    
    if (window.webrtcHandlers) delete window.webrtcHandlers;
    if (window.localMediaStream) delete window.localMediaStream;
    
    cleanupChatListeners();
    setConnectionState('idle');
    console.log('✅ Cleanup done');
  };

  const stopAllStreams = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      remoteVideoRef.current.srcObject = null;
    }
    if (window.localMediaStream) {
      window.localMediaStream.getTracks().forEach(t => t.stop());
      delete window.localMediaStream;
    }
  };

  const initializeVideoChat = async () => {
    try {
      console.log('🎥 ULTRA-FAST MODE ENABLED');
      setConnectionState('connecting');

      let attempts = 0;
      while (!socketService.isSocketConnected() && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!socketService.isSocketConnected()) {
        throw new Error('Socket timeout');
      }

      console.log('✅ Socket connected');

      const roomId = match.roomId || match.room_id || match.id;
      const matchId = match.matchId || match.id;

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 3,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      console.log('📹 Getting media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      console.log('✅ Media obtained');

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      window.localMediaStream = stream;

      const pc = new RTCPeerConnection(configuration);
      window.peerConnection = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log(`🎉 Track: ${event.track.kind}`);

        if (event.streams && event.streams[0]) {
          const remoteVideo = remoteVideoRef.current;
          
          if (remoteVideo) {
            console.log('🎯 Setting video NOW');
            remoteVideo.srcObject = event.streams[0];
            setConnectionState('connected');
            
            remoteVideo.muted = true;
            remoteVideo.play()
              .then(() => {
                console.log('✅ Playing');
                setTimeout(() => { 
                  remoteVideo.muted = false; 
                  console.log('✅ Unmuted');
                }, 200);
              })
              .catch(err => console.error('Play err:', err));
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.socket.emit('ice-candidate', { roomId, candidate: event.candidate });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🔌 ICE state:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setConnectionState('connected');
          toast.success('Connected!');
        } else if (pc.iceConnectionState === 'failed') {
          setConnectionState('failed');
          toast.error('Connection failed');
        } else if (pc.iceConnectionState === 'disconnected') {
          setConnectionState('disconnected');
        }
      };

      // ============================================
      // ✅✅✅ CRITICAL: ATTACH LISTENERS FIRST ✅✅✅
      // ============================================
      
      const handleRoomReady = async (data) => {
        console.log('🎬🎬🎬 ROOM READY EVENT RECEIVED!', data);

        if (data.participants !== 2) {
          console.warn('⚠️ Invalid participants:', data.participants);
          return;
        }

        // Check isInitiator from backend data (preferred) or fallback to prop
        const amInitiator = data.isInitiator !== undefined ? data.isInitiator : isInitiator;

        if (amInitiator) {
          try {
            console.log('🎯 I AM INITIATOR - Creating offer...');
            const offer = await pc.createOffer({ 
              offerToReceiveAudio: true, 
              offerToReceiveVideo: true 
            });
            await pc.setLocalDescription(offer);
            
            console.log('📤 Sending offer to room:', roomId);
            socketService.socket.emit('webrtc-offer', { roomId, offer: pc.localDescription });
            console.log('✅ Offer sent successfully');
          } catch (error) {
            console.error('❌ Offer creation error:', error);
          }
        } else {
          console.log('⏳ I AM RECEIVER - Waiting for offer...');
        }
      };

      const handleWebRTCOffer = async (data) => {
        console.log(`📥 RECEIVER: Received offer from ${data?.fromName || 'Unknown'}`);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log('✅ Remote description set (offer)');

          for (const candidate of iceCandidatesBuffer.current) {
            await pc.addIceCandidate(candidate);
            console.log('✅ Buffered ICE candidate added');
          }
          iceCandidatesBuffer.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          console.log('📤 Answer sent');
          socketService.socket.emit('webrtc-answer', { roomId, answer: pc.localDescription });
        } catch (error) {
          console.error('❌ Offer handling error:', error);
        }
      };

      const handleWebRTCAnswer = async (data) => {
        console.log('📥 WebRTC answer received');
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('✅ Remote description set from answer');

          for (const candidate of iceCandidatesBuffer.current) {
            await pc.addIceCandidate(candidate);
            console.log('✅ Buffered ICE candidate added');
          }
          iceCandidatesBuffer.current = [];

          console.log('✅ Answer processed successfully');
        } catch (error) {
          console.error('❌ Answer handling error:', error);
        }
      };

      const handleICECandidate = async (data) => {
        try {
          console.log(`📥 Received ICE candidate from ${data?.fromName || 'Unknown'}`);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('✅ ICE candidate added');
          } else {
            console.log('⚠️ Received ICE candidate before remote description');
            iceCandidatesBuffer.current.push(new RTCIceCandidate(data.candidate));
          }
        } catch (error) {
          console.error('❌ ICE candidate error:', error);
        }
      };

      const handleParticipantLeft = () => {
        console.log('👋 Partner left');
        setConnectionState('disconnected');
        toast.info('Partner left the call');
        setTimeout(() => {
          handleNextMatch();
        }, 1200);
      };

      const handlePartnerSkipped = (data) => {
  console.log('⏭️ Partner skipped');
  toast.info('Partner moved to next');
  handleNextMatch();
      };

      // ✅ ATTACH ALL LISTENERS TO SOCKET
      console.log('📝 Attaching socket listeners...');
      
      socketService.socket.on('roomReady', handleRoomReady);
      socketService.socket.on('webrtc-offer', handleWebRTCOffer);
      socketService.socket.on('webrtc-answer', handleWebRTCAnswer);
      socketService.socket.on('ice-candidate', handleICECandidate);
      socketService.socket.on('participantLeft', handleParticipantLeft);
      socketService.socket.on('partnerSkipped', handlePartnerSkipped);

      // Store handlers globally for debugging
      window.webrtcHandlers = { 
        handleRoomReady, 
        handleWebRTCOffer, 
        handleWebRTCAnswer, 
        handleICECandidate, 
        handleParticipantLeft 
      };

      console.log('✅ All listeners attached successfully');

      // ============================================
      // ✅✅✅ NOW JOIN ROOM (AFTER LISTENERS) ✅✅✅
      // ============================================
      
      console.log('🚪 Joining video room:', roomId);
      socketService.socket.emit('joinVideoRoom', { roomId, matchId });
      console.log('✅ Room join request sent');

      console.log('✅ WebRTC setup complete');

    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      setConnectionState('failed');
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        toast.error('Camera/microphone access denied. Please check browser permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera/microphone found.');
      } else {
        toast.error('Connection setup failed. Try refreshing.');
      }
    }
  };

  const setupChatListeners = async () => {
    try {
      let attempts = 0;
      while (!socketService.isSocketConnected() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!socketService.socket) return;

      const handleNewMessage = (messageData) => {
        const formattedMessage = {
          id: messageData.id,
          sender_id: messageData.senderId,
          content: messageData.content,
          message_type: messageData.messageType || 'text',
          created_at: messageData.createdAt
        };

        setMessages(prev => {
          if (prev.find(msg => msg.id === formattedMessage.id)) return prev;
          return [...prev, formattedMessage];
        });

        if (!showChat && messageData.senderId !== currentUser.id) {
          setUnreadCount(prev => prev + 1);
        }

        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      };

      socketService.socket.on('newMessage', handleNewMessage);
      window.chatCleanup = () => {
        if (socketService.socket) socketService.socket.off('newMessage', handleNewMessage);
      };
    } catch (error) {
      console.error('Chat setup error:', error);
    }
  };

  const cleanupChatListeners = () => {
    if (window.chatCleanup) {
      window.chatCleanup();
      delete window.chatCleanup;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (!socketService.socket) {
        toast.error('Chat disconnected');
        return;
      }

      socketService.socket.emit('sendMessage', {
        matchId: match.id || match.matchId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const toggleAudio = () => {
    if (window.localMediaStream) {
      const track = window.localMediaStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
        toast.info(track.enabled ? '🎤 Microphone on' : '🔇 Microphone off');
      }
    }
  };

  const toggleVideo = () => {
    if (window.localMediaStream) {
      const track = window.localMediaStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
        toast.info(track.enabled ? '📹 Camera on' : '📷 Camera off');
      }
    }
  };

  const handleNextMatch = async () => {
    try {
      console.log('⏭️ Skipping to next match');
      setIsSkipping(true);
      setConnectionState('disconnecting');

      const roomId = match.roomId || match.room_id || match.id;

      if (socketService.socket && socketService.isSocketConnected()) {
        socketService.socket.emit('skipMatch', {
          roomId,
          matchId: match.matchId || match.id,
          reason: 'user_skipped'
        });
      }

      await cleanup();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (typeof onEndCall === 'function') {
        onEndCall(0);
      }
      
    } catch (error) {
      console.error('Skip error:', error);
      setTimeout(() => window.location.reload(), 1500);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleEndCall = async () => {
    try {
      const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
      await cleanup();
      setConnectionState('idle');
      toast.success(`Call ended: ${formatDuration(duration)}`);
      if (typeof onEndCall === 'function') {
        onEndCall(duration);
      }
    } catch (error) {
      setConnectionState('failed');
      toast.error('Error ending call. Please refresh.');
      console.error('End call error:', error);
    }
  };

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  };

  // ...existing code...

  return (
    <div
      className={`relative w-full h-screen bg-black overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onMouseMove={() => setShowControls(true)}
    >
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {connectionState === 'connecting' && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl text-white mb-2">Connecting to {partner.name}...</h3>
              <p className="text-gray-400 text-sm">⚡ Ultra-fast mode enabled</p>
            </div>
          </div>
        )}
        {connectionState === 'disconnecting' && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl text-white mb-2">Finding next match...</h3>
            </div>
          </div>
        )}
        {connectionState === 'failed' && (
          <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-xl mb-2">Connection Failed</h3>
              <Button onClick={initializeVideoChat} className="mt-4 bg-red-600 hover:bg-red-700">
                Retry Connection
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl z-10">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <CameraOffIcon className="w-10 h-10 text-red-400" />
          </div>
        )}
      </div>
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 transition-opacity z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <Card className="px-4 py-2 bg-black/50 backdrop-blur">
          <div className="flex items-center gap-3 text-white">
            <Users className="w-4 h-4" />
            <span className="font-medium">{partner.name}</span>
            <Clock className="w-3 h-3" />
            <span className="text-sm">{formatDuration(callDuration)}</span>
            {currentUser.is_premium && (
              <>
                <Coins className="w-3 h-3 text-yellow-500" />
                <span className="text-sm">{currentUser.tokens}</span>
              </>
            )}
          </div>
        </Card>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={toggleAudio}
            className={`rounded-full w-14 h-14 ${isAudioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {isAudioEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
          </Button>
          <Button
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 ${isVideoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {isVideoEnabled ? <CameraIcon /> : <CameraOffIcon />}
          </Button>
          <Button
            onClick={handleNextMatch}
            disabled={isSkipping}
            className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSkipping ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SkipForward className="w-6 h-6" />
            )}
          </Button>
          <Button
            onClick={handleEndCall}
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
          >
            <PhoneEndIcon />
          </Button>
          <Button
            onClick={toggleChat}
            className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 relative"
          >
            <ChatIcon />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={toggleFullscreen}
            className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30"
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
          </Button>
        </div>
      </div>
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur border-l border-white/10 flex flex-col z-20">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <span className="text-white font-medium">Chat</span>
            <Button variant="ghost" size="sm" onClick={toggleChat}>
              <CloseIcon className="w-4 h-4 text-white" />
            </Button>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                No messages yet 👋
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type message..."
                className="flex-1 bg-gray-800 text-white border-gray-700"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <SendIcon />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default VideoChat;
