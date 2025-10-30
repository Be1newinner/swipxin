/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from "socket.io";
import { query } from "./config/database";
import { socketAuth } from "./middleware/auth";
import { v4 as uuid } from "uuid";

interface ActiveUser {
    socketId: string;
    user: any;
}

interface WaitingUser {
    user: any;
    preferences: any;
    socketId: string;
    joinedAt: number;
}

interface Room {
    participants: string[];
    matchId?: string;
    createdAt?: number;
}

export function initializeSocket(server: any, FRONTEND_URLS: string[] | undefined) {
    const io = new Server(server, {
        cors: {
            origin: FRONTEND_URLS,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(socketAuth);

    const activeUsers = new Map<string, ActiveUser>();
    const waitingUsers = new Map<string, WaitingUser>();
    const activeMatches = new Map<string, any>();
    const rooms = new Map<string, Room>();

    // Common helper to validate socket exists and safe access
    const socketExists = (userId: string) => {
        const userSocket = activeUsers.get(userId);
        return userSocket && io.sockets.sockets.has(userSocket.socketId);
    };

    // Helper to emit to user by userId
    const emitToUser = (userId: string, event: string, payload: any) => {
        const userSocket = activeUsers.get(userId);
        if (userSocket) {
            io.to(userSocket.socketId).emit(event, payload);
        }
    };

    async function findMatch(userId: string): Promise<boolean> {
        const waitingUser = waitingUsers.get(userId);
        if (!waitingUser) return false;

        const { user } = waitingUser;

        const matchedEntry = Array.from(waitingUsers.entries()).find(
            ([otherUserId]) =>
                otherUserId !== userId && socketExists(otherUserId)
        );

        if (!matchedEntry) {
            emitToUser(userId, "matchingStatus", {
                status: "searching",
                message: `Looking for match... ${waitingUsers.size} users in queue`,
                queueSize: waitingUsers.size,
            });
            return false;
        }

        const [matchedUserId, matchedUserData] = matchedEntry;

        const matchId = uuid();
        const roomId = uuid();

        // Remove both users from queue safely
        waitingUsers.delete(userId);
        waitingUsers.delete(matchedUserId);

        activeMatches.set(matchId, {
            user1Id: userId,
            user2Id: matchedUserId,
            roomId,
            startedAt: Date.now(),
        });

        if (!socketExists(userId) || !socketExists(matchedUserId)) {
            // Re-add users if sockets invalid
            if (waitingUsers.get(userId) === undefined) waitingUsers.set(userId, waitingUser);
            if (waitingUsers.get(matchedUserId) === undefined) waitingUsers.set(matchedUserId, matchedUserData);
            return false;
        }

        // Notify both users
        emitToUser(userId, "matchFound", {
            matchId,
            roomId,
            partner: { ...matchedUserData.user },
            isInitiator: true,
        });

        emitToUser(matchedUserId, "matchFound", {
            matchId,
            roomId,
            partner: { ...user },
            isInitiator: false,
        });

        try {
            await query(
                "UPDATE users SET tokens = tokens - 1 WHERE id IN ($1, $2) AND tokens > 0",
                [userId, matchedUserId]
            );
        } catch (error) {
            console.warn("Could not deduct tokens, continuing", error);
        }

        return true;
    }

    async function processMatchingQueue() {
        if (waitingUsers.size < 2) return;

        const userIds = Array.from(waitingUsers.keys());
        const processedUsers = new Set<string>();

        for (let i = 0; i < userIds.length; i++) {
            const userId1 = userIds[i];
            if (processedUsers.has(userId1) || !waitingUsers.has(userId1)) continue;

            for (let j = i + 1; j < userIds.length; j++) {
                const userId2 = userIds[j];
                if (processedUsers.has(userId2) || !waitingUsers.has(userId2)) continue;

                if (!(socketExists(userId1) && socketExists(userId2))) continue;

                const user1Data = waitingUsers.get(userId1)!;
                const user2Data = waitingUsers.get(userId2)!;

                const matchId = `match-${userId1}-${userId2}-${Date.now()}`;
                const roomId = `room-${matchId}`;

                waitingUsers.delete(userId1);
                waitingUsers.delete(userId2);

                processedUsers.add(userId1);
                processedUsers.add(userId2);

                activeMatches.set(matchId, { user1Id: userId1, user2Id: userId2, roomId, startedAt: Date.now() });

                emitToUser(userId1, "matchFound", {
                    matchId,
                    roomId,
                    partner: { ...user2Data.user },
                    isInitiator: true,
                });

                emitToUser(userId2, "matchFound", {
                    matchId,
                    roomId,
                    partner: { ...user1Data.user },
                    isInitiator: false,
                });

                try {
                    await query(
                        "UPDATE users SET tokens = tokens - 1 WHERE id IN ($1, $2) AND tokens > 0",
                        [userId1, userId2]
                    );
                } catch (error) {
                    console.warn("Could not deduct tokens", error);
                }

                // Stop inner loop, user1 matched
                break;
            }
        }
    }

    io.on("connection", async (socket: Socket) => {
        const { userId, user } = socket as any;
        console.log(`✅ User connected: ${user.name} (${userId})`);

        activeUsers.set(userId, { socketId: socket.id, user });

        const updateOnlineStatus = async (online: boolean) => {
            try {
                await query("UPDATE users SET is_online = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2", [
                    online,
                    userId,
                ]);
                if (online) {
                    socket.broadcast.emit("userOnline", { userId, user });
                } else {
                    socket.broadcast.emit("userOffline", { userId });
                }
            } catch (e) {
                console.error("Error updating online status", e);
            }
        };

        await updateOnlineStatus(true);

        try {
            await query(
                "INSERT INTO user_sessions (user_id, socket_id, is_active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING",
                [userId, socket.id]
            );
        } catch {
            try {
                await query(
                    "UPDATE user_sessions SET socket_id = $2, is_active = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
                    [userId, socket.id]
                );
            } catch {
                console.log("user_sessions table not found, skipping session storage");
            }
        }

        socket.broadcast.emit("userOnline", { userId, user });

        // Event handlers (grouped for brevity)
        socket.on("joinMatchingQueue", async (preferences = {}) => {
            if (user.tokens < 1) {
                socket.emit("matchingError", { message: "Insufficient tokens. You need at least 1 token to start a video call." });
                return;
            }
            waitingUsers.set(userId, { user, preferences, socketId: socket.id, joinedAt: Date.now() });
            socket.emit("matchingStatus", { status: "searching", message: "Looking for a match..." });
            const matched = await findMatch(userId);
            if (!matched && waitingUsers.size >= 2) await processMatchingQueue();
            if (waitingUsers.size >= 2) setTimeout(() => processMatchingQueue(), 1000);
        });

        socket.on("leaveMatchingQueue", () => {
            waitingUsers.delete(userId);
            socket.emit("matchingStatus", { status: "idle", message: "Stopped searching for matches" });
        });

        socket.on("webrtc-signal", ({ roomId, signal }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            const targetSocketId = room.participants.find(id => id !== socket.id);
            if (targetSocketId) {
                io.to(targetSocketId).emit("webrtc-signal", { signal, fromUserId: userId, roomId });
            }
        });

        socket.on("joinVideoRoom", ({ roomId, matchId }) => {
            socket.join(roomId);
            const room = rooms.get(roomId);
            if (room) {
                room.participants.push(socket.id);
            } else {
                rooms.set(roomId, { participants: [socket.id], matchId, createdAt: Date.now() });
            }
            io.to(roomId).emit("roomReady", { roomId, matchId, participants: rooms.get(roomId)?.participants.length });
        });

        socket.on("leaveVideoRoom", async ({ roomId, matchId }) => {
            socket.leave(roomId);
            const room = rooms.get(roomId);
            if (!room) return;
            room.participants = room.participants.filter(id => id !== socket.id);
            if (room.participants.length === 0) {
                rooms.delete(roomId);
                if (matchId) {
                    try {
                        await query("SELECT end_match($1, $2)", [matchId, userId]);
                    } catch (e) {
                        console.error("Error ending match", e);
                    }
                }
            } else {
                socket.to(roomId).emit("participantLeft", { userId, roomId });
            }
        });

        socket.on("sendMessage", async ({ matchId, content, messageType = "text" }) => {
            try {
                const result = await query(
                    "INSERT INTO messages (match_id, sender_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING *",
                    [matchId, userId, content, messageType]
                );
                const message = result.rows[0];
                const matchResult = await query("SELECT room_id FROM matches WHERE id = $1", [matchId]);
                if (matchResult.rows.length === 0) return;
                const roomId = matchResult.rows[0].room_id;
                io.to(roomId).emit("newMessage", { ...message, senderName: user.name });
            } catch (e) {
                console.error("Error sending message", e);
                socket.emit("messageError", { message: "Failed to send message" });
            }
        });

        socket.on("updateOnlineStatus", async ({ userId: uid, isOnline }) => {
            if (uid !== userId) return;
            await updateOnlineStatus(isOnline);
        });

        socket.on("disconnect", async () => {
            activeUsers.delete(userId);
            waitingUsers.delete(userId);
            await updateOnlineStatus(false);
            // Clean up user from rooms
            for (const [roomId, room] of rooms.entries()) {
                if (room.participants.includes(socket.id)) {
                    room.participants = room.participants.filter(id => id !== socket.id);
                    socket.to(roomId).emit("participantLeft", { userId, roomId });
                    if (room.participants.length === 0) rooms.delete(roomId);
                }
            }
        });

    });

    // Periodic tasks
    setInterval(async () => {
        if (waitingUsers.size >= 2) {
            await processMatchingQueue();
        }
    }, 5000);

    setInterval(() => {
        const now = Date.now();
        const maxWaitTime = 5 * 60 * 1000;
        waitingUsers.forEach((data, userId) => {
            if (now - data.joinedAt > maxWaitTime) {
                waitingUsers.delete(userId);
                emitToUser(userId, "matchingTimeout", { message: "No matches found. Please try again." });
            }
        });
        rooms.forEach((room, roomId) => {
            if (!room.participants.length) rooms.delete(roomId);
        });
    }, 60000);

    return io;
}
