import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import fileUpload from "express-fileupload";
import axios from "axios";

// Import middleware
import { authenticateToken, requireSupportAgent } from "./middleware/auth.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

// Import routes
import ticketRoutes from "./routes/ticket.routes.js";
import faqRoutes from "./routes/FAQ.routes.js";
import flagRoutes from "./routes/flag.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import reviewRoutes from "./routes/review.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.CLIENT_URL, 
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5000";
const COMMUNICATION_SERVICE_URL = process.env.COMMUNICATION_SERVICE_URL || "http://localhost:5002";
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || "http://localhost:5004";

// Helper function to make authenticated requests to other services
const makeAuthenticatedRequest = async (url, authHeader) => {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error.message);
    throw error;
  }
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }
}));

// Make services available to routes
app.use((req, res, next) => {
  req.io = io;
  req.services = {
    userService: USER_SERVICE_URL,
    communicationService: COMMUNICATION_SERVICE_URL,
    analysisService: ANALYSIS_SERVICE_URL,
    makeAuthenticatedRequest: (url) => makeAuthenticatedRequest(url, req.headers.authorization)
  };
  next();
});

// WebSocket for real-time updates
io.on("connection", (socket) => {
  console.log("Support service WebSocket client connected");
  
  socket.on("join_support_room", (agentUsername) => {
    socket.join(`support_${agentUsername}`);
    console.log(`Agent ${agentUsername} joined support room`);
  });

  socket.on("disconnect", () => {
    console.log("Support service WebSocket client disconnected");
  });
});

// Public routes
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    service: "support-service",
    timestamp: new Date().toISOString()
  });
});

// Main protected routes
app.use("/api/support/tickets", authenticateToken, requireSupportAgent, ticketRoutes);
app.use("/api/support/faqs", faqRoutes);
app.use("/api/support/flagged-content", authenticateToken, requireSupportAgent, flagRoutes);
app.use("/api/support/activity", authenticateToken, requireSupportAgent, activityRoutes);
app.use("/api/support/reviews", authenticateToken, requireSupportAgent, reviewRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`🎯 Support service running on port ${PORT}`);
});

export { io };