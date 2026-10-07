import { describe, it, expect } from "vitest";
import { FORBIDDEN_PHRASES, ADVISORY } from "@trustguard/shared";

describe("Accessibility & Copy Verification Suite", () => {
  it("must never include forbidden false-assurance claims in public advisories", () => {
    const advisoryStrings = Object.values(ADVISORY).join(" ").toLowerCase();

    for (const phrase of FORBIDDEN_PHRASES) {
      expect(advisoryStrings).not.toContain(phrase.toLowerCase());
    }
  });

  it("should have non-empty ARIA accessibility notices for advisory banners", () => {
    expect(ADVISORY.chatBanner.length).toBeGreaterThan(10);
    expect(ADVISORY.corePrinciple.length).toBeGreaterThan(10);
    expect(ADVISORY.disclaimerShort.length).toBeGreaterThan(10);
  });
});
