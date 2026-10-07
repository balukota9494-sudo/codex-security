import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  EyeOff,
  Bot,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Layers,
} from "lucide-react";
import { VisibilityMeter } from "../components/visibility/VisibilityMeter";
import { apiRequest } from "../lib/apiClient";
import type { CapabilityInfo, SecurityVisibilityResult } from "@trustguard/shared";

export const BlindSpotsPage: React.FC = () => {
  const [visibility, setVisibility] = useState<SecurityVisibilityResult | null>(null);
  const [blindSpots, setBlindSpots] = useState<CapabilityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiRequest<any>("/api/blind-spots");
        setVisibility(data.visibility);
        setBlindSpots(data.blindSpots || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              SECURITY BLIND SPOTS
            </h1>
            <span className="text-xs text-muted-foreground">
              Radical transparency about browser sandbox boundaries
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Most web security checkers pretend to scan your entire device. TRUSTGUARD AI is radically honest: web applications cannot see installed apps, background tasks, or local drive contents.
        </p>
      </div>

      {/* Visibility Meter */}
      {visibility && <VisibilityMeter visibility={visibility} />}

      {/* Blind Spots Cards List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          What TRUSTGUARD Cannot Verify On Your Device ({blindSpots.length} Blind Spots)
        </h2>

        <div className="space-y-4">
          {blindSpots.map((item) => (
            <div
              key={item.key}
              className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-foreground">
                    {item.title}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.key}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.status === "unavailable"
                        ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Why Limited */}
              <div className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/50">
                <strong>Why uninspectable: </strong>
                <span>{item.reason}</span>
              </div>

              {/* What we can see vs cannot see */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    What TRUSTGUARD Can See:
                  </span>
                  {item.canSee.length === 0 ? (
                    <span className="text-muted-foreground italic">None (Strictly isolated by browser)</span>
                  ) : (
                    <ul className="space-y-1">
                      {item.canSee.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border">
                  <span className="font-bold text-red-600 dark:text-red-400 block">
                    What TRUSTGUARD Cannot See:
                  </span>
                  <ul className="space-y-1">
                    {item.cannotSee.map((c: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Action & Ask AI */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground">
                  <strong className="text-foreground">Recommended User Action: </strong>
                  <span>{item.userAction}</span>
                </div>

                <Link
                  to={`/app/ask?q=How can I manually inspect ${encodeURIComponent(item.title)} on my device?`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-500/20 transition-colors shrink-0"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI How To Check</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
