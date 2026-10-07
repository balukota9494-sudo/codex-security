import type { SecurityAssistantResponse } from "@trustguard/shared";
import { FORBIDDEN_PHRASES } from "@trustguard/shared";

/**
 * Validates and filters AI output to prevent unsafe instructions or deceptive claims.
 */
export function filterAiOutput(
  response: SecurityAssistantResponse
): SecurityAssistantResponse {
  const dangerousPatterns = [
    /disable.*(antivirus|firewall|defender|security)/i,
    /install.*(anydesk|teamviewer|remote access)/i,
    /run.*(powershell|terminal|cmd|bash|regedit|registry)/i,
    /send.*(password|otp|code|seed phrase|private key)/i,
    /share.*(screen|remote access)/i,
  ];

  const sanitizeString = (text: string): string => {
    let sanitized = text;

    // Check dangerous patterns
    for (const pat of dangerousPatterns) {
      if (pat.test(sanitized)) {
        sanitized =
          "Follow only official guidance from the verified service. Never share credentials or grant remote access.";
      }
    }

    // Check forbidden marketing/false claims
    for (const phrase of FORBIDDEN_PHRASES) {
      const regex = new RegExp(phrase, "gi");
      if (regex.test(sanitized)) {
        sanitized = sanitized.replace(regex, "potential risk");
      }
    }

    return sanitized;
  };

  return {
    ...response,
    summary: sanitizeString(response.summary),
    immediateSteps: response.immediateSteps.map(sanitizeString),
    avoidActions: response.avoidActions.map(sanitizeString),
    nextSteps: response.nextSteps.map(sanitizeString),
    limitations: response.limitations.map(sanitizeString),
  };
}
