import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, XCircle, AlertCircle, ShieldAlert, Filter, Loader2 } from "lucide-react";
import { SeverityChip } from "../components/common/SeverityChip";
import { apiRequest } from "../lib/apiClient";

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterState, setFilterState] = useState<string>("open");
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (stateFilter?: string) => {
    setLoading(true);
    try {
      const q = stateFilter && stateFilter !== "all" ? `&status=${stateFilter}` : "";
      const data = await apiRequest<any>(`/api/alerts?pageSize=50${q}`).catch(() => ({ alerts: [] }));
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(filterState);
  }, [filterState]);

  const handleUpdateState = async (alertId: string, newState: "dismissed" | "resolved") => {
    try {
      await apiRequest(`/api/alerts/${alertId}`, {
        method: "PATCH",
        body: JSON.stringify({ state: newState }),
      });
      // Refresh list
      fetchAlerts(filterState);
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              SECURITY ALERTS CENTER
            </h1>
            <span className="text-xs text-muted-foreground">
              Automated duplicate suppression &amp; actionable risk notifications
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Alerts generated during website checks or incident assessments appear here. Automated deduplication prevents notification overload.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["open", "resolved", "dismissed", "all"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterState(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterState === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading alerts...</p>
        </div>
      ) : (!Array.isArray(alerts) || alerts.length === 0) ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl space-y-2">
          <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
          <p className="font-bold text-foreground text-sm">No {filterState} alerts</p>
          <p>
            You have no security notifications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(Array.isArray(alerts) ? alerts : []).map((alert) => (
            <div
              key={alert.id}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityChip severity={alert.severity} />
                    <span className="text-xs font-mono text-muted-foreground">
                      {alert.event_type}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {alert.what_happened}
                  </h3>
                </div>

                {alert.state === "open" && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleUpdateState(alert.id, "resolved")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => handleUpdateState(alert.id, "dismissed")}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground font-bold text-xs transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Why It Matters */}
              <div className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/60">
                <strong className="text-primary block mb-0.5">Why It Matters:</strong>
                <span>{alert.why_it_matters}</span>
              </div>

              {/* Action Steps */}
              {Array.isArray(alert?.what_to_do) && alert.what_to_do.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground block">
                    Recommended Steps:
                  </span>
                  <ul className="space-y-1 text-xs text-muted-foreground font-medium">
                    {alert.what_to_do.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 text-[11px] text-muted-foreground flex justify-between">
                <span>Source: {alert.source}</span>
                <span>{new Date(alert.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
