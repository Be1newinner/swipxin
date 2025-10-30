
/* Domain types */
export type PreferredGender = "male" | "female" | "any" | null;

export type MatchStatus = "idle" | "searching" | "matched";

export interface Partner {
    id: string;
    name?: string;
    [k: string]: unknown;
}

export interface MatchFoundEvent {
    matchId: string;
    roomId: string;
    partner: Partner;
    isInitiator: boolean;
}

export interface MatchingTimeoutEvent {
    message?: string;
}

export interface MatchingErrorEvent {
    message?: string;
    code?: string | number;
    [k: string]: unknown;
}

export interface MatchingStatusEvent {
    stage?: "queued" | "searching" | "pairing" | "matched";
    queueSize?: number;
    [k: string]: unknown;
}

export type SocketEvents =
    | "matchFound"
    | "matchEnded"
    | "newMessage"
    | "matchingError"
    | "matchingTimeout"
    | "matchingStatus";

export interface CurrentMatch {
    id: string;          // alias of matchId
    roomId: string;
    partner: Partner;
    isInitiator: boolean;
    matchId: string;     // backend compatibility
}

export type MessageType = "text" | "image" | "file";

export interface OutgoingMessage {
    id: string;
    match_id: string;
    sender_id: string;
    content: string;
    message_type: MessageType;
    created_at: string;
}

export interface SubscribeCallbacks {
    onMatchFound?: (m: CurrentMatch) => void;
    onMatchEnded?: (payload?: unknown) => void;
    onMessageReceived?: (payload: unknown) => void;
}
