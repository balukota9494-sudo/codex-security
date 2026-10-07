import React, { useState } from "react";
import {
  Sparkles,
  Globe,
  Link2,
  FileLock2,
  Bot,
  AlertTriangle,
  Eye,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import { TrustReportCard } from "../components/scanning/TrustReportCard";
import { StructuredAnswerCard } from "../components/assistant/StructuredAnswerCard";
import { PiiFindingsTable } from "../components/privacy/PiiFindingsTable";
import { ADVISORY } from "@trustguard/shared";

export const DemoPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>("phishing_site");

  const scenarios = [
    {
      id: "phishing_site",
      title: "Suspicious Lookalike Domain (Phishing)",
      icon: Globe,
      summary: "Simulated scan of 'paypa1-account-security-update.com'",
    },
    {
      id: "safe_site",
      title: "Standard Verified Website",
      icon: CheckCircle2,
      summary: "Simulated scan of standard HTTPS service with valid TLS & HSTS",
    },
    {
      id: "privacy_leak",
      title: "PII & Secret Credential Redaction",
      icon: FileLock2,
      summary: "Simulated redaction of credit cards, SSN, and API tokens in text",
    },
    {
      id: "emergency_hack",
      title: "Emergency 'I've Been Hacked' Response",
      icon: AlertTriangle,
      summary: "Immediate deterministic guidance for someone who shared an OTP",
    },
  ];

  // Synthetic report data (marked strictly DEMO_DATA)
  const phishingReport = {
    status: "HIGH_RISK" as const,
    confidence: 0.9,
    report: {
      whatWasChecked: "Passive evaluation of paypa1-account-security-update.com (Synthetic Demo Target).",
      whatWasFound: "Domain closely mimics 'paypal' (Levenshtein distance 1 typosquatting). Insecure form submission action detected.",
      whyItMatters: "Typo domains combined with urgent security keywords are the signature of credential phishing portals.",
      whatTheUserShouldDo: [
        "Do not enter passwords or payment credentials on this website.",
        "Check your browser address bar: notice the numeral '1' substituted for the letter 'l'.",
        "Navigate directly to paypal.com by typing it manually.",
      ],
      whatCouldNotBeChecked: [
        "Internal web hosting database or server-side scripts.",
      ],
      confidenceLevel: 0.9,
      dataSourcesUsed: ["TrustGuard Heuristic Classifier", "Domain Distance Matrix"],
      limitations: [ADVISORY.passiveScan, "Synthetic demonstration scenario."],
      automatedCheckDisclaimer: ADVISORY.noGuarantee,
      technicalSummary: "Domain: paypa1-account-security-update.com | Mimics: paypal | Protocol: HTTPS | Certificate: Self-Signed",
    },
    findings: [
      {
        check_key: "url.lookalike",
        category: "LOOKALIKE_DOMAIN",
        severity: "high" as const,
        capability: "available" as const,
        title: "Brand Impersonation: Target is 'paypal'",
        plain_explanation: "This web address substitutes the numeral '1' for the letter 'l' in 'paypal' to deceive human readers.",
        technical_details: { target: "paypal", detected: "paypa1" },
      },
      {
        check_key: "html.urgency",
        category: "SOCIAL_ENGINEERING",
        severity: "medium" as const,
        capability: "available" as const,
        title: "Artificial Urgency Keywords Observed",
        plain_explanation: "URL incorporates 'account-security-update' designed to induce panic into entering credentials.",
        technical_details: { keywords: ["account", "security", "update"] },
      },
    ],
  };

  const safeReport = {
    status: "SAFE_LOOKING" as const,
    confidence: 0.85,
    report: {
      whatWasChecked: "Passive evaluation of verified-partner-portal.org.",
      whatWasFound: "Valid TLS certificate issued by trusted CA. Full defensive headers present (HSTS, CSP, X-Frame-Options).",
      whyItMatters: "Defensive technical headers and verified encryption prevent eavesdropping and clickjacking.",
      whatTheUserShouldDo: [
        "Always confirm you are signed into the correct service.",
        "Enable Two-Factor Authentication on your accounts.",
      ],
      whatCouldNotBeChecked: [
        "Server-side databases or backend business logic security.",
      ],
      confidenceLevel: 0.85,
      dataSourcesUsed: ["Direct TLS handshake", "HTTP Header Audit"],
      limitations: [ADVISORY.passiveScan, "Synthetic demonstration scenario."],
      automatedCheckDisclaimer: ADVISORY.noGuarantee,
      technicalSummary: "HTTP 200 OK | HSTS: Active (31536000s) | CSP: Strict | TLS 1.3",
    },
    findings: [],
  };

  const privacyDemoFindings = [
    { piiType: "FINANCIAL" as const, maskedPreview: "****-****-****-4242", severity: "critical" as const },
    { piiType: "PASSWORD_LIKE" as const, maskedPreview: "••••••••", severity: "critical" as const },
    { piiType: "API_KEY" as const, maskedPreview: "sk_live_...9182", severity: "critical" as const },
    { piiType: "EMAIL" as const, maskedPreview: "ad****@company.com", severity: "medium" as const },
  ];

  const emergencyDemoAnswer = {
    riskLevel: "critical" as const,
    summary: "A one-time verification passcode (OTP) was shared with an unverified party. An attacker is likely attempting to authorize an immediate transaction or access your account.",
    immediateSteps: [
      "Open your banking or service app directly on your phone right now.",
      "Call the official fraud support phone line printed on the back of your physical card.",
      "Change your primary password and select 'Log out of all other sessions'.",
    ],
    avoidActions: [
      "Do not reply to any additional messages asking for updated codes.",
      "Do not click links received in SMS or WhatsApp claiming to be fraud alerts.",
    ],
    nextSteps: [
      "Audit recent transaction history and pending transfers with your bank.",
      "Request temporary fraud locks on sensitive wire services.",
    ],
    escalationRequired: true,
    limitations: [
      "Decision support only. Cannot view your live bank account.",
    ],
    confidence: 0.95,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-3xl border border-purple-500/30 bg-purple-500/5 backdrop-blur-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Demo Sandbox</span>
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          Explore TRUSTGUARD AI Scenarios
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Test our radical honesty, passive inspection engine, and privacy redactor safely without touching real sensitive data.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = selectedScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border bg-card/60 hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-xs text-foreground leading-tight">
                  {sc.title}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {sc.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Scenario Display */}
      <div className="pt-2">
        {selectedScenario === "phishing_site" && (
          <TrustReportCard
            status={phishingReport.status}
            confidence={phishingReport.confidence}
            report={phishingReport.report}
            findings={phishingReport.findings}
            checkedAt={new Date().toISOString()}
          />
        )}

        {selectedScenario === "safe_site" && (
          <TrustReportCard
            status={safeReport.status}
            confidence={safeReport.confidence}
            report={safeReport.report}
            findings={safeReport.findings}
            checkedAt={new Date().toISOString()}
          />
        )}

        {selectedScenario === "privacy_leak" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileLock2 className="w-5 h-5 text-indigo-500" />
                <span>Simulated Privacy Redaction Preview</span>
              </h2>
              <div className="p-4 rounded-xl bg-muted/40 font-mono text-xs text-foreground space-y-2">
                <span className="text-muted-foreground font-sans font-bold block text-[11px] uppercase">
                  Simulated Input with Sensitive Tokens:
                </span>
                <p>
                  &quot;Hello team, my card is 4532-0151-1283-4242, password is MyPass123!, and API key is sk_live_test9182. Contact admin@company.com.&quot;
                </p>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 font-mono text-xs text-foreground space-y-2">
                <span className="text-primary font-sans font-bold block text-[11px] uppercase">
                  Protect My Data Output (Sanitized Text):
                </span>
                <p>
                  &quot;Hello team, my card is [REDACTED_FINANCIAL_1], password is [REDACTED_PASSWORD_LIKE_1], and API key is [REDACTED_API_KEY_1]. Contact [REDACTED_EMAIL_1].&quot;
                </p>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-muted-foreground block mb-3 uppercase tracking-wider">
                  Masked Findings Table
                </span>
                <PiiFindingsTable findings={privacyDemoFindings} />
              </div>
            </div>
          </div>
        )}

        {selectedScenario === "emergency_hack" && (
          <div className="space-y-4">
            <StructuredAnswerCard data={emergencyDemoAnswer} wasFallback={true} />
          </div>
        )}
      </div>
    </div>
  );
};
