import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "../components/ui/button.js";
import { Badge } from "../components/ui/badge.js";
import { Card } from "../components/ui/card.js";
import { Search, Users, Coins, Video, Phone } from "lucide-react";
import { toast } from "sonner";
import IsolatedMatchingService from "../lib/isolatedMatching";
import VideoChat from "../components/VideoChat.js";
import { useAppStore } from "@/store/useAppStore.js";
import { useAppNavigation } from "@/components/utils/navigateHook";

// ===== Domain types =====
type Partner = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type RawMatchEvent = {
  matchId: string;
  roomId: string;
  partner?: Partner;
  isInitiator?: boolean;
};

type Match = {
  id: string;
  roomId: string;
  partner: Partner;
  isInitiator: boolean;
  matchId: string; // kept for backward compat with server payloads
};

// Matching service interface surface we consume locally
type MatchingCallbacks = {
  onMatchFound: (match: RawMatchEvent) => void;
  onMatchEnded: (match?: { matchId?: string }) => void;
  onMessageReceived?: (message: unknown) => void;
};

type MatchingService = {
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;
  getOnlineUsersCount: () => Promise<number>;
  getCurrentMatch: () => Promise<Match | null>;
  subscribeToMatches: (cbs: MatchingCallbacks) => void;
  unsubscribe?: () => void;
  findMatch: (preferredGender?: string | null) => Promise<RawMatchEvent | null>;
  cancelMatching: () => void;
};

// Socket service minimal surface for our usage
type SocketService = {
  on: <E extends keyof SocketEvents>(
    event: E,
    listener: SocketEvents[E]
  ) => void;
  off: <E extends keyof SocketEvents>(
    event: E,
    listener: SocketEvents[E]
  ) => void;
};

type SocketEvents = {
  matchFound: (data: RawMatchEvent) => void;
  matchingStatus: (data: unknown) => void;
  matchingError: (data: unknown) => void;
};

// Helpers
const toFormattedMatch = (m: RawMatchEvent): Match | null => {
  if (!m || !m.matchId || !m.roomId) return null;
  return {
    id: m.matchId,
    roomId: m.roomId,
    partner: m.partner ?? { id: "unknown", name: "Your Match" },
    isInitiator: Boolean(m.isInitiator),
    matchId: m.matchId,
  };
};

