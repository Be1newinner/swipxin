import { ENVIRONMENTS } from "@/constants/envs";
import api from "@/lib/api";
import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const isDevelopment = ENVIRONMENTS.NODE_ENV === "development";

export const API_CONFIG = {
  SIGNALING_SERVER_URL: ENVIRONMENTS.SIGNALING_SERVER_URL,
  SOCKET_IO_URL: ENVIRONMENTS.BACKEND_URL,
  IS_DEVELOPMENT: isDevelopment,
  IS_LOCALHOST: isLocalhost,
  BASE_URL: ENVIRONMENTS.BACKEND_URL,
};


// Check if APIs are properly configured
export const isApiConfigured = {
  webrtc: !!API_CONFIG.SIGNALING_SERVER_URL,
  socketio: !!API_CONFIG.SOCKET_IO_URL,
};

// WebRTC Room Management Function using Axios
export const createWebRTCRoom = async () => {
  if (!isApiConfigured.webrtc) throw new Error(
    "WebRTC signaling server not configured!"
  );


  try {
    // this creates a room on our signaling server
    const response = await axios.post(`${API_CONFIG.SOCKET_IO_URL}/api/rooms`, {
      maxParticipants: 2,
      timeout: 30 * 60 * 1000,
    });

    const room = response.data;

    console.info("WebRTC room created successfully:", room.roomId);
    return {
      url: `${API_CONFIG.SIGNALING_SERVER_URL}/${room.roomId}`,
      roomId: room.roomId,
    };
  } catch (error) {
    console.warn(
      "Signaling server call failed;",
      (error as Error).message || "Unknown error"
    );
  }
};
export const deleteWebRTCRoom = async (roomId: string) => {
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
      (error as Error).message || "Unknown error"
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
      (error as Error).message || "Unknown error"
    );
    return {
      success: false,
      error: (error as Error).message || "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};

export const createDailyRoom = createWebRTCRoom;
export const deleteDailyRoom = deleteWebRTCRoom;