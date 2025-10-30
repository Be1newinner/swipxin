import { toast } from 'sonner';
import socketService from './socket.js';

export class IsolatedMatchingService {
  constructor(userId) {
    this.userId = userId;
    this.activeChannel = null;
    this.currentMatch = null;
    this.matchingStatus = 'idle'; // idle, searching, matched
    this.eventListeners = new Map();
    this.userSpecificEventId = `user_${userId}_${Date.now()}`;
    
    console.log(`🔧 Created isolated matching service for user: ${userId}`);
  }

  // Find and create a match using real backend
  async findMatch(preferredGender = null) {
    try {
      console.log(`🔍 [${this.userId}] Starting match search with backend...`, { preferredGender });
      
      if (!socketService.isSocketConnected()) {
        throw new Error('Not connected to server. Please refresh and try again.');
      }

      // Set matching status for this specific user
      this.matchingStatus = 'searching';
      console.log(`📊 [${this.userId}] Set matching status to: searching`);
      
      // Join matching queue via Socket.IO
      const preferences = {
        preferredGender: preferredGender === 'any' ? null : preferredGender
      };
      
      socketService.joinMatchingQueue(preferences);
      
      // Return a promise that resolves when match is found
      return new Promise((resolve, reject) => {
        // Set timeout for matching
        const timeout = setTimeout(() => {
          console.log(`⏰ [${this.userId}] Matching timeout reached`);
          this.matchingStatus = 'idle';
          socketService.leaveMatchingQueue();
          cleanup();
          reject(new Error('Matching timeout. No matches found.'));
        }, 120000); // 120 second timeout (2 minutes)
        
        // Create user-specific event handler with unique ID
        const eventId = this.userSpecificEventId;
        
        // Listen for match found event
        const handleMatchFound = (matchData) => {
          console.log(`📰 [${this.userId}] Raw matchFound event received:`, matchData);
          
          // Backend sends: { matchId, roomId, partner: { id, name, ... }, isInitiator }
          // Check if this match is for this user by checking if we have partner data
          // (Backend only sends to users involved in the match)
          const hasValidMatchData = matchData.matchId && matchData.roomId && matchData.partner;
          
          if (hasValidMatchData) {
            console.log(`✅ [${this.userId}] Match event received from backend, processing...`);
            
            clearTimeout(timeout);
            this.matchingStatus = 'matched';
            
            this.currentMatch = {
              id: matchData.matchId,
              roomId: matchData.roomId,
              partner: matchData.partner,
              isInitiator: matchData.isInitiator,
              // Store backend format for compatibility
              matchId: matchData.matchId
            };
            
            console.log(`🎉 [${this.userId}] Match processed from backend:`, this.currentMatch);
            
            // Join video room immediately
            if (socketService.isSocketConnected()) {
              socketService.joinVideoRoom(this.currentMatch.roomId, this.currentMatch.id);
            }
            
            cleanup();
            resolve(this.currentMatch);
          } else {
            console.log(`🚫 [${this.userId}] Invalid match data received:`, matchData);
          }
        };
        
        // Listen for matching errors
        const handleMatchingError = (error) => {
          console.log(`❌ [${this.userId}] Matching error:`, error);
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          cleanup();
          reject(new Error(error.message || 'Matching failed'));
        };
        
        // Listen for matching timeout
        const handleMatchingTimeout = (data) => {
          console.log(`⏰ [${this.userId}] Server matching timeout:`, data);
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          cleanup();
          reject(new Error(data.message || 'No matches found'));
        };
        
        // Listen for matching status updates
        const handleMatchingStatus = (statusData) => {
          console.log(`📊 [${this.userId}] Matching status update:`, statusData);
          // Don't change the searching state for general status updates
        };
        
        // Set up event listeners with unique event names
        const uniqueMatchFoundEvent = `matchFound_${eventId}`;
        const uniqueMatchingErrorEvent = `matchingError_${eventId}`;
        const uniqueMatchingTimeoutEvent = `matchingTimeout_${eventId}`;
        const uniqueMatchingStatusEvent = `matchingStatus_${eventId}`;
        
        // Use the standard events for now but with unique handlers
        socketService.on('matchFound', handleMatchFound);
        socketService.on('matchingError', handleMatchingError);
        socketService.on('matchingTimeout', handleMatchingTimeout);
        socketService.on('matchingStatus', handleMatchingStatus);
        
        // Clean up listeners when promise resolves/rejects
        const cleanup = () => {
          console.log(`🧹 [${this.userId}] Cleaning up event listeners`);
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
      console.log(`💥 [${this.userId}] Match finding failed:`, error);
      this.matchingStatus = 'idle';
      throw new Error(error.message || 'Failed to find match');
    }
  }

  // Start listening for real-time match updates using Socket.IO
  subscribeToMatches(callbacks = {}) {
    console.log(`👂 [${this.userId}] Subscribing to matches for user`);
    
    const onMatchFound = callbacks.onMatchFound;
    const onMatchEnded = callbacks.onMatchEnded;
    const onMessageReceived = callbacks.onMessageReceived;

    // Set up Socket.IO event listeners with user-specific filtering
    if (socketService.isSocketConnected()) {
      const wrappedMatchFound = (match) => {
        // Backend sends match data only to involved users
        // Format: { matchId, roomId, partner: { id, name, ... }, isInitiator }
        const hasValidMatchData = match.matchId && match.roomId && match.partner;
        
        if (hasValidMatchData) {
          console.log(`🎯 [${this.userId}] Match subscription callback triggered`);
          
          // Use backend format directly
          const formattedMatch = {
            matchId: match.matchId,
            roomId: match.roomId,
            partner: match.partner,
            isInitiator: match.isInitiator,
            // Keep id for compatibility
            id: match.matchId
          };
          
          // Update current match
          this.currentMatch = formattedMatch;
          this.matchingStatus = 'matched';
          
          // Join video room immediately
          if (socketService.isSocketConnected()) {
            socketService.joinVideoRoom(formattedMatch.roomId, formattedMatch.matchId);
          }
          
          console.log(`🚀 [${this.userId}] Triggering match found callback with:`, formattedMatch);
          if (onMatchFound) onMatchFound(formattedMatch);
        } else {
          console.log(`🚫 [${this.userId}] Invalid match data in subscription:`, match);
        }
      };
      
      socketService.on('matchFound', wrappedMatchFound);
      socketService.on('matchEnded', onMatchEnded);
      socketService.on('newMessage', onMessageReceived);
      
      // Store wrapped handlers for cleanup
      this.eventListeners.set('subscribe_matchFound', wrappedMatchFound);
      this.eventListeners.set('subscribe_matchEnded', onMatchEnded);
      this.eventListeners.set('subscribe_newMessage', onMessageReceived);
    }

    this.activeChannel = { connected: true };
    return this.activeChannel;
  }

  // Cancel matching search
  cancelMatching() {
    console.log(`❌ [${this.userId}] Cancelling match search`);
    
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

  // Get matching status for this specific user
  getMatchingStatus() {
    console.log(`📊 [${this.userId}] Current matching status:`, this.matchingStatus);
    return this.matchingStatus;
  }

  // Get current match
  async getCurrentMatch() {
    console.log(`🔍 [${this.userId}] Getting current match:`, this.currentMatch);
    return this.currentMatch;
  }

  // Update user online status
  async updateOnlineStatus(isOnline) {
    console.log(`🟢 [${this.userId}] Updating online status:`, isOnline);
    
    if (!socketService.isSocketConnected()) {
      console.warn(`⚠️ [${this.userId}] Socket not connected, skipping online status update`);
      return;
    }
    
    try {
      socketService.updateOnlineStatus(this.userId, isOnline);
    } catch (error) {
      console.error(`❌ [${this.userId}] Failed to update online status:`, error);
    }
  }

  // Get online users count
  async getOnlineUsersCount() {
    console.log(`📊 [${this.userId}] Getting online users count`);
    
    if (!socketService.isSocketConnected()) {
      console.warn(`⚠️ [${this.userId}] Socket not connected, returning default count`);
      return 0;
    }
    
    try {
      return Math.floor(Math.random() * 100) + 10; // Random number between 10-110
    } catch (error) {
      console.error(`❌ [${this.userId}] Failed to get online users count:`, error);
      return 0;
    }
  }

  // Clean up all listeners and state
  unsubscribe() {
    console.log(`🔇 [${this.userId}] Unsubscribing from matching service`);
    
    // Clean up stored event listeners
    this.eventListeners.forEach((cleanup, key) => {
      console.log(`🧹 [${this.userId}] Cleaning up listener: ${key}`);
      try {
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          // Handle wrapped event listeners - these are the actual callback functions
          if (key === 'subscribe_matchFound' && cleanup) {
            socketService.off('matchFound', cleanup);
          } else if (key === 'subscribe_matchEnded' && cleanup) {
            socketService.off('matchEnded', cleanup);
          } else if (key === 'subscribe_newMessage' && cleanup) {
            socketService.off('newMessage', cleanup);
          }
        }
      } catch (cleanupError) {
        console.warn(`⚠️ [${this.userId}] Error during cleanup of ${key}:`, cleanupError);
      }
    });
    
    this.eventListeners.clear();
    
    // Reset state
    this.activeChannel = null;
    this.currentMatch = null;
    this.matchingStatus = 'idle';
    
    console.log(`✅ [${this.userId}] Matching service cleanup complete`);
  }

  // Send a chat message using Socket.IO
  async sendMessage(matchId, content, messageType = 'text') {
    console.log(`💬 [${this.userId}] Sending message via backend:`, { matchId, content });
    
    if (!socketService.isSocketConnected()) {
      throw new Error('Not connected to server');
    }
    
    socketService.sendMessage(matchId, content, messageType);
    
    // Return a mock message object for immediate UI update
    return {
      id: `temp_${Date.now()}`,
      match_id: matchId,
      sender_id: this.userId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString()
    };
  }

  // Join video room using Socket.IO
  async joinVideoRoom(roomId, matchId) {
    console.log(`📹 [${this.userId}] Joining video room via backend:`, { roomId, matchId });
    
    if (!socketService.isSocketConnected()) {
      throw new Error('Not connected to server');
    }
    
    socketService.joinVideoRoom(roomId, matchId);
    return true;
  }

  // Leave video room using Socket.IO
  async leaveVideoRoom(roomId, matchId) {
    console.log(`🚪 [${this.userId}] Leaving video room via backend:`, { roomId, matchId });
    
    if (socketService.isSocketConnected()) {
      socketService.leaveVideoRoom(roomId, matchId);
    }
    
    this.currentMatch = null;
    return true;
  }

  // End current match
  async endMatch(matchId) {
    console.log(`🔚 [${this.userId}] Ending match via backend:`, matchId);
    
    if (this.currentMatch && this.currentMatch.roomId) {
      await this.leaveVideoRoom(this.currentMatch.roomId, matchId);
    }
    
    this.currentMatch = null;
    this.matchingStatus = 'idle';
    return true;
  }
}

export default IsolatedMatchingService;
