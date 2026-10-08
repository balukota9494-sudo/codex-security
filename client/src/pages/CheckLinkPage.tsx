import React, { useState } from "react";
import { Link2, ArrowRight, AlertCircle, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { TrustReportCard } from "../components/scanning/TrustReportCard";
import { apiRequest } from "../lib/apiClient";
import type { SourceApp } from "@trustguard/shared";

export const CheckLinkPage: React.FC = () => {
  const [url, setUrl] = useState("");
  const [sourceApp, setSourceApp] = useState<SourceApp>("sms");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apps: Array<{ id: SourceApp; label: string }> = [
    { id: "sms", label: "SMS Text Message" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "email", label: "Email" },
    { id: "telegram", label: "Telegram" },
    { id: "instagram", label: "Instagram" },
    { id: "social", label: "Social Media Post" },
    { id: "browser", label: "Web Browser" },
    { id: "other", label: "Other App" },
  ];

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const data = await apiRequest<any>("/api/link-scans", {
        method: "POST",
        body: JSON.stringify({ url: url.trim(), sourceApp }),
      });
      setScanResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to inspect link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              CHECK A LINK
            </h1>
            <span className="text-xs text-muted-foreground">
              We never open this link for you
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Suspicious links delivered via SMS, WhatsApp, or email often hide phishing forms or tracking tokens. Paste the link here to inspect it defensively.
        </p>
      </div>

      {/* Radical Honesty Notice */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <span>
          Safety Guarantee: TRUSTGUARD AI analyzes links purely at the protocol and heuristic level. We never open the link or download files to your device.
        </span>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleScan}
        className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-md space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Where Did You Receive This Link?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSourceApp(app.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  sourceApp === app.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {app.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Paste The Suspicious Link
          </label>
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://bit.ly/3xyz or http://bank-update-alert.com"
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inspecting Link Defensively...</span>
              </>
            ) : (
              <>
                <span>Inspect Link Defensively</span>
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
            Assessment for Link received via {scanResult.sourceApp ? scanResult.sourceApp.toUpperCase() : "EXTERNAL SOURCE"}
          </h2>

          {/* Indicators list */}
          {Array.isArray(scanResult.indicators) && scanResult.indicators.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Observed Link Indicators
              </span>
              <div className="space-y-2">
                {scanResult.indicators.map((ind: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>{ind.title}</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{ind.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TrustReportCard
            status={scanResult.status}
            confidence={scanResult.report?.confidenceLevel || 0.8}
            report={scanResult.report}
            findings={[]}
            checkedAt={scanResult.checkedAt}
          />
        </div>
      )}
    </div>
  );
};
