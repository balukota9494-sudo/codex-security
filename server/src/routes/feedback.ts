import { Router } from "express";
import { FeedbackRequest } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";
import { redactPii } from "../services/redactor.js";

export const feedbackRouter = Router();

feedbackRouter.post(
  "/",
  requireAuth,
  validate({ body: FeedbackRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { category, message } = req.body;

      // Always redact feedback messages prior to saving
      const redaction = redactPii(message);

      const { data, error } = await userClient
        .from("user_feedback")
        .insert({
          user_id: userId,
          category,
          message_redacted: redaction.redactedText,
        })
        .select()
        .single();

      if (error) throw error;

      sendSuccess(res, {
        message: "Thank you for your feedback. We appreciate your contribution to safety and privacy.",
        feedbackId: data.id,
      });
    } catch (err) {
      next(err);
    }
  }
);
