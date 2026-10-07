import {
  ADVISORY,
  type AssessmentStatus,
  type NineElementReport,
  type WebsiteFinding,
} from "@trustguard/shared";
import type { UrlAnalysisResult } from "./urlAnalyzer.js";
import type { TlsInspectionResult } from "./tlsInspector.js";
import type { HeaderAnalysisResult } from "./headerAnalyzer.js";
import type { HtmlSignalResult } from "./htmlSignalExtractor.js";
import type { SafeFetchResult } from "./safeFetch.js";
import type { ReputationResult } from "./reputationProvider.js";

/**
 * Central honesty guard:
 * Guarantees that if any critical check could not be completed, or is unknown/unavailable/limited,
 * the overall assessment status cannot be returned as SAFE_LOOKING.
 */
export function assertNotSafeWhenUnknown(
  computedStatus: AssessmentStatus,
  criticalUnverifiedPresent: boolean
): AssessmentStatus {
  if (criticalUnverifiedPresent && computedStatus === "SAFE_LOOKING") {
    return "UNKNOWN";
  }
  return computedStatus;
}

export interface BuildReportInput {
  urlAnalysis: UrlAnalysisResult;
  fetchResult: SafeFetchResult;
  tlsResult: TlsInspectionResult;
  headerResult: HeaderAnalysisResult;
  htmlSignals: HtmlSignalResult;
  reputationResult: ReputationResult;
  isDemo?: boolean;
}

export interface BuildReportOutput {
  status: AssessmentStatus;
  assessment: "COMPLETE" | "SCAN_INCOMPLETE" | "UNSAFE_REDIRECT_BLOCKED" | "SSRF_BLOCKED";
  confidence: number;
  failureCategory?: string;
  findings: WebsiteFinding[];
  sources: string[];
  limitations: string[];
  nineElementReport: NineElementReport;
}

