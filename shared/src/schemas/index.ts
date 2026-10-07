import { z } from "zod";

export const AssessmentStatus = z.enum([
  "SAFE_LOOKING",
  "LOW_RISK",
  "CAUTION",
  "HIGH_RISK",
  "CRITICAL_RISK",
  "UNKNOWN",
  "UNABLE_TO_VERIFY",
  "NOT_CHECKED",
  "DEMO_DATA",
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatus>;

export const CapabilityStatus = z.enum(["available", "limited", "unavailable", "unknown"]);
export type CapabilityStatus = z.infer<typeof CapabilityStatus>;

export const Severity = z.enum(["info", "low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof Severity>;

export const AlertState = z.enum(["open", "dismissed", "resolved"]);
export type AlertState = z.infer<typeof AlertState>;

export const ScanState = z.enum(["queued", "running", "completed", "failed", "blocked"]);
export type ScanState = z.infer<typeof ScanState>;

export const UserMode = z.enum(["standard", "simple", "teen"]);
export type UserMode = z.infer<typeof UserMode>;

export const ThemeMode = z.enum(["system", "light", "dark", "high_contrast", "colorblind"]);
export type ThemeMode = z.infer<typeof ThemeMode>;

export const TextSize = z.enum(["small", "medium", "large", "xlarge"]);
export type TextSize = z.infer<typeof TextSize>;

export const ThreatCategory = z.enum([
  "PHISHING",
  "MALWARE_REPUTATION",
  "SUSPICIOUS_REDIRECT",
  "LOOKALIKE_DOMAIN",
  "URL_SHORTENER",
  "TLS_ISSUE",
  "MISSING_SECURITY_HEADERS",
  "PRIVACY_EXPOSURE",
  "CREDENTIAL_EXPOSURE",
  "SOCIAL_ENGINEERING",
  "ACCOUNT_COMPROMISE",
  "DEVICE_POSTURE",
  "CONFIGURATION_ISSUE",
  "SCAN_INCOMPLETE",
]);
export type ThreatCategory = z.infer<typeof ThreatCategory>;

export const PiiCategory = z.enum([
  "EMAIL",
  "PHONE",
  "PERSON_NAME",
  "ADDRESS",
  "FINANCIAL",
  "GOVERNMENT_ID",
  "API_KEY",
  "ACCESS_TOKEN",
  "PASSWORD_LIKE",
  "PRIVATE_KEY",
  "MEDICAL_EDU_SENSITIVE",
]);
export type PiiCategory = z.infer<typeof PiiCategory>;

export const EmergencyScenario = z.enum([
  "clicked_link",
  "gave_password",
  "shared_otp",
  "account_strange",
  "device_strange",
  "unknown_app",
  "financial_exposed",
  "downloaded_suspicious",
  "none",
]);
export type EmergencyScenario = z.infer<typeof EmergencyScenario>;

export const SourceApp = z.enum([
  "whatsapp",
  "sms",
  "email",
  "telegram",
  "instagram",
  "social",
  "browser",
  "other",
]);
export type SourceApp = z.infer<typeof SourceApp>;

export const UrlInput = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .transform((s) => s.normalize("NFC"));

export const WebsiteScanRequest = z
  .object({
    url: UrlInput,
  })
  .strict();
export type WebsiteScanRequest = z.infer<typeof WebsiteScanRequest>;

export const LinkScanRequest = z
  .object({
    url: UrlInput,
    sourceApp: SourceApp,
  })
  .strict();
export type LinkScanRequest = z.infer<typeof LinkScanRequest>;

export const PrivacyScanRequest = z
  .object({
    text: z.string().min(1, "Text is required").max(20000, "Maximum 20,000 characters allowed"),
    useAiExplanation: z.boolean().default(false),
  })
  .strict();
export type PrivacyScanRequest = z.infer<typeof PrivacyScanRequest>;

export const AssistantMessageRequest = z
  .object({
    conversationId: z.string().uuid().optional(),
    message: z.string().trim().min(1, "Message is required").max(2000, "Maximum 2,000 characters allowed"),
    scenario: EmergencyScenario.default("none"),
    idempotencyKey: z.string().min(8).max(64),
  })
  .strict();
export type AssistantMessageRequest = z.infer<typeof AssistantMessageRequest>;

export const EmergencyGuidanceRequest = z
  .object({
    scenario: EmergencyScenario,
    notes: z.string().max(1000).optional(),
  })
  .strict();
export type EmergencyGuidanceRequest = z.infer<typeof EmergencyGuidanceRequest>;

export const SecurityAssistantResponse = z
  .object({
    riskLevel: z.enum(["low", "medium", "high", "critical", "unknown"]),
    summary: z.string().max(800),
    immediateSteps: z.array(z.string().max(300)).min(1).max(8),
    avoidActions: z.array(z.string().max(300)).max(8),
    nextSteps: z.array(z.string().max(300)).max(8),
    escalationRequired: z.boolean(),
    limitations: z.array(z.string().max(300)).min(1).max(5),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type SecurityAssistantResponse = z.infer<typeof SecurityAssistantResponse>;

export const ReportExplainerResponse = z
  .object({
    whatWasChecked: z.string().max(500),
    whatWasFound: z.string().max(800),
    whyItMatters: z.string().max(600),
    whatToDo: z.array(z.string().max(250)).max(6),
    whatCouldNotBeChecked: z.array(z.string().max(250)).max(8),
    technicalSummary: z.string().max(800),
  })
  .strict();
export type ReportExplainerResponse = z.infer<typeof ReportExplainerResponse>;

export const PrivacyExplainerResponse = z
  .object({
    overview: z.string().max(600),
    perType: z.array(
      z
        .object({
          piiType: z.string().max(40),
          risk: z.string().max(300),
          advice: z.string().max(300),
        })
        .strict()
    ).max(12),
    limitations: z.array(z.string().max(250)).max(4),
  })
  .strict();
export type PrivacyExplainerResponse = z.infer<typeof PrivacyExplainerResponse>;

export const NineElementReportSchema = z
  .object({
    whatWasChecked: z.string(),
    whatWasFound: z.string(),
    whyItMatters: z.string(),
    whatTheUserShouldDo: z.array(z.string()),
    whatCouldNotBeChecked: z.array(z.string()),
    confidenceLevel: z.number().min(0).max(1),
    dataSourcesUsed: z.array(z.string()),
    limitations: z.array(z.string()),
    automatedCheckDisclaimer: z.string(),
    technicalSummary: z.string().optional(),
  })
  .strict();
export type NineElementReport = z.infer<typeof NineElementReportSchema>;

export const ProfileUpdate = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    language: z.string().min(2).max(10).optional(),
    mode: UserMode.optional(),
  })
  .strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

export const UserPreferencesUpdate = z
  .object({
    theme: ThemeMode.optional(),
    text_size: TextSize.optional(),
    reduced_motion: z.boolean().optional(),
    store_history: z.boolean().optional(),
    store_ai_history: z.boolean().optional(),
    ai_retention_days: z.number().int().min(1).max(365).optional(),
    allow_reputation_lookup: z.boolean().optional(),
    allow_ai_processing: z.boolean().optional(),
    monitoring_paused: z.boolean().optional(),
    notifications_enabled: z.boolean().optional(),
  })
  .strict();
export type UserPreferencesUpdate = z.infer<typeof UserPreferencesUpdate>;

export const ConsentRecordSchema = z.object({
  consent_type: z.enum([
    "history_storage",
    "ai_processing",
    "reputation_lookup",
    "usage_sync",
    "analytics",
  ]),
  granted: z.boolean(),
  policy_version: z.string().max(20),
});
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

export const DeleteDataRequest = z
  .object({
    categories: z
      .array(
        z.enum([
          "scan_history",
          "ai_history",
          "alerts",
          "activity",
          "uploads",
          "exports",
          "preferences",
          "account",
        ])
      )
      .min(1),
    confirm: z.literal("DELETE"),
  })
  .strict();
export type DeleteDataRequest = z.infer<typeof DeleteDataRequest>;

export const AlertPatch = z
  .object({
    state: z.enum(["dismissed", "resolved"]),
  })
  .strict();
export type AlertPatch = z.infer<typeof AlertPatch>;

export const PaginationQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    q: z.string().max(100).optional(),
    status: AssessmentStatus.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    sort: z.enum(["created_at_desc", "created_at_asc"]).default("created_at_desc"),
  })
  .strict();
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export const FeedbackRequest = z
  .object({
    category: z.enum(["bug", "false_result", "suggestion", "privacy", "other"]),
    message: z.string().trim().min(5).max(2000),
  })
  .strict();
export type FeedbackRequest = z.infer<typeof FeedbackRequest>;

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  GEMINI_API_KEY: z.string().min(10),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  SAFE_BROWSING_API_KEY: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"),
  LOG_HASH_SALT: z.string().min(16).default("trustguard_default_secure_salt_2026_xyz"),
});
export type EnvConfig = z.infer<typeof EnvSchema>;

export const ApiResponseEnvelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema.nullable(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .nullable(),
    requestId: z.string().uuid(),
  });
