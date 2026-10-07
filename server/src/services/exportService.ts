import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIMITS } from "@trustguard/shared";
import { supabaseAdminClient } from "../lib/supabaseAdmin.js";

/**
 * Compiles a comprehensive export of all user data categories and stores it as an expiring object.
 */
export async function createUserDataExport(userClient: SupabaseClient, userId: string) {
  // Fetch user data across tables using RLS userClient
  const [
    profileRes,
    prefsRes,
    websiteScansRes,
    linkScansRes,
    privacyScansRes,
    alertsRes,
    aiMessagesRes,
    transparencyRes,
  ] = await Promise.all([
    userClient.from("profiles").select("*").maybeSingle(),
    userClient.from("user_preferences").select("*").maybeSingle(),
    userClient.from("website_scans").select("*, website_findings(*)").order("created_at", { ascending: false }),
    userClient.from("link_scans").select("*").order("created_at", { ascending: false }),
    userClient.from("privacy_scans").select("*, privacy_findings(*)").order("created_at", { ascending: false }),
    userClient.from("security_alerts").select("*").order("created_at", { ascending: false }),
    userClient.from("ai_conversations").select("*, ai_messages(*)").order("created_at", { ascending: false }),
    userClient.from("transparency_events").select("*").order("created_at", { ascending: false }),
  ]);

  const exportPayload = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    disclaimer: "TrustGuard AI User Data Export. Raw inputs and sensitive third-party secrets are excluded by design.",
    profile: profileRes.data,
    preferences: prefsRes.data,
    websiteScans: websiteScansRes.data || [],
    linkScans: linkScansRes.data || [],
    privacyScans: privacyScansRes.data || [],
    securityAlerts: alertsRes.data || [],
    aiConversations: aiMessagesRes.data || [],
    transparencyEvents: transparencyRes.data || [],
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const buffer = Buffer.from(jsonString, "utf-8");
  const exportId = crypto.randomUUID();
  const storagePath = `${userId}/${exportId}.json`;

  // Upload to Supabase Storage exports bucket
  const { error: uploadError } = await supabaseAdminClient.storage
    .from("exports")
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to store export archive: ${uploadError.message}`);
  }

  const expiresAt = new Date(Date.now() + LIMITS.exportExpiryHours * 60 * 60 * 1000).toISOString();

  // Create record in data_exports
  const { data: record, error: dbError } = await userClient
    .from("data_exports")
    .insert({
      user_id: userId,
      storage_path: storagePath,
      size_bytes: buffer.byteLength,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (dbError) {
    throw dbError;
  }

  // Create signed URL valid for 1 hour
  const { data: signedData } = await supabaseAdminClient.storage
    .from("exports")
    .createSignedUrl(storagePath, 3600);

  return {
    exportRecord: record,
    downloadUrl: signedData?.signedUrl,
    sizeBytes: buffer.byteLength,
    expiresAt,
  };
}
