import { Router } from "express";
import {
  WebsiteScanRequest,
  PaginationQuery,
} from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { scanLimiter } from "../middleware/rateLimit.js";
import { sendError, sendSuccess } from "../lib/envelope.js";
import { analyzeUrl, sanitizeUrlForStorage } from "../services/urlAnalyzer.js";
import { safeFetch } from "../services/safeFetch.js";
import { inspectTls } from "../services/tlsInspector.js";
import { analyzeHeaders } from "../services/headerAnalyzer.js";
import { extractHtmlSignals } from "../services/htmlSignalExtractor.js";
import { checkReputation } from "../services/reputationProvider.js";
import { buildWebsiteReport } from "../services/reportBuilder.js";
import { createSecurityAlert } from "../services/alertService.js";
import { logTransparencyEvent } from "../services/transparencyService.js";
import { checkDailyQuota } from "../services/quota.js";

export const websiteScansRouter = Router();

// Run website scan
websiteScansRouter.post(
  "/",
  requireAuth,
  scanLimiter,
  validate({ body: WebsiteScanRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { url } = req.body;

      // Check daily scan quota
      const quota = await checkDailyQuota(userClient, userId, "scans");
      if (!quota.allowed) {
        return sendError(
          res,
          "QUOTA_EXCEEDED",
          `Daily scan quota reached (${quota.limit} checks per day). Resets at midnight.`,
          429
        );
      }

      // Check user preference for reputation lookups
      const { data: prefs } = await userClient
        .from("user_preferences")
        .select("allow_reputation_lookup, store_history")
        .eq("user_id", userId)
        .maybeSingle();

      const allowReputation = Boolean(prefs?.allow_reputation_lookup);
      const shouldStoreHistory = prefs?.store_history ?? false;

      // 1. Analyze URL structure & heuristics
      const urlAnalysis = analyzeUrl(url);

      // 2. Perform SSRF-hardened fetch
      const fetchResult = await safeFetch(url, {
        followRedirects: false, // Default: do not follow redirects blindly
      });

      // 3. Inspect TLS if port 443 available
      const tlsResult = await inspectTls(urlAnalysis.hostname);

      // 4. Analyze defensive headers
      const headerResult = analyzeHeaders(fetchResult.headers);

      // 5. Extract observable HTML signals
      const htmlSignals = extractHtmlSignals(
        fetchResult.bodySnippet,
        urlAnalysis.isHttps
      );

      // 6. External reputation check (consent-gated)
      const reputationResult = await checkReputation(
        urlAnalysis.safeUrl,
        allowReputation
      );

      // 7. Compose 9-Element Report with honesty guards
      const reportData = buildWebsiteReport({
        urlAnalysis,
        fetchResult,
        tlsResult,
        headerResult,
        htmlSignals,
        reputationResult,
      });

      // 8. Persist scan if history storage is enabled
      let scanRecord: any = null;
      if (shouldStoreHistory) {
        const insertPayload = {
          user_id: userId,
          attempted_url_safe: urlAnalysis.safeUrl,
          final_url_safe: sanitizeUrlForStorage(fetchResult.finalUrl),
          hostname: urlAnalysis.hostname,
          state: "completed" as const,
          status: reportData.status,
          assessment: reportData.assessment,
          confidence: reportData.confidence,
          failure_category: reportData.failureCategory || null,
          report: reportData.nineElementReport,
          sources: reportData.sources,
          limitations: reportData.limitations,
          is_demo: false,
        };

        const { data: savedScan, error: scanInsertError } = await userClient
          .from("website_scans")
          .insert(insertPayload)
          .select()
          .single();

        if (scanInsertError) {
          throw scanInsertError;
        }
        scanRecord = savedScan;

        // Insert findings
        if (reportData.findings.length > 0) {
          const findingsToInsert = reportData.findings.map((f) => ({
            scan_id: savedScan.id,
            user_id: userId,
            check_key: f.check_key,
            category: f.category,
            severity: f.severity,
            capability: f.capability,
            title: f.title,
            plain_explanation: f.plain_explanation,
            technical_details: f.technical_details,
          }));

          await userClient.from("website_findings").insert(findingsToInsert);
        }

        // Trigger alert if high risk or critical
        if (["HIGH_RISK", "CRITICAL_RISK"].includes(reportData.status)) {
          await createSecurityAlert(userClient, {
            userId,
            eventType: "SUSPICIOUS_WEBSITE_DETECTED",
            severity: reportData.status === "CRITICAL_RISK" ? "critical" : "high",
            whatHappened: `Checked suspicious website: ${urlAnalysis.hostname}`,
            whyItMatters: reportData.nineElementReport.whyItMatters,
            whatToDo: reportData.nineElementReport.whatTheUserShouldDo,
            source: "WEBSITE_CHECKER",
            relatedScanId: savedScan.id,
          });
        }
      }

      // Record Transparency Event
      const dataSent = [urlAnalysis.hostname];
      if (reputationResult.checked) {
        dataSent.push("Google Safe Browsing");
      }

      await logTransparencyEvent(userClient, {
        userId,
        eventType: "WEBSITE_PASSIVE_CHECK",
        summary: `Passive security scan of ${urlAnalysis.hostname}`,
        dataSentTo: dataSent,
      });

      sendSuccess(res, {
        scanId: scanRecord?.id || "ephemeral",
        url: urlAnalysis.safeUrl,
        hostname: urlAnalysis.hostname,
        status: reportData.status,
        assessment: reportData.assessment,
        confidence: reportData.confidence,
        report: reportData.nineElementReport,
        findings: reportData.findings,
        sources: reportData.sources,
        limitations: reportData.limitations,
        historyStored: shouldStoreHistory,
        checkedAt: new Date().toISOString(),
      }, 201);
    } catch (err) {
      next(err);
    }
  }
);

// List past scans
websiteScansRouter.get(
  "/",
  requireAuth,
  validate({ query: PaginationQuery }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { page, pageSize, q, status } = req.query as any;

      let query = userClient
        .from("website_scans")
        .select("*, website_findings(*)", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_demo", false);

      if (status) {
        query = query.eq("status", status);
      }
      if (q) {
        query = query.ilike("hostname", `%${q}%`);
      }

      const offset = (page - 1) * pageSize;
      const { data, count, error } = await query
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

// Get single scan
websiteScansRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: scan, error } = await userClient
      .from("website_scans")
      .select("*, website_findings(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if ((error as any).code === "PGRST205") {
        return sendError(res, "NOT_FOUND", "Scan report not found.", 404);
      }
      throw error;
    }
    if (!scan) {
      return sendError(res, "NOT_FOUND", "Scan report not found.", 404);
    }

    sendSuccess(res, scan);
  } catch (err) {
    next(err);
  }
});

// Delete single scan
websiteScansRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await userClient
      .from("website_scans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});
