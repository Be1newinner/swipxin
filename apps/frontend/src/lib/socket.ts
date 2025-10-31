/* eslint-disable @typescript-eslint/no-explicit-any */
import { ENVIRONMENTS } from '@/constants/envs';
import { io, Socket } from 'socket.io-client';

// ==================== TYPE DEFINITIONS ====================

/**
 * Socket.IO server URL from environment configuration
 */
const SOCKET_URL: string = ENVIRONMENTS.BACKEND_URL;

/**
 * User matching preferences for the matching queue
 */
interface MatchingPreferences {
  gender?: string;
  ageRange?: {
    min: number;
    max: number;
  };
  interests?: string[];
  language?: string;
  location?: string;
  [key: string]: unknown; // Allow additional custom preferences
}

/**
 * Video room join/leave payload
 */
interface VideoRoomPayload {
  roomId: string;
  matchId: string;
}

/**
 * WebRTC signaling payload
 */
interface WebRTCSignalPayload {
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  roomId: string;
  targetUserId: string;
}

/**
 * Chat message payload
 */
interface SendMessagePayload {
  matchId: string;
  content: string;
  messageType: MessageType;
}

/**
 * Message types supported by the chat system
 */
type MessageType = 'text' | 'emoji' | 'image' | 'system';

/**
 * Online status update payload
 */
interface OnlineStatusPayload {
  userId: string;
  isOnline: boolean;
}

/**
 * Socket connection check result
 */
interface SocketConnectionStatus {
  isConnected: boolean;
  socketExists: boolean;
  socketConnected: boolean | undefined;
  overall: boolean;
}

/**
 * Server-to-Client Events (events the client listens to)
 */
interface ServerToClientEvents {
  connect: () => void;
  disconnect: (reason: Socket.DisconnectReason) => void;
  connect_error: (error: Error) => void;
  matchFound: (data: unknown) => void;
  matchCancelled: (data: unknown) => void;
  roomReady: (data: unknown) => void;
  'webrtc-offer': (data: unknown) => void;
  'webrtc-answer': (data: unknown) => void;
  'ice-candidate': (data: unknown) => void;
  participantLeft: (data: unknown) => void;
  partnerSkipped: (data: unknown) => void;
  newMessage: (data: unknown) => void;
  messageDelivered: (data: unknown) => void;
  messageRead: (data: unknown) => void;
  userOnline: (data: unknown) => void;
  userOffline: (data: unknown) => void;
  error: (error: { message: string; code?: string }) => void;
  [event: string]: (...args: any[]) => void; // Allow dynamic events
}

/**
 * Client-to-Server Events (events the client emits)
 */
interface ClientToServerEvents {
  joinMatchingQueue: (preferences: MatchingPreferences) => void;
  leaveMatchingQueue: () => void;
  joinVideoRoom: (payload: VideoRoomPayload) => void;
  leaveVideoRoom: (payload: VideoRoomPayload) => void;
  'webrtc-signal': (payload: WebRTCSignalPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  updateOnlineStatus: (payload: OnlineStatusPayload) => void;
  skipMatch: (data: unknown) => void;
  [event: string]: (...args: any[]) => void; // Allow dynamic events
}

/**
 * Socket authentication data
 */
interface SocketAuthData {
  token: string;
}

/**
 * Typed Socket.IO client instance
 */
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Event listener callback type
 */
type EventCallback = (...args: any[]) => void;

// ==================== SOCKET SERVICE CLASS ====================

/**
 * Singleton service for managing Socket.IO connections and events
 * Provides type-safe methods for real-time communication
 */
class SocketService {
  /**
   * The Socket.IO client instance
   */
  public socket: TypedSocket | null;

  /**
   * Connection state tracker
   */
  private isConnected: boolean;

  /**
   * Map of event names to their registered callbacks for cleanup
   */
  private eventListeners: Map<string, EventCallback[]>;

  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map<string, EventCallback[]>();
  }

