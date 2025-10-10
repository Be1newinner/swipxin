// WebRTC Service - Local Mode (no Supabase)

export class WebRTCService {
  static peerConnection = null;
  static localStream = null;
  static remoteStream = null;
  static signalChannel = null;
  static roomId = null;
  static isInitiator = false;
  static onRemoteStreamCallback = null;
  static onConnectionStateChangeCallback = null;

  // ICE servers configuration
  static iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  // Initialize WebRTC connection
  static async initializeConnection(roomId, isInitiator = false, callbacks = {}) {
    try {
      console.log('🚀 Initializing WebRTC connection...', { roomId, isInitiator });
      
      this.roomId = roomId;
      this.isInitiator = isInitiator;
      this.onRemoteStreamCallback = callbacks.onRemoteStream;
      this.onConnectionStateChangeCallback = callbacks.onConnectionStateChange;

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // Set up event listeners
      this.setupPeerConnectionEvents();

      // Get user media (camera and microphone)
      await this.getUserMedia();

      // Set up signaling channel
      await this.setupSignalingChannel();

      console.log('✅ WebRTC connection initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC connection:', error);
      throw error;
    }
  }

  // Get user media (camera and microphone)
  static async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      console.log('📹 Requesting user media...');
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add local stream tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
          console.log('➕ Added track to peer connection:', track.kind);
        });
      }

      console.log('✅ User media acquired successfully');
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw new Error('Failed to access camera/microphone. Please allow permissions and try again.');
    }
  }

  // Set up peer connection event listeners
  static setupPeerConnectionEvents() {
    if (!this.peerConnection) return;

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Remote stream received');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 New ICE candidate:', event.candidate);
        this.sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔄 Connection state changed:', state);
      
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(state);
      }

      // Handle connection failures
      if (state === 'failed') {
        console.error('❌ WebRTC connection failed');
        this.handleConnectionFailure();
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState;
      console.log('❄️ ICE connection state:', iceState);
    };
  }

  // Set up mock signaling channel (local mode)
  static async setupSignalingChannel() {
    try {
      console.log('📡 Setting up mock signaling channel for room (local mode):', this.roomId);
      
      // In local mode, we'll simulate a signaling channel
      this.signalChannel = {
        mockChannel: true,
        roomId: this.roomId
      };

      console.log('✅ Mock signaling channel established');
      
      // In local mode, we won't actually connect to another peer
      // This is just for testing the interface
      if (this.isInitiator) {
        setTimeout(() => {
          console.log('📡 Local mode: Would create offer here');
          // Don't actually create offer in local mode
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to setup signaling channel:', error);
      throw error;
    }
  }

  // Send signal (local mode - mock)
  static sendSignal(signal) {
    if (this.signalChannel) {
      console.log('📤 Sending WebRTC signal (local mode):', signal.type);
      // In local mode, we don't actually send signals
    }
  }

  // Handle incoming signals
  static async handleRemoteSignal(signal) {
    try {
      console.log('📥 Processing remote signal:', signal.type);

      switch (signal.type) {
        case 'offer':
          await this.handleOffer(signal.offer);
          break;
        case 'answer':
          await this.handleAnswer(signal.answer);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(signal.candidate);
          break;
        default:
          console.warn('Unknown signal type:', signal.type);
      }
    } catch (error) {
      console.error('❌ Failed to handle remote signal:', error);
    }
  }

  // Create and send offer (initiator)
  static async createOffer() {
    try {
      console.log('📞 Creating WebRTC offer...');
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignal({
        type: 'offer',
        offer: offer
      });
      
      console.log('✅ Offer created and sent');
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
    }
  }

  // Handle incoming offer (receiver)
  static async handleOffer(offer) {
    try {
      console.log('📞 Handling incoming offer...');
      
      await this.peerConnection.setRemoteDescription(offer);
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.sendSignal({
        type: 'answer',
        answer: answer
      });
      
      console.log('✅ Answer created and sent');
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
    }
  }

  // Handle incoming answer (initiator)
  static async handleAnswer(answer) {
    try {
      console.log('📞 Handling incoming answer...');
      
      await this.peerConnection.setRemoteDescription(answer);
      
      console.log('✅ Answer processed successfully');
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
    }
  }

  // Handle ICE candidates
  static async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('🧊 ICE candidate added successfully');
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  // Mute/unmute audio
  static toggleAudio(enabled = null) {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== null ? enabled : !audioTrack.enabled;
      console.log('🎤 Audio toggled:', audioTrack.enabled);
      return audioTrack.enabled;
    }
    return false;
  }

  // Mute/unmute video
  static toggleVideo(enabled = null) {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== null ? enabled : !videoTrack.enabled;
      console.log('📹 Video toggled:', videoTrack.enabled);
      return videoTrack.enabled;
    }
    return false;
  }

  // Switch camera (front/back on mobile)
  static async switchCamera() {
    try {
      if (!this.localStream) return false;

      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) return false;

      // Get current facing mode
      const currentFacingMode = videoTrack.getSettings().facingMode || 'user';
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      console.log('📱 Switching camera:', currentFacingMode, '→', newFacingMode);

      // Stop current track
      videoTrack.stop();

      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false // Don't restart audio
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in peer connection
      const sender = this.peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Replace track in local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);

      console.log('✅ Camera switched successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      return false;
    }
  }

  // Handle connection failure
  static handleConnectionFailure() {
    console.log('🔄 Attempting to restart ICE...');
    
    if (this.peerConnection) {
      this.peerConnection.restartIce();
    }
  }

  // End the call
  static endCall() {
    try {
      console.log('📞 Ending WebRTC call...');

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Stop local streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
          console.log('⏹️ Stopped track:', track.kind);
        });
        this.localStream = null;
      }

      // Clear remote stream
      this.remoteStream = null;

      // Close signaling channel
      if (this.signalChannel) {
        console.log('🔇 Closing mock signaling channel');
        this.signalChannel = null;
      }

      // Clear callbacks
      this.onRemoteStreamCallback = null;
      this.onConnectionStateChangeCallback = null;

      // Clear room info
      this.roomId = null;
      this.isInitiator = false;

      console.log('✅ WebRTC call ended successfully');
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }

  // Get connection statistics
  static async getConnectionStats() {
    if (!this.peerConnection) return null;

    try {
      const stats = await this.peerConnection.getStats();
      const report = {};
      
      stats.forEach((stat) => {
        if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
          report.inboundVideo = {
            packetsReceived: stat.packetsReceived,
            packetsLost: stat.packetsLost,
            bytesReceived: stat.bytesReceived,
            frameWidth: stat.frameWidth,
            frameHeight: stat.frameHeight,
            framesPerSecond: stat.framesPerSecond
          };
        }
        
        if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
          report.outboundVideo = {
            packetsSent: stat.packetsSent,
            bytesSent: stat.bytesSent,
            frameWidth: stat.frameWidth,
            frameHeight: stat.frameHeight,
            framesPerSecond: stat.framesPerSecond
          };
        }

        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          report.connection = {
            currentRoundTripTime: stat.currentRoundTripTime,
            availableOutgoingBitrate: stat.availableOutgoingBitrate,
            availableIncomingBitrate: stat.availableIncomingBitrate
          };
        }
      });

      return report;
    } catch (error) {
      console.error('❌ Failed to get connection stats:', error);
      return null;
    }
  }

  // Check if WebRTC is supported
  static isWebRTCSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection &&
      window.RTCSessionDescription &&
      window.RTCIceCandidate
    );
  }

  // Get available media devices
  static async getAvailableDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        videoInputs: devices.filter(device => device.kind === 'videoinput'),
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        audioOutputs: devices.filter(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('❌ Failed to enumerate devices:', error);
      return { videoInputs: [], audioInputs: [], audioOutputs: [] };
    }
  }

  // Change audio output device (if supported)
  static async setAudioOutputDevice(deviceId, audioElement) {
    try {
      if (audioElement && audioElement.setSinkId) {
        await audioElement.setSinkId(deviceId);
        console.log('🔊 Audio output device changed:', deviceId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to change audio output device:', error);
      return false;
    }
  }
}

export default WebRTCService;
