import { toast } from 'sonner';
import socketService from './socket.js';

export class MatchingService {
  constructor() {
    this.activeChannel = null;
    this.currentMatch = null;
    this.onMatchFound = null;
    this.onMatchEnded = null;
    this.onMessageReceived = null;
    this.matchingStatus = 'idle'; // idle, searching, matched
    this.eventListeners = new Map();
  }

  // Find and create a match using real backend
  async findMatch(userId, preferredGender = null) {
    try {
      console.log('🔍 Starting match search with backend...', { userId, preferredGender });
      
      if (!socketService.isSocketConnected()) {
        throw new Error('Not connected to server. Please refresh and try again.');
      }

      // Set matching status
      this.matchingStatus = 'searching';
      
      // Join matching queue via Socket.IO
      const preferences = {
        preferredGender: preferredGender === 'any' ? null : preferredGender
      };
      
      socketService.joinMatchingQueue(preferences);
      
      // Return a promise that resolves when match is found
      return new Promise((resolve, reject) => {
        // Set timeout for matching (increased to allow more time for matching)
        const timeout = setTimeout(() => {
          this.matchingStatus = 'idle';
          socketService.leaveMatchingQueue();
          reject(new Error('Matching timeout. No matches found.'));
        }, 120000); // 120 second timeout (2 minutes)
        
        // Listen for match found event
        const handleMatchFound = (matchData) => {
          console.log('📰 Raw matchFound event received:', matchData);
          clearTimeout(timeout);
          this.matchingStatus = 'matched';
          this.currentMatch = {
            id: matchData.matchId,
            roomId: matchData.roomId,
            partner: matchData.partner,
            isInitiator: matchData.isInitiator
          };
          
          console.log('🎉 Match found via backend, formatted:', this.currentMatch);
          cleanup();
          resolve(this.currentMatch);
        };
        
        // Listen for matching errors
        const handleMatchingError = (error) => {
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          console.error('❌ Matching error:', error);
          cleanup();
          reject(new Error(error.message || 'Matching failed'));
        };
        
        // Listen for matching timeout
        const handleMatchingTimeout = (data) => {
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          cleanup();
          reject(new Error(data.message || 'No matches found'));
        };
        
        // Listen for matching status updates
        const handleMatchingStatus = (statusData) => {
          console.log('📊 Matching status update:', statusData);
          // Don't change the searching state for status updates
        };
        
        // Set up event listeners
        socketService.on('matchFound', handleMatchFound);
        socketService.on('matchingError', handleMatchingError);
        socketService.on('matchingTimeout', handleMatchingTimeout);
        socketService.on('matchingStatus', handleMatchingStatus);
        
        // Clean up listeners when promise resolves/rejects
        const cleanup = () => {
          socketService.off('matchFound', handleMatchFound);
          socketService.off('matchingError', handleMatchingError);
          socketService.off('matchingTimeout', handleMatchingTimeout);
          socketService.off('matchingStatus', handleMatchingStatus);
          this.eventListeners.delete('findMatch');
        };
        
        // Store cleanup function
        this.eventListeners.set('findMatch', cleanup);
      });
      
    } catch (error) {
      this.matchingStatus = 'idle';
      console.error('💥 Match finding failed:', error);
      throw new Error(error.message || 'Failed to find match');
    }
  }

  // Start listening for real-time match updates using Socket.IO
  subscribeToMatches(userId, callbacks = {}) {
    console.log('👂 Subscribing to matches for user:', userId);
    
    this.onMatchFound = callbacks.onMatchFound;
    this.onMatchEnded = callbacks.onMatchEnded;
    this.onMessageReceived = callbacks.onMessageReceived;

    // Set up Socket.IO event listeners
    if (socketService.isSocketConnected()) {
      socketService.on('matchFound', this.onMatchFound);
      socketService.on('matchEnded', this.onMatchEnded);
      socketService.on('newMessage', this.onMessageReceived);
    }

    this.activeChannel = { connected: true };
    return this.activeChannel;
  }

