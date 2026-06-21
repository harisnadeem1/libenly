// server.js
const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const { Server } = require("socket.io");
const { releaseExpiredLocks } = require("./src/utils/lockCleanup");

dotenv.config();

// Cron jobs
require("./src/cron/dailyJob");
require("./src/cron/notificationJob");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Allowed origins (SAFE DEV + FUTURE READY)
const allowedOrigins = [
  "http://localhost:5173"
  // later add:
  // "https://your-frontend-domain.com"
];

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow server-to-server / mobile apps / postman
      if (!origin) return callback(null, true);

      // Allow localhost during development
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true); // TEMP SAFE MODE (won't block frontend later)
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// Global access for controllers
global.io = io;

// Auto-release expired locks
setInterval(releaseExpiredLocks, 2 * 60 * 1000);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join_chat", (roomId) => {
    socket.join(roomId);
    console.log(`✅ Socket ${socket.id} joined ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// Start server (Render compatible)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});