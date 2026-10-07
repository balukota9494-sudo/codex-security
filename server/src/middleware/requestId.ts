import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.locals.requestId = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}
