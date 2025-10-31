import socketService from './socket.js';

// Match data interface from backend
interface MatchData {
  matchId: string;
  roomId: string;
  partner: {
    id: string;
    name: string;
    avatar?: string;
    [key: string]: unknown;
  };
  isInitiator: boolean;
}

// Internal match representation
interface CurrentMatch extends MatchData {
  id: string; // Alias for matchId for compatibility
}

// Matching status type
type MatchingStatus = 'idle' | 'searching' | 'matched';

// Message type
type MessageType = 'text' | 'image' | 'system';

// Message interface
interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  created_at: string;
}

// Subscribe callbacks
interface SubscribeCallbacks {
  onMatchFound?: (match: CurrentMatch) => void;
  onMatchEnded?: (data: unknown) => void;
  onMessageReceived?: (message: Message) => void;
}

// Error data interfaces
interface MatchingError {
  message?: string;
}

interface MatchingTimeoutData {
  message?: string;
}

interface MatchingStatusData {
  status?: string;
  [key: string]: unknown;
}

// Channel interface
interface Channel {
  connected: boolean;
}

export class IsolatedMatchingService {
  private userId: string;
  private activeChannel: Channel | null;
  private currentMatch: CurrentMatch | null;
  private matchingStatus: MatchingStatus;
  private eventListeners: Map<string, unknown>;

  constructor(userId: string) {
    this.userId = userId;
    this.activeChannel = null;
    this.currentMatch = null;
    this.matchingStatus = 'idle';
    this.eventListeners = new Map();

    console.log(`🔧 Created isolated matching service for user: ${userId}`);
  }

