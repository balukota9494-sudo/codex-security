import {
  type EmergencyScenario,
  type PrivacyExplainerResponse,
  type ReportExplainerResponse,
  type SecurityAssistantResponse,
  type UserMode,
  SecurityAssistantResponse as SecurityAssistantZod,
  ReportExplainerResponse as ReportExplainerZod,
  PrivacyExplainerResponse as PrivacyExplainerZod,
} from "@trustguard/shared";
import { generateStructured } from "./geminiClient.js";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompts/assistantSystemPrompt.js";
import {
  REPORT_EXPLAINER_PROMPT,
  REPORT_EXPLAINER_JSON_SCHEMA,
} from "./prompts/reportExplainer.js";
import {
  PRIVACY_EXPLAINER_PROMPT,
  PRIVACY_EXPLAINER_JSON_SCHEMA,
} from "./prompts/privacyExplainer.js";
import { filterAiOutput } from "./outputFilter.js";
import { getFallbackGuidance } from "./fallbackGuidance.js";
import { logger } from "../lib/logger.js";

export interface AnalyzeIncidentInput {
  message: string;
  scenario?: EmergencyScenario;
  userMode?: UserMode;
  conversationHistory?: string;
}

export interface ExplainPrivacyInput {
  findingsCountByType: Record<string, number>;
  totalFindings: number;
}

export interface ExplainReportInput {
  sanitizedFindingsJson: string;
}

export interface AiProvider {
  analyzeSecurityIncident(input: AnalyzeIncidentInput): Promise<{
    response: SecurityAssistantResponse;
    wasFallback: boolean;
  }>;
  explainPrivacyFindings(input: ExplainPrivacyInput): Promise<PrivacyExplainerResponse>;
  explainWebsiteReport(input: ExplainReportInput): Promise<ReportExplainerResponse>;
}

export class GeminiProvider implements AiProvider {
  async analyzeSecurityIncident(input: AnalyzeIncidentInput): Promise<{
    response: SecurityAssistantResponse;
    wasFallback: boolean;
  }> {
    const userPrompt = `Context:
- user_mode: ${input.userMode || "standard"}
- scenario_hint: ${input.scenario || "none"}
- conversation_summary_redacted: ${input.conversationHistory || "none"}

<user_input>
${input.message}
</user_input>

Respond with JSON only.`;

    const jsonSchema = {
      type: "object",
      properties: {
        riskLevel: {
          type: "string",
          enum: ["low", "medium", "high", "critical", "unknown"],
        },
        summary: { type: "string" },
        immediateSteps: { type: "array", items: { type: "string" } },
        avoidActions: { type: "array", items: { type: "string" } },
        nextSteps: { type: "array", items: { type: "string" } },
        escalationRequired: { type: "boolean" },
        limitations: { type: "array", items: { type: "string" } },
        confidence: { type: "number" },
      },
      required: [
        "riskLevel",
        "summary",
        "immediateSteps",
        "avoidActions",
        "nextSteps",
        "escalationRequired",
        "limitations",
        "confidence",
      ],
    };

    try {
      const rawResult = await generateStructured<SecurityAssistantResponse>({
        systemInstruction: ASSISTANT_SYSTEM_PROMPT,
        userContent: userPrompt,
        jsonSchema,
        zodSchema: SecurityAssistantZod,
      });

      const sanitizedResult = filterAiOutput(rawResult);
      return { response: sanitizedResult, wasFallback: false };
    } catch (err: any) {
      logger.warn({ err: err.message }, "AI generation failed, using deterministic fallback guidance");
      const fallback = getFallbackGuidance(input.scenario || "none");
      return { response: fallback, wasFallback: true };
    }
  }

  async explainPrivacyFindings(input: ExplainPrivacyInput): Promise<PrivacyExplainerResponse> {
    const userPrompt = `Findings detected:
${JSON.stringify(input.findingsCountByType, null, 2)}
Total items: ${input.totalFindings}

Respond with JSON only.`;

    try {
      return await generateStructured<PrivacyExplainerResponse>({
        systemInstruction: PRIVACY_EXPLAINER_PROMPT,
        userContent: userPrompt,
        jsonSchema: PRIVACY_EXPLAINER_JSON_SCHEMA,
        zodSchema: PrivacyExplainerZod,
      });
    } catch (err: any) {
      logger.warn({ err: err.message }, "Privacy explainer AI failed; returning standard explanation");
      return {
        overview:
          "Certain kinds of personal information like contact details, payment information, or keys can be misused if posted publicly.",
        perType: Object.entries(input.findingsCountByType).map(([type, count]) => ({
          piiType: type,
          risk: `Sharing ${type} (${count} found) exposes sensitive details to unauthorized scraping or identity impersonation.`,
          advice: "Remove or mask these details before sharing or pasting text into public forums.",
        })),
        limitations: [
          "Automated detection focuses on predefined syntax patterns.",
          "Context and implied sensitivity cannot be verified without deeper human review.",
        ],
      };
    }
  }

  async explainWebsiteReport(input: ExplainReportInput): Promise<ReportExplainerResponse> {
    const userPrompt = `<findings>${input.sanitizedFindingsJson}</findings>

Respond with JSON only.`;

    try {
      return await generateStructured<ReportExplainerResponse>({
        systemInstruction: REPORT_EXPLAINER_PROMPT,
        userContent: userPrompt,
        jsonSchema: REPORT_EXPLAINER_JSON_SCHEMA,
        zodSchema: ReportExplainerZod,
      });
    } catch (err: any) {
      logger.warn({ err: err.message }, "Report explainer AI failed; returning template");
      return {
        whatWasChecked: "Passive security checks: domain structure, certificate, and defensive headers.",
        whatWasFound: "Findings compiled from direct network and protocol observations.",
        whyItMatters: "Web security standards help protect against eavesdropping and domain spoofing.",
        whatToDo: [
          "Check the browser address bar to verify the domain name matches expectations.",
          "Avoid entering sensitive credentials if warnings or mismatches are present.",
        ],
        whatCouldNotBeChecked: [
          "Server backend security and internal database configurations.",
        ],
        technicalSummary: "Automated passive check evaluation.",
      };
    }
  }
}

export const aiProvider: AiProvider = new GeminiProvider();
