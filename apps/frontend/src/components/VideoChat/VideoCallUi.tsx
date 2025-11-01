/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IncomingMessageData, Match, Message, Partner, User } from "./interfaces";
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Users, Clock, SkipForward } from "lucide-react";
import { toast } from "sonner";

import {
    useTracks,
    useLocalParticipant,
    VideoTrack,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import type { TrackReference } from "@livekit/components-react";

import socketService from "../../lib/socket";

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
} from "../icons/VideoCallIcons";


interface VideoCallUIProps {
    match: Match;
    currentUser: User;
    partner: Partner;
    matchId: string;
    onEndCall: (duration: number) => void;
}


export default function VideoCallUI({ currentUser, partner, matchId, onEndCall }: VideoCallUIProps) {
    // ✅ LiveKit hooks (replaces all WebRTC state management)
    // const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const tracks = useTracks([
        { source: Track.Source.Camera, withPlaceholder: false },
        { source: Track.Source.Microphone, withPlaceholder: false },
    ]);

    // UI State
    const [showChat, setShowChat] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [callDuration, setCallDuration] = useState(0);
    const [isSkipping, setIsSkipping] = useState(false);

    const controlsTimerRef = useRef<any>(null);
    const callTimerRef = useRef<any>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const callStartTime = useRef(Date.now());

    // ✅ Get remote participant (your partner)
    // const remoteParticipant = participants.find((p) => p.identity !== currentUser.id);

    function isValidTrackReference(track: any): track is TrackReference {
        return track.publication !== undefined;
    }

    const validTracks = tracks.filter(isValidTrackReference);


    const localVideoTrack = validTracks.find(
        (t) => t.participant.identity === currentUser.id && t.source === Track.Source.Camera
    );

    const remoteVideoTrack = validTracks.find(
        (t) => t.participant.identity !== currentUser.id && t.source === Track.Source.Camera
    );
    // ✅ Connection state (derived from LiveKit)
    // const connectionState: ConnectionState = useMemo(() => {
    //   if (!remoteParticipant) return "connecting";
    //   if (remoteVideoTrack) return "connected";
    //   return "connecting";
    // }, [remoteParticipant, remoteVideoTrack]);

    // Format duration
    const formatDuration = (sec: number): string =>
        `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

    // Fullscreen toggle
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
            console.warn("Fullscreen error:", err);
        }
    };

    // ✅ Toggle audio/video (LiveKit APIs)
    const toggleAudio = () => {
        const enabled = localParticipant.isMicrophoneEnabled;
        localParticipant.setMicrophoneEnabled(!enabled);
        toast.info(!enabled ? "🎤 Microphone on" : "🔇 Microphone off");
    };

    const toggleVideo = () => {
        const enabled = localParticipant.isCameraEnabled;
        localParticipant.setCameraEnabled(!enabled);
        toast.info(!enabled ? "📹 Camera on" : "📷 Camera off");
    };

    // Send message (still via Socket.IO)
    const sendMessage = (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!newMessage.trim() || !socketService.isSocketConnected()) return;
        socketService.emit("sendMessage", { matchId, content: newMessage.trim(), messageType: "text" });
        setNewMessage("");
    };

    // Skip to next match
    const handleNextMatch = async () => {
        setIsSkipping(true);
        if (socketService.isSocketConnected()) {
            socketService.emit("skipMatch", { roomId: matchId, matchId, reason: "user_skipped" });
        }
        await new Promise((r) => setTimeout(r, 500));
        onEndCall(0);
        setIsSkipping(false);
    };

    // End call
    const handleEndCall = () => {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        toast.success(`Call ended: ${formatDuration(duration)}`);
        onEndCall(duration);
    };

    // ==================== EFFECTS ====================

    // Controls auto-hide
    useEffect(() => {
        if (showControls) {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
            controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
        return () => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        };
    }, [showControls]);

    // Call duration timer
    useEffect(() => {
        callStartTime.current = Date.now();
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
        }, 1000);
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, []);

    // Chat messages listener
    useEffect(() => {
        const handleNewMessage = (messageData: IncomingMessageData) => {
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
        };

        socketService.on("newMessage", handleNewMessage);

        return () => {
            socketService.off("newMessage", handleNewMessage);
        };
    }, [showChat, currentUser]);

    // Reset unread count when chat opens
    useEffect(() => {
        if (showChat) setUnreadCount(0);
    }, [showChat]);

    // ==================== RENDER ====================

    return (
        <>
            {/* ✅ Audio renderer (handles all remote audio) */}
            <RoomAudioRenderer />

            <div
                className={`relative w-full h-screen bg-black overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
                onMouseMove={() => setShowControls(true)}
            >
                {/* Remote Video */}
                <div className="w-full h-full">
                    {remoteVideoTrack ? (
                        <VideoTrack trackRef={remoteVideoTrack} className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-linear-to-br from-gray-900 to-black flex items-center justify-center">
                            <div className="text-center">
                                <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                                <h3 className="text-xl text-white mb-2">Waiting for {partner.name}...</h3>
                                <p className="text-gray-400 text-sm">Please wait...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl z-10">
                    {localVideoTrack ? (
                        <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
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
                <div className={`absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/90 to-transparent transition-opacity z-10 ${showControls ? "opacity-100" : "opacity-0"}`}>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={toggleAudio}
                            className={`rounded-full w-14 h-14 ${localParticipant.isMicrophoneEnabled ? "bg-white/20" : "bg-red-500"}`}
                        >
                            {localParticipant.isMicrophoneEnabled ? <MicrophoneIcon /> : <MicrophoneOffIcon />}
                        </Button>

                        <Button
                            onClick={toggleVideo}
                            className={`rounded-full w-14 h-14 ${localParticipant.isCameraEnabled ? "bg-white/20" : "bg-red-500"}`}
                        >
                            {localParticipant.isCameraEnabled ? <CameraIcon /> : <CameraOffIcon />}
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
        </>
    );
}
