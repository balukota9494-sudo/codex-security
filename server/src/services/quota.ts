import type { SupabaseClient } from "@supabase/supabase-js";
import { LIMITS } from "@trustguard/shared";

/**
 * Checks whether user has exceeded daily activity quotas.
 */
export async function checkDailyQuota(
  userClient: SupabaseClient,
  userId: string,
  category: "scans" | "ai"
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();

  if (category === "scans") {
    const { count, error } = await userClient
      .from("website_scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startIso);

    const used = count || 0;
    const limit = LIMITS.scansPerUserPerDay;
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
    };
  }

  if (category === "ai") {
    const { count, error } = await userClient
      .from("ai_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", startIso);

    const used = count || 0;
    const limit = LIMITS.aiMessagesPerUserPerDay;
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
    };
  }

  return { allowed: true, remaining: 100, limit: 100 };
}
