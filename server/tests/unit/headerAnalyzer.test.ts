import { describe, it, expect } from "vitest";
import { analyzeHeaders } from "../../src/services/headerAnalyzer.js";

describe("headerAnalyzer Service", () => {
  it("scores 0 when all security headers are missing", () => {
    const result = analyzeHeaders({});
    expect(result.score).toBe(0);
    expect(result.hasHsts).toBe(false);
    expect(result.hasCsp).toBe(false);
    expect(result.missingHeaders).toContain("Strict-Transport-Security");
    expect(result.missingHeaders).toContain("Content-Security-Policy");
  });

  it("calculates high score for well-configured security headers", () => {
    const headers = {
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "permissions-policy": "geolocation=()",
    };
    const result = analyzeHeaders(headers);
    expect(result.score).toBe(100);
    expect(result.hasHsts).toBe(true);
    expect(result.hasCsp).toBe(true);
    expect(result.hasXFrameOptions).toBe(true);
    expect(result.missingHeaders.length).toBe(0);
  });

  it("detects insecure cookie flags", () => {
    const headers = {
      "set-cookie": "session_id=abc123xyz; Path=/",
    };
    const result = analyzeHeaders(headers);
    expect(result.cookieSecurity.totalCookies).toBe(1);
    expect(result.cookieSecurity.missingSecure).toBe(1);
    expect(result.cookieSecurity.missingHttpOnly).toBe(1);
    expect(result.cookieSecurity.missingSameSite).toBe(1);
  });
});
