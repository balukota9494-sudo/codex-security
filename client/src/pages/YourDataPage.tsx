import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  Clock,
  Sparkles,
  Database,
  AlertOctagon,
  Check,
} from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export const YourDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [privacyData, setPrivacyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchPrivacyData = async () => {
    try {
      const data = await apiRequest<any>("/api/privacy");
      setPrivacyData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const handleTogglePreference = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      const updated = await apiRequest<any>("/api/privacy", {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      setPrivacyData((prev: any) => ({ ...prev, preferences: updated }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const data = await apiRequest<any>("/api/data/export", { method: "POST" });
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      await apiRequest("/api/data", {
        method: "DELETE",
        body: JSON.stringify({
          categories: ["account"],
          confirm: "DELETE",
        }),
      });
      await supabase.auth.signOut();
      navigate("/");
    } catch {}
  };

  const prefs = privacyData?.preferences;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              YOUR DATA &amp; PRIVACY CENTER
            </h1>
            <span className="text-xs text-muted-foreground">
              Granular consent management, exports, and account deletion
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You are in complete control of your data. Change consent toggles anytime, generate expiring data exports, or permanently delete your records.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Privacy preferences updated successfully.</span>
        </div>
      )}

      {/* Consent Toggles Card */}
      {prefs && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-sm">
          <h2 className="text-base font-extrabold text-foreground">
            Consent &amp; Data Storage Controls
          </h2>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm text-foreground block">
                  Store Scan History
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  When enabled, saves past website and link assessments so you can review them. When disabled, checks are ephemeral and never saved to the database.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.store_history}
                onChange={(e) => handleTogglePreference("store_history", e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm text-foreground block">
                  Allow AI Processing (Google Gemini)
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  Enables plain-language incident guidance via Gemini. All sensitive secrets are strictly redacted before sending. If disabled, verified deterministic checklists are used.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.allow_ai_processing}
                onChange={(e) =>
                  handleTogglePreference("allow_ai_processing", e.target.checked)
                }
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm text-foreground block">
                  Allow External Reputation Lookups
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  Allows querying threat databases (like Google Safe Browsing) during scans. If disabled, checks rely purely on passive technical signals.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.allow_reputation_lookup}
                onChange={(e) =>
                  handleTogglePreference("allow_reputation_lookup", e.target.checked)
                }
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Export & Delete Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-foreground">Export My Data</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Download a portable, complete JSON archive containing your profile, preferences, scans, findings, alerts, and transparency events. Export links expire in 24 hours.
          </p>
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {exportLoading ? <span>Generating Export...</span> : <span>Download JSON Export</span>}
          </button>
        </div>

        {/* Delete Data / Account */}
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-destructive">Delete My Data &amp; Account</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permanently purges all your scan history, alerts, AI conversations, uploaded avatars, and account credentials across all systems.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive font-bold text-xs hover:bg-destructive/20 flex items-center justify-center gap-2 transition-all"
          >
            Permanently Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl border border-destructive/40 bg-card shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertOctagon className="w-6 h-6" />
              <h4 className="font-black text-lg">Confirm Account Deletion</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action is immediate and irreversible. All profile data, scans, alerts, AI messages, and storage records will be wiped.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Type &quot;DELETE&quot; to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs shadow-md shadow-destructive/20 disabled:opacity-40"
              >
                Permanently Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