  /**
   * Establishes connection to Socket.IO server with authentication
   * @param token - JWT authentication token
   * @returns The connected socket instance
   */
  public connect(token: string): TypedSocket {
    if (this.socket) {
      this.disconnect();
    }

    console.log('🔌 Connecting to Socket.IO server...');

    const auth: SocketAuthData = { token };

    this.socket = io(SOCKET_URL, {
      auth,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    }) as TypedSocket;

    // Connection event handlers
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));

    return this.socket;
  }

  /**
   * Handles successful connection to the server
   */
  private handleConnect(): void {
    console.log('✅ Connected to Socket.IO server');
    this.isConnected = true;
  }

  /**
   * Handles disconnection from the server
   * @param reason - The reason for disconnection
   */
  private handleDisconnect(reason: Socket.DisconnectReason): void {
    console.log('🔴 Disconnected from Socket.IO server:', reason);
    this.isConnected = false;
  }

  /**
   * Handles connection errors
   * @param error - The connection error
   */
  private handleConnectError(error: Error): void {
    console.error('❌ Socket connection error:', error);
    this.isConnected = false;
  }

  /**
   * Disconnects from the Socket.IO server and cleans up resources
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // ==================== MATCHING SYSTEM ====================

  /**
   * Joins the matching queue with optional preferences
   * @param preferences - User preferences for matching
   */
  public joinMatchingQueue(preferences: MatchingPreferences = {}): void {
    if (this.socket) {
      console.log('🔍 Joining matching queue with preferences:', preferences);
      this.socket.emit('joinMatchingQueue', preferences);
    } else {
      console.warn('⚠️ Cannot join matching queue: Socket not connected');
    }
  }

  /**
   * Leaves the matching queue
   */
  public leaveMatchingQueue(): void {
    if (this.socket) {
      console.log('🚨 Leaving matching queue');
      this.socket.emit('leaveMatchingQueue');
    } else {
      console.warn('⚠️ Cannot leave matching queue: Socket not connected');
    }
  }

  // ==================== VIDEO CALL EVENTS ====================

  /**
   * Joins a video room for a specific match
   * @param roomId - The video room identifier
   * @param matchId - The match identifier
   */
  public joinVideoRoom(roomId: string, matchId: string): void {
    if (this.socket) {
      console.log(`📹 Joining video room ${roomId} for match ${matchId}`);
      const payload: VideoRoomPayload = { roomId, matchId };
      this.socket.emit('joinVideoRoom', payload);
    } else {
      console.warn('⚠️ Cannot join video room: Socket not connected');
    }
  }

  /**
   * Leaves a video room
   * @param roomId - The video room identifier
   * @param matchId - The match identifier
   */
  public leaveVideoRoom(roomId: string, matchId: string): void {
    if (this.socket) {
      console.log(`🚪 Leaving video room ${roomId} for match ${matchId}`);
      const payload: VideoRoomPayload = { roomId, matchId };
      this.socket.emit('leaveVideoRoom', payload);
    } else {
      console.warn('⚠️ Cannot leave video room: Socket not connected');
    }
  }

  // ==================== WEBRTC SIGNALING ====================

  /**
   * Sends WebRTC signaling data to a peer
   * @param signal - The WebRTC signal (offer, answer, or ICE candidate)
   * @param roomId - The room identifier
   * @param targetUserId - The target user's identifier
   */
  public sendWebRTCSignal(
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit,
    roomId: string,
    targetUserId: string
  ): void {
    if (this.socket) {
      const payload: WebRTCSignalPayload = {
        signal,
        roomId,
        targetUserId,
      };
      this.socket.emit('webrtc-signal', payload);
    } else {
      console.warn('⚠️ Cannot send WebRTC signal: Socket not connected');
    }
  }

  // ==================== CHAT MESSAGES ====================

  /**
   * Sends a chat message in a match
   * @param matchId - The match identifier
   * @param content - The message content
   * @param messageType - The type of message (default: 'text')
   */
  public sendMessage(
    matchId: string,
    content: string,
    messageType: MessageType = 'text'
  ): void {
    if (this.socket) {
      const payload: SendMessagePayload = {
        matchId,
        content,
        messageType,
      };
      this.socket.emit('sendMessage', payload);
    } else {
      console.warn('⚠️ Cannot send message: Socket not connected');
    }
  }

  // ==================== USER PRESENCE ====================

  /**
   * Updates the online status of a user
   * @param userId - The user identifier
   * @param isOnline - Whether the user is online
   */
  public updateOnlineStatus(userId: string, isOnline: boolean): void {
    if (this.socket) {
      console.log(
        `🟢 Updating online status via socket for user ${userId}:`,
        isOnline
      );
      const payload: OnlineStatusPayload = { userId, isOnline };
      this.socket.emit('updateOnlineStatus', payload);
    } else {
      console.warn('⚠️ Cannot update online status: Socket not connected');
    }
  }

  // ==================== EVENT LISTENERS MANAGEMENT ====================

  /**
   * Registers an event listener
   * @param event - The event name
   * @param callback - The callback function
   */
  public on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void;
  public on(event: string, callback: EventCallback): void;
  public on(event: string, callback: EventCallback): void {
    if (this.socket) {
      this.socket.on(event as any, callback);

      // Store listener for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)!.push(callback);
    } else {
      console.warn(`⚠️ Cannot register listener for "${event}": Socket not connected`);
    }
  }

  /**
   * Removes a specific event listener
   * @param event - The event name
   * @param callback - The callback function to remove
   */
  public off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K]
  ): void;
  public off(event: string, callback?: EventCallback): void;
  public off(event: string, callback?: EventCallback): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event as any, callback);

        // Remove from stored listeners
        if (this.eventListeners.has(event)) {
          const listeners = this.eventListeners.get(event)!;
          const index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      } else {
        // If no callback provided, remove all listeners for this event
        this.removeAllListeners(event);
      }
    }
  }

  /**
   * Removes all listeners for a specific event
   * @param event - The event name
   */
  public removeAllListeners(event?: string): void {
    if (this.socket) {
      if (event) {
        this.socket.removeAllListeners(event);
        this.eventListeners.delete(event);
      } else {
        // Remove all listeners for all events
        this.socket.removeAllListeners();
        this.eventListeners.clear();
      }
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Checks if the socket is connected
   * @returns True if connected, false otherwise
   */
  public isSocketConnected(): boolean {
    const connected: boolean = this.isConnected && (this.socket?.connected ?? false);

    const status: SocketConnectionStatus = {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      overall: connected,
    };

    console.log('🔍 Socket connection check:', status);
    return connected;
  }

  /**
   * Gets the current socket ID
   * @returns The socket ID or undefined if not connected
   */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Cleans up all registered event listeners
   */
  public cleanup(): void {
    if (this.socket) {
      for (const [event, listeners] of this.eventListeners.entries()) {
        for (const listener of listeners) {
          this.socket.off(event as any, listener);
        }
      }
      this.eventListeners.clear();
      console.log('🧹 All event listeners cleaned up');
    }
  }

  /**
   * Emits a custom event (for advanced use cases)
   * @param event - The event name
   * @param args - Arguments to pass with the event
   */
  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void;
  public emit(event: string, ...args: any[]): void;
  public emit(event: string, ...args: any[]): void {
    if (this.socket) {
      this.socket.emit(event as any, ...args);
    } else {
      console.warn(`⚠️ Cannot emit "${event}": Socket not connected`);
    }
  }

  /**
   * Gets the current connection state
   * @returns True if connected, false otherwise
   */
  public getConnectionState(): boolean {
    return this.isConnected;
  }

  /**
   * Checks if a specific event has registered listeners
   * @param event - The event name
   * @returns True if the event has listeners, false otherwise
   */
  public hasListeners(event: string): boolean {
    const listeners = this.eventListeners.get(event);
    return !!listeners && listeners.length > 0;
  }

  /**
   * Gets the count of registered listeners for an event
   * @param event - The event name
   * @returns The number of registered listeners
   */
  public getListenerCount(event: string): number {
    const listeners = this.eventListeners.get(event);
    return listeners ? listeners.length : 0;
  }
}

// ==================== SINGLETON INSTANCE ====================

/**
 * Singleton instance of SocketService
 * Import this to access socket functionality throughout your application
 */
const socketService: SocketService = new SocketService();

export default socketService;

// ==================== NAMED EXPORTS ====================

export type {
  MatchingPreferences,
  VideoRoomPayload,
  WebRTCSignalPayload,
  SendMessagePayload,
  MessageType,
  OnlineStatusPayload,
  SocketConnectionStatus,
  ServerToClientEvents,
  ClientToServerEvents,
  TypedSocket,
  EventCallback,
};

export { SocketService };
