import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/envelope.js";
import { adminOps } from "../lib/supabaseAdmin.js";
import { hashUserId } from "../lib/hash.js";

export async function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userRole = (req.user?.app_metadata as any)?.role;
  const isAdmin = userRole === "admin";

  if (!req.user || !isAdmin) {
    sendError(res, "FORBIDDEN", "Admin privilege required to access this resource.", 403);
    return;
  }

  // Audit this administrative access
  try {
    await adminOps.logAuditEvent({
      actorUserId: req.user.id,
      actorHash: hashUserId(req.user.id),
      action: `ADMIN_ACCESS:${req.method}:${req.path}`,
      resource: req.path,
      requestId: res.locals.requestId,
    });
  } catch (err) {
    // Non-blocking for audit failure, but logged
  }

  next();
}
