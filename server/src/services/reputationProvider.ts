import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export interface ReputationResult {
  checked: boolean;
  status: "SAFE_LOOKING" | "HIGH_RISK" | "NOT_CHECKED" | "UNABLE_TO_VERIFY";
  threats: string[];
  provider: string;
}

/**
 * Queries external reputation provider (e.g. Google Safe Browsing) only when consent is granted.
 * If API key is not configured or consent is false, strictly returns NOT_CHECKED.
 * Never fabricates or guesses reputation data.
 */
export async function checkReputation(
  targetUrl: string,
  userConsentGranted: boolean
): Promise<ReputationResult> {
  if (!userConsentGranted) {
    return {
      checked: false,
      status: "NOT_CHECKED",
      threats: [],
      provider: "None (Consent not granted by user preferences)",
    };
  }

  const apiKey = env.SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return {
      checked: false,
      status: "NOT_CHECKED",
      threats: [],
      provider: "Google Safe Browsing (Unconfigured / No API key)",
    };
  }

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const payload = {
      client: {
        clientId: "trustguard-ai",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url: targetUrl }],
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "Safe Browsing API check failed");
      return {
        checked: true,
        status: "UNABLE_TO_VERIFY",
        threats: [],
        provider: "Google Safe Browsing",
      };
    }

    const data = (await res.json()) as any;
    const matches = data.matches || [];

    if (matches.length > 0) {
      const threats = matches.map((m: any) => m.threatType);
      return {
        checked: true,
        status: "HIGH_RISK",
        threats,
        provider: "Google Safe Browsing",
      };
    }

    return {
      checked: true,
      status: "SAFE_LOOKING",
      threats: [],
      provider: "Google Safe Browsing",
    };
  } catch (err: any) {
    logger.warn({ err: err.message }, "Reputation check exception");
    return {
      checked: true,
      status: "UNABLE_TO_VERIFY",
      threats: [],
      provider: "Google Safe Browsing",
    };
  }
}
