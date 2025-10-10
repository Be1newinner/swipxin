import axios from "axios";

// Detect environment
const isFigmaPreview =
  typeof window !== "undefined" && window.location.hostname.includes("figma");
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const isDevelopment =
  process.env.NODE_ENV === "development" || isFigmaPreview || isLocalhost;

// API Configuration - Replace with your actual API key
export const API_CONFIG = {
  // WebRTC Signaling Server
  SIGNALING_SERVER_URL: "wss://your-signaling-server.io",
  SOCKET_IO_URL: "https://your-socket-server.io",

  // Google OAuth - Use demo client ID for Figma preview or disable entirely
  GOOGLE_CLIENT_ID: isDevelopment
    ? null // Disable Google auth in development/preview
    : "YOUR_GOOGLE_CLIENT_ID_HERE",

  // Facebook App - Use demo app ID for Figma preview or disable entirely
  FACEBOOK_APP_ID: isDevelopment
    ? null // Disable Facebook auth in development/preview
    : "YOUR_FACEBOOK_APP_ID_HERE",

  // Environment flags
  IS_DEVELOPMENT: isDevelopment,
  IS_FIGMA_PREVIEW: isFigmaPreview,
  IS_LOCALHOST: isLocalhost,

  // API Base URLs
  BASE_URL: "https://backendswipxin.onrender.com",
};

// Check if APIs are properly configured
export const isApiConfigured = {
  google:
    API_CONFIG.GOOGLE_CLIENT_ID &&
    API_CONFIG.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE",
  facebook:
    API_CONFIG.FACEBOOK_APP_ID &&
    API_CONFIG.FACEBOOK_APP_ID !== "YOUR_FACEBOOK_APP_ID_HERE",
  webrtc:
    API_CONFIG.SIGNALING_SERVER_URL &&
    API_CONFIG.SIGNALING_SERVER_URL !== "wss://your-signaling-server.io",
  socketio:
    API_CONFIG.SOCKET_IO_URL &&
    API_CONFIG.SOCKET_IO_URL !== "https://your-socket-server.io",
  supabase: true, // Add supabase property for compatibility
};
// WebRTC Room Management Function using Axios
export const createWebRTCRoom = async () => {
  // Check if WebRTC signaling server is configured
  if (!isApiConfigured.webrtc || API_CONFIG.IS_DEVELOPMENT) {
    console.info(
      "WebRTC signaling server not configured or in development mode, using mock room"
    );
    // Return mock room data for development
    const mockRoomId = "room-" + Math.random().toString(36).substring(2, 11);
    return {
      url: `wss://demo-signaling.swipx.io/${mockRoomId}`,
      roomId: mockRoomId,
    };
  }

  try {
    // In production, this creates a room on your signaling server
    const response = await axios.post(`${API_CONFIG.SOCKET_IO_URL}/api/rooms`, {
      maxParticipants: 2,
      timeout: 30 * 60 * 1000, // 30 minutes
    });

    const room = response.data;

    console.info("WebRTC room created successfully:", room.roomId);
    return {
      url: `${API_CONFIG.SIGNALING_SERVER_URL}/${room.roomId}`,
      roomId: room.roomId,
    };
  } catch (error) {
    console.warn(
      "Signaling server call failed, falling back to mock room:",
      error.message || "Unknown error"
    );
    // Fallback to mock data for development
    const mockRoomId = "room-" + Math.random().toString(36).substring(2, 11);
    return {
      url: `wss://demo-signaling.swipx.io/${mockRoomId}`,
      roomId: mockRoomId,
    };
  }
};
export const deleteWebRTCRoom = async (roomId) => {
  // Skip deletion if using mock rooms or API not configured
  if (
    !isApiConfigured.webrtc ||
    API_CONFIG.IS_DEVELOPMENT ||
    roomId.startsWith("room-")
  ) {
    console.info("Skipping room deletion for mock/development room:", roomId);
    return;
  }

  try {
    const response = await axios.delete(
      `${API_CONFIG.SOCKET_IO_URL}/api/rooms/${roomId}`
    );

    if (response.status === 200) {
      console.info("WebRTC room deleted successfully:", roomId);
    } else {
      console.warn(
        "Failed to delete WebRTC room:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.warn(
      "Error deleting WebRTC room (non-critical):",
      error.message || "Unknown error"
    );
  }
};

export const getWebRTCStats = async () => {
  try {
    if (API_CONFIG.IS_DEVELOPMENT || !isApiConfigured.webrtc) {
      return {
        success: true,
        demo: true,
        stats: {
          totalRooms: Math.floor(Math.random() * 50) + 10,
          activeConnections: Math.floor(Math.random() * 20) + 5,
          averageCallDuration: Math.floor(Math.random() * 300) + 120,
          totalBandwidth: Math.floor(Math.random() * 1000) + 500,
        },
        timestamp: new Date().toISOString(),
      };
    }

    const response = await api.get(`${API_CONFIG.SOCKET_IO_URL}/api/stats`);

    if (response.status !== 200) {
      throw new Error(`WebRTC stats API error: ${response.status}`);
    }

    const stats = response.data;

    return {
      success: true,
      demo: false,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      "Failed to fetch WebRTC stats:",
      error.message || "Unknown error"
    );
    return {
      success: false,
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};

export const createDailyRoom = createWebRTCRoom;
export const deleteDailyRoom = deleteWebRTCRoom;

export const MOCK_USERS = [
  {
    id: "1",
    name: "Alex Kumar",
    country: "India",
    gender: "male",
    isPremium: false,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    country: "USA",
    gender: "female",
    isPremium: true,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b88d3f13?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "3",
    name: "James Wilson",
    country: "UK",
    gender: "male",
    isPremium: false,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "4",
    name: "Priya Sharma",
    country: "India",
    gender: "female",
    isPremium: true,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "5",
    name: "Michael Brown",
    country: "Canada",
    gender: "male",
    isPremium: false,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
];

export const findRandomUser = (filters) => {
  let availableUsers = MOCK_USERS.filter(
    (user) => user.id !== filters.excludeId
  );

  if (filters.country) {
    availableUsers = availableUsers.filter(
      (user) => user.country === filters.country
    );
  }

  if (filters.gender) {
    availableUsers = availableUsers.filter(
      (user) => user.gender === filters.gender
    );
  }

  if (availableUsers.length === 0) {
    availableUsers = MOCK_USERS.filter((user) => user.id !== filters.excludeId);
  }

  return availableUsers[Math.floor(Math.random() * availableUsers.length)];
};
