import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { sendSuccess } from "../lib/envelope.js";
import { getBrowserCapabilities } from "../services/capabilityEngine.js";

export const capabilitiesRouter = Router();

capabilitiesRouter.get("/", optionalAuth, (_req, res) => {
  const capabilities = getBrowserCapabilities();
  sendSuccess(res, {
    mode: "browser",
    capabilities,
  });
});

capabilitiesRouter.get("/evaluate", optionalAuth, (_req, res) => {
  const capabilities = getBrowserCapabilities();
  sendSuccess(res, {
    mode: "browser",
    capabilities,
    auditedAt: new Date().toISOString(),
    summary: "Web applications are bounded by the browser sandbox.",
  });
});
