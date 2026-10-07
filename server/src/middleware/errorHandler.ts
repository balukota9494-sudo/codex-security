import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { sendError } from "../lib/envelope.js";
import { hashUserId } from "../lib/hash.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = res.locals.requestId || "unknown-request";
  const userIdHash = hashUserId(req.user?.id);

  // Log error with safe metadata
  logger.error(
    {
      requestId,
      userIdHash,
      path: req.path,
      method: req.method,
      errorName: err?.name || "InternalError",
      errorMessage: err?.message || "Unknown error occurred",
    },
    "Unhandled request exception caught by central handler"
  );

  // Client response: sanitized plain-language error
  const statusCode = err?.status || err?.statusCode || 500;
  const clientMessage =
    statusCode >= 500
      ? "An unexpected system error occurred. Our team has been notified."
      : err?.message || "An error occurred while processing your request.";

  sendError(res, err?.code || "INTERNAL_ERROR", clientMessage, statusCode);
}
