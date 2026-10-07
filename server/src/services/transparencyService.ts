import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger.js";

export interface LogTransparencyParams {
  userId: string;
  eventType: string;
  summary: string;
  dataSentTo?: string[];
  dataNotAccessed?: string[];
}

/**
 * Records a metadata-only transparency event.
 * Shows users exactly what TRUSTGUARD transmitted and what device resources were left untouched.
 */
export async function logTransparencyEvent(
  userClient: SupabaseClient,
  params: LogTransparencyParams
) {
  const defaultNotAccessed = [
    "Device Camera",
    "Microphone",
    "GPS / Geolocation",
    "Personal File System",
    "Saved Passwords & Keystore",
  ];

  try {
    await userClient.from("transparency_events").insert({
      user_id: params.userId,
      event_type: params.eventType,
      summary: params.summary.slice(0, 300),
      data_sent_to: params.dataSentTo || [],
      data_not_accessed: params.dataNotAccessed || defaultNotAccessed,
    });
  } catch (err: any) {
    logger.warn({ err: err.message }, "Notice: could not record transparency event");
  }
}
