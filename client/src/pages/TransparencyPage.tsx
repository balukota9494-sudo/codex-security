import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Eye, Lock, Database, Server, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { ADVISORY } from "@trustguard/shared";

export const TransparencyPage: React.FC = () => {
  const [activityData, setActivityData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/api/activity?pageSize=10")
      .then((data) => setActivityData(data))
      .catch(() => setActivityData({ events: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              TRANSPARENCY CENTER
            </h1>
            <span className="text-xs text-muted-foreground">
              What is TRUSTGUARD doing with your information?
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We believe in radical clarity. Here is an exact, unvarnished accounting of what TRUSTGUARD accesses, transmits to external providers, and what is permanently blocked from reaching our servers.
        </p>
      </div>

      {/* Core Principle Callout */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
        <p className="text-sm font-semibold text-primary">
          &ldquo;{ADVISORY.corePrinciple}&rdquo;
        </p>
      </div>

      {/* Data Access Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm uppercase">
            <CheckCircle2 className="w-5 h-5" />
            <span>Data TRUSTGUARD Accesses</span>
          </div>
          <ul className="space-y-3 text-xs text-foreground font-medium">
            <li className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <strong className="block text-sm text-foreground">URLs &amp; Hostnames You Enter</strong>
              <span className="text-muted-foreground">
                Sent to our server to perform passive DNS lookups, TLS verification, and security header checks. Stored in history only if opted in.
              </span>
            </li>
            <li className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <strong className="block text-sm text-foreground">Pasted Text for Privacy Check</strong>
              <span className="text-muted-foreground">
                Inspected in-memory on our server to detect PII. Replaced with tokens via Protect My Data. Raw text is discarded immediately and NEVER stored in the database.
              </span>
            </li>
            <li className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <strong className="block text-sm text-foreground">Assistant Prompts</strong>
              <span className="text-muted-foreground">
                Sanitized to strip private keys, passwords, and card numbers, then sent to Google Gemini for incident response.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm uppercase">
            <Lock className="w-5 h-5" />
            <span>Data TRUSTGUARD Never Accesses</span>
          </div>
          <ul className="space-y-3 text-xs text-foreground font-medium">
            <li className="p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
              <strong className="block text-sm text-foreground">Camera &amp; Microphone</strong>
              <span className="text-muted-foreground">
                Blocked at the browser header level via Permissions-Policy. A web page cannot activate sensors without explicit permission.
              </span>
            </li>
            <li className="p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
              <strong className="block text-sm text-foreground">Local Device Files &amp; Storage</strong>
              <span className="text-muted-foreground">
                We have zero access to your hard drive, personal documents, photos, or desktop filesystem.
              </span>
            </li>
            <li className="p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
              <strong className="block text-sm text-foreground">Installed &amp; Running Applications</strong>
              <span className="text-muted-foreground">
                Operating system isolation prevents web browsers from inspecting installed software or background processes.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Real-time Transparency Events Timeline */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <h2 className="text-base font-extrabold text-foreground">
          Recent Transparency Audit Log (Your Account)
        </h2>
        <p className="text-xs text-muted-foreground">
          Every time TRUSTGUARD checks a URL or consults an AI provider, a non-sensitive audit event is logged:
        </p>

        {loading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Loading activity log...
          </div>
        ) : (!Array.isArray(activityData?.events) || activityData.events.length === 0) ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No activity events recorded yet. Run a website or privacy check to see real-time transparency events.
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(activityData?.events) ? activityData.events : []).map((ev: any) => {
              const dataSentTo = Array.isArray(ev?.data_sent_to) ? ev.data_sent_to : [];
              return (
                <div
                  key={ev.id || Math.random().toString()}
                  className="p-3 rounded-xl border border-border/70 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground block">{ev.event_type}</span>
                    <span className="text-muted-foreground">{ev.summary}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-muted-foreground block">
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ""}
                    </span>
                    {dataSentTo.length > 0 && (
                      <span className="text-[10px] text-primary font-semibold">
                        Sent to: {dataSentTo.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
