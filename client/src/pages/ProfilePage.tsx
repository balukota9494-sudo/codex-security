import React, { useState, useEffect } from "react";
import { User, Camera, Shield, Check, Loader2, Globe, Sparkles } from "lucide-react";
import { apiRequest, API_BASE } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<"standard" | "simple" | "teen">("standard");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/api/profile")
      .then((data) => {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setLanguage(data.language || "en");
        setMode(data.mode || "standard");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiRequest<any>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName, language, mode }),
      });
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch(`${API_BASE}/api/profile/avatar`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const body = await res.json();
      if (body.success && body.data) {
        setProfile(body.data.profile);
        if (body.data.avatarUrl) {
          setAvatarUrl(body.data.avatarUrl);
        }
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          PROFILE &amp; ACCOUNT SETTINGS
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your personal details, mode preference, and avatars.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      <div className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-5 pb-6 border-b border-border">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold overflow-hidden shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer transition-transform hover:scale-105">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground">Profile Picture</h3>
            <p className="text-[11px] text-muted-foreground">
              JPEG, PNG, or WebP up to 2 MB. Stored privately in dedicated cloud storage.
            </p>
            {uploadingAvatar && (
              <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading avatar...
              </span>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Language Preference
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none"
            >
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Experience Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "standard",
                  title: "Standard",
                  desc: "Comprehensive tools and full navigation.",
                },
                {
                  id: "simple",
                  title: "Simple Mode",
                  desc: "Large buttons, simplified navigation, voice-friendly.",
                },
                {
                  id: "teen",
                  title: "Teen Mode",
                  desc: "Includes the Safety Learning Hub and zero tracking.",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground block">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              {saving ? <span>Saving...</span> : <span>Save Profile Changes</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
