import type { Request, Response, NextFunction } from "express";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createUserClient } from "../lib/supabaseBrowserless.js";
import { sendError } from "../lib/envelope.js";
import { supabaseAdminClient } from "../lib/supabaseAdmin.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userClient?: SupabaseClient;
      jwtToken?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "UNAUTHORIZED", "Authentication token is required.", 401);
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    sendError(res, "UNAUTHORIZED", "Invalid token format.", 401);
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdminClient.auth.getUser(token);

    if (error || !user) {
      sendError(res, "UNAUTHORIZED", "Invalid or expired session.", 401);
      return;
    }

    req.user = user;
    req.jwtToken = token;
    req.userClient = createUserClient(token);
    res.locals.userId = user.id;

    next();
  } catch (err) {
    sendError(res, "AUTH_ERROR", "Authentication verification failed.", 401);
  }
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) return next();

  supabaseAdminClient.auth
    .getUser(token)
    .then(({ data: { user }, error }) => {
      if (!error && user) {
        req.user = user;
        req.jwtToken = token;
        req.userClient = createUserClient(token);
        res.locals.userId = user.id;
      }
      next();
    })
    .catch(() => next());
}
