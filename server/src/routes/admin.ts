import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { sendSuccess } from "../lib/envelope.js";
import { adminOps } from "../lib/supabaseAdmin.js";

export const adminRouter = Router();

adminRouter.get("/aggregates", requireAuth, adminOnly, async (_req, res, next) => {
  try {
    const [scanAggregates, alertAggregates] = await Promise.all([
      adminOps.getScanAggregates(),
      adminOps.getAlertAggregates(),
    ]);

    sendSuccess(res, {
      anonymizedMetrics: {
        scanAggregates,
        alertAggregates,
      },
      notice: "Admin metrics contain anonymized aggregates only. No individual scans or user identifiers are exposed.",
    });
  } catch (err) {
    next(err);
  }
});
