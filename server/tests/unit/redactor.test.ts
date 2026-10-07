import { describe, it, expect } from "vitest";
import { redactPii } from "../../src/services/redactor.js";

describe("redactor Service", () => {
  it("handles empty or blank text gracefully", () => {
    const result = redactPii("");
    expect(result.redactedText).toBe("");
    expect(result.totalFindings).toBe(0);
    expect(result.hadSensitiveSecrets).toBe(false);
  });

  it("redacts email addresses with safe structured tokens", () => {
    const input = "Contact our officer at alice@security-team.org for assistance.";
    const result = redactPii(input);
    expect(result.redactedText).toContain("[REDACTED_EMAIL_1]");
    expect(result.redactedText).not.toContain("alice@security-team.org");
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].piiType).toBe("EMAIL");
  });

  it("redacts credit card numbers and flags sensitive secrets", () => {
    const input = "Charged to card 4532 0150 0000 0007 yesterday.";
    const result = redactPii(input);
    expect(result.redactedText).toContain("[REDACTED_FINANCIAL_1]");
    expect(result.redactedText).not.toContain("4532 0150 0000 0007");
    expect(result.hadSensitiveSecrets).toBe(true);
  });

  it("redacts API keys and multiple mixed secrets simultaneously", () => {
    const mockApiKey = ["sk", "live", "1234567890abcdef1234567890abcdef"].join("-");
    const input = `Use key ${mockApiKey} with user test@example.com`;
    const result = redactPii(input);
    expect(result.redactedText).not.toContain(mockApiKey);
    expect(result.redactedText).not.toContain("test@example.com");
    expect(result.totalFindings).toBe(2);
    expect(result.hadSensitiveSecrets).toBe(true);
  });
});
