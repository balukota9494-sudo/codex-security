import { Router } from "express";
import { EmergencyGuidanceRequest, ADVISORY } from "@trustguard/shared";
import { optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess, sendError } from "../lib/envelope.js";
import { DETERMINISTIC_SCENARIOS, getFallbackGuidance } from "../ai/fallbackGuidance.js";
import { redactPii } from "../services/redactor.js";
import { aiProvider } from "../ai/provider.js";
import { logTransparencyEvent } from "../services/transparencyService.js";

export const emergencyRouter = Router();

// List all deterministic emergency scenarios
emergencyRouter.get("/scenarios", (_req, res) => {
  const scenarios = Object.entries(DETERMINISTIC_SCENARIOS)
    .filter(([id]) => id !== "none")
    .map(([id, data]) => ({
      id,
      title: data.title,
      summary: data.summary,
      escalationRequired: data.escalationRequired,
    }));
  sendSuccess(res, scenarios);
});

// Get specific scenario checklist
emergencyRouter.get("/scenarios/:id", (req, res) => {
  const { id } = req.params;
  const ALIASES: Record<string, keyof typeof DETERMINISTIC_SCENARIOS> = {
    "compromised-account": "gave_password",
    "stolen-device": "device_strange",
    "phishing-clicked": "clicked_link",
  };
  const scenarioKey = (ALIASES[id] || id) as keyof typeof DETERMINISTIC_SCENARIOS;
  const scenarioData = DETERMINISTIC_SCENARIOS[scenarioKey];
  if (!scenarioData || id === "none") {
    return sendError(res, "NOT_FOUND", `Emergency scenario '${id}' not found.`, 404);
  }
  sendSuccess(res, {
    id,
    title: scenarioData.title,
    summary: scenarioData.summary,
    checklist: scenarioData.immediateSteps,
    immediateActions: scenarioData.immediateSteps,
    avoidActions: scenarioData.avoidActions,
    nextSteps: scenarioData.nextSteps,
    escalationRequired: scenarioData.escalationRequired,
  });
});

// Get emergency scenario guidance (Instant deterministic checklist + optional AI follow-up)
emergencyRouter.post(
  "/guidance",
  optionalAuth,
  validate({ body: EmergencyGuidanceRequest }),
  async (req, res, next) => {
    try {
      const { scenario, notes } = req.body;
      const scenarioKey = scenario as keyof typeof DETERMINISTIC_SCENARIOS;
      const scenarioData = DETERMINISTIC_SCENARIOS[scenarioKey] || DETERMINISTIC_SCENARIOS.none;

      let aiFollowup = null;
      let wasFallback = true;

      // If user provided notes and is authenticated with AI allowed, attempt AI analysis
      if (notes && req.userClient && req.user) {
        const { data: prefs } = await req.userClient
          .from("user_preferences")
          .select("allow_ai_processing")
          .eq("user_id", req.user.id)
          .maybeSingle();

        if (prefs?.allow_ai_processing) {
          const redaction = redactPii(notes);
          const aiResult = await aiProvider.analyzeSecurityIncident({
            message: redaction.redactedText,
            scenario,
          });
          aiFollowup = aiResult.response;
          wasFallback = aiResult.wasFallback;

          await logTransparencyEvent(req.userClient, {
            userId: req.user.id,
            eventType: "EMERGENCY_GUIDANCE_REQUEST",
            summary: `Emergency guidance for scenario: ${scenario}`,
            dataSentTo: wasFallback ? [] : ["Google Gemini AI (Redacted notes only)"],
          });
        }
      }

      sendSuccess(res, {
        scenario,
        title: scenarioData.title,
        deterministicChecklist: {
          summary: scenarioData.summary,
          immediateSteps: scenarioData.immediateSteps,
          avoidActions: scenarioData.avoidActions,
          nextSteps: scenarioData.nextSteps,
          escalationRequired: scenarioData.escalationRequired,
        },
        aiFollowup,
        disclaimer: ADVISORY.disclaimerShort,
        officialChannelNotice:
          "Always verify contact information on the back of your official payment card or from official apps.",
      });
    } catch (err) {
      next(err);
    }
  }
);
