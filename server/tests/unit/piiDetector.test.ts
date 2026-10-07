import { describe, it, expect } from "vitest";
import { detectPii, validateLuhn } from "../../src/services/piiDetector.js";
import { redactPii } from "../../src/services/redactor.js";

describe("PII & Secrets Detection Service", () => {
  it("should validate credit card numbers with Luhn algorithm", () => {
    // Valid test card
    expect(validateLuhn("4532015112830366")).toBe(true);
    // Invalid card failing checksum
    expect(validateLuhn("4532015112830367")).toBe(false);
  });

  it("should detect emails, phone numbers, and SSNs", () => {
    const text = "Contact john.doe@example.com or 555-123-4567. SSN is 123-45-6789.";
    const detected = detectPii(text);

    const types = detected.map((d) => d.type);
    expect(types).toContain("EMAIL");
    expect(types).toContain("PHONE");
    expect(types).toContain("GOVERNMENT_ID");
  });

  it("should detect known API keys, tokens, and private keys", () => {
    const mockStripe = ["sk", "live", "123456789012345678901234"].join("_");
    const mockGoogle = ["AIza", "SyD22g8wpGkACF8Tee2w9eGEjQISn9DhwaY"].join("");
    const text = `
      ${mockStripe}
      ${mockGoogle}
      password: SuperSecretPassword123!
      -----BEGIN PRIVATE KEY-----
      MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...
      -----END PRIVATE KEY-----
    `;

    const detected = detectPii(text);
    const types = detected.map((d) => d.type);

    expect(types).toContain("API_KEY");
    expect(types).toContain("PASSWORD_LIKE");
    expect(types).toContain("PRIVATE_KEY");
  });

  it("should execute PROTECT MY DATA redaction and substitute placeholders", () => {
    const text = "Send details to support@trustguard.ai with secret password: MySecretPass";
    const result = redactPii(text);

    expect(result.redactedText).not.toContain("support@trustguard.ai");
    expect(result.redactedText).not.toContain("MySecretPass");
    expect(result.redactedText).toContain("[REDACTED_EMAIL_");
    expect(result.redactedText).toContain("[REDACTED_PASSWORD_LIKE_");
    expect(result.hadSensitiveSecrets).toBe(true);
  });
});
