import React from "react";
import { useOutletContext } from "react-router-dom";
import { Settings, Sun, Moon, Eye, Contrast, Check, Sparkles } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, userMode, setUserMode } = useOutletContext<{
    theme: string;
    setTheme: (t: string) => void;
    userMode: "standard" | "simple" | "teen";
    setUserMode: (m: "standard" | "simple" | "teen") => void;
  }>();

  const themes = [
    { id: "dark", label: "Dark Mode (Obsidian / Slate)", icon: Moon },
    { id: "light", label: "Light Mode", icon: Sun },
    { id: "high_contrast", label: "High Contrast (WCAG AAA)", icon: Contrast },
    { id: "colorblind", label: "Color-Blind Safe Palette", icon: Eye },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          ACCESSIBILITY &amp; DISPLAY SETTINGS
        </h1>
        <p className="text-xs text-muted-foreground">
          Tailor TRUSTGUARD AI to your vision and interaction preferences.
        </p>
      </div>

      <div className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        {/* Theme Picker */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Visual Theme &amp; Contrast
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((th) => {
              const Icon = th.icon;
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-extrabold text-xs text-foreground">
                      {th.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience Mode Toggle */}
        <div className="space-y-3 pt-4 border-t border-border">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Interface Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "standard", title: "Standard", desc: "Full feature suite" },
              { id: "simple", title: "Simple Mode", desc: "Large buttons, clear guides" },
              { id: "teen", title: "Teen Safety", desc: "Learn Hub, zero tracking" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setUserMode(m.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  userMode === m.id
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">
                  {m.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
