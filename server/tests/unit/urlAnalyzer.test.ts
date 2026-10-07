import { describe, it, expect } from "vitest";
import { analyzeUrl, sanitizeUrlForStorage } from "../../src/services/urlAnalyzer.js";

describe("urlAnalyzer Service", () => {
  it("sanitizes URLs by stripping query parameters and hash fragments", () => {
    const raw = "https://example.com/login?token=secret123#step2";
    expect(sanitizeUrlForStorage(raw)).toBe("https://example.com/login");
  });

  it("identifies HTTPS and standard hostname correctly", () => {
    const result = analyzeUrl("https://github.com/balukota9494-sudo");
    expect(result.hostname).toBe("github.com");
    expect(result.isHttps).toBe(true);
    expect(result.isLookalike).toBe(false);
    expect(result.isShortener).toBe(false);
  });

  it("detects known URL shorteners", () => {
    const result = analyzeUrl("https://bit.ly/3xY8a91");
    expect(result.isShortener).toBe(true);
    expect(result.flags).toContain("Known link shortener service hides final destination");
  });

  it("detects brand lookalikes (typosquatting via Levenshtein distance)", () => {
    const result = analyzeUrl("https://paypa1-security.com/login");
    expect(result.isLookalike).toBe(true);
    expect(result.lookalikeBrandTarget).toBe("paypal");
    expect(result.structuralRiskLevel).toBe("high");
  });

  it("detects internationalized punycode domains", () => {
    const result = analyzeUrl("http://xn--apple-43d.com");
    expect(result.isPunycode).toBe(true);
  });

  it("flags suspicious urgency and credential keywords", () => {
    const result = analyzeUrl("https://auth-recovery.example.com/verify-account-suspended");
    expect(result.suspiciousKeywordsFound).toContain("verify");
    expect(result.suspiciousKeywordsFound).toContain("account");
    expect(result.suspiciousKeywordsFound).toContain("suspended");
  });
});
