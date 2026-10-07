import rateLimit from "express-rate-limit";
import { LIMITS } from "@trustguard/shared";
import { sendError } from "../lib/envelope.js";

// Standard IP rate limiter
export const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: LIMITS.ipRateLimitPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests from this address. Please wait a minute before retrying.",
      429
    );
  },
});

// Stricter rate limiter for resource-intensive scanning endpoints
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: LIMITS.scansPerUserPerMinute,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || "anonymous";
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      "SCAN_RATE_LIMIT",
      "Scan request rate limit exceeded. Please wait a moment before starting another check.",
      429
    );
  },
});

// Rate limiter for AI assistant calls
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || "anonymous";
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      "AI_RATE_LIMIT",
      "Assistant rate limit reached. Please wait a moment before sending another message.",
      429
    );
  },
});
