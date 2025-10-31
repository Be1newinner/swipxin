// index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import matchingRoutes from "./routes/matching";

import { initializeSocket } from "./socket"; // <-- import your new socket module
import livekitRoutes from "./routes/livekit";

const PORT = 5002;
const FRONTEND_URLS = process.env.FRONTEND_URLS?.split(",");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: FRONTEND_URLS,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_, res) =>
  res.json({
    success: true,
    message: "SwipX Backend is running!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
);

app.use("/api/livekit", livekitRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/matching", matchingRoutes);

const server = createServer(app);

// Initialize Socket.IO and get io instance
initializeSocket(server, FRONTEND_URLS);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✨ SwipX Backend server running on port ${PORT}`);
  console.log(`🌐 Environment: development`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Socket.IO enabled with CORS:`, FRONTEND_URLS);
});
