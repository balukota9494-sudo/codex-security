import { describe, it, expect } from "vitest";
import {
  WebsiteScanRequest,
  AssessmentStatus,
  FORBIDDEN_PHRASES,
  ADVISORY,
  LIMITS,
} from "../src/index.js";

describe("Shared Schemas & Advisory Specifications", () => {
  it("validates WebsiteScanRequest correctly", () => {
    const valid = WebsiteScanRequest.safeParse({ url: "https://example.com" });
    expect(valid.success).toBe(true);

    const invalid = WebsiteScanRequest.safeParse({ url: "" });
    expect(invalid.success).toBe(false);
  });

  it("includes all 9 mandatory assessment status tokens", () => {
    const requiredStatuses = [
      "SAFE_LOOKING",
      "LOW_RISK",
      "CAUTION",
      "HIGH_RISK",
      "CRITICAL_RISK",
      "UNKNOWN",
      "UNABLE_TO_VERIFY",
      "NOT_CHECKED",
      "DEMO_DATA",
    ];

    for (const status of requiredStatuses) {
      expect(AssessmentStatus.safeParse(status).success).toBe(true);
    }
  });

  it("defines strict forbidden phrases", () => {
    expect(FORBIDDEN_PHRASES).toContain("100% safe");
    expect(FORBIDDEN_PHRASES).toContain("100% secure");
    expect(FORBIDDEN_PHRASES).toContain("impossible to hack");
    expect(FORBIDDEN_PHRASES).toContain("completely safe");
  });

  it("enforces core radical honesty advisory principles", () => {
    expect(ADVISORY.corePrinciple).toBe(
      "We do not know what we cannot verify, and we never treat unknown information as safe."
    );
    expect(LIMITS.scanTimeoutMs).toBe(8000);
  });
});
