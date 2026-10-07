import type { EmergencyScenario, SecurityAssistantResponse } from "@trustguard/shared";

export const DETERMINISTIC_SCENARIOS: Record<
  EmergencyScenario,
  {
    title: string;
    summary: string;
    immediateSteps: string[];
    avoidActions: string[];
    nextSteps: string[];
    escalationRequired: boolean;
  }
> = {
  clicked_link: {
    title: "Clicked a Suspicious Link",
    summary:
      "You visited an untrusted or suspicious link. If you did not download a file or enter credentials, the risk is typically moderate, but immediate caution is advised.",
    immediateSteps: [
      "Close the suspicious browser tab immediately.",
      "Do not enter any username, password, phone number, or payment details.",
      "Do not click 'Allow' on any browser notification or permission prompts.",
    ],
    avoidActions: [
      "Do not download or open any files that popped up.",
      "Do not call any phone numbers displayed on the webpage claiming your device is infected.",
    ],
    nextSteps: [
      "Clear your browser cache and recent history.",
      "If you typed your password before closing, change that password immediately from a different device.",
      "Enable Multi-Factor Authentication (MFA) on your critical accounts.",
    ],
    escalationRequired: false,
  },
  gave_password: {
    title: "Entered or Shared a Password",
    summary:
      "Your credentials may have been captured by an unauthorized party. Immediate action is critical to prevent account takeover.",
    immediateSteps: [
      "Change the password immediately on the official service website or app.",
      "Log out of all existing active sessions or select 'Sign out of all other devices'.",
      "Check whether your account recovery email or phone number was altered.",
    ],
    avoidActions: [
      "Do not use the old password on any other websites or apps.",
      "Do not click links inside confirmation emails that you did not explicitly trigger yourself.",
    ],
    nextSteps: [
      "Turn on Two-Factor Authentication (2FA/MFA) using an authenticator app.",
      "Review connected third-party applications and revoke any unknown authorizations.",
      "If you reuse this password elsewhere, change it on those accounts too.",
    ],
    escalationRequired: true,
  },
  shared_otp: {
    title: "Shared a One-Time Passcode (OTP)",
    summary:
      "An attacker may be attempting to log in, reset credentials, or authorize a money transfer right now using your verification code.",
    immediateSteps: [
      "Immediately open the official app or website and change your account password.",
      "Contact customer support or your bank's fraud line immediately through verified official channels.",
      "Terminate all other active sessions in security settings.",
    ],
    avoidActions: [
      "Never share future codes received via SMS, email, or WhatsApp with anyone.",
      "Do not reply to the person or entity requesting the code.",
    ],
    nextSteps: [
      "Review recent transaction and login logs for unauthorized actions.",
      "Request that the provider temporarily lock sensitive transactions if financial accounts are involved.",
    ],
    escalationRequired: true,
  },
  account_strange: {
    title: "Account Showing Strange Activity",
    summary:
      "Unfamiliar emails, unrecognized logins, or profile changes suggest unauthorized access to your account.",
    immediateSteps: [
      "Log into the account directly through the official app and change your password.",
      "Select 'Sign out of all devices / Revoke all sessions'.",
      "Inspect account security settings for unknown email addresses, forwarding rules, or phone numbers.",
    ],
    avoidActions: [
      "Do not click links in notification emails reporting strange activity—navigate to the service directly.",
    ],
    nextSteps: [
      "Audit email forwarding rules and deleted folder items (attackers often hide confirmation emails).",
      "Enable Multi-Factor Authentication (MFA).",
    ],
    escalationRequired: false,
  },
  device_strange: {
    title: "Device Behaving Abnormally",
    summary:
      "Excessive pop-ups, rapid battery drain, or unexpected overheating can indicate unwanted background software or adware.",
    immediateSteps: [
      "Disconnect your device from Wi-Fi and mobile data to halt unauthorized transfers.",
      "Close all open applications and restart your device.",
      "Do not grant any unexpected administrator or accessibility permission requests.",
    ],
    avoidActions: [
      "Do not call tech support phone numbers from sudden alert screens.",
      "Do not install 'cleaning' or 'antivirus' tools advertised inside aggressive pop-ups.",
    ],
    nextSteps: [
      "Run your device's built-in official security scan (e.g. Windows Security or Google Play Protect).",
      "Review recently installed applications and uninstall anything unfamiliar.",
    ],
    escalationRequired: false,
  },
  unknown_app: {
    title: "Discovered an Unknown Application",
    summary:
      "An unexpected application is present on your device that you do not recall downloading.",
    immediateSteps: [
      "Do not open the unfamiliar application.",
      "Open your device's official System Settings -> Apps.",
      "Select the app and tap 'Uninstall' or remove it.",
    ],
    avoidActions: [
      "Do not grant camera, microphone, accessibility, or notification permissions to the app.",
    ],
    nextSteps: [
      "Check whether unknown applications were allowed from browser downloads and disable 'Install unknown apps'.",
      "Run a system scan using official OS security software.",
    ],
    escalationRequired: false,
  },
  financial_exposed: {
    title: "Financial Information May Be Compromised",
    summary:
      "A credit/debit card number, bank details, or payment credentials were typed on a questionable website.",
    immediateSteps: [
      "Call the official phone number printed on the back of your physical card immediately.",
      "Ask your card issuer to freeze or lock the card to prevent unauthorized charges.",
      "Review your recent transaction history for any unauthorized pending transactions.",
    ],
    avoidActions: [
      "Do not wait to see if fraudulent charges appear—act proactively.",
      "Do not call phone numbers provided by the suspicious website.",
    ],
    nextSteps: [
      "Request a replacement card with a new card number and CVV.",
      "Check credit monitoring or bank alert options.",
    ],
    escalationRequired: true,
  },
  downloaded_suspicious: {
    title: "Downloaded a Suspicious File",
    summary:
      "A file was downloaded from an untrusted source, but has not necessarily infected your device if you have not opened or executed it.",
    immediateSteps: [
      "Do not double-click, open, or execute the downloaded file.",
      "Navigate to your Downloads folder and permanently delete the file.",
      "Empty your device's Recycle Bin / Trash.",
    ],
    avoidActions: [
      "Do not extract zip files or run .exe, .dmg, .apk, or script files.",
    ],
    nextSteps: [
      "Run your operating system's built-in security scan on your downloads directory.",
      "Clear browser download history and cached files.",
    ],
    escalationRequired: false,
  },
  none: {
    title: "General Security Inquiry",
    summary:
      "TRUSTGUARD provides defensive security decision support. When in doubt, preserve your credentials and avoid unverified links.",
    immediateSteps: [
      "Verify the identity of anyone asking for urgent actions or sensitive information.",
      "Check website addresses directly by typing them into your browser rather than clicking links.",
    ],
    avoidActions: [
      "Never share passwords, security codes, or private recovery phrases.",
    ],
    nextSteps: [
      "Review your account privacy settings and enable Two-Factor Authentication on primary accounts.",
    ],
    escalationRequired: false,
  },
};

/**
 * Returns deterministic fallback guidance if the AI assistant is unreachable,
 * times out, or quota is exhausted.
 */
export function getFallbackGuidance(
  scenario: EmergencyScenario = "none",
  customSummary?: string
): SecurityAssistantResponse {
  const data = DETERMINISTIC_SCENARIOS[scenario] || DETERMINISTIC_SCENARIOS.none;

  return {
    riskLevel: data.escalationRequired ? "high" : "medium",
    summary: customSummary || data.summary,
    immediateSteps: data.immediateSteps,
    avoidActions: data.avoidActions,
    nextSteps: data.nextSteps,
    escalationRequired: data.escalationRequired,
    limitations: [
      "AI assistant was unreachable; presenting verified deterministic safety checklist.",
      "Cannot inspect your device memory or local processes in browser mode.",
    ],
    confidence: 0.85,
  };
}
