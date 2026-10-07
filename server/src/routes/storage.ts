import { Router } from "express";
import { ADVISORY } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { sendSuccess } from "../lib/envelope.js";

export const storageRouter = Router();

// Retrieve TrustGuard account cloud storage breakdown (Never fake device storage)
storageRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;

    // Fetch counts across tables
    const [scansRes, alertsRes, aiRes, exportsRes] = await Promise.all([
      userClient.from("website_scans").select("id", { count: "exact", head: true }).eq("user_id", userId),
      userClient.from("security_alerts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      userClient.from("ai_messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
      userClient.from("data_exports").select("size_bytes").eq("user_id", userId),
    ]);

    const scansBytes = (scansRes.count || 0) * 2048; // ~2 KB per scan record
    const alertsBytes = (alertsRes.count || 0) * 1024; // ~1 KB per alert
    const aiBytes = (aiRes.count || 0) * 1536; // ~1.5 KB per AI message
    const exportsBytes = (exportsRes.data || []).reduce((acc: number, row: any) => acc + (row.size_bytes || 0), 0);
    const avatarBytes = 50 * 1024; // Estimate

    const totalBytes = scansBytes + alertsBytes + aiBytes + exportsBytes + avatarBytes;

    sendSuccess(res, {
      accountStorage: {
        scans_bytes: scansBytes,
        alerts_bytes: alertsBytes,
        ai_bytes: aiBytes,
        avatar_bytes: avatarBytes,
        exports_bytes: exportsBytes,
        total_bytes: totalBytes,
        updated_at: new Date().toISOString(),
      },
      deviceStorageHonestyNotice: ADVISORY.deviceStorage,
      storageExplanation:
        "This breakdown reflects only the cloud storage utilized by your TRUSTGUARD AI account. Operating systems do not permit websites to inspect your physical hard drive or local application files.",
    });
  } catch (err) {
    next(err);
  }
});
