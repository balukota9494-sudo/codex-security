import { Router } from "express";
import { sendSuccess } from "../lib/envelope.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "TrustGuard AI Core",
    version: "1.0.0",
  });
});
