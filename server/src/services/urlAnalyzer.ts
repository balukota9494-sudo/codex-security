export interface UrlAnalysisResult {
  rawUrl: string;
  safeUrl: string; // Query string stripped/sanitized
  hostname: string;
  protocol: string;
  isHttps: boolean;
  isShortener: boolean;
  isLookalike: boolean;
  lookalikeBrandTarget?: string;
  isPunycode: boolean;
  hasMixedScript: boolean;
  suspiciousKeywordsFound: string[];
  subdomainCount: number;
  structuralRiskLevel: "low" | "medium" | "high";
  flags: string[];
}

const POPULAR_BRANDS = [
  "google",
  "paypal",
  "apple",
  "microsoft",
  "amazon",
  "facebook",
  "instagram",
  "netflix",
  "chase",
  "bankofamerica",
  "wellsfargo",
  "binance",
  "coinbase",
  "twitter",
  "linkedin",
  "discord",
  "telegram",
  "whatsapp",
  "dropbox",
  "github",
];

const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "buff.ly",
  "ow.ly",
  "cutt.ly",
  "goo.gl",
  "rebrand.ly",
  "bl.ink",
  "v.gd",
  "s.id",
  "shorturl.at",
]);

const SUSPICIOUS_KEYWORDS = [
  "login",
  "signin",
  "verify",
  "verification",
  "account",
  "security-update",
  "update-billing",
  "password",
  "credential",
  "bank",
  "wallet",
  "recover",
  "secure-login",
  "confirm",
  "authenticate",
  "suspended",
  "action-required",
];

/**
 * Computes Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Sanitizes a URL to a safe version by stripping query parameters and hash fragments.
 */
export function sanitizeUrlForStorage(rawUrl: string): string {
  try {
    const withScheme = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    const parsed = new URL(withScheme);
    // Return origin + pathname without search or hash
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.protocol}//${parsed.hostname}${path}`;
  } catch {
    return rawUrl.split("?")[0].split("#")[0].slice(0, 512);
  }
}

/**
 * Analyzes URL patterns, structural heuristics, punycode, lookalikes, and brand spoofing.
 */
export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const flags: string[] = [];
  let parsed: URL;

  const trimmed = rawUrl.trim().normalize("NFC");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    parsed = new URL(withScheme);
  } catch {
    const isPuny = trimmed.toLowerCase().includes("xn--");
    return {
      rawUrl,
      safeUrl: sanitizeUrlForStorage(rawUrl),
      hostname: "unknown",
      protocol: "unknown",
      isHttps: false,
      isShortener: false,
      isLookalike: false,
      isPunycode: isPuny,
      hasMixedScript: false,
      suspiciousKeywordsFound: [],
      subdomainCount: 0,
      structuralRiskLevel: "high",
      flags: [isPuny ? "Punycode domain syntax error" : "Malformed URL syntax"],
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const safeUrl = sanitizeUrlForStorage(withScheme);
  const isHttps = parsed.protocol === "https:";

  if (!isHttps) {
    flags.push("Insecure HTTP protocol used");
  }

  // Punycode detection (starts with xn--)
  const isPunycode = hostname.includes("xn--") || withScheme.toLowerCase().includes("xn--");
  if (isPunycode) {
    flags.push("Internationalized domain name (Punycode / xn--) detected");
  }

  // Mixed-script detection
  const hasMixedScript = /[а-яА-Я]/.test(hostname) && /[a-zA-Z]/.test(hostname);
  if (hasMixedScript) {
    flags.push("Mixed Latin and Cyrillic scripts in domain name");
  }

  // URL shortener check
  const isShortener = KNOWN_SHORTENERS.has(hostname);
  if (isShortener) {
    flags.push("Known link shortener service hides final destination");
  }

  // Subdomain count
  const labels = hostname.split(".");
  const subdomainCount = Math.max(0, labels.length - 2);
  if (subdomainCount >= 3) {
    flags.push(`Unusually high number of subdomains (${subdomainCount})`);
  }

  // Check for suspicious keywords in host or path
  const lowerUrl = parsed.href.toLowerCase();
  const suspiciousKeywordsFound: string[] = [];
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (lowerUrl.includes(kw)) {
      suspiciousKeywordsFound.push(kw);
    }
  }
  if (suspiciousKeywordsFound.length > 0) {
    flags.push(`Suspicious authentication or urgency keywords: ${suspiciousKeywordsFound.join(", ")}`);
  }

  // Lookalike brand detection (checks full primary label and hyphenated sub-tokens)
  let isLookalike = false;
  let lookalikeBrandTarget: string | undefined;

  const primaryDomainLabel = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  const candidatesToCheck = [primaryDomainLabel, ...primaryDomainLabel.split(/[-_]/).filter(Boolean)];

  for (const candidate of candidatesToCheck) {
    for (const brand of POPULAR_BRANDS) {
      if (candidate !== brand) {
        const distance = levenshteinDistance(candidate, brand);
        // Small distance or visual substitution
        if (
          (distance === 1 && brand.length >= 4) ||
          (distance === 2 && brand.length >= 7) ||
          (candidate.includes(brand) && candidate !== brand)
        ) {
          isLookalike = true;
          lookalikeBrandTarget = brand;
          flags.push(`Domain closely resembles brand "${brand}" (potential typosquatting)`);
          break;
        }
      }
    }
    if (isLookalike) break;
  }

  // Calculate structural risk level
  let structuralRiskLevel: "low" | "medium" | "high" = "low";
  if (isLookalike || hasMixedScript || (isPunycode && suspiciousKeywordsFound.length > 0)) {
    structuralRiskLevel = "high";
  } else if (!isHttps || isShortener || suspiciousKeywordsFound.length >= 2 || subdomainCount >= 3) {
    structuralRiskLevel = "medium";
  }

  return {
    rawUrl,
    safeUrl,
    hostname,
    protocol: parsed.protocol,
    isHttps,
    isShortener,
    isLookalike,
    lookalikeBrandTarget,
    isPunycode,
    hasMixedScript,
    suspiciousKeywordsFound,
    subdomainCount,
    structuralRiskLevel,
    flags,
  };
}
