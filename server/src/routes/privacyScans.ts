import { Router } from "express";
import { PrivacyScanRequest, PaginationQuery } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";
import { redactPii } from "../services/redactor.js";
import { aiProvider } from "../ai/provider.js";
import { logTransparencyEvent } from "../services/transparencyService.js";

export const privacyScansRouter = Router();

// Run Privacy Check & Protect My Data Redaction
privacyScansRouter.post(
  "/",
  requireAuth,
  validate({ body: PrivacyScanRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { text, useAiExplanation } = req.body;

      // 1. Detect PII and execute Protect My Data redaction
      const redaction = redactPii(text);

      let status: any = "SAFE_LOOKING";
      if (redaction.hadSensitiveSecrets) {
        status = "CRITICAL_RISK";
      } else if (redaction.totalFindings > 0) {
        status = "CAUTION";
      }

      // Check user preferences
      const { data: prefs } = await userClient
        .from("user_preferences")
        .select("allow_ai_processing, store_history")
        .eq("user_id", userId)
        .maybeSingle();

      const allowAi = Boolean(prefs?.allow_ai_processing);
      const shouldStoreHistory = prefs?.store_history ?? false;

      // 2. Optional AI Explanation (passing ONLY counts & types, NEVER raw text)
      let aiExplanation = null;
      let aiUsed = false;

      if (useAiExplanation && allowAi && redaction.totalFindings > 0) {
        aiExplanation = await aiProvider.explainPrivacyFindings({
          findingsCountByType: redaction.piiCountByType,
          totalFindings: redaction.totalFindings,
        });
        aiUsed = true;
      }

      // 3. Persist metadata only (NO RAW TEXT COLUMN EVER CREATED IN DATABASE)
      let savedScanId: string | null = null;
      if (shouldStoreHistory) {
        const { data: scanRecord, error: scanError } = await userClient
          .from("privacy_scans")
          .insert({
            user_id: userId,
            input_length: text.length,
            finding_count: redaction.totalFindings,
            status,
            ai_used: aiUsed,
          })
          .select()
          .single();

        if (scanError) throw scanError;
        savedScanId = scanRecord.id;

        // Insert masked findings only
        if (redaction.findings.length > 0) {
          const findingsToInsert = redaction.findings.map((f) => ({
            scan_id: scanRecord.id,
            user_id: userId,
            pii_type: f.piiType,
            masked_preview: f.maskedPreview,
            severity: f.severity,
          }));

          await userClient.from("privacy_findings").insert(findingsToInsert);
        }
      }

      // Record Transparency Event
      await logTransparencyEvent(userClient, {
        userId,
        eventType: "PRIVACY_SCAN_REDACTION",
        summary: `Redacted ${redaction.totalFindings} sensitive elements. Raw input was not persisted.`,
        dataSentTo: aiUsed ? ["Google Gemini AI (Masked categories only)"] : [],
      });

      sendSuccess(res, {
        scanId: savedScanId || "ephemeral",
        inputLength: text.length,
        totalFindings: redaction.totalFindings,
        findingsCountByType: redaction.piiCountByType,
        status,
        findings: redaction.findings,
        redactedText: redaction.redactedText,
        aiExplanation,
        aiUsed,
        rawTextStored: false,
        notice: "Protect My Data successfully stripped sensitive tokens. Raw input is never saved to the database.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// List past privacy scans (metadata and masked previews only)
privacyScansRouter.get(
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
        .from("privacy_scans")
        .select("*, privacy_findings(*)", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        if ((error as any).code === "PGRST205") {
          return sendSuccess(res, {
            scans: [],
            total: 0,
            page,
            pageSize,
            totalPages: 1,
          });
        }
        throw error;
      }

      sendSuccess(res, {
        scans: data || [],
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
