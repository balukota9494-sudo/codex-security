import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { sendSuccess } from "../lib/envelope.js";
import { getBrowserCapabilities } from "../services/capabilityEngine.js";
import { calculateSecurityVisibility } from "../services/visibility.js";

export const blindSpotsRouter = Router();

blindSpotsRouter.get("/", optionalAuth, (_req, res) => {
  const capabilities = getBrowserCapabilities();
  const visibility = calculateSecurityVisibility();

  // Filter items where status is not fully available
  const blindSpots = capabilities.filter((c) => c.status !== "available");

  sendSuccess(res, {
    visibility,
    blindSpots,
    mode: "browser",
    platformHonestyNotice:
      "Web applications run in an isolated sandbox. TRUSTGUARD AI reports only what can be genuinely verified, and never fabricates device security, installed apps, or background processes.",
  });
});