  // Find and create a match using real backend
  async findMatch(preferredGender: string | null = null): Promise<CurrentMatch> {
    try {
      console.log(`🔍 [${this.userId}] Starting match search with backend...`, { preferredGender });

      if (!socketService.isSocketConnected()) {
        throw new Error('Not connected to server. Please refresh and try again.');
      }

      // Set matching status for this specific user
      this.matchingStatus = 'searching';
      console.log(`📊 [${this.userId}] Set matching status to: searching`);

      socketService.joinMatchingQueue();

      // Return a promise that resolves when match is found
      return new Promise<CurrentMatch>((resolve, reject) => {
        // Set timeout for matching
        const timeout = setTimeout(() => {
          console.log(`⏰ [${this.userId}] Matching timeout reached`);
          this.matchingStatus = 'idle';
          socketService.leaveMatchingQueue();
          cleanup();
          reject(new Error('Matching timeout. No matches found.'));
        }, 120000); // 120 second timeout (2 minutes)

        // Listen for match found event
        const handleMatchFound = (matchData: MatchData): void => {
          console.log(`📰 [${this.userId}] Raw matchFound event received:`, matchData);

          // Backend sends: { matchId, roomId, partner: { id, name, ... }, isInitiator }
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
        const handleMatchingError = (error: MatchingError): void => {
          console.log(`❌ [${this.userId}] Matching error:`, error);
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          cleanup();
          reject(new Error(error.message || 'Matching failed'));
        };

        // Listen for matching timeout
        const handleMatchingTimeout = (data: MatchingTimeoutData): void => {
          console.log(`⏰ [${this.userId}] Server matching timeout:`, data);
          clearTimeout(timeout);
          this.matchingStatus = 'idle';
          cleanup();
          reject(new Error(data.message || 'No matches found'));
        };

        // Listen for matching status updates
        const handleMatchingStatus = (statusData: MatchingStatusData): void => {
          console.log(`📊 [${this.userId}] Matching status update:`, statusData);
        };

        // Use the standard events for now but with unique handlers
        socketService.on('matchFound', handleMatchFound);
        socketService.on('matchingError', handleMatchingError);
        socketService.on('matchingTimeout', handleMatchingTimeout);
        socketService.on('matchingStatus', handleMatchingStatus);

        // Clean up listeners when promise resolves/rejects
        const cleanup = (): void => {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to find match';
      throw new Error(errorMessage);
    }
  }

  // Start listening for real-time match updates using Socket.IO
  subscribeToMatches(callbacks: SubscribeCallbacks = {}): Channel {
    console.log(`👂 [${this.userId}] Subscribing to matches for user`);

    const { onMatchFound, onMatchEnded, onMessageReceived } = callbacks;

    // Set up Socket.IO event listeners with user-specific filtering
    if (socketService.isSocketConnected()) {
      const wrappedMatchFound = (match: MatchData): void => {
        const hasValidMatchData = match.matchId && match.roomId && match.partner;

        if (hasValidMatchData) {
          console.log(`🎯 [${this.userId}] Match subscription callback triggered`);

          const formattedMatch: CurrentMatch = {
            matchId: match.matchId,
            roomId: match.roomId,
            partner: match.partner,
            isInitiator: match.isInitiator,
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
      if (onMatchEnded) socketService.on('matchEnded', onMatchEnded);
      if (onMessageReceived) socketService.on('newMessage', onMessageReceived);

      // Store wrapped handlers for cleanup
      this.eventListeners.set('subscribe_matchFound', wrappedMatchFound);
      this.eventListeners.set('subscribe_matchEnded', onMatchEnded);
      this.eventListeners.set('subscribe_newMessage', onMessageReceived);
    }

    this.activeChannel = { connected: true };
    return this.activeChannel;
  }

  // Cancel matching search
  cancelMatching(): void {
    console.log(`❌ [${this.userId}] Cancelling match search`);

    this.matchingStatus = 'idle';

    if (socketService.isSocketConnected()) {
      socketService.leaveMatchingQueue();
    }

    // Clean up event listeners
    const cleanup = this.eventListeners.get('findMatch');
    if (typeof cleanup === 'function') {
      cleanup();
      this.eventListeners.delete('findMatch');
    }
  }

  // Get matching status for this specific user
  getMatchingStatus(): MatchingStatus {
    console.log(`📊 [${this.userId}] Current matching status:`, this.matchingStatus);
    return this.matchingStatus;
  }

  // Get current match
  async getCurrentMatch(): Promise<CurrentMatch | null> {
    console.log(`🔍 [${this.userId}] Getting current match:`, this.currentMatch);
    return this.currentMatch;
  }

  // Update user online status
  async updateOnlineStatus(isOnline: boolean): Promise<void> {
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
  async getOnlineUsersCount(): Promise<number> {
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
  unsubscribe(): void {
    console.log(`🔇 [${this.userId}] Unsubscribing from matching service`);

    // Clean up stored event listeners
    this.eventListeners.forEach((cleanup, key) => {
      console.log(`🧹 [${this.userId}] Cleaning up listener: ${key}`);
      try {
        if (typeof cleanup === 'function') {
          if (key === 'findMatch') {
            cleanup();
          } else if (key === 'subscribe_matchFound') {
            socketService.off('matchFound');
          } else if (key === 'subscribe_matchEnded') {
            socketService.off('matchEnded');
          } else if (key === 'subscribe_newMessage') {
            socketService.off('newMessage');
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
  async sendMessage(matchId: string, content: string, messageType: MessageType = 'text'): Promise<Message> {
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
  async joinVideoRoom(roomId: string, matchId: string): Promise<boolean> {
    console.log(`📹 [${this.userId}] Joining video room via backend:`, { roomId, matchId });

    if (!socketService.isSocketConnected()) {
      throw new Error('Not connected to server');
    }

    socketService.joinVideoRoom(roomId, matchId);
    return true;
  }

  // Leave video room using Socket.IO
  async leaveVideoRoom(roomId: string, matchId: string): Promise<boolean> {
    console.log(`🚪 [${this.userId}] Leaving video room via backend:`, { roomId, matchId });

    if (socketService.isSocketConnected()) {
      socketService.leaveVideoRoom(roomId, matchId);
    }

    this.currentMatch = null;
    return true;
  }

  // End current match
  async endMatch(matchId: string): Promise<boolean> {
    console.log(`🔚 [${this.userId}] Ending match via backend:`, matchId);

    if (this.currentMatch?.roomId) {
      await this.leaveVideoRoom(this.currentMatch.roomId, matchId);
    }

    this.currentMatch = null;
    this.matchingStatus = 'idle';
    return true;
  }
}

export default IsolatedMatchingService;
