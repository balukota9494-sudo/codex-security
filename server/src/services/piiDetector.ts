import type { PiiCategory, PiiFinding } from "@trustguard/shared";

/**
 * Validates a number string using the Luhn checksum algorithm (Mod 10).
 */
export function validateLuhn(numStr: string): boolean {
  const sanitized = numStr.replace(/\D/g, "");
  if (sanitized.length < 13 || sanitized.length > 19) return false;

  let sum = 0;
  let alternate = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

export interface DetectedPiiItem {
  type: PiiCategory;
  raw: string;
  masked: string;
  startIndex: number;
  endIndex: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
}

/**
 * Masks sensitive values safely so they can be reviewed without exposing raw data.
 */
export function maskPii(type: PiiCategory, value: string): string {
  switch (type) {
    case "EMAIL": {
      const parts = value.split("@");
      if (parts.length === 2) {
        const user = parts[0];
        const maskedUser =
          user.length <= 2 ? user.charAt(0) + "*" : user.slice(0, 2) + "****" + user.slice(-1);
        return `${maskedUser}@${parts[1]}`;
      }
      return "****@****";
    }
    case "FINANCIAL": {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 4) {
        return `****-****-****-${digits.slice(-4)}`;
      }
      return "****-****";
    }
    case "PHONE": {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 4) {
        return `***-***-${digits.slice(-4)}`;
      }
      return "***-***-****";
    }
    case "GOVERNMENT_ID": {
      return "***-**-****";
    }
    case "API_KEY":
    case "ACCESS_TOKEN": {
      if (value.length > 8) {
        return `${value.slice(0, 4)}...${value.slice(-4)}`;
      }
      return "********";
    }
    case "PASSWORD_LIKE": {
      return "••••••••";
    }
    case "PRIVATE_KEY": {
      return "-----BEGIN [REDACTED KEY]-----";
    }
    default:
      if (value.length > 4) {
        return `${value.slice(0, 2)}****`;
      }
      return "****";
  }
}

/**
 * Scans text and detects personal identifiable information, secrets, and credentials.
 */
export function detectPii(text: string): DetectedPiiItem[] {
  if (!text) return [];

  const findings: DetectedPiiItem[] = [];

  // 1. Private Key PEM block
  const pemRegex = /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----[\s\S]*?-----END[ A-Z0-9_-]+PRIVATE KEY-----/g;
  let match: RegExpExecArray | null;
  while ((match = pemRegex.exec(text)) !== null) {
    findings.push({
      type: "PRIVATE_KEY",
      raw: match[0],
      masked: maskPii("PRIVATE_KEY", match[0]),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: "critical",
    });
  }

  // 2. Email Address
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    findings.push({
      type: "EMAIL",
      raw: match[0],
      masked: maskPii("EMAIL", match[0]),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: "medium",
    });
  }

  // 3. Known API Keys & Tokens
  const apiKeyPatterns = [
    { type: "API_KEY" as PiiCategory, regex: /\b(sk[_-](?:live|test)?[_-]?[0-9a-zA-Z]{20,40})\b/g, sev: "critical" as const },
    { type: "API_KEY" as PiiCategory, regex: /\b(ghp_[0-9a-zA-Z]{36})\b/g, sev: "critical" as const },
    { type: "API_KEY" as PiiCategory, regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g, sev: "critical" as const },
    { type: "API_KEY" as PiiCategory, regex: /\b(xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24})\b/g, sev: "critical" as const },
    { type: "API_KEY" as PiiCategory, regex: /\b(AKIA[0-9A-Z]{16})\b/g, sev: "critical" as const },
  ];
  for (const { type, regex, sev } of apiKeyPatterns) {
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        type,
        raw: match[0],
        masked: maskPii(type, match[0]),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: sev,
      });
    }
  }

  // 4. JWT / Bearer Tokens
  const jwtRegex = /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g;
  while ((match = jwtRegex.exec(text)) !== null) {
    findings.push({
      type: "ACCESS_TOKEN",
      raw: match[0],
      masked: maskPii("ACCESS_TOKEN", match[0]),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: "critical",
    });
  }

  // 5. Passwords / Secrets in plain text patterns
  const passwordLikeRegex = /\b(?:password|passwd|pwd|secret)\s*[:=]\s*([^\s,;]+)/gi;
  while ((match = passwordLikeRegex.exec(text)) !== null) {
    const rawSecret = match[1];
    if (rawSecret && rawSecret.length >= 4) {
      findings.push({
        type: "PASSWORD_LIKE",
        raw: rawSecret,
        masked: maskPii("PASSWORD_LIKE", rawSecret),
        startIndex: match.index + match[0].indexOf(rawSecret),
        endIndex: match.index + match[0].indexOf(rawSecret) + rawSecret.length,
        severity: "critical",
      });
    }
  }

  // 6. Credit Card Numbers (Validated with Luhn)
  const ccRegex = /\b(?:\d[ -]*?){13,19}\b/g;
  while ((match = ccRegex.exec(text)) !== null) {
    const candidate = match[0].replace(/[\s-]/g, "");
    if (validateLuhn(candidate)) {
      findings.push({
        type: "FINANCIAL",
        raw: match[0],
        masked: maskPii("FINANCIAL", candidate),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: "critical",
      });
    }
  }

  // 7. US Social Security Numbers (SSN)
  const ssnRegex = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    findings.push({
      type: "GOVERNMENT_ID",
      raw: match[0],
      masked: maskPii("GOVERNMENT_ID", match[0]),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: "critical",
    });
  }

  // 8. Phone Numbers
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    // Avoid overlap with financial or SSN
    const isAlreadyCovered = findings.some(
      (f) =>
        match &&
        match.index >= f.startIndex &&
        match.index + match[0].length <= f.endIndex
    );
    if (!isAlreadyCovered) {
      findings.push({
        type: "PHONE",
        raw: match[0],
        masked: maskPii("PHONE", match[0]),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: "low",
      });
    }
  }

  // Sort findings by start index ascending
  return findings.sort((a, b) => a.startIndex - b.startIndex);
}
