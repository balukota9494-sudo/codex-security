import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

// Dedicated admin client instantiated with the secret service role key (SERVER-ONLY)
export const supabaseAdminClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Narrow, audited admin operations.
 * Explicitly guards against dynamic or user-controlled queries.
 */
export const adminOps = {
  /**
   * Reads anonymized daily scan aggregates.
   */
  async getScanAggregates() {
    const { data, error } = await supabaseAdminClient
      .from("admin_scan_aggregates")
      .select("*")
      .order("day", { ascending: false })
      .limit(30);

    if (error) {
      logger.error({ err: error.message }, "Failed to fetch admin scan aggregates");
      throw error;
    }
    return data ?? [];
  },

  /**
   * Reads anonymized daily alert aggregates.
   */
  async getAlertAggregates() {
    const { data, error } = await supabaseAdminClient
      .from("admin_alert_aggregates")
      .select("*")
      .order("day", { ascending: false })
      .limit(30);

    if (error) {
      logger.error({ err: error.message }, "Failed to fetch admin alert aggregates");
      throw error;
    }
    return data ?? [];
  },

  /**
   * Audited system audit event log writer.
   */
  async logAuditEvent(params: {
    actorUserId?: string | null;
    actorHash: string;
    action: string;
    resource?: string;
    requestId?: string;
  }) {
    const { error } = await supabaseAdminClient.from("audit_events").insert({
      actor_user_id: params.actorUserId ?? null,
      actor_hash: params.actorHash,
      action: params.action,
      resource: params.resource ?? null,
      request_id: params.requestId ?? null,
    });

    if (error) {
      logger.error({ err: error.message }, "Failed to write audit event");
    }
  },

  /**
   * Purges expired exports from storage and DB.
   */
  async purgeExpiredExports() {
    const now = new Date().toISOString();
    const { data: expiredExports, error } = await supabaseAdminClient
      .from("data_exports")
      .select("id, storage_path")
      .lt("expires_at", now);

    if (error || !expiredExports || expiredExports.length === 0) return 0;

    const paths = expiredExports.map((e) => e.storage_path);
    await supabaseAdminClient.storage.from("exports").remove(paths);
    await supabaseAdminClient
      .from("data_exports")
      .delete()
      .in(
        "id",
        expiredExports.map((e) => e.id)
      );

    return expiredExports.length;
  },

  /**
   * Hard deletion of user data across tables for account deletion.
   */
  async deleteUserAccountAndData(userId: string) {
    // Delete storage objects
    try {
      const { data: avatarFiles } = await supabaseAdminClient.storage
        .from("avatars")
        .list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        await supabaseAdminClient.storage
          .from("avatars")
          .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
      }

      const { data: exportFiles } = await supabaseAdminClient.storage
        .from("exports")
        .list(userId);
      if (exportFiles && exportFiles.length > 0) {
        await supabaseAdminClient.storage
          .from("exports")
          .remove(exportFiles.map((f) => `${userId}/${f.name}`));
      }
    } catch (err) {
      logger.warn({ userId }, "Notice: could not clear storage files during account deletion");
    }

    // Auth user deletion deletes cascades across public tables (profiles, scans, alerts, etc.)
    const { error } = await supabaseAdminClient.auth.admin.deleteUser(userId);
    if (error) {
      logger.error({ err: error.message, userId }, "Failed to delete user in Supabase auth");
      throw error;
    }
  },
};
