import { ENVIRONMENTS } from '@/constants/envs';
import { io } from 'socket.io-client';

const SOCKET_URL = ENVIRONMENTS.BACKEND_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    console.log('🔌 Connecting to Socket.IO server...');

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Matching system
  joinMatchingQueue(preferences = {}) {
    if (this.socket) {
      console.log('🔍 Joining matching queue with preferences:', preferences);
      this.socket.emit('joinMatchingQueue', preferences);
    }
  }

  leaveMatchingQueue() {
    if (this.socket) {
      console.log('🚨 Leaving matching queue');
      this.socket.emit('leaveMatchingQueue');
    }
  }

  // Video call events
  joinVideoRoom(roomId, matchId) {
    if (this.socket) {
      console.log(`📹 Joining video room ${roomId} for match ${matchId}`);
      this.socket.emit('joinVideoRoom', { roomId, matchId });
    }
  }

  leaveVideoRoom(roomId, matchId) {
    if (this.socket) {
      console.log(`🚪 Leaving video room ${roomId} for match ${matchId}`);
      this.socket.emit('leaveVideoRoom', { roomId, matchId });
    }
  }

  // WebRTC signaling
  sendWebRTCSignal(signal, roomId, targetUserId) {
    if (this.socket) {
      this.socket.emit('webrtc-signal', {
        signal,
        roomId,
        targetUserId
      });
    }
  }

  // Chat messages
  sendMessage(matchId, content, messageType = 'text') {
    if (this.socket) {
      this.socket.emit('sendMessage', {
        matchId,
        content,
        messageType
      });
    }
  }

  // User presence
  updateOnlineStatus(userId, isOnline) {
    if (this.socket) {
      console.log(`🟢 Updating online status via socket for user ${userId}:`, isOnline);
      this.socket.emit('updateOnlineStatus', {
        userId,
        isOnline
      });
    }
  }

  // Event listeners management
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.eventListeners.delete(event);
    }
  }

  // Utility methods
  isSocketConnected() {
    const connected = this.isConnected && this.socket?.connected;
    console.log('🔍 Socket connection check:', {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      overall: connected
    });
    return connected;
  }

  getSocketId() {
    return this.socket?.id;
  }

  // Clean up all listeners
  cleanup() {
    if (this.socket) {
      for (const [event, listeners] of this.eventListeners.entries()) {
        for (const listener of listeners) {
          this.socket.off(event, listener);
        }
      }
      this.eventListeners.clear();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
