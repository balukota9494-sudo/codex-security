import { describe, it, expect } from "vitest";
import { assertNotSafeWhenUnknown } from "../../src/services/reportBuilder.js";
import { calculateSecurityVisibility } from "../../src/services/visibility.js";
import { DETERMINISTIC_SCENARIOS } from "../../src/ai/fallbackGuidance.js";
import { FORBIDDEN_PHRASES } from "@trustguard/shared";

describe("Honesty Guard & Platform Honesty Rules", () => {
  it("must NEVER convert UNKNOWN or incomplete checks to SAFE_LOOKING", () => {
    // If critical parts were unverified, status must be downgraded to UNKNOWN
    const status = assertNotSafeWhenUnknown("SAFE_LOOKING", true);
    expect(status).toBe("UNKNOWN");

    const unchanged = assertNotSafeWhenUnknown("SAFE_LOOKING", false);
    expect(unchanged).toBe("SAFE_LOOKING");
  });

  it("should calculate Security Visibility and flag assessment as incomplete in browser mode", () => {
    const visibility = calculateSecurityVisibility();

    // Browser mode cannot inspect installed apps or processes
    expect(visibility.assessmentComplete).toBe(false);
    expect(visibility.missingCritical.length).toBeGreaterThan(0);
    expect(visibility.percent).toBeLessThan(100);
    expect(visibility.explanation).toContain("Visibility shows how much relevant information TRUSTGUARD could inspect");
  });

  it("must NEVER contain forbidden false-assurance phrases in deterministic fallback guidance", () => {
    const allGuidanceText = JSON.stringify(DETERMINISTIC_SCENARIOS).toLowerCase();

    for (const phrase of FORBIDDEN_PHRASES) {
      expect(allGuidanceText).not.toContain(phrase.toLowerCase());
    }
  });
});
