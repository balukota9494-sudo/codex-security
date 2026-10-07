import React, { useState } from "react";
import { Globe, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { TrustReportCard } from "../components/scanning/TrustReportCard";
import { apiRequest } from "../lib/apiClient";
import { ADVISORY } from "@trustguard/shared";

export const CheckWebsitePage: React.FC = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const data = await apiRequest<any>("/api/website-scans", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      setScanResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to inspect website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              CHECK A WEBSITE
            </h1>
            <span className="text-xs text-muted-foreground">
              Passive, defensive safety assessment
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enter any domain or web address. TRUSTGUARD inspects TLS certificates, defensive headers, punycode spoofing, and lookalike brand indicators without executing harmful code.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleScan}
        className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-md space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Target Website Address or Domain
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. example.com or https://secure-login-portal.net"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-muted-foreground">
            {ADVISORY.passiveScan}
          </span>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Passively Inspecting...</span>
              </>
            ) : (
              <>
                <span>Inspect Website Safely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Safety Assessment for {scanResult.hostname}
          </h2>

          <TrustReportCard
            status={scanResult.status}
            confidence={scanResult.confidence}
            report={scanResult.report}
            findings={scanResult.findings || []}
            checkedAt={scanResult.checkedAt}
          />
        </div>
      )}
    </div>
  );
};
