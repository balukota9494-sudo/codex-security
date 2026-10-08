import { Router } from "express";
import { PaginationQuery } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";

export const activityRouter = Router();

// Get transparency activity events & data access matrix
activityRouter.get(
  "/",
  requireAuth,
  validate({ query: PaginationQuery }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { page, pageSize } = req.query as any;

      const offset = (page - 1) * pageSize;
      const { data, count, error } = await userClient
        .from("transparency_events")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        if ((error as any).code === "PGRST205") {
          return sendSuccess(res, {
            events: [],
            total: 0,
            page,
            pageSize,
            totalPages: 1,
            dataAccessMatrix: {
              dataAccessed: [],
              dataNeverAccessed: [
                "Device Camera & Microphone",
                "GPS Location",
                "Personal Files & Photos",
                "Local Keystore / Stored Passwords",
                "Installed Applications List",
                "Background System Processes",
              ],
            },
          });
        }
        throw error;
      }

      // Data Access Matrix summary
      const dataAccessMatrix = {
        dataAccessed: [
          {
            category: "Requested Website/Link Hostname",
            purpose: "To perform DNS, TLS, and defensive header inspection",
            retained: "Only if user has enabled history storage in settings",
          },
          {
            category: "Pasted Text (Masked/Redacted)",
            purpose: "To detect sensitive credentials and PII",
            retained: "Raw text is NEVER saved to database",
          },
        ],
        dataNeverAccessed: [
          "Device Camera & Microphone",
          "GPS Location",
          "Personal Files & Photos",
          "Local Keystore / Stored Passwords",
          "Installed Applications List",
          "Background System Processes",
        ],
      };

      sendSuccess(res, {
        events: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        dataAccessMatrix,
      });
    } catch (err) {
      next(err);
    }
  }
);
