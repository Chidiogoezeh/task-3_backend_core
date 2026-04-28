import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { status: "error", message: "Too many login attempts, try again later" }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip, // Per user rate limiting
  message: { status: "error", message: "Rate limit exceeded (60 req/min)" }
});