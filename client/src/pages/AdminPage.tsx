import React, { useState, useEffect } from "react";
import { Shield, BarChart3, AlertTriangle, Users, Lock, Loader2 } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

export const AdminPage: React.FC = () => {
  const [aggregates, setAggregates] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<any>("/api/admin/aggregates")
      .then((data) => setAggregates(data.anonymizedMetrics))
      .catch((err) => setError(err.message || "Admin authorization required."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Loading administrative aggregates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-bold mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error} Server-side role verification requires an administrator token (`role: admin`). All access attempts are recorded in system audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            ADMINISTRATIVE AGGREGATES
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Server-audited aggregate analytics. Individual users and raw inputs are never exposed.
        </p>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Daily Scan Records
          </span>
          <span className="text-3xl font-black text-foreground block">
            {aggregates?.scanAggregates?.reduce((a: number, b: any) => a + Number(b.scans), 0) || 0}
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Alert Events
          </span>
          <span className="text-3xl font-black text-foreground block">
            {aggregates?.alertAggregates?.reduce((a: number, b: any) => a + Number(b.alerts), 0) || 0}
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Privacy Invariant
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block pt-1">
            Zero Identifiers Persisted
          </span>
        </div>
      </div>

      {/* Anonymized Table */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h2 className="text-base font-extrabold text-foreground">
          Recent Scan Distribution By Status
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-bold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {aggregates?.scanAggregates?.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-muted/20">
                  <td className="py-2.5 px-4 font-mono">
                    {new Date(row.day).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 font-semibold">{row.status}</td>
                  <td className="py-2.5 px-4 font-bold">{row.scans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
