import { Router } from "express";
import { DeleteDataRequest } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";
import { createUserDataExport } from "../services/exportService.js";
import { executeUserDeletion } from "../services/deletionService.js";

export const dataRouter = Router();

// Generate expiring data export
dataRouter.post("/export", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;

    const exportResult = await createUserDataExport(userClient, userId);
    sendSuccess(res, exportResult);
  } catch (err) {
    next(err);
  }
});

// Delete user data categories or entire account
dataRouter.delete(
  "/",
  requireAuth,
  validate({ body: DeleteDataRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { categories } = req.body;

      const deletionResult = await executeUserDeletion(userClient, userId, categories);
      sendSuccess(res, {
        message: "Requested data categories have been successfully purged.",
        result: deletionResult,
      });
    } catch (err) {
      next(err);
    }
  }
);
