/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Users, Clock, SkipForward } from "lucide-react";
import { toast } from "sonner";

import socketService from "../lib/socket";

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
  LoadingSpinnerIcon,
} from "./icons/VideoCallIcons";

// ==================== TYPE DEFINITIONS ====================

type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "failed" | "disconnecting";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string | Date;
}

interface IncomingMessageData {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

interface BaseMatch {
  id: string;
  matchId?: string;
  roomId?: string;
  room_id?: string;
  isInitiator?: boolean;
}

interface MatchWithPartner extends BaseMatch {
  partner: Partner;
}

interface MatchWithUsers extends BaseMatch {
  user1: { id: string; name: string };
  user2: { id: string; name: string };
  user1_id: string;
}

type Match = MatchWithPartner | MatchWithUsers;

interface VideoChatProps {
  match: Match;
  currentUser: User;
  onEndCall: (duration: number) => void;
}

interface NormalizedMatch {
  roomId: string;
  matchId: string;
  partner: Partner;
  isInitiator: boolean;
}

// ==================== TYPE GUARDS ====================

function isMatchWithPartner(match: Match): match is MatchWithPartner {
  return "partner" in match;
}

// ==================== COMPONENT ====================

export function VideoChat({ match, currentUser, onEndCall }: VideoChatProps) {
  // ========== UI State ==========
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  // ========== Refs ==========
  const controlsTimerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const connectionTimeoutRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidate[]>([]);
  const cleanupDone = useRef(false);
  const callStartTime = useRef(Date.now());

  // ========== Normalize Match Data ==========
  const { roomId, matchId, partner, isInitiator }: NormalizedMatch = useMemo(() => {
    const resolvedRoomId = match.roomId || match.room_id || match.id;
    const resolvedMatchId = match.matchId || match.id;
    let resolvedPartner: Partner = { id: "unknown", name: "Your Match" };
    let resolvedInitiator = false;

    if (isMatchWithPartner(match)) {
      resolvedPartner = match.partner;
      resolvedInitiator = match.isInitiator ?? false;
    } else {
      resolvedPartner = match.user1_id === currentUser?.id ? match.user2 : match.user1;
      resolvedInitiator = match.user1_id === currentUser.id;
    }

    return { roomId: resolvedRoomId, matchId: resolvedMatchId, partner: resolvedPartner, isInitiator: resolvedInitiator };
  }, [match, currentUser]);

  // ==================== UTILITY FUNCTIONS ====================

  const formatDuration = (sec: number): string =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore
    }
  };

  // ==================== CLEANUP ====================

  const cleanup = async () => {
    if (cleanupDone.current) return;
    console.log("🧹 Cleanup started");
    cleanupDone.current = true;

    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    ["roomReady", "webrtc-offer", "webrtc-answer", "ice-candidate", "participantLeft", "partnerSkipped", "newMessage"].forEach((ev) => socketService.off(ev));

    if (socketService.isSocketConnected()) {
      socketService.emit("leaveVideoRoom", { roomId, matchId });
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      remoteVideoRef.current.srcObject = null;
    }

    iceCandidatesBuffer.current = [];
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    console.log("✅ Cleanup completed");
  };

  // ==================== WEBRTC INITIALIZATION ====================

  const initializeVideoChat = async () => {
    try {
      cleanupDone.current = false;
      setConnectionState("connecting");
      console.log("🎥 Initializing video chat...", { roomId, matchId, isInitiator });

      // Wait for socket
      let attempts = 0;
      while (!socketService.isSocketConnected() && attempts < 20) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }
      if (!socketService.isSocketConnected()) {
        throw new Error("Socket connection timeout");
      }
      console.log("✅ Socket connected");

      // Get user media
      console.log("📹 Requesting media devices...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      console.log("✅ Media devices obtained");

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Create peer connection
      console.log("🔗 Creating RTCPeerConnection...");
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        console.log(`➕ Adding ${track.kind} track`);
        pc.addTrack(track, stream);
      });

      // Track received
      pc.ontrack = (event) => {
        console.log("🎉 Remote track received:", event.track.kind);
        if (event.streams[0] && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionState("connected");

          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          remoteVideoRef.current.play().catch((err) => console.warn("Play error:", err));
          toast.success("Connected!");
        }
      };

      // ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 Sending ICE candidate");
          if (socketService.isSocketConnected()) {
            socketService.emit("ice-candidate", { roomId, candidate: event.candidate });
          }
        } else {
          console.log("✅ All ICE candidates sent");
        }
      };

      // ICE connection state
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log("🔌 ICE connection state:", state);

        if (state === "connected" || state === "completed") {
          setConnectionState("connected");
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          toast.success("Connected!");
        } else if (state === "failed") {
          setConnectionState("failed");
          toast.error("Connection failed");
        } else if (state === "disconnected") {
          setConnectionState("disconnected");
          toast.warning("Connection lost");
        }
      };

      // Signaling state
      pc.onsignalingstatechange = () => {
        console.log("📡 Signaling state:", pc.signalingState);
      };

      // Connection state
      pc.onconnectionstatechange = () => {
        console.log("🔗 Connection state:", pc.connectionState);
      };

      // ========== Socket Handlers (ATTACH BEFORE JOINING ROOM) ==========

      console.log("📝 Attaching socket handlers...");

      socketService.on("roomReady", async (data: any) => {
        console.log("🚪 Room ready:", data);
        if (data.participants !== 2) {
          console.warn("⚠️ Invalid participant count:", data.participants);
          return;
        }

        const amInitiator = data.isInitiator !== undefined ? data.isInitiator : isInitiator;
        console.log("👤 Am I initiator?", amInitiator);

        if (amInitiator) {
          try {
            console.log("📤 Creating and sending offer...");
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            console.log("✅ Local description set (offer)");
            socketService.emit("webrtc-offer", { roomId, offer: pc.localDescription });
            console.log("✅ Offer sent");
          } catch (err) {
            console.error("❌ Offer creation error:", err);
            toast.error("Failed to create offer");
          }
        } else {
          console.log("⏳ Waiting for offer from initiator...");
        }
      });

      socketService.on("webrtc-offer", async (data: any) => {
        console.log("📥 Received offer");
        try {
          // Check signaling state
          if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
            console.warn("⚠️ Invalid signaling state for offer:", pc.signalingState);
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log("✅ Remote description set (offer)");

          // Add buffered ICE candidates
          console.log(`🧊 Adding ${iceCandidatesBuffer.current.length} buffered candidates`);
          for (const candidate of iceCandidatesBuffer.current) {
            await pc.addIceCandidate(candidate).catch((err) => console.warn("Buffered candidate error:", err));
          }
          iceCandidatesBuffer.current = [];

          console.log("📤 Creating and sending answer...");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("✅ Local description set (answer)");
          socketService.emit("webrtc-answer", { roomId, answer: pc.localDescription });
          console.log("✅ Answer sent");
        } catch (err) {
          console.error("❌ Offer handling error:", err);
          toast.error("Failed to process offer");
        }
      });

      socketService.on("webrtc-answer", async (data: any) => {
        console.log("📥 Received answer");
        try {
          // Check signaling state
          if (pc.signalingState !== "have-local-offer") {
            console.warn("⚠️ Invalid signaling state for answer:", pc.signalingState);
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log("✅ Remote description set (answer)");

          // Add buffered ICE candidates
          console.log(`🧊 Adding ${iceCandidatesBuffer.current.length} buffered candidates`);
          for (const candidate of iceCandidatesBuffer.current) {
            await pc.addIceCandidate(candidate).catch((err) => console.warn("Buffered candidate error:", err));
          }
          iceCandidatesBuffer.current = [];
        } catch (err) {
          console.error("❌ Answer handling error:", err);
          toast.error("Failed to process answer");
        }
      });

      socketService.on("ice-candidate", async (data: any) => {
        try {
          const candidate = new RTCIceCandidate(data.candidate);

          if (pc.remoteDescription?.type) {
            console.log("🧊 Adding ICE candidate");
            await pc.addIceCandidate(candidate);
          } else {
            console.log("🧊 Buffering ICE candidate (no remote description yet)");
            iceCandidatesBuffer.current.push(candidate);
          }
        } catch (err) {
          console.error("❌ ICE candidate error:", err);
        }
      });

      socketService.on("participantLeft", () => {
        console.log("👋 Participant left");
        setConnectionState("disconnected");
        toast.info("Partner left");
        setTimeout(handleNextMatch, 1200);
      });

      socketService.on("partnerSkipped", () => {
        console.log("⏭️ Partner skipped");
        toast.info("Partner moved to next");
        handleNextMatch();
      });

      socketService.on("newMessage", (messageData: IncomingMessageData) => {
        const formattedMessage: Message = {
          id: messageData.id,
          sender_id: messageData.senderId,
          content: messageData.content,
          created_at: messageData.createdAt,
        };

        setMessages((prev) => (prev.find((m) => m.id === formattedMessage.id) ? prev : [...prev, formattedMessage]));

        if (!showChat && messageData.senderId !== currentUser?.id) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      console.log("✅ Socket handlers attached");

      // NOW join the room (after handlers are ready)
      console.log("🚪 Joining video room...");
      socketService.emit("joinVideoRoom", { roomId, matchId });
      console.log("✅ Join room emitted");

      // Set connection timeout (30 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionState === "connecting") {
          console.error("⏱️ Connection timeout");
          setConnectionState("failed");
          toast.error("Connection timeout. Please try again.");
        }
      }, 30000);

    } catch (error: any) {
      console.error("❌ WebRTC initialization failed:", error);
      setConnectionState("failed");

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Camera/microphone access denied. Please allow permissions.");
      } else if (error.name === "NotFoundError") {
        toast.error("No camera/microphone found.");
      } else {
        toast.error("Connection failed. Please check your internet and try again.");
      }
    }
  };

  // ==================== ACTIONS ====================

  const sendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socketService.isSocketConnected()) return;
    socketService.emit("sendMessage", { matchId, content: newMessage.trim(), messageType: "text" });
    setNewMessage("");
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
      toast.info(track.enabled ? "🎤 Microphone on" : "🔇 Microphone off");
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
      toast.info(track.enabled ? "📹 Camera on" : "📷 Camera off");
    }
  };

  const handleNextMatch = async () => {
    setIsSkipping(true);
    setConnectionState("disconnecting");
    if (socketService.isSocketConnected()) {
      socketService.emit("skipMatch", { roomId, matchId, reason: "user_skipped" });
    }
    await cleanup();
    await new Promise((r) => setTimeout(r, 500));
    onEndCall(0);
    setIsSkipping(false);
  };

  const handleEndCall = async () => {
    const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
    await cleanup();
    toast.success(`Call ended: ${formatDuration(duration)}`);
    onEndCall(duration);
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [showControls]);

  useEffect(() => {
    callStartTime.current = Date.now();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
    return () => callTimerRef.current && clearInterval(callTimerRef.current);
  }, []);

  useEffect(() => {
    initializeVideoChat();
    return () => {
      cleanup();
    };
  }, [roomId, matchId]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  // ==================== RENDER ====================

  return (
    <div
      className={`relative w-full h-screen bg-black overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Remote Video */}
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

      {/* Connecting State */}
      {connectionState === "connecting" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl text-white mb-2">Connecting to {partner.name}...</h3>
            <p className="text-gray-400 text-sm">Please wait...</p>
          </div>
        </div>
      )}

      {/* Disconnecting State */}
      {connectionState === "disconnecting" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <LoadingSpinnerIcon className="w-12 h-12 text-yellow-500" />
        </div>
      )}

      {/* Failed State */}
      {connectionState === "failed" && (
        <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-xl mb-2">Connection Failed</h3>
            <p className="text-sm mb-4">Check console for details</p>
            <Button onClick={initializeVideoChat} className="bg-red-600 hover:bg-red-700">
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Local Video */}
      <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl z-10">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <CameraOffIcon className="w-10 h-10 text-red-400" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 transition-opacity z-10 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <Card className="px-4 py-2 bg-black/50 backdrop-blur">
          <div className="flex items-center gap-3 text-white">
            <Users className="w-4 h-4" />
            <span className="font-medium">{partner.name}</span>
            <Clock className="w-3 h-3" />
            <span className="text-sm">{formatDuration(callDuration)}</span>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity z-10 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-center items-center gap-4">
          <Button onClick={toggleAudio} className={`rounded-full w-14 h-14 ${isAudioEnabled ? "bg-white/20" : "bg-red-500"}`}>
            {isAudioEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
          </Button>
          <Button onClick={toggleVideo} className={`rounded-full w-14 h-14 ${isVideoEnabled ? "bg-white/20" : "bg-red-500"}`}>
            {isVideoEnabled ? <CameraIcon /> : <CameraOffIcon />}
          </Button>
          <Button onClick={handleNextMatch} disabled={isSkipping} className="rounded-full w-14 h-14 bg-blue-500">
            {isSkipping ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SkipForward />}
          </Button>
          <Button onClick={handleEndCall} className="rounded-full w-16 h-16 bg-red-500">
            <PhoneEndIcon />
          </Button>
          <Button onClick={() => setShowChat(!showChat)} className="rounded-full w-14 h-14 bg-white/20 relative">
            <ChatIcon />
            {unreadCount > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500 px-2 py-1 text-xs">{unreadCount}</Badge>}
          </Button>
          <Button onClick={toggleFullscreen} className="rounded-full w-14 h-14 bg-white/20">
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
          </Button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur border-l border-white/10 flex flex-col z-20">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <span className="text-white font-medium">Chat</span>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              <CloseIcon className="w-4 h-4 text-white" />
            </Button>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && <div className="text-center text-gray-400 text-sm mt-4">No messages yet 👋</div>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.sender_id === currentUser?.id ? "bg-blue-600" : "bg-gray-700"} text-white`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." className="flex-1 bg-gray-800 text-white" />
              <Button type="submit" disabled={!newMessage.trim()} className="bg-blue-600">
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
