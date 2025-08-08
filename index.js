import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from './Routes/user.route.js';
import PostRoute from './Routes/post.route.js';
import MessageRoute from './Routes/message.route.js';
import { app, server } from "./socket/socket.js"; // Make sure this app === express()

dotenv.config();

const port = process.env.PORT || 8000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "I'm coming from backend",
    success: true,
  });
});

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", PostRoute);
app.use("/api/v1/message", MessageRoute);

// Start server
server.listen(port, () => {
  connectDB();
  console.log(`🚀 Server running at http://localhost:${port}`);
});
