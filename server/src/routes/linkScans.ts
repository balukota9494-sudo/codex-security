import { Router } from "express";
import { LinkScanRequest, PaginationQuery, ADVISORY } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { scanLimiter } from "../middleware/rateLimit.js";
import { sendError, sendSuccess } from "../lib/envelope.js";
import { analyzeUrl, sanitizeUrlForStorage } from "../services/urlAnalyzer.js";
import { inspectTls } from "../services/tlsInspector.js";
import { logTransparencyEvent } from "../services/transparencyService.js";

export const linkScansRouter = Router();

// Analyze link defensively without opening or executing it
linkScansRouter.post(
  "/",
  requireAuth,
  scanLimiter,
  validate({ body: LinkScanRequest }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { url, sourceApp } = req.body;

      // 1. Analyze URL structure defensively
      const urlAnalysis = analyzeUrl(url);

      // 2. Passively inspect TLS of hostname
      const tlsResult = await inspectTls(urlAnalysis.hostname);

      // Indicators array
      const indicators: Array<{ title: string; risk: "low" | "medium" | "high"; explanation: string }> = [];

      if (urlAnalysis.isShortener) {
        indicators.push({
          title: "Obfuscated Destination",
          risk: "medium",
          explanation: `Received via ${sourceApp}. The link uses a shortener service (${urlAnalysis.hostname}) that masks where the user is being directed.`,
        });
      }

      if (urlAnalysis.isLookalike) {
        indicators.push({
          title: "Brand Impersonation / Typosquatting",
          risk: "high",
          explanation: `The domain mimics "${urlAnalysis.lookalikeBrandTarget}". Attackers use lookalikes in messaging apps (${sourceApp}) to steal credentials.`,
        });
      }

      if (!urlAnalysis.isHttps) {
        indicators.push({
          title: "Insecure Protocol (HTTP)",
          risk: "high",
          explanation: "The link directs to an unencrypted address.",
        });
      }

      if (urlAnalysis.isPunycode || urlAnalysis.hasMixedScript) {
        indicators.push({
          title: "Homograph Character Spoofing",
          risk: "high",
          explanation: "The address utilizes internationalized characters to resemble familiar Latin letters.",
        });
      }

      // Compute status
      let status: any = "SAFE_LOOKING";
      if (indicators.some((i) => i.risk === "high")) {
        status = "HIGH_RISK";
      } else if (indicators.some((i) => i.risk === "medium")) {
        status = "CAUTION";
      } else if (!tlsResult.hasTls) {
        status = "UNKNOWN";
      }

      const report = {
        whatWasChecked: `Defensive link inspection of ${urlAnalysis.hostname} received from ${sourceApp}. We never open the link for you.`,
        whatWasFound: indicators.length > 0
          ? `${indicators.length} warning indicators detected: ${indicators.map((i) => i.title).join(", ")}.`
          : "No immediate structural lookalike or link obfuscation indicators found.",
        whyItMatters: "Links shared across messaging and social platforms are the primary delivery channel for phishing attacks.",
        whatTheUserShouldDo: [
          "Never enter passwords or verification codes after following links from messages.",
          "Verify unexpected messages directly with the sender via a voice call or alternative channel.",
          "Navigate to the official service website manually instead of clicking.",
        ],
        whatCouldNotBeChecked: [
          "Page body content (TrustGuard does not open external links on your behalf).",
          "Dynamic malware payloads hidden behind redirects.",
        ],
        confidenceLevel: 0.8,
        dataSourcesUsed: ["WHATWG Parser", "Domain Distance Heuristics", "TLS Handshake"],
        limitations: [
          "Defensive link analysis only.",
          "Does not fetch destination page or execute scripts.",
        ],
        automatedCheckDisclaimer: ADVISORY.noGuarantee,
        technicalSummary: `Source App: ${sourceApp} | Protocol: ${urlAnalysis.protocol} | Indicators: ${indicators.length}`,
      };

      // Check if user preferences allow history storage
      const { data: prefs } = await userClient
        .from("user_preferences")
        .select("store_history")
        .eq("user_id", userId)
        .maybeSingle();

      let savedId: string | null = null;
      if (prefs?.store_history) {
        const { data: savedLink } = await userClient
          .from("link_scans")
          .insert({
            user_id: userId,
            source_app: sourceApp,
            attempted_url_safe: urlAnalysis.safeUrl,
            hostname: urlAnalysis.hostname,
            status,
            indicators,
            report,
            is_demo: false,
          })
          .select()
          .single();
        savedId = savedLink?.id ?? null;
      }

      // Log transparency
      await logTransparencyEvent(userClient, {
        userId,
        eventType: "LINK_DEFENSIVE_CHECK",
        summary: `Passive link analysis for ${urlAnalysis.hostname} (${sourceApp})`,
        dataSentTo: [],
      });

      sendSuccess(res, {
        scanId: savedId || "ephemeral",
        url: urlAnalysis.safeUrl,
        hostname: urlAnalysis.hostname,
        sourceApp,
        status,
        indicators,
        report,
        neverOpenedNotice: "TrustGuard AI inspected this link defensively and never opened the destination address for you.",
        checkedAt: new Date().toISOString(),
      }, 201);
    } catch (err) {
      next(err);
    }
  }
);

// List link checks
linkScansRouter.get(
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
        .from("link_scans")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_demo", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

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
