
// ==================== TYPE DEFINITIONS ====================

// type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "failed" | "disconnecting";

export interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string | Date;
}

export interface IncomingMessageData {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
}

export interface Partner {
    id: string;
    name: string;
}

export interface BaseMatch {
    id: string;
    matchId?: string;
    roomId?: string;
    room_id?: string;
    isInitiator?: boolean;
}

export interface MatchWithPartner extends BaseMatch {
    partner: Partner;
}

export interface MatchWithUsers extends BaseMatch {
    user1: { id: string; name: string };
    user2: { id: string; name: string };
    user1_id: string;
}

export type Match = MatchWithPartner | MatchWithUsers;

export interface VideoChatProps {
    match: Match;
    currentUser: User;
    onEndCall: (duration: number) => void;
}

export interface NormalizedMatch {
    roomId: string;
    matchId: string;
    partner: Partner;
    isInitiator: boolean;
}

// ==================== TYPE GUARDS ====================

export function isMatchWithPartner(match: Match): match is MatchWithPartner {
    return "partner" in match;
}