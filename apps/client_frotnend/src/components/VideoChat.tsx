import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Users, Clock, SkipForward, Coins } from "lucide-react";
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

export function VideoChat({ match, currentUser, onEndCall }) {
  // UI state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState("connecting");
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);

  const [isSkipping, setIsSkipping] = useState(false);

  // Refs for media & PC
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidatesBuffer = useRef([]);
  const cleanupDone = useRef(false);
  const mountedRef = useRef(false);

  const callStartTime = useRef(Date.now());

  // Normalize identifiers + partner once using useMemo
  const { roomId, matchId, partner, isInitiator } = useMemo(() => {
    const resolvedRoomId = match.roomId || match.room_id || match.id;
    const resolvedMatchId = match.matchId || match.id;
    let resolvedPartner = { id: "unknown", name: "Your Match" };
    let resolvedInitiator = false;

    if (match.partner) {
      resolvedPartner = match.partner;
      resolvedInitiator = !!match.isInitiator;
    } else if (match.user1 && match.user2) {
      if (match.user1_id && currentUser?.id) {
        resolvedPartner =
          match.user1_id === currentUser.id ? match.user2 : match.user1;
        resolvedInitiator = match.user1_id === currentUser.id;
      } else {
        resolvedPartner = match.user2 || match.user1 || resolvedPartner;
        resolvedInitiator = false;
      }
    } else if (match.partner_id && match.partner_name) {
      resolvedPartner = { id: match.partner_id, name: match.partner_name };
      resolvedInitiator = !!match.isInitiator;
    } else {
      resolvedInitiator = false;
    }

    return {
      roomId: resolvedRoomId,
      matchId: resolvedMatchId,
      partner: resolvedPartner,
      isInitiator: resolvedInitiator,
    };
  }, [match, currentUser]);

  // ---------- Missing handlers fixed ----------
  const toggleChat = () => {
    setShowChat((p) => {
      const next = !p;
      if (next === true) setUnreadCount(0);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  // Format call duration mm:ss
  const formatDuration = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  // Controls show/hide timer
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
    };
  }, [showControls]);

  // Call timer (updates callDuration every second)
  useEffect(() => {
    // reset start time when match changes (new match)
    callStartTime.current = Date.now();
    setCallDuration(0);

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [roomId, matchId]);

  // Log mount & unmount
  useEffect(() => {
    console.log("🎬 VideoChat mounted");
    mountedRef.current = true;
    cleanupDone.current = false;
    initializeVideoChat(); // start webRTC flow
    setupChatListeners();

    return () => {
      console.log("🔄 Unmounting VideoChat");
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, matchId]); // re-run when room/match changes

  // Ensure socket availability on mount
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      toast.error(
        "Socket not connected. Please refresh or check your network."
      );
    }
  }, []);

  // ----------------- Cleanup -----------------
  const cleanup = async () => {
    if (cleanupDone.current) return;
    console.log("🧹 Cleanup");
    cleanupDone.current = true;

    // Remove socket handlers (scoped)
    try {
      if (socketService.socket) {
        const scopedEvents = [
          "roomReady",
          "webrtc-offer",
          "webrtc-answer",
          "ice-candidate",
          "participantLeft",
          "partnerSkipped",
        ];
        // we rely on named handler removal - see initializeVideoChat for handler names
        scopedEvents.forEach((ev) => {
          try {
            // this is safe even if handler was not attached
            socketService.socket.off(ev);
          } catch (e) {
            // continue
          }
        });

        if (socketService.isSocketConnected()) {
          try {
            socketService.socket.emit("leaveVideoRoom", {
              roomId,
              matchId,
            });
          } catch (e) {
            console.warn("Emit leaveVideoRoom failed:", e);
          }
        }
      }
    } catch (error) {
      console.error("Socket cleanup err:", error);
    }

    // Close/cleanup peer connection
    try {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current
            .getSenders()
            .forEach((s) => s.track?.stop());
        } catch (e) {}
        try {
          peerConnectionRef.current
            .getReceivers()
            .forEach((r) => r.track?.stop());
        } catch (e) {}
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
    } catch (error) {
      console.error("Peer cleanup err:", error);
    }

    // Stop all media tracks
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current?.srcObject) {
        try {
          localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current?.srcObject) {
        try {
          remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        remoteVideoRef.current.srcObject = null;
      }
    } catch (err) {
      console.warn("Stream stop error:", err);
    }

    iceCandidatesBuffer.current = [];

    // chat listeners
    cleanupChatListeners();

    // timers
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setConnectionState("idle");
    console.log("✅ Cleanup done");
  };

  // Stop chat listeners helper
  const cleanupChatListeners = () => {
    try {
      if (socketService.socket) {
        socketService.socket.off("newMessage");
      }
      if (window.chatCleanup) {
        try {
          window.chatCleanup();
        } catch {}
        delete window.chatCleanup;
      }
    } catch (e) {
      // ignore
    }
  };

  // ----------------- WebRTC Init -----------------
  const initializeVideoChat = async () => {
    try {
      cleanupDone.current = false; // reset for a new match
      setConnectionState("connecting");
      console.log("🎥 initializeVideoChat");

      // Wait for socket to be ready (bounded)
      let attempts = 0;
      while (!socketService.isSocketConnected() && attempts < 20) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }
      if (!socketService.isSocketConnected()) {
        throw new Error("Socket timeout");
      }

      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        iceCandidatePoolSize: 3,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      };

      // getUserMedia
      console.log("📹 Getting media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("✅ Media obtained");
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // create PC
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // track handler
      pc.ontrack = (event) => {
        console.log("🎉 Track received:", event.track.kind);
        if (event.streams && event.streams[0] && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionState("connected");
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current
            .play()
            .then(() => {
              setTimeout(() => {
                remoteVideoRef.current.muted = false;
              }, 200);
            })
            .catch((err) => console.error("Remote play err:", err));
        }
      };

      // ICE candidate -> send to server
      pc.onicecandidate = (event) => {
        if (
          event.candidate &&
          socketService.socket &&
          socketService.isSocketConnected()
        ) {
          try {
            socketService.socket.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
            });
          } catch (e) {
            console.warn("Emit ice-candidate failed:", e);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🔌 ICE state:", pc.iceConnectionState);
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") {
          setConnectionState("connected");
          toast.success("Connected!");
        } else if (s === "failed") {
          setConnectionState("failed");
          toast.error("Connection failed");
        } else if (s === "disconnected") {
          setConnectionState("disconnected");
        }
      };

      // ---------------- attach socket handlers (scoped) ----------------
      console.log("📝 Attaching socket listeners (scoped)...");

      const handleRoomReady = async (data) => {
        console.log("🎬 ROOM READY", data);
        if (data.participants !== 2) {
          console.warn("⚠️ Invalid participants:", data.participants);
          return;
        }
        const amInitiator =
          data.isInitiator !== undefined ? data.isInitiator : isInitiator;
        if (amInitiator) {
          try {
            console.log("🎯 Creating offer...");
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            socketService.socket?.emit("webrtc-offer", {
              roomId,
              offer: pc.localDescription,
            });
            console.log("✅ Offer emitted");
          } catch (err) {
            console.error("Offer creation/emit error:", err);
          }
        } else {
          console.log("⏳ Receiver waiting for offer");
        }
      };

      const handleWebRTCOffer = async (data) => {
        console.log("📥 Received offer", data?.fromName || "");
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          // add buffered candidates
          for (const c of iceCandidatesBuffer.current) {
            try {
              await pc.addIceCandidate(c);
            } catch (e) {
              console.warn("Buffered candidate add failed:", e);
            }
          }
          iceCandidatesBuffer.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketService.socket?.emit("webrtc-answer", {
            roomId,
            answer: pc.localDescription,
          });
          console.log("📤 Answer emitted");
        } catch (err) {
          console.error("Offer handling error:", err);
        }
      };

      const handleWebRTCAnswer = async (data) => {
        console.log("📥 Received answer");
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          for (const c of iceCandidatesBuffer.current) {
            try {
              await pc.addIceCandidate(c);
            } catch (e) {
              console.warn("Buffered candidate add failed:", e);
            }
          }
          iceCandidatesBuffer.current = [];
        } catch (err) {
          console.error("Answer handling error:", err);
        }
      };

      const handleICECandidate = async (data) => {
        try {
          const candidate = new RTCIceCandidate(data.candidate);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate);
            console.log("✅ ICE candidate added");
          } else {
            console.log("⚠️ Buffering ICE candidate (no remote desc yet)");
            iceCandidatesBuffer.current.push(candidate);
          }
        } catch (err) {
          console.error("ICE candidate error:", err);
        }
      };

      const handleParticipantLeft = () => {
        console.log("👋 Partner left");
        setConnectionState("disconnected");
        toast.info("Partner left the call");
        setTimeout(() => {
          handleNextMatch();
        }, 1200);
      };

      const handlePartnerSkipped = (data) => {
        console.log("⏭️ Partner skipped");
        toast.info("Partner moved to next");
        handleNextMatch();
      };

      // Attach handlers
      socketService.socket?.on("roomReady", handleRoomReady);
      socketService.socket?.on("webrtc-offer", handleWebRTCOffer);
      socketService.socket?.on("webrtc-answer", handleWebRTCAnswer);
      socketService.socket?.on("ice-candidate", handleICECandidate);
      socketService.socket?.on("participantLeft", handleParticipantLeft);
      socketService.socket?.on("partnerSkipped", handlePartnerSkipped);

      // store for potential debugging (not global PC/stream)
      window.webrtcHandlers = {
        handleRoomReady,
        handleWebRTCOffer,
        handleWebRTCAnswer,
        handleICECandidate,
        handleParticipantLeft,
        handlePartnerSkipped,
      };

      console.log("🚪 Joining video room:", roomId, matchId);
      try {
        socketService.socket?.emit("joinVideoRoom", { roomId, matchId });
        console.log("✅ Room join emitted");
      } catch (e) {
        console.warn("joinVideoRoom emit failed:", e);
      }

      console.log("✅ WebRTC setup complete");
    } catch (error) {
      console.error("❌ WebRTC initialization failed:", error);
      setConnectionState("failed");
      if (
        error?.name === "NotAllowedError" ||
        error.message?.includes("permission")
      ) {
        toast.error(
          "Camera/microphone access denied. Please check browser permissions."
        );
      } else if (error?.name === "NotFoundError") {
        toast.error("No camera/microphone found.");
      } else {
        toast.error("Connection setup failed. Try refreshing.");
      }
    }
  };

  // ----------------- Chat setup -----------------
  const setupChatListeners = async () => {
    try {
      let attempts = 0;
      while (!socketService.isSocketConnected() && attempts < 10) {
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
      }
      if (!socketService.socket) return;

      const handleNewMessage = (messageData) => {
        const formattedMessage = {
          id: messageData.id,
          sender_id: messageData.senderId,
          content: messageData.content,
          message_type: messageData.messageType || "text",
          created_at: messageData.createdAt,
        };

        setMessages((prev) => {
          if (prev.find((m) => m.id === formattedMessage.id)) return prev;
          return [...prev, formattedMessage];
        });

        if (!showChat && messageData.senderId !== currentUser?.id) {
          setUnreadCount((prev) => prev + 1);
        }

        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 100);
      };

      socketService.socket.on("newMessage", handleNewMessage);

      // store cleanup
      window.chatCleanup = () => {
        try {
          socketService.socket?.off("newMessage", handleNewMessage);
        } catch (e) {}
      };
    } catch (err) {
      console.error("Chat setup error:", err);
    }
  };

  // ----------------- Actions -----------------
  const sendMessage = async (e) => {
    e?.preventDefault?.();
    if (!newMessage.trim()) return;
    try {
      if (!socketService.socket || !socketService.isSocketConnected()) {
        toast.error("Chat disconnected");
        return;
      }
      socketService.socket.emit("sendMessage", {
        matchId: match.id || match.matchId,
        content: newMessage.trim(),
        messageType: "text",
      });
      setNewMessage("");
    } catch (err) {
      toast.error("Failed to send message");
      console.error("sendMessage err:", err);
    }
  };

  const toggleAudio = () => {
    const s = localStreamRef.current;
    if (s) {
      const track = s.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
        toast.info(track.enabled ? "🎤 Microphone on" : "🔇 Microphone off");
      }
    }
  };

  const toggleVideo = () => {
    const s = localStreamRef.current;
    if (s) {
      const track = s.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
        toast.info(track.enabled ? "📹 Camera on" : "📷 Camera off");
      }
    }
  };

  const handleNextMatch = async () => {
    try {
      console.log("⏭️ Skipping to next match");
      setIsSkipping(true);
      setConnectionState("disconnecting");

      if (socketService.socket && socketService.isSocketConnected()) {
        try {
          socketService.socket.emit("skipMatch", {
            roomId,
            matchId,
            reason: "user_skipped",
          });
        } catch (e) {
          console.warn("skipMatch emit failed:", e);
        }
      }

      await cleanup();
      await new Promise((r) => setTimeout(r, 500));

      if (typeof onEndCall === "function") {
        onEndCall(0);
      }
    } catch (err) {
      console.error("Skip error:", err);
      setTimeout(() => window.location.reload(), 1500);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleEndCall = async () => {
    try {
      const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
      await cleanup();
      setConnectionState("idle");
      toast.success(`Call ended: ${formatDuration(duration)}`);
      if (typeof onEndCall === "function") {
        onEndCall(duration);
      }
    } catch (err) {
      setConnectionState("failed");
      toast.error("Error ending call. Please refresh.");
      console.error("End call error:", err);
    }
  };

  // ----------------- Render -----------------
  return (
    <div
      className={`relative w-full h-screen bg-black overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      onMouseMove={() => setShowControls(true)}
    >
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {connectionState === "connecting" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl text-white mb-2">
                Connecting to {partner.name}...
              </h3>
              <p className="text-gray-400 text-sm">
                ⚡ Ultra-fast mode enabled
              </p>
            </div>
          </div>
        )}
        {connectionState === "disconnecting" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl text-white mb-2">Finding next match...</h3>
            </div>
          </div>
        )}
        {connectionState === "failed" && (
          <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-xl mb-2">Connection Failed</h3>
              <Button
                onClick={initializeVideoChat}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
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

      <div
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 transition-opacity z-10 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <Card className="px-4 py-2 bg-black/50 backdrop-blur">
          <div className="flex items-center gap-3 text-white">
            <Users className="w-4 h-4" />
            <span className="font-medium">{partner.name}</span>
            <Clock className="w-3 h-3" />
            <span className="text-sm">{formatDuration(callDuration)}</span>
            {currentUser?.is_premium && (
              <>
                <Coins className="w-3 h-3 text-yellow-500" />
                <span className="text-sm">{currentUser.tokens}</span>
              </>
            )}
          </div>
        </Card>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity z-10 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={toggleAudio}
            className={`rounded-full w-14 h-14 ${isAudioEnabled ? "bg-white/20 hover:bg-white/30" : "bg-red-500 hover:bg-red-600"}`}
          >
            {isAudioEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
          </Button>
          <Button
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 ${isVideoEnabled ? "bg-white/20 hover:bg-white/30" : "bg-red-500 hover:bg-red-600"}`}
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
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                No messages yet 👋
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.sender_id === currentUser?.id ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}
                >
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