  // Send a chat message using Socket.IO
  async sendMessage(matchId, senderId, content, messageType = 'text') {
    console.log('💬 Sending message via backend:', { matchId, senderId, content });
    
    if (!socketService.isSocketConnected()) {
      throw new Error('Not connected to server');
    }
    
    socketService.sendMessage(matchId, content, messageType);
    
    // Return a mock message object for immediate UI update
    return {
      id: `temp_${Date.now()}`,
      match_id: matchId,
      sender_id: senderId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString()
    };
  }

  // Join video room using Socket.IO
  async joinVideoRoom(roomId, matchId) {
    console.log('📹 Joining video room via backend:', { roomId, matchId });
    
    if (!socketService.isSocketConnected()) {
      throw new Error('Not connected to server');
    }
    
    socketService.joinVideoRoom(roomId, matchId);
    return true;
  }

  // Leave video room using Socket.IO
  async leaveVideoRoom(roomId, matchId) {
    console.log('🚪 Leaving video room via backend:', { roomId, matchId });
    
    if (socketService.isSocketConnected()) {
      socketService.leaveVideoRoom(roomId, matchId);
    }
    
    this.currentMatch = null;
    return true;
  }

  // End current match
  async endMatch(matchId, userId) {
    console.log('🔚 Ending match via backend:', matchId);
    
    if (this.currentMatch && this.currentMatch.roomId) {
      await this.leaveVideoRoom(this.currentMatch.roomId, matchId);
    }
    
    this.currentMatch = null;
    this.matchingStatus = 'idle';
    return true;
  }

  // Get current match
  async getCurrentMatch(userId) {
    console.log('🔍 Getting current match:', userId);
    return this.currentMatch;
  }

  // Cancel matching search
  cancelMatching() {
    console.log('❌ Cancelling match search');
    
    this.matchingStatus = 'idle';
    
    if (socketService.isSocketConnected()) {
      socketService.leaveMatchingQueue();
    }
    
    // Clean up event listeners
    const cleanup = this.eventListeners.get('findMatch');
    if (cleanup) {
      cleanup();
      this.eventListeners.delete('findMatch');
    }
  }

  // Get matching status
  getMatchingStatus() {
    return this.matchingStatus;
  }

  // Update user online status
  async updateOnlineStatus(userId, isOnline) {
    console.log(`🟢 Updating online status for user ${userId}:`, isOnline);
    
    if (!socketService.isSocketConnected()) {
      console.warn('Socket not connected, skipping online status update');
      return;
    }
    
    try {
      socketService.updateOnlineStatus(userId, isOnline);
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }

  // Get online users count
  async getOnlineUsersCount() {
    console.log('📊 Getting online users count');
    
    if (!socketService.isSocketConnected()) {
      console.warn('Socket not connected, returning default count');
      return 0;
    }
    
    try {
      // For now, return a default value since we don't have this implemented yet
      // In a real app, this would make an API call or socket request
      return Math.floor(Math.random() * 100) + 10; // Random number between 10-110
    } catch (error) {
      console.error('Failed to get online users count:', error);
      return 0;
    }
  }

  // Clean up all listeners and state
  unsubscribe() {
    console.log('🔇 Unsubscribing from matching service');
    
    // Clean up Socket.IO listeners
    if (socketService.isSocketConnected()) {
      socketService.removeAllListeners('matchFound');
      socketService.removeAllListeners('matchEnded');
      socketService.removeAllListeners('newMessage');
      socketService.removeAllListeners('matchingError');
      socketService.removeAllListeners('matchingTimeout');
    }
    
    // Clean up stored event listeners
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners.clear();
    
    // Reset state
    this.activeChannel = null;
    this.currentMatch = null;
    this.onMatchFound = null;
    this.onMatchEnded = null;
    this.onMessageReceived = null;
    this.matchingStatus = 'idle';
  }
}

// Legacy exports for backward compatibility
export const findMatch = async (userId, preferences = {}) => {
  return MatchingService.findMatch(userId, preferences.preferredGender);
};

export const createVideoRoom = async (matchId) => {
  return {
    roomId: 'room-' + matchId,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
};

export const endMatch = async (matchId) => {
  console.log('Match ended:', matchId);
};

export default MatchingService;
