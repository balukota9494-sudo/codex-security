import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Globe,
  Link2,
  FileLock2,
  Bot,
  AlertTriangle,
  Bell,
  ArrowRight,
  Eye,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { VisibilityMeter } from "../components/visibility/VisibilityMeter";
import { SimpleModeNav } from "../components/layout/SimpleModeNav";
import { StatusBadge } from "../components/common/StatusBadge";
import { apiRequest } from "../lib/apiClient";

export const DashboardPage: React.FC = () => {
  const { userMode } = useOutletContext<{ userMode: "standard" | "simple" | "teen" }>();
  const [visibility, setVisibility] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [blindSpotsRes, scansRes, alertsRes] = await Promise.all([
          apiRequest<any>("/api/blind-spots").catch(() => null),
          apiRequest<any>("/api/website-scans?pageSize=5").catch(() => ({ scans: [] })),
          apiRequest<any>("/api/alerts?pageSize=3").catch(() => ({ alerts: [] })),
        ]);

        if (blindSpotsRes) setVisibility(blindSpotsRes.visibility);
        setRecentScans(scansRes?.scans || []);
        setRecentAlerts(alertsRes?.alerts || []);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (userMode === "simple") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Welcome to TRUSTGUARD AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Select any option below for simple, step-by-step guidance.
        </p>
        <SimpleModeNav />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Security &amp; Privacy Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Radically honest decision support for personal digital safety.
          </p>
        </div>

        <Link
          to="/demo"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Interactive Demo Sandbox</span>
        </Link>
      </div>

      {/* Visibility Metric Card */}
      {visibility && <VisibilityMeter visibility={visibility} />}

      {/* Primary Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Defensive Security Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/app/check-website"
            className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all hover:-translate-y-0.5 group space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Check a Website</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Passive inspection of URL lookalikes, TLS, and headers.
              </p>
            </div>
          </Link>

          <Link
            to="/app/check-link"
            className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/50 transition-all hover:-translate-y-0.5 group space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Check a Link</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Analyze SMS/WhatsApp links without ever opening them.
              </p>
            </div>
          </Link>

          <Link
            to="/app/privacy-check"
            className="p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/50 transition-all hover:-translate-y-0.5 group space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <FileLock2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Protect My Data</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Redact cards, keys, and PII from text before sharing.
              </p>
            </div>
          </Link>

          <Link
            to="/app/ask"
            className="p-5 rounded-2xl border border-border bg-card hover:border-purple-500/50 transition-all hover:-translate-y-0.5 group space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Ask TRUSTGUARD</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Incident-response assistance with structured steps.
              </p>
            </div>
          </Link>

          <Link
            to="/app/emergency"
            className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all hover:-translate-y-0.5 group space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground text-red-600 dark:text-red-400">
                I Think I&apos;m Hacked
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Emergency checklists for password, OTP, or financial leaks.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>Recent Website Checks</span>
            </h3>
            <Link
              to="/app/history"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No recent website checks stored. Checks are only saved when history storage is enabled in settings.
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/app/reports/${scan.id}`}
                  className="p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-foreground block truncate">
                      {scan.hostname}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StatusBadge status={scan.status} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Recent Security Alerts</span>
            </h3>
            <Link
              to="/app/alerts"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Alert Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No open security alerts. Automated duplicate suppression prevents alert fatigue.
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl border border-border/70 bg-background/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground truncate">
                      {alert.what_happened}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        alert.severity === "critical"
                          ? "bg-red-500/20 text-red-700 dark:text-red-300"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {alert.why_it_matters}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
