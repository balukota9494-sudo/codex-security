import { describe, it, expect } from "vitest";
import { validateTargetUrl, safeFetch } from "../../src/services/safeFetch.js";

describe("SSRF Security Enforcement", () => {
  it("should reject URLs with embedded credentials", async () => {
    await expect(validateTargetUrl("http://user:pass@example.com")).rejects.toThrow(
      "embedded username or password"
    );
  });

  it("should reject prohibited protocols (file, ftp, gopher, javascript, data)", async () => {
    const prohibited = [
      "file:///etc/passwd",
      "ftp://example.com/file",
      "gopher://example.com",
      "javascript:alert(1)",
      "data:text/html,test",
    ];

    for (const url of prohibited) {
      await expect(validateTargetUrl(url)).rejects.toThrow("Forbidden protocol");
    }
  });

  it("should reject localhost, single-label hosts, and cloud metadata hostnames", async () => {
    const blockedHosts = [
      "http://localhost",
      "http://127.0.0.1",
      "http://metadata.google.internal",
      "http://router",
      "http://internal",
    ];

    for (const url of blockedHosts) {
      await expect(validateTargetUrl(url)).rejects.toThrow();
    }
  });

  it("safeFetch should gracefully return SSRF_BLOCKED result without crashing", async () => {
    const result = await safeFetch("http://127.0.0.1:8080/admin");
    expect(result.ok).toBe(false);
    expect(result.statusText).toBe("SSRF_BLOCKED");
    expect(result.isSsrfBlocked).toBe(true);
  });
});
