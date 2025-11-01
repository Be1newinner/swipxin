import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";

import { LoadingSpinnerIcon } from "../icons/VideoCallIcons";
import api from "@/lib/api";
import { ENVIRONMENTS } from "@/constants/envs";
import { isMatchWithPartner, type NormalizedMatch, type Partner, type VideoChatProps } from "./interfaces";
import VideoCallUI from "./VideoCallUi";

// ==================== MAIN COMPONENT ====================

export function VideoChat({ match, currentUser, onEndCall }: VideoChatProps) {
  const [livekitToken, setLivekitToken] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");

  // Normalize match data
  const { roomId, matchId, partner }: NormalizedMatch = useMemo(() => {
    const resolvedRoomId = match.roomId || match.room_id || match.id;
    const resolvedMatchId = match.matchId || match.id;
    let resolvedPartner: Partner = { id: "unknown", name: "Your Match" };

    if (isMatchWithPartner(match)) {
      resolvedPartner = match.partner;
    } else {
      resolvedPartner = match.user1_id === currentUser?.id ? match.user2 : match.user1;
    }

    return {
      roomId: resolvedRoomId,
      matchId: resolvedMatchId,
      partner: resolvedPartner,
      isInitiator: false
    };
  }, [match, currentUser]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.post(
          `api/livekit/token`,
          {
            roomName: roomId,
            participantName: currentUser.name,
            participantId: currentUser.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setLivekitToken(response.data.token);

        console.log("TOKEN LIVEKIT, ", response.data, response.data.token)

      } catch (error) {
        console.error("Token fetch error:", error);
        setTokenError("Failed to connect. Please try again.");
        toast.error("Connection failed");
      }
    };

    fetchToken();
  }, [roomId, currentUser]);


  // Show loading while fetching token
  if (!livekitToken) {
    return (
      <div className="relative w-full h-screen bg-linear-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          {tokenError ? (
            <>
              <h3 className="text-xl text-red-500 mb-2">{tokenError}</h3>
              <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600">
                Retry
              </Button>
            </>
          ) : (
            <>
              <LoadingSpinnerIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl text-white mb-2">Connecting to {partner.name}...</h3>
              <p className="text-gray-400 text-sm">Please wait...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={ENVIRONMENTS.LIVEKIT_URL}
      token={livekitToken}
      connect={true}
      onDisconnected={(reason) => {
        console.log("Disconnected:", reason);
        onEndCall(0);
      }}
      style={{ height: "100vh", width: "100vw" }}
    >
      <VideoCallUI
        match={match}
        currentUser={currentUser}
        partner={partner}
        matchId={matchId}
        onEndCall={onEndCall}
      />
    </LiveKitRoom>
  );
}

export default VideoChat;