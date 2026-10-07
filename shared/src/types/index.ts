export * from "../schemas/index.js";
export * from "../config/advisory.js";

export type CapabilityKey =
  | "device.model"
  | "device.os"
  | "device.securityUpdates"
  | "device.storage"
  | "device.installedApps"
  | "device.runningApps"
  | "device.usageStats"
  | "device.permissions"
  | "device.systemProcesses"
  | "device.backgroundActivity"
  | "device.battery"
  | "device.network";

export interface CapabilityInfo {
  key: CapabilityKey;
  status: "available" | "limited" | "unavailable" | "unknown";
  title: string;
  source: "browser" | "native" | "none";
  reason: string;
  canSee: string[];
  cannotSee: string[];
  requiredPermission: string | null;
  userAction: string;
  checkedAt: string;
}

export interface SecurityVisibilityResult {
  percent: number;
  assessmentComplete: boolean;
  checkedCapabilities: number;
  totalCapabilities: number;
  missingCritical: string[];
  explanation: string;
}

export interface WebsiteFinding {
  id?: string;
  scan_id?: string;
  check_key: string;
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  capability: "available" | "limited" | "unavailable" | "unknown";
  title: string;
  plain_explanation: string;
  technical_details: Record<string, unknown>;
  created_at?: string;
}

export interface PiiFinding {
  id?: string;
  scan_id?: string;
  pii_type: string;
  masked_preview: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  start_index?: number;
  end_index?: number;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  dedupe_key: string;
  event_type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  state: "open" | "dismissed" | "resolved";
  what_happened: string;
  why_it_matters: string;
  evidence: Array<{ key: string; value: string }>;
  what_to_do: string[];
  source: string;
  related_scan_id?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransparencyEvent {
  id: string;
  user_id: string;
  event_type: string;
  summary: string;
  data_sent_to: string[];
  data_not_accessed: string[];
  created_at: string;
}

export interface StorageUsageBreakdown {
  scans_bytes: number;
  alerts_bytes: number;
  ai_bytes: number;
  avatar_bytes: number;
  exports_bytes: number;
  total_bytes: number;
  updated_at: string;
}

export interface BlindSpotItem {
  key: CapabilityKey;
  title: string;
  status: "available" | "limited" | "unavailable" | "unknown";
  reason: string;
  canSee: string[];
  cannotSee: string[];
  requiredPermission: string | null;
  userAction: string;
}
