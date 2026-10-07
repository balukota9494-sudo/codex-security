import crypto from "node:crypto";
import { env } from "../config/env.js";

/**
 * Returns a salted HMAC-SHA256 hex digest for user identifiers.
 * Ensures audit logging and debug metrics never persist identifiable raw user IDs.
 */
export function hashUserId(userId?: string | null): string {
  if (!userId) return "anonymous";
  return crypto
    .createHmac("sha256", env.LOG_HASH_SALT)
    .update(userId)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Generates an SHA-256 fingerprint for deduplication (e.g. alerts or idempotency).
 */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
