import express from "express";
import authRoutes from "./authRoutes";
import fileRoutes from "./fileRoutes";
import aiRoutes from "./aiRoutes";
import { logRequest } from "../utils/logger"; // Logging utility
import { rateLimitMiddleware } from "../middlewares/rateLimiter"; // Rate limiting middleware
import { validateRequest } from "../middlewares/validation"; // Request validation middleware
import { errorHandler } from "../middlewares/errorHandler"; // Centralized error handler middleware

const router = express.Router();

// Middleware to log incoming requests
router.use(logRequest);

// Apply rate limiting for all routes
router.use(rateLimitMiddleware);

// **API Root Route**
router.get("/", (req, res) => {
  res.json({
    message: "Teralynk API is working!",
    status: "success",
  });
});

// **Authentication Routes**
router.use("/auth", authRoutes);

// **File Management Routes**
router.use("/files", fileRoutes);

// **AI Integration Routes**
router.use("/ai", aiRoutes);

// **Catch-All Route for Unmatched Requests**
router.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    status: "error",
  });
});

// **Global Error Handling Middleware**
router.use(errorHandler); // Added a centralized error handler middleware

export default router;
