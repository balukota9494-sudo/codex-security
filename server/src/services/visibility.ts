import { ADVISORY, type SecurityVisibilityResult } from "@trustguard/shared";
import { getBrowserCapabilities } from "./capabilityEngine.js";

/**
 * Calculates Security Visibility.
 * Radical honesty directive:
 * "Visibility shows how much relevant information TRUSTGUARD could inspect. It does not mean your device is X% secure."
 * If critical capabilities cannot be inspected in browser mode, assessmentComplete is strictly false.
 */
export function calculateSecurityVisibility(): SecurityVisibilityResult {
  const capabilities = getBrowserCapabilities();
  const total = capabilities.length;

  const criticalKeys = [
    "device.installedApps",
    "device.runningApps",
    "device.systemProcesses",
    "device.securityUpdates",
  ];

  let checked = 0;
  const missingCritical: string[] = [];

  for (const cap of capabilities) {
    if (cap.status === "available") {
      checked += 1.0;
    } else if (cap.status === "limited") {
      checked += 0.5; // partial visibility
    } else {
      if (criticalKeys.includes(cap.key)) {
        missingCritical.push(cap.title);
      }
    }
  }

  const percent = Math.round((checked / total) * 100);
  const assessmentComplete = missingCritical.length === 0;

  const explainerText = ADVISORY.visibilityExplainer.replace("{pct}", percent.toString());

  return {
    percent,
    assessmentComplete,
    checkedCapabilities: Math.round(checked),
    totalCapabilities: total,
    missingCritical,
    explanation: explainerText,
  };
}
