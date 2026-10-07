import type { SupabaseClient } from "@supabase/supabase-js";
import type { Severity } from "@trustguard/shared";
import { sha256 } from "../lib/hash.js";

export interface CreateAlertParams {
  userId: string;
  eventType: string;
  severity: Severity;
  whatHappened: string;
  whyItMatters: string;
  evidence?: Array<{ key: string; value: string }>;
  whatToDo: string[];
  source: string;
  relatedScanId?: string | null;
  isDemo?: boolean;
}

/**
 * Creates or updates a security alert with deduplication suppression.
 */
export async function createSecurityAlert(
  userClient: SupabaseClient,
  params: CreateAlertParams
) {
  // Dedupe key generated from user + eventType + source + whatHappened summary
  const dedupeRaw = `${params.userId}:${params.eventType}:${params.source}:${params.whatHappened.slice(0, 100)}`;
  const dedupeKey = sha256(dedupeRaw).slice(0, 32);

  const payload = {
    user_id: params.userId,
    dedupe_key: dedupeKey,
    event_type: params.eventType,
    severity: params.severity,
    state: "open" as const,
    what_happened: params.whatHappened.slice(0, 500),
    why_it_matters: params.whyItMatters.slice(0, 800),
    evidence: params.evidence || [],
    what_to_do: params.whatToDo,
    source: params.source,
    related_scan_id: params.relatedScanId || null,
    is_demo: params.isDemo || false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await userClient
    .from("security_alerts")
    .upsert(payload, { onConflict: "user_id,dedupe_key" })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}
