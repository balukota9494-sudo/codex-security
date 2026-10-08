import React from "react";
import type { SecurityAssistantResponse } from "@trustguard/shared";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  HelpCircle,
  Bot,
  AlertOctagon,
} from "lucide-react";

export const StructuredAnswerCard: React.FC<{
  data: Partial<SecurityAssistantResponse>;
  wasFallback?: boolean;
}> = ({ data, wasFallback = false }) => {
  const riskBadges: Record<string, { label: string; color: string }> = {
    low: { label: "LOW RISK", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
    medium: { label: "MEDIUM RISK", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
    high: { label: "HIGH RISK", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" },
    critical: { label: "CRITICAL RISK", color: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
    unknown: { label: "UNKNOWN RISK", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  };

  const badge = riskBadges[data?.riskLevel || "unknown"] || riskBadges.unknown;
  const immediateSteps = Array.isArray(data?.immediateSteps) ? data.immediateSteps : [];
  const avoidActions = Array.isArray(data?.avoidActions) ? data.avoidActions : [];
  const nextSteps = Array.isArray(data?.nextSteps) ? data.nextSteps : [];
  const limitations = Array.isArray(data?.limitations) ? data.limitations : [];
  const confidence = typeof data?.confidence === "number" ? data.confidence : 0.8;

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/85 backdrop-blur-md shadow-lg space-y-6">
      {/* Header with Risk Level and AI Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-foreground">
              TRUSTGUARD Security Guidance
            </h4>
            <span className="text-[11px] text-muted-foreground block">
              {wasFallback ? "Deterministic Safety System" : "AI Decision-Support System"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.color}`}
          >
            {badge.label}
          </span>
          {data?.escalationRequired && (
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-red-600 text-white flex items-center gap-1 animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5" />
              Contact Provider Now
            </span>
          )}
        </div>
      </div>

      {/* 1. What Happened & How Serious Might It Be? */}
      <div className="space-y-1.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>1. What Happened &amp; How Serious Might It Be?</span>
        </h5>
        <p className="text-sm text-foreground font-medium leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/50">
          {data?.summary || "Assessment in progress."}
        </p>
      </div>

      {/* 2. What Should I Do Now? (Immediate Steps) */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>2. What Should I Do Now? (Immediate Steps)</span>
        </h5>
        <ul className="space-y-2">
          {immediateSteps.map((step: string, idx: number) => (
            <li
              key={idx}
              className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-sm font-semibold text-foreground flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. What Should I Avoid? */}
      {avoidActions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            <span>3. What Should I Avoid?</span>
          </h5>
          <ul className="space-y-1.5">
            {avoidActions.map((avoid: string, idx: number) => (
              <li
                key={idx}
                className="p-2.5 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-xs font-medium text-foreground flex items-start gap-2"
              >
                <span className="text-red-500 font-bold">✕</span>
                <span>{avoid}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. What Should I Do Next? */}
      {nextSteps.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <ArrowRightCircle className="w-4 h-4" />
            <span>4. What Should I Do Next? (Follow-up)</span>
          </h5>
          <ul className="space-y-1.5">
            {nextSteps.map((next: string, idx: number) => (
              <li
                key={idx}
                className="p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary font-bold">→</span>
                <span>{next}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer: Honest Limitations & AI Disclaimer */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span>
            Limitations: {limitations.length > 0 ? limitations.join(" ") : "Automated advisory guidance only."}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span>Confidence: <strong>{Math.round(confidence * 100)}%</strong></span>
        </div>
      </div>
    </div>
  );
};
