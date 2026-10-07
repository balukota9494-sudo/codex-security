import { Router } from "express";
import { UserPreferencesUpdate } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";

export const privacyRouter = Router();

// Get privacy settings, consents & data handling info
privacyRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;

    const [prefsRes, consentsRes] = await Promise.all([
      userClient.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      userClient.from("privacy_consents").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    let prefs = prefsRes.data;
    if (!prefs) {
      const { data: newPrefs } = await userClient
        .from("user_preferences")
        .insert({ user_id: userId })
        .select()
        .single();
      prefs = newPrefs;
    }

    sendSuccess(res, {
      preferences: prefs,
      consents: consentsRes.data || [],
      policyVersion: "1.0.0",
      dataHandlingSummary: {
        rawInputStored: false,
        passwordsStored: false,
        aiDataRetentionDefaultDays: prefs?.ai_retention_days || 30,
        reputationProviderLookupDefault: prefs?.allow_reputation_lookup || false,
        corePrinciple: "We do not know what we cannot verify, and we never treat unknown information as safe.",
      },
    });
  } catch (err) {
    next(err);
  }
});

// Update privacy preferences and log consent changes
privacyRouter.patch(
  "/",
  requireAuth,
  validate({ body: UserPreferencesUpdate }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const updates = req.body;

      const { data: updatedPrefs, error } = await userClient
        .from("user_preferences")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      // Append consent ledger entries if consent toggles were updated
      const consentLedgerEntries: any[] = [];
      if (updates.store_history !== undefined) {
        consentLedgerEntries.push({
          user_id: userId,
          consent_type: "history_storage",
          granted: updates.store_history,
          policy_version: "1.0.0",
        });
      }
      if (updates.allow_ai_processing !== undefined) {
        consentLedgerEntries.push({
          user_id: userId,
          consent_type: "ai_processing",
          granted: updates.allow_ai_processing,
          policy_version: "1.0.0",
        });
      }
      if (updates.allow_reputation_lookup !== undefined) {
        consentLedgerEntries.push({
          user_id: userId,
          consent_type: "reputation_lookup",
          granted: updates.allow_reputation_lookup,
          policy_version: "1.0.0",
        });
      }

      if (consentLedgerEntries.length > 0) {
        await userClient.from("privacy_consents").insert(consentLedgerEntries);
      }

      sendSuccess(res, updatedPrefs);
    } catch (err) {
      next(err);
    }
  }
);
