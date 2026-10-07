import type { SupabaseClient } from "@supabase/supabase-js";
import { adminOps, supabaseAdminClient } from "../lib/supabaseAdmin.js";

export type DeletionCategory =
  | "scan_history"
  | "ai_history"
  | "alerts"
  | "activity"
  | "uploads"
  | "exports"
  | "preferences"
  | "account";

/**
 * Handles selective category or full account deletion.
 */
export async function executeUserDeletion(
  userClient: SupabaseClient,
  userId: string,
  categories: DeletionCategory[]
) {
  const results: Record<string, boolean> = {};

  if (categories.includes("account")) {
    await adminOps.deleteUserAccountAndData(userId);
    return { accountDeleted: true };
  }

  if (categories.includes("scan_history")) {
    await Promise.all([
      userClient.from("website_scans").delete().eq("user_id", userId),
      userClient.from("link_scans").delete().eq("user_id", userId),
      userClient.from("privacy_scans").delete().eq("user_id", userId),
    ]);
    results.scan_history = true;
  }

  if (categories.includes("ai_history")) {
    await userClient.from("ai_conversations").delete().eq("user_id", userId);
    results.ai_history = true;
  }

  if (categories.includes("alerts")) {
    await userClient.from("security_alerts").delete().eq("user_id", userId);
    results.alerts = true;
  }

  if (categories.includes("activity")) {
    await userClient.from("transparency_events").delete().eq("user_id", userId);
    results.activity = true;
  }

  if (categories.includes("uploads")) {
    const { data: files } = await supabaseAdminClient.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await supabaseAdminClient.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }
    await userClient.from("profiles").update({ avatar_path: null }).eq("user_id", userId);
    results.uploads = true;
  }

  if (categories.includes("exports")) {
    const { data: exportsList } = await userClient.from("data_exports").select("storage_path").eq("user_id", userId);
    if (exportsList && exportsList.length > 0) {
      await supabaseAdminClient.storage
        .from("exports")
        .remove(exportsList.map((e) => e.storage_path));
    }
    await userClient.from("data_exports").delete().eq("user_id", userId);
    results.exports = true;
  }

  if (categories.includes("preferences")) {
    await userClient.from("user_preferences").update({
      theme: "system",
      text_size: "medium",
      reduced_motion: false,
      store_history: false,
      store_ai_history: false,
      allow_reputation_lookup: false,
      allow_ai_processing: false,
      monitoring_paused: false,
      notifications_enabled: true,
    }).eq("user_id", userId);
    results.preferences = true;
  }

  return results;
}