export function buildWebsiteReport(input: BuildReportInput): BuildReportOutput {
  const {
    urlAnalysis,
    fetchResult,
    tlsResult,
    headerResult,
    htmlSignals,
    reputationResult,
    isDemo = false,
  } = input;

  const findings: WebsiteFinding[] = [];
  const sources = [
    "WHATWG URL Analysis",
    "DNS Resolution via system resolver",
    "Direct TLS handshake (port 443)",
    "HTTP Response Header Analysis",
    "Passive HTML structure parsing",
  ];
  if (reputationResult.checked) {
    sources.push(reputationResult.provider);
  }

  const limitations = [
    ADVISORY.passiveScan,
    "Cannot inspect server-side database vulnerabilities or backend code.",
    "Cannot execute client-side JavaScript or simulate full browser execution.",
    ADVISORY.browserMode,
    ADVISORY.privacySignals,
  ];

  // SSRF or connection blocked
  if (fetchResult.isSsrfBlocked) {
    return {
      status: "CRITICAL_RISK",
      assessment: "SSRF_BLOCKED",
      confidence: 1.0,
      failureCategory: "SSRF_BLOCKED",
      findings: [
        {
          check_key: "ssrf.blocked",
          category: "CONFIGURATION_ISSUE",
          severity: "critical",
          capability: "available",
          title: "Restricted Destination Blocked",
          plain_explanation: `Connection to this address was blocked by TrustGuard security policy: ${fetchResult.failureReason}`,
          technical_details: { reason: fetchResult.failureReason },
        },
      ],
      sources: ["SSRF Defense Firewall"],
      limitations,
      nineElementReport: {
        whatWasChecked: "Target destination IP and domain policy",
        whatWasFound: `The requested target attempts to access a prohibited address: ${fetchResult.failureReason}`,
        whyItMatters: "Accessing internal, private, or loopback network addresses poses severe security risks.",
        whatTheUserShouldDo: [
          "Do not visit or trust internal system addresses provided by external parties.",
          "Verify that the link came from a legitimate source.",
        ],
        whatCouldNotBeChecked: ["Target website content (blocked by defensive policy)"],
        confidenceLevel: 1.0,
        dataSourcesUsed: ["TrustGuard SSRF Firewall"],
        limitations,
        automatedCheckDisclaimer: ADVISORY.noGuarantee,
      },
    };
  }

  // 1. Evaluate Findings
  // Lookalike domain
  if (urlAnalysis.isLookalike && urlAnalysis.lookalikeBrandTarget) {
    findings.push({
      check_key: "url.lookalike",
      category: "LOOKALIKE_DOMAIN",
      severity: "high",
      capability: "available",
      title: `Potential Impersonation of ${urlAnalysis.lookalikeBrandTarget}`,
      plain_explanation: `This website domain is very similar to "${urlAnalysis.lookalikeBrandTarget}". Scammers frequently create similar-looking domains to trick people into giving away credentials.`,
      technical_details: {
        brand: urlAnalysis.lookalikeBrandTarget,
        hostname: urlAnalysis.hostname,
      },
    });
  }

  // Punycode / Homograph
  if (urlAnalysis.isPunycode || urlAnalysis.hasMixedScript) {
    findings.push({
      check_key: "url.punycode",
      category: "LOOKALIKE_DOMAIN",
      severity: "high",
      capability: "available",
      title: "Internationalized / Mixed-Script Domain",
      plain_explanation: "This web address uses special international characters that look visually identical to standard letters. This is a common tactic used in phishing campaigns.",
      technical_details: {
        isPunycode: urlAnalysis.isPunycode,
        hasMixedScript: urlAnalysis.hasMixedScript,
      },
    });
  }

  // Link shortener
  if (urlAnalysis.isShortener) {
    findings.push({
      check_key: "url.shortener",
      category: "URL_SHORTENER",
      severity: "medium",
      capability: "available",
      title: "Link Shortener Service Used",
      plain_explanation: "The link uses a shortening service that obscures where it will ultimately send you. You cannot see the real destination until after following it.",
      technical_details: { hostname: urlAnalysis.hostname },
    });
  }

  // TLS / HTTPS Check
  if (!urlAnalysis.isHttps) {
    findings.push({
      check_key: "tls.insecure_http",
      category: "TLS_ISSUE",
      severity: "high",
      capability: "available",
      title: "Unencrypted HTTP Connection",
      plain_explanation: "This site does not use HTTPS encryption. Any passwords, messages, or information you submit could be intercepted by others on the same network.",
      technical_details: { protocol: urlAnalysis.protocol },
    });
  } else if (!tlsResult.hasTls || !tlsResult.authorized) {
    findings.push({
      check_key: "tls.certificate_invalid",
      category: "TLS_ISSUE",
      severity: "high",
      capability: "available",
      title: "Invalid or Untrusted Security Certificate",
      plain_explanation: "The website presents a certificate that your browser cannot verify. This may indicate a spoofed website or an expired configuration.",
      technical_details: { error: tlsResult.error },
    });
  } else if (tlsResult.isExpired) {
    findings.push({
      check_key: "tls.expired",
      category: "TLS_ISSUE",
      severity: "medium",
      capability: "available",
      title: "Security Certificate Expired",
      plain_explanation: "The website's digital certificate has expired. While it may just be poor maintenance, your connection cannot be guaranteed authentic.",
      technical_details: { validTo: tlsResult.validTo, daysRemaining: tlsResult.daysRemaining },
    });
  }

  // Security Headers
  if (headerResult.missingHeaders.includes("Strict-Transport-Security")) {
    findings.push({
      check_key: "headers.missing_hsts",
      category: "MISSING_SECURITY_HEADERS",
      severity: "low",
      capability: "available",
      title: "Missing HSTS Header",
      plain_explanation: "The website does not mandate encrypted connections for future visits.",
      technical_details: { missing: "Strict-Transport-Security" },
    });
  }

  if (headerResult.missingHeaders.includes("Content-Security-Policy")) {
    findings.push({
      check_key: "headers.missing_csp",
      category: "MISSING_SECURITY_HEADERS",
      severity: "low",
      capability: "available",
      title: "Missing Content Security Policy",
      plain_explanation: "The site does not restrict where scripts and resources can be loaded from.",
      technical_details: { missing: "Content-Security-Policy" },
    });
  }

  // HTML Signals
  if (htmlSignals.hasLoginForm && !urlAnalysis.isHttps) {
    findings.push({
      check_key: "html.unencrypted_login",
      category: "CREDENTIAL_EXPOSURE",
      severity: "critical",
      capability: "available",
      title: "Unencrypted Login Form Detected",
      plain_explanation: "This page asks for login details or passwords over an unencrypted connection. Entering your password here puts your account at risk.",
      technical_details: { hasLoginForm: true, isHttps: false },
    });
  }

  if (htmlSignals.insecureFormAction) {
    findings.push({
      check_key: "html.insecure_form_action",
      category: "CREDENTIAL_EXPOSURE",
      severity: "high",
      capability: "available",
      title: "Form Submits to Insecure Destination",
      plain_explanation: "A form on this page sends information over an unencrypted HTTP connection.",
      technical_details: { insecureFormAction: true },
    });
  }

  if (htmlSignals.detectedTrackers.length > 0) {
    findings.push({
      check_key: "privacy.trackers",
      category: "PRIVACY_EXPOSURE",
      severity: "info",
      capability: "available",
      title: "Observed Tracking Scripts",
      plain_explanation: `We observed common analytics and tracking scripts (${htmlSignals.detectedTrackers.join(", ")}). This is common for analytics, but indicates activity may be monitored by third parties.`,
      technical_details: { trackers: htmlSignals.detectedTrackers },
    });
  }

  // Reputation matches
  if (reputationResult.checked && reputationResult.status === "HIGH_RISK") {
    findings.push({
      check_key: "reputation.known_threat",
      category: "MALWARE_REPUTATION",
      severity: "critical",
      capability: "available",
      title: "Flagged in Security Threat Database",
      plain_explanation: `Known threat database (${reputationResult.provider}) lists this URL for: ${reputationResult.threats.join(", ")}.`,
      technical_details: { threats: reputationResult.threats },
    });
  }

  // Determine Overall Status
  let computedStatus: AssessmentStatus = "SAFE_LOOKING";
  let hasCriticalUnverified = false;

  if (isDemo) {
    computedStatus = "DEMO_DATA";
  } else if (!fetchResult.ok && fetchResult.statusCode === 0) {
    computedStatus = "UNKNOWN";
    hasCriticalUnverified = true;
  } else if (findings.some((f) => f.severity === "critical")) {
    computedStatus = "CRITICAL_RISK";
  } else if (findings.some((f) => f.severity === "high")) {
    computedStatus = "HIGH_RISK";
  } else if (findings.some((f) => f.severity === "medium")) {
    computedStatus = "CAUTION";
  } else if (findings.some((f) => f.severity === "low")) {
    computedStatus = "LOW_RISK";
  } else {
    // If no findings, check if critical parts could not be verified
    if (!tlsResult.hasTls && urlAnalysis.isHttps) {
      computedStatus = "UNKNOWN";
      hasCriticalUnverified = true;
    } else {
      computedStatus = "SAFE_LOOKING";
    }
  }

  // Apply HONESTY GUARD: never convert unknown/incomplete into SAFE_LOOKING
  const finalStatus = assertNotSafeWhenUnknown(computedStatus, hasCriticalUnverified);

  const confidence =
    fetchResult.ok && tlsResult.hasTls ? 0.85 : fetchResult.ok ? 0.6 : 0.4;

  const assessmentState = fetchResult.ok ? "COMPLETE" : "SCAN_INCOMPLETE";

  // Synthesize Plain-Language 9-Element Report
  const whatWasChecked =
    `Passive evaluation of ${urlAnalysis.hostname}: URL structure, domain similarity, TLS certificate, HTTP defensive headers, and visible HTML forms.`;

  let whatWasFound = "";
  if (findings.length === 0) {
    whatWasFound = "No obvious passive security risks or known lookalike patterns were detected during this check.";
  } else {
    const highFindings = findings.filter((f) => ["critical", "high"].includes(f.severity));
    if (highFindings.length > 0) {
      whatWasFound = `Identified ${highFindings.length} notable security risk(s): ${highFindings.map((f) => f.title).join(", ")}.`;
    } else {
      whatWasFound = `Found ${findings.length} minor indicator(s) or standard observations.`;
    }
  }

  const whyItMatters =
    findings.length > 0
      ? findings[0].plain_explanation
      : "Basic technical hygiene indicators (HTTPS, valid certificate, and standard headers) help prevent credential eavesdropping and impersonation.";

  const whatTheUserShouldDo: string[] = [];
  if (finalStatus === "CRITICAL_RISK" || finalStatus === "HIGH_RISK") {
    whatTheUserShouldDo.push("Do not enter your password, payment information, or personal details on this website.");
    whatTheUserShouldDo.push("If you followed this link from a message or email, verify the sender through a separate channel.");
  } else if (finalStatus === "CAUTION") {
    whatTheUserShouldDo.push("Proceed with caution. Check the address bar to ensure the spelling matches the service you intend to visit.");
  } else if (finalStatus === "UNKNOWN") {
    whatTheUserShouldDo.push("Do not enter sensitive information until the website can be verified.");
    whatTheUserShouldDo.push("Try checking the address again later or open the official site directly.");
  } else {
    whatTheUserShouldDo.push("Always verify that you are on the intended domain before logging in.");
  }

  const whatCouldNotBeChecked = [
    "Internal server-side code and backend database security.",
    "JavaScript behaviors executed after initial page load.",
    "Zero-day phishing campaigns not yet cataloged in passive records.",
  ];

  const nineElementReport: NineElementReport = {
    whatWasChecked,
    whatWasFound,
    whyItMatters,
    whatTheUserShouldDo,
    whatCouldNotBeChecked,
    confidenceLevel: confidence,
    dataSourcesUsed: sources,
    limitations,
    automatedCheckDisclaimer: ADVISORY.noGuarantee,
    technicalSummary: `HTTP Status: ${fetchResult.statusCode} | TLS: ${tlsResult.protocol || "N/A"} | Header Posture Score: ${headerResult.score}/100`,
  };

  return {
    status: finalStatus,
    assessment: assessmentState,
    confidence,
    findings,
    sources,
    limitations,
    nineElementReport,
  };
}
