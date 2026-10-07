export interface HtmlSignalResult {
  hasLoginForm: boolean;
  hasPasswordInput: boolean;
  hasPaymentForm: boolean;
  hasMixedContent: boolean;
  hasPrivacyPolicyLink: boolean;
  detectedTrackers: string[];
  externalScriptDomains: string[];
  insecureFormAction: boolean;
}

const COMMON_TRACKER_PATTERNS = [
  { name: "Google Analytics", pattern: /google-analytics\.com|googletagmanager\.com/i },
  { name: "Meta / Facebook Pixel", pattern: /connect\.facebook\.net|fbevents\.js/i },
  { name: "Hotjar", pattern: /static\.hotjar\.com/i },
  { name: "TikTok Pixel", pattern: /analytics\.tiktok\.com/i },
  { name: "Yandex Metrica", pattern: /mc\.yandex\.ru/i },
  { name: "Crazy Egg", pattern: /cetrk\.com/i },
  { name: "Segment", pattern: /cdn\.segment\.com/i },
];

/**
 * Extracts passive security and privacy signals from HTML snippet without running scripts.
 */
export function extractHtmlSignals(html: string, isHttps = true): HtmlSignalResult {
  if (!html) {
    return {
      hasLoginForm: false,
      hasPasswordInput: false,
      hasPaymentForm: false,
      hasMixedContent: false,
      hasPrivacyPolicyLink: false,
      detectedTrackers: [],
      externalScriptDomains: [],
      insecureFormAction: false,
    };
  }

  const hasPasswordInput = /<input[^>]+type=["']?password["']?/i.test(html);
  const hasLoginForm =
    hasPasswordInput ||
    (/<form[^>]*>/i.test(html) && /login|signin|log-in|sign-in/i.test(html));

  const hasPaymentForm =
    /card-number|cardnumber|cvv|cvc|exp-month|exp-year|cc-number/i.test(html);

  // Mixed content: HTTP references inside HTTPS page
  const hasMixedContent =
    isHttps && /src=["']http:\/\/[^"']+|href=["']http:\/\/[^"']+\.css/i.test(html);

  // Insecure form action: form posting to http://
  const insecureFormAction =
    isHttps && /<form[^>]+action=["']http:\/\//i.test(html);

  // Privacy policy link presence
  const hasPrivacyPolicyLink =
    /href=["'][^"']*(privacy|privacy-policy|terms-of-service)[^"']*["']/i.test(html) ||
    /privacy policy|data protection policy/i.test(html);

  // Observable privacy signals: known tracker scripts
  const detectedTrackers: string[] = [];
  for (const tracker of COMMON_TRACKER_PATTERNS) {
    if (tracker.pattern.test(html)) {
      detectedTrackers.push(tracker.name);
    }
  }

  // Extract third party script domains
  const scriptRegex = /<script[^>]+src=["'](https?:\/\/[^"'/]+)[^"']*["']/gi;
  const externalDomains = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1]);
      externalDomains.add(url.hostname);
    } catch {}
  }

  return {
    hasLoginForm,
    hasPasswordInput,
    hasPaymentForm,
    hasMixedContent,
    hasPrivacyPolicyLink,
    detectedTrackers,
    externalScriptDomains: Array.from(externalDomains).slice(0, 10),
    insecureFormAction,
  };
}
