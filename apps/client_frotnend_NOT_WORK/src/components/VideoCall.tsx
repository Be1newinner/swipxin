import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Search, Users, Coins, Video, Phone } from "lucide-react";
import { toast } from "sonner";
import IsolatedMatchingService from "../lib/isolatedMatching";
import VideoChat from "./VideoChat";

export function VideoCall({ user, navigateTo, onDurationUpdate }) {
  // States for the new integrated video chat system
  const [currentMatch, setCurrentMatch] = useState(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [isInVideoChat, setIsInVideoChat] = useState(false);

  // Create separate matching service instance for this user
  const [matchingService] = useState(() =>
    user ? new IsolatedMatchingService(user.id) : null
  );

  useEffect(() => {
    if (!user) {
      navigateTo("auth");
      return;
    }

    console.log(`🚀 [${user.id}] VideoCall component mounted`);

    // Update online status
    if (matchingService) {
      matchingService.updateOnlineStatus(true);
    }

    // Get online users count
    loadOnlineUsersCount();

    // Check for existing active match
    checkExistingMatch();

    // Cleanup when leaving
    return () => {
      console.log(`🧹 [${user.id}] Cleaning up VideoCall component`);

      // ✅ FIXED: Safe cleanup with try-catch
      try {
        if (matchingService) {
          // Update online status
          matchingService.updateOnlineStatus(false).catch((err) => {
            console.warn("⚠️ Failed to update online status:", err);
          });

          // Safely unsubscribe with optional chaining
          if (typeof matchingService.unsubscribe === "function") {
            matchingService.unsubscribe();
            console.log("✅ Unsubscribed from matching service");
          }
        }
      } catch (error) {
        console.warn("⚠️ Cleanup error (non-critical):", error);
      }
    };
  }, [user]);

  // DEBUG: Add raw event listener to test if events are received at all
  useEffect(() => {
    if (!user) return;

    import("../lib/socket.js").then(({ default: socketService }) => {
      console.log(`🔴 [${user.id}] Setting up DEBUG raw event listener`);

      const rawMatchFoundListener = async (data) => {
        console.log(`🔥 [${user.id}] RAW matchFound event received:`, data);

        // ✅ FIXED: Validate data before processing
        if (!data || !data.matchId || !data.roomId) {
          console.error(`❌ [${user.id}] Invalid match data received:`, data);
          toast.error("Received invalid match data");
          return;
        }

        console.log(`🔍 [${user.id}] Match data structure:`, {
          matchId: data.matchId,
          roomId: data.roomId,
          partner: data.partner,
          isInitiator: data.isInitiator,
        });

        try {
          // IMMEDIATE TRANSITION - Force transition to video chat
          console.log(
            `🚑 [${user.id}] FORCING immediate transition to video chat`
          );

          const emergencyMatch = {
            id: data.matchId,
            roomId: data.roomId,
            partner: data.partner || { id: "unknown", name: "Your Match" },
            isInitiator: data.isInitiator || false,
            matchId: data.matchId,
          };

          console.log(
            `📦 [${user.id}] Emergency match object created:`,
            emergencyMatch
          );

          // Force state update immediately
          console.log(`📊 [${user.id}] Setting currentMatch state...`);
          setCurrentMatch(emergencyMatch);

          console.log(`🎬 [${user.id}] Setting isInVideoChat to true...`);
          setIsInVideoChat(true);

          console.log(`🔍 [${user.id}] Setting isSearchingMatch to false...`);
          setIsSearchingMatch(false);

          console.log(
            `🎉 [${user.id}] State updates complete, showing toast...`
          );
          toast.success(
            `Connected with ${data.partner?.name || "your match"}!`
          );

          console.log(
            `✅ [${user.id}] Emergency transition completed successfully`
          );
        } catch (error) {
          console.error(
            `❌ [${user.id}] Error during emergency transition:`,
            error
          );
          toast.error(`ERROR during transition: ${error.message}`);
        }
      };

      const rawMatchingStatusListener = (data) => {
        console.log(`📊 [${user.id}] RAW matchingStatus:`, data);
      };

      const rawMatchingErrorListener = (data) => {
        console.log(`⚠️ [${user.id}] RAW matchingError:`, data);
      };

      // Set up raw listeners
      socketService.on("matchFound", rawMatchFoundListener);
      socketService.on("matchingStatus", rawMatchingStatusListener);
      socketService.on("matchingError", rawMatchingErrorListener);

      return () => {
        console.log(`🧽 [${user.id}] Cleaning up DEBUG listeners`);
        socketService.off("matchFound", rawMatchFoundListener);
        socketService.off("matchingStatus", rawMatchingStatusListener);
        socketService.off("matchingError", rawMatchingErrorListener);
      };
    });
  }, [user]);

  // Load online users count
  const loadOnlineUsersCount = async () => {
    try {
      if (matchingService) {
        const count = await matchingService.getOnlineUsersCount();
        setOnlineUsersCount(count);
      }
    } catch (error) {
      console.error("Failed to load online users count:", error);
    }
  };

  // Check for existing active match
  const checkExistingMatch = async () => {
    try {
      if (matchingService) {
        const existingMatch = await matchingService.getCurrentMatch();
        if (existingMatch) {
          console.log("Found existing active match:", existingMatch);
          setCurrentMatch(existingMatch);
          setIsInVideoChat(true);
        }
      }
    } catch (error) {
      console.error("Failed to check existing match:", error);
    }
  };

  // Find a new match
  const handleFindMatch = async () => {
    if (user.tokens < 1) {
      toast.error(
        "Insufficient tokens. You need at least 1 token to start a video call."
      );
      navigateTo("wallet");
      return;
    }

    if (!matchingService) {
      toast.error("Matching service not available. Please refresh the page.");
      return;
    }

    setIsSearchingMatch(true);
    toast.info("Looking for someone to chat with...");

    try {
      // Subscribe to real-time match updates BEFORE starting search
      console.log(`🚀 [${user.id}] Setting up real-time match subscription...`);

      matchingService.subscribeToMatches({
        onMatchFound: async (match) => {
          console.log(
            `✅ [${user.id}] Match found via real-time subscription:`,
            match
          );

          // ✅ FIXED: Validate match data
          if (!match || !match.matchId || !match.roomId) {
            console.error("❌ Invalid match data:", match);
            toast.error("Received invalid match data");
            return;
          }

          // Format match data for VideoChat component
          const formattedMatch = {
            id: match.matchId,
            roomId: match.roomId,
            partner: match.partner || { id: "unknown", name: "Your Match" },
            isInitiator: match.isInitiator || false,
            matchId: match.matchId,
          };

          console.log(
            `🎉 [${user.id}] Transitioning to video chat with:`,
            formattedMatch
          );

          // Update state to show video chat
          setCurrentMatch(formattedMatch);
          setIsInVideoChat(true);
          setIsSearchingMatch(false);

          // Show success message
          const partnerName = match.partner?.name || "your match";
          toast.success(`Connected with ${partnerName}!`);
        },
        onMatchEnded: (match) => {
          console.log(`📞 [${user.id}] Match ended via real-time:`, match);

          // ✅ FIXED: Validate match exists before accessing properties
          if (match && match.matchId) {
            console.log(`Ending match: ${match.matchId}`);
          }

          handleEndCall();
        },
        onMessageReceived: (message) => {
          console.log(
            `💬 [${user.id}] Message received via real-time:`,
            message
          );
          // Messages will be handled in VideoChat component
        },
      });

      console.log(`📚 [${user.id}] Real-time subscription set up successfully`);

      // Try to find a match
      console.log(`🔍 [${user.id}] Starting findMatch process`);

      try {
        const match = await matchingService.findMatch(user.preferredGender);

        if (match) {
          console.log(
            `✅ [${user.id}] Match found directly from promise:`,
            match
          );

          // ✅ FIXED: Validate before formatting
          if (!match.matchId || !match.roomId) {
            console.error("❌ Invalid match data from findMatch");
            return;
          }

          // Format match data consistently
          const formattedMatch = {
            id: match.matchId,
            roomId: match.roomId,
            partner: match.partner || { id: "unknown", name: "Your Match" },
            isInitiator: match.isInitiator || false,
            matchId: match.matchId,
          };

          console.log(`🎉 [${user.id}] Transitioning to video chat directly`);

          setCurrentMatch(formattedMatch);
          setIsInVideoChat(true);
          setIsSearchingMatch(false);
          toast.success(
            `Connected with ${match.partner?.name || "your match"}!`
          );
        }
      } catch (matchError) {
        console.log(`⚠️ [${user.id}] Match search error:`, matchError);
        setIsSearchingMatch(false);

        if (!matchError.message.includes("timeout")) {
          toast.error(`Match failed: ${matchError.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Failed to find match:", error);
      setIsSearchingMatch(false);
      toast.error(error.message || "Failed to find a match");
    }
  };

  // Cancel search
  const handleCancelSearch = () => {
    console.log("❌ Cancelling search...");
    if (matchingService) {
      matchingService.cancelMatching();
    }
    setIsSearchingMatch(false);
    toast.info("Search cancelled. You can start a new search anytime!");
  };

  // End current call
  const handleEndCall = (duration = 0) => {
    setCurrentMatch(null);
    setIsInVideoChat(false);
    setIsSearchingMatch(false);

    // Update call duration if provided
    if (duration > 0) {
      onDurationUpdate(0); // Reset duration
    }

    // Refresh online count
    loadOnlineUsersCount();

    toast.success("Call ended. Ready for your next chat!");
  };

  if (!user) return null;

  console.log(`🗺 [${user.id}] VideoCall render state:`, {
    isInVideoChat,
    hasCurrentMatch: !!currentMatch,
    isSearchingMatch,
  });

  // If in video chat, show the VideoChat component
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
        onTokenUpdate={(newTokens) => {
          console.log(`💰 Token update from VideoChat:`, newTokens);
        }}
        matchingService={matchingService}
      />
    );
  }

  // Main video call screen (matching/waiting)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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
          <Badge variant={user.isPremium ? "default" : "outline"}>
            {user.isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Status Card */}
          <Card className="glass p-6 text-center">
            {isSearchingMatch ? (
              // Searching state
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Search className="w-10 h-10 text-white animate-bounce" />
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
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              // Ready state
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-10 h-10 text-white" />
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
          <Card className="glass p-4">
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
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 text-lg font-medium opacity-70"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              disabled={user.tokens < 1}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-4 text-lg font-medium"
            >
              {user.tokens < 1 ? "Need Tokens to Chat" : "Start Video Chat"}
            </Button>
          )}

          {/* Token Info */}
          {user.tokens < 1 && (
            <Card className="glass p-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    No tokens remaining
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    You need at least 1 token to start a video chat. Purchase
                    more tokens to continue.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigateTo("wallet")}
                    className="p-0 h-auto mt-2 text-amber-700 dark:text-amber-300 hover:text-amber-600"
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
      <div className="p-4 border-t border-border">
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigateTo("home")}>
            Back to Home
          </Button>
          <Button variant="outline" onClick={() => navigateTo("wallet")}>
            <Coins className="w-4 h-4 mr-2" />
            Buy Tokens
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
