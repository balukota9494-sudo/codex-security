import React, { useState } from "react";
import {
  FileLock2,
  ShieldCheck,
  Copy,
  Check,
  Upload,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { PiiFindingsTable } from "../components/privacy/PiiFindingsTable";
import { apiRequest } from "../lib/apiClient";

export const PrivacyCheckPage: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      setErrorMessage("Text file exceeds the 100 KB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content.slice(0, 20000));
    };
    reader.readAsText(file);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const data = await apiRequest<any>("/api/privacy-scans", {
        method: "POST",
        body: JSON.stringify({
          text: inputText,
          useAiExplanation: useAi,
        }),
      });
      setScanResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to inspect text for privacy risks.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRedacted = () => {
    if (scanResult?.redactedText) {
      navigator.clipboard.writeText(scanResult.redactedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileLock2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              PRIVACY CHECK &amp; PROTECT MY DATA
            </h1>
            <span className="text-xs text-muted-foreground">
              Detect sensitive information &amp; generate redacted text
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste messages, code snippets, or documents. TRUSTGUARD identifies credit card numbers, passwords, API keys, private keys, emails, and phone numbers. The &quot;Protect My Data&quot; engine produces clean redacted text safe for sharing.
        </p>
      </div>

      {/* Radical Honesty Notice */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <span>
          Radical Privacy Guarantee: Raw text pasted here is NEVER stored in our database. Only masked statistics (e.g. &quot;1 credit card found&quot;) are kept if history storage is enabled.
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleScan} className="space-y-4">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Paste Text to Inspect ({inputText.length} / 20,000 characters)
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Load .txt File (≤ 100 KB)</span>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            required
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text here... e.g. An email draft, customer inquiry, or log file containing possible emails, phone numbers, or credentials."
            className="w-full p-4 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Request AI Plain-Language Risk Explanation (Uses masked categories only)</span>
            </label>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning &amp; Redacting...</span>
                </>
              ) : (
                <>
                  <FileLock2 className="w-4 h-4" />
                  <span>PROTECT MY DATA (Scan &amp; Redact)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results Section */}
      {scanResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Banner */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h2 className="text-lg font-black text-foreground">Redaction Complete</h2>
                <span className="text-xs text-muted-foreground">
                  Identified {scanResult.totalFindings} sensitive item(s) in {scanResult.inputLength} characters.
                </span>
              </div>
              <button
                onClick={handleCopyRedacted}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors self-start sm:self-auto"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Redacted Text"}</span>
              </button>
            </div>

            {/* Redacted Output Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sanitized Redacted Text (Safe for Public Use)
              </label>
              <pre className="p-4 rounded-xl bg-muted/60 font-mono text-xs text-foreground whitespace-pre-wrap overflow-x-auto max-h-60 border border-border/80">
                {scanResult.redactedText}
              </pre>
            </div>

            {/* Masked Findings Table */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Detected Elements Breakdown (Masked Previews)
              </label>
              <PiiFindingsTable findings={scanResult.findings || []} />
            </div>

            {/* AI Explanation If Generated */}
            {scanResult.aiExplanation && (
              <div className="mt-4 p-5 rounded-xl bg-primary/5 border border-primary/15 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Privacy Risk Analysis</span>
                </div>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {scanResult.aiExplanation.overview}
                </p>
                {scanResult.aiExplanation.perType?.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-background/60 text-xs space-y-1">
                    <span className="font-bold text-foreground block">{item.piiType} Risk:</span>
                    <p className="text-muted-foreground">{item.risk}</p>
                    <p className="text-primary font-semibold">Advice: {item.advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
