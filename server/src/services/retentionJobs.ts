import { LIMITS } from "@trustguard/shared";
import { adminOps, supabaseAdminClient } from "../lib/supabaseAdmin.js";
import { logger } from "../lib/logger.js";

/**
 * Executes scheduled data retention cleanup jobs.
 */
export async function runRetentionPurge(): Promise<{
  purgedExports: number;
  purgedAiConversations: number;
  purgedAlerts: number;
}> {
  logger.info("Executing retention purge job...");
  const now = new Date().toISOString();

  // 1. Purge expired exports
  const purgedExports = await adminOps.purgeExpiredExports();

  // 2. Purge expired AI conversations
  const { data: expiredConversations, error: convError } = await supabaseAdminClient
    .from("ai_conversations")
    .select("id")
    .lt("expires_at", now);

  let purgedAiConversations = 0;
  if (!convError && expiredConversations && expiredConversations.length > 0) {
    const ids = expiredConversations.map((c) => c.id);
    const { error: delError } = await supabaseAdminClient
      .from("ai_conversations")
      .delete()
      .in("id", ids);
    if (!delError) purgedAiConversations = ids.length;
  }

  // 3. Purge alerts older than retention period (180 days)
  const alertThreshold = new Date(
    Date.now() - LIMITS.alertRetentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: oldAlerts, error: alertError } = await supabaseAdminClient
    .from("security_alerts")
    .delete()
    .lt("created_at", alertThreshold)
    .select("id");

  const purgedAlerts = !alertError && oldAlerts ? oldAlerts.length : 0;

  logger.info(
    { purgedExports, purgedAiConversations, purgedAlerts },
    "Retention purge job completed"
  );

  return {
    purgedExports,
    purgedAiConversations,
    purgedAlerts,
  };
}
