import { detectPii, type DetectedPiiItem } from "./piiDetector.js";
import type { PiiCategory } from "@trustguard/shared";

export interface RedactionResult {
  redactedText: string;
  findings: Array<{
    piiType: PiiCategory;
    maskedPreview: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
  }>;
  piiCountByType: Record<string, number>;
  totalFindings: number;
  hadSensitiveSecrets: boolean;
}

/**
 * Protect My Data redaction engine.
 * Converts raw sensitive text into sanitized text with structured placeholder tokens.
 */
export function redactPii(rawText: string): RedactionResult {
  if (!rawText) {
    return {
      redactedText: "",
      findings: [],
      piiCountByType: {},
      totalFindings: 0,
      hadSensitiveSecrets: false,
    };
  }

  const detected = detectPii(rawText);
  const piiCountByType: Record<string, number> = {};
  let hadSensitiveSecrets = false;

  // Track categories and sensitive secrets
  for (const item of detected) {
    piiCountByType[item.type] = (piiCountByType[item.type] || 0) + 1;
    if (["PASSWORD_LIKE", "PRIVATE_KEY", "FINANCIAL", "ACCESS_TOKEN", "API_KEY"].includes(item.type)) {
      hadSensitiveSecrets = true;
    }
  }

  // Build replacement string moving backwards from the end so indices remain valid
  let redacted = rawText;
  const reversed = [...detected].sort((a, b) => b.startIndex - a.startIndex);

  const typeCounters: Record<string, number> = {};
  for (const item of reversed) {
    const count = (typeCounters[item.type] = (typeCounters[item.type] || 0) + 1);
    const token = `[REDACTED_${item.type}_${count}]`;
    redacted =
      redacted.slice(0, item.startIndex) + token + redacted.slice(item.endIndex);
  }

  const findings = detected.map((item) => ({
    piiType: item.type,
    maskedPreview: item.masked,
    severity: item.severity,
  }));

  return {
    redactedText: redacted,
    findings,
    piiCountByType,
    totalFindings: detected.length,
    hadSensitiveSecrets,
  };
}
