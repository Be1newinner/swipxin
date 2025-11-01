import express from "express";
import { AccessToken } from "livekit-server-sdk";

const router = express.Router();

router.post("/token", async (req, res) => {
    console.log("🔵 LiveKit token endpoint hit!");
    console.log("📦 Request body:", req.body);

    try {
        const { roomName, participantName, participantId } = req.body;

        console.log("📝 Received:", { roomName, participantName, participantId });

        if (!roomName || !participantName || !participantId) {
            console.log("❌ Missing fields");
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("🔑 Generating token...");

        const token = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: participantId,
                name: participantName,
            }
        );

        token.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const jwt = await token.toJwt();

        console.log("✅ Token generated:", jwt.substring(0, 50) + "...");

        res.json({ token: jwt });
    } catch (error) {
        console.error("❌ Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

export default router;