export function VideoCall() {
  const user = useAppStore((s) => s.user);

  // ===== Local state (well-typed) =====
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState<boolean>(false);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [isInVideoChat, setIsInVideoChat] = useState<boolean>(false);

  const { navigate } = useAppNavigation();

  // ===== Matching service instance (memoized and typed) =====
  const matchingService = useMemo<MatchingService | null>(() => {
    return user
      ? (new IsolatedMatchingService(user.id) as unknown as MatchingService)
      : null;
  }, [user]);

  // Hold stable refs for callbacks to avoid stale closures in async listeners
  const onEndCallRef = useRef<(duration?: number) => void>(null);
  onEndCallRef.current = () =>
  // duration = 0
  {
    setCurrentMatch(null);
    setIsInVideoChat(false);
    setIsSearchingMatch(false);
    // if (duration > 0 && onDurationUpdate) onDurationUpdate(0);
    void loadOnlineUsersCount();
    toast.success("Call ended. Ready for your next chat!");
  };

  // ===== Lifecycle: mount/cleanup =====
  useEffect(() => {
    if (!user) {
      navigate("auth");
      return;
    }

    console.log(`🚀 [${user.id}] VideoCall component mounted`);

    const setOnline = async () => {
      try {
        await matchingService?.updateOnlineStatus(true);
      } catch (err) {
        console.warn("⚠️ Failed to update online status:", err);
      }
    };

    const boot = async () => {
      await setOnline();
      await loadOnlineUsersCount();
      await checkExistingMatch();
    };

    void boot();

    // Cleanup
    return () => {
      if (!user) return;
      console.log(`🧹 [${user.id}] Cleaning up VideoCall component`);
      (async () => {
        try {
          if (matchingService) {
            await matchingService.updateOnlineStatus(false).catch((err) => {
              console.warn("⚠️ Failed to update online status:", err);
            });
            if (typeof matchingService.unsubscribe === "function") {
              matchingService.unsubscribe();
              console.log("✅ Unsubscribed from matching service");
            }
          }
        } catch (error) {
          console.warn("⚠️ Cleanup error (non-critical):", error);
        }
      })();
    };
    // matchingService is intentionally not a dependency: we want user-bound lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // ===== DEBUG socket raw listeners (typed) =====
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    import("../lib/socket.js").then(({ default: socketService }) => {
      if (!mounted) return;

      const socket = socketService as SocketService;
      console.log(`🔴 [${user.id}] Setting up DEBUG raw event listener`);

      const rawMatchFoundListener: SocketEvents["matchFound"] = async (
        data
      ) => {
        console.log(`🔥 [${user.id}] RAW matchFound event received:`, data);

        const formatted = toFormattedMatch(data);
        if (!formatted) {
          console.error(`❌ [${user.id}] Invalid match data received:`, data);
          toast.error("Received invalid match data");
          return;
        }

        try {
          console.log(
            `🚑 [${user.id}] FORCING immediate transition to video chat`
          );
          setCurrentMatch(formatted);
          setIsInVideoChat(true);
          setIsSearchingMatch(false);
          toast.success(`Connected with ${formatted.partner.name}!`);
          console.log(
            `✅ [${user.id}] Emergency transition completed successfully`
          );
        } catch (error) {
          const err = error as Error;
          console.error(
            `❌ [${user.id}] Error during emergency transition:`,
            err
          );
          toast.error(`ERROR during transition: ${err.message}`);
        }
      };

      const rawMatchingStatusListener: SocketEvents["matchingStatus"] = (
        data
      ) => {
        console.log(`📊 [${user.id}] RAW matchingStatus:`, data);
      };

      const rawMatchingErrorListener: SocketEvents["matchingError"] = (
        data
      ) => {
        console.log(`⚠️ [${user.id}] RAW matchingError:`, data);
      };

      socket.on("matchFound", rawMatchFoundListener);
      socket.on("matchingStatus", rawMatchingStatusListener);
      socket.on("matchingError", rawMatchingErrorListener);

      return () => {
        console.log(`🧽 [${user.id}] Cleaning up DEBUG listeners`);
        socket.off("matchFound", rawMatchFoundListener);
        socket.off("matchingStatus", rawMatchingStatusListener);
        socket.off("matchingError", rawMatchingErrorListener);
      };
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  // ===== Commands =====
  const loadOnlineUsersCount = async () => {
    try {
      if (!matchingService) return;
      const count = await matchingService.getOnlineUsersCount();
      setOnlineUsersCount(count);
    } catch (error) {
      console.error("Failed to load online users count:", error);
    }
  };

  const checkExistingMatch = async () => {
    try {
      if (!matchingService) return;
      const existingMatch = await matchingService.getCurrentMatch();
      if (existingMatch) {
        console.log("Found existing active match:", existingMatch);
        setCurrentMatch(existingMatch);
        setIsInVideoChat(true);
      }
    } catch (error) {
      console.error("Failed to check existing match:", error);
    }
  };

  const handleFindMatch = async () => {
    if (user!.tokens < 1) {
      toast.error(
        "Insufficient tokens. You need at least 1 token to start a video call."
      );
      navigate("wallet");
      return;
    }
    if (!matchingService) {
      toast.error("Matching service not available. Please refresh the page.");
      return;
    }

    setIsSearchingMatch(true);
    toast.info("Looking for someone to chat with...");

    try {
      console.log(
        `🚀 [${user?.id}] Setting up real-time match subscription...`
      );
      matchingService.subscribeToMatches({
        onMatchFound: async (match) => {
          console.log(
            `✅ [${user?.id}] Match found via real-time subscription:`,
            match
          );
          const formatted = toFormattedMatch(match);
          if (!formatted) {
            console.error("❌ Invalid match data:", match);
            toast.error("Received invalid match data");
            return;
          }
          setCurrentMatch(formatted);
          setIsInVideoChat(true);
          setIsSearchingMatch(false);
          toast.success(`Connected with ${formatted.partner.name}!`);
        },
        onMatchEnded: (match) => {
          console.log(`📞 [${user?.id}] Match ended via real-time:`, match);
          onEndCallRef.current?.();
        },
        onMessageReceived: (message) => {
          console.log(
            `💬 [${user?.id}] Message received via real-time:`,
            message
          );
        },
      });

      console.log(
        `📚 [${user?.id}] Real-time subscription set up successfully`
      );
      console.log(`🔍 [${user?.id}] Starting findMatch process`);

      try {
        const raw = await matchingService.findMatch(
          user?.preferred_gender ?? null
        );
        if (raw) {
          console.log(
            `✅ [${user?.id}] Match found directly from promise:`,
            raw
          );
          const formatted = toFormattedMatch(raw);
          if (!formatted) {
            console.error("❌ Invalid match data from findMatch");
            return;
          }
          setCurrentMatch(formatted);
          setIsInVideoChat(true);
          setIsSearchingMatch(false);
          toast.success(`Connected with ${formatted.partner.name}!`);
        }
      } catch (inner) {
        const err = inner as Error;
        console.log(`⚠️ [${user?.id}] Match search error:`, err.message);
        setIsSearchingMatch(false);
        if (!err.message.includes("timeout")) {
          toast.error(`Match failed: ${err.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error("Failed to find match:", err);
      setIsSearchingMatch(false);
      toast.error(err.message || "Failed to find a match");
    }
  };

  const handleCancelSearch = () => {
    console.log("❌ Cancelling search...");
    matchingService?.cancelMatching();
    setIsSearchingMatch(false);
    toast.info("Search cancelled. You can start a new search anytime!");
  };

  const handleEndCall = (duration = 0) => {
    onEndCallRef.current?.(duration);
  };

  if (!user) return null;

  console.log(`🗺 [${user.id}] VideoCall render state:`, {
    isInVideoChat,
    hasCurrentMatch: !!currentMatch,
    isSearchingMatch,
  });

  if (isInVideoChat && currentMatch) {
    console.log(
      `🎥 [${user.id}] Rendering VideoChat component with match:`,
      currentMatch
    );
    return (
      <VideoChat
        match={currentMatch}
        currentUser={user}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-300 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Video Chat</h1>
            <p className="text-sm text-muted-foreground">
              Connect with people worldwide
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Coins className="w-3 h-3" />
            {user.tokens} tokens
          </Badge>
          <Badge variant={user.is_premium ? "default" : "outline"}>
            {user.is_premium ? "Premium" : "Free"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Status Card */}
          <Card className="glass p-6 text-center bg-white border-none">
            {isSearchingMatch ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Search className="w-10 h-10 animate-bounce text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Finding your match...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Looking for someone to chat with
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ready to Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a video call with someone new
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Online Stats */}
          <Card className="glass p-4 bg-white border-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Online Users</span>
              </div>
              <Badge variant="secondary">{onlineUsersCount}</Badge>
            </div>
          </Card>

          {/* Action Buttons */}
          {isSearchingMatch ? (
            <div className="space-y-3">
              <Button
                disabled
                className="w-full bg-white py-4 text-lg font-medium"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full animate-spin" />
                  Searching...
                </div>
              </Button>
              <Button
                onClick={handleCancelSearch}
                variant="outline"
                className="w-full py-3"
              >
                Cancel Search
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleFindMatch}
              variant={"default"}
              disabled={user.tokens < 1}
              className="w-full bg-white py-4 text-lg font-medium"
            >
              {user.tokens < 1 ? "Need Tokens to Chat" : "Start Video Chat"}
            </Button>
          )}

          {/* Token Info */}
          {user.tokens < 1 && (
            <Card className="glass p-4 border-slate-300 bg-white text-red-500 font-bold">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5  flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">No tokens remaining</p>
                  <p>
                    You need at least 1 token to start a video chat. Purchase
                    more tokens to continue.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate("wallet")}
                    className="p-0 h-auto mt-2"
                  >
                    Go to Wallet →
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4  bg-white border-2 border-slate-300">
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("home")}
            className="cursor-pointer"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("wallet")}
            className="cursor-pointer"
          >
            <Coins className="w-4 h-4 mr-2" />
            Buy Tokens
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
