import { Router } from "express";
import { AlertPatch, PaginationQuery } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../lib/envelope.js";

export const alertsRouter = Router();

// List user alerts
alertsRouter.get(
  "/",
  requireAuth,
  validate({ query: PaginationQuery }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { page, pageSize, status } = req.query as any;

      let query = userClient
        .from("security_alerts")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_demo", false);

      if (status) {
        query = query.eq("state", status);
      }

      const offset = (page - 1) * pageSize;
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        if ((error as any).code === "PGRST205") {
          return sendSuccess(res, {
            alerts: [],
            total: 0,
            page,
            pageSize,
            totalPages: 1,
          });
        }
        throw error;
      }

      sendSuccess(res, {
        alerts: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      });
    } catch (err) {
      next(err);
    }
  }
);

// Update alert state (dismiss or resolve)
alertsRouter.patch(
  "/:id",
  requireAuth,
  validate({ body: AlertPatch }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { id } = req.params;
      const { state } = req.body;

      const { data, error } = await userClient
        .from("security_alerts")
        .update({ state, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if ((error as any).code === "PGRST205") {
          return sendSuccess(res, { id, state, updated_at: new Date().toISOString() });
        }
        throw error;
      }
      if (!data) {
        return sendError(res, "NOT_FOUND", "Alert not found.", 404);
      }

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
);
