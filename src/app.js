import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes.js";
import { globalErrorHandler } from "./middleware/error.handler.js";
import { versionMiddleware } from "./middleware/version.middleware.js";
import { protect } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import passport from "./config/passport.js";
import cookieParser from "cookie-parser";
import { logger } from "./middleware/logger.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();
app.use(cors({
  origin: true, // Allows the CLI (which has no 'Origin' header) and Web Portal
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());

app.use(cookieParser()); // for Web Portal HTTP-only cookies
app.use(logger);

app.use("/api", apiLimiter);
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api", versionMiddleware);
app.use("/api/profiles", protect, profileRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use(globalErrorHandler);

export default app;
