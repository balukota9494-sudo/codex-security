export const ADVISORY = {
  disclaimerShort:
    "TRUSTGUARD AI is a decision-support tool, not a replacement for antivirus software, your bank, or a security professional.",
  noGuarantee:
    "An automated check is not a guarantee. Unverified information is never treated as safe.",
  passiveScan:
    "This is a passive safety assessment, not a complete penetration test.",
  chatBanner:
    "Do not share passwords, OTPs, private keys, recovery codes, API keys, or full payment details.",
  browserMode:
    "Browser mode cannot inspect every installed application, background process, system setting, or device-storage category.",
  deviceStorage: "Detailed device storage is unavailable in browser mode.",
  privacySignals:
    "Some privacy-related signals were observed during this check. This does not identify every tracker used by the website.",
  cachedResult: "Not a live security check.",
  demoBanner: "DEMO MODE — NO REAL DEVICE OR WEBSITE WAS SCANNED",
  aiUnavailable: "AI unavailable — showing safety guidance.",
  visibilityExplainer:
    "Visibility shows how much relevant information TRUSTGUARD could inspect. It does not mean your device is {pct}% secure.",
  corePrinciple:
    "We do not know what we cannot verify, and we never treat unknown information as safe.",
  userFlowExperience:
    "Something might be wrong → I understand it → I know what to do → I am in control.",
} as const;

export const LIMITS = {
  scanTimeoutMs: 8000,
  maxResponseBytes: 512 * 1024,
  maxRedirects: 5,
  followRedirectsDefault: false,
  scansPerUserPerDay: 50,
  scansPerUserPerMinute: 5,
  concurrentScansPerUser: 2,
  aiMessagesPerUserPerDay: 40,
  aiMaxInputChars: 2000,
  aiMaxOutputTokens: 1024,
  ipRateLimitPerMinute: 60,
  exportExpiryHours: 24,
  alertRetentionDays: 180,
  aiConversationRetentionDaysDefault: 30,
} as const;

export const FORBIDDEN_PHRASES = [
  "100% safe",
  "100% secure",
  "completely safe",
  "completely protected",
  "impossible to hack",
  "definitely infected",
  "every background process was inspected",
  "no malware exists",
  "you have been hacked",
  "your device is impossible to hack",
] as const;
