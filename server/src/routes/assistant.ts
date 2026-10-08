import { Router } from "express";
import {
  AssistantMessageRequest,
  EmergencyGuidanceRequest,
  ADVISORY,
} from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { sendError, sendSuccess } from "../lib/envelope.js";
import { redactPii } from "../services/redactor.js";
import { aiProvider } from "../ai/provider.js";
import { checkDailyQuota } from "../services/quota.js";
import { getFallbackGuidance } from "../ai/fallbackGuidance.js";
import { logTransparencyEvent } from "../services/transparencyService.js";

export const assistantRouter = Router();

// Send message to Ask TrustGuard
assistantRouter.post(
  "/messages",
  requireAuth,
  aiLimiter,
  validate({ body: AssistantMessageRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { message, conversationId, scenario } = req.body;

      // 1. Check daily AI message quota
      const quota = await checkDailyQuota(userClient, userId, "ai");
      if (!quota.allowed) {
        return sendError(
          res,
          "AI_QUOTA_EXCEEDED",
          `Daily assistant quota reached (${quota.limit} messages). Please try again tomorrow or use emergency checklists.`,
          429
        );
      }

      // Check user preferences
      const { data: prefs } = await userClient
        .from("user_preferences")
        .select("allow_ai_processing, store_ai_history, ai_retention_days")
        .eq("user_id", userId)
        .maybeSingle();

      const allowAi = Boolean(prefs?.allow_ai_processing);
      const storeAiHistory = Boolean(prefs?.store_ai_history);
      const retentionDays = prefs?.ai_retention_days || 30;

      // 2. Redaction-first pipeline: ALWAYS redact passwords, keys, and PII before AI transmission
      const redaction = redactPii(message);

      let assistantResult;
      let wasFallback = false;

      if (!allowAi) {
        // Return deterministic fallback guidance if user has not granted AI processing consent
        assistantResult = getFallbackGuidance(
          scenario,
          "AI processing consent is disabled in your settings. Showing deterministic safety guidance."
        );
        wasFallback = true;
      } else {
        // Query AI provider with redacted content
        const result = await aiProvider.analyzeSecurityIncident({
          message: redaction.redactedText,
          scenario,
        });
        assistantResult = result.response;
        wasFallback = result.wasFallback;
      }

      // 3. Conversation management
      let currentConvId = conversationId;
      if (storeAiHistory) {
        if (!currentConvId) {
          const expiresAt = new Date(
            Date.now() + retentionDays * 24 * 60 * 60 * 1000
          ).toISOString();

          const { data: newConv } = await userClient
            .from("ai_conversations")
            .insert({
              user_id: userId,
              title: redaction.redactedText.slice(0, 50),
              expires_at: expiresAt,
            })
            .select()
            .single();

          if (newConv) currentConvId = newConv.id;
        }

        if (currentConvId) {
          // Store user message (redacted only!)
          await userClient.from("ai_messages").insert([
            {
              conversation_id: currentConvId,
              user_id: userId,
              role: "user",
              content_redacted: redaction.redactedText,
              risk_level: assistantResult.riskLevel,
              was_fallback: false,
            },
            {
              conversation_id: currentConvId,
              user_id: userId,
              role: "assistant",
              content_redacted: JSON.stringify(assistantResult),
              risk_level: assistantResult.riskLevel,
              was_fallback: wasFallback,
            },
          ]);
        }
      }

      // Record Transparency Event
      await logTransparencyEvent(userClient, {
        userId,
        eventType: "AI_ASSISTANT_CONSULTATION",
        summary: `Incident response advice requested (Scenario: ${scenario}).`,
        dataSentTo: allowAi && !wasFallback ? ["Google Gemini AI (Redacted text only)"] : [],
      });

      sendSuccess(res, {
        conversationId: currentConvId || "ephemeral",
        response: assistantResult,
        wasFallback,
        hadRedactedSecrets: redaction.hadSensitiveSecrets,
        redactedTextSent: redaction.redactedText,
        banner: wasFallback ? ADVISORY.aiUnavailable : undefined,
        chatBanner: ADVISORY.chatBanner,
      });
    } catch (err) {
      next(err);
    }
  }
);

// List active AI conversations
assistantRouter.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;

    const { data, error } = await userClient
      .from("ai_conversations")
      .select("*, ai_messages(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if ((error as any).code === "PGRST205") {
        return sendSuccess(res, []);
      }
      throw error;
    }
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// Delete single conversation
assistantRouter.delete("/conversations/:id", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await userClient
      .from("ai_conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      if ((error as any).code === "PGRST205") {
        return sendSuccess(res, { deleted: true });
      }
      throw error;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});
