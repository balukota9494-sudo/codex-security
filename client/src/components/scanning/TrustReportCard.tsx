import React, { useState } from "react";
import type { AssessmentStatus, NineElementReport, WebsiteFinding } from "@trustguard/shared";
import { StatusBadge } from "../common/StatusBadge";
import { SeverityChip } from "../common/SeverityChip";
import {
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  Layers,
  FileQuestion,
  CheckCircle2,
  Info,
} from "lucide-react";

interface TrustReportCardProps {
  status: AssessmentStatus;
  confidence: number;
  report: NineElementReport;
  findings: WebsiteFinding[];
  checkedAt?: string;
  isCached?: boolean;
}

export const TrustReportCard: React.FC<TrustReportCardProps> = ({
  status,
  confidence,
  report,
  findings,
  checkedAt,
  isCached = false,
}) => {
  const [technicalOpen, setTechnicalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Status Badge and Radical Honesty */}
      <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Safety Assessment
            </span>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} size="lg" />
              {isCached && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Cached Result (Not a live security check)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div>
              <span className="block font-medium">Confidence Level</span>
              <span className="font-extrabold text-foreground text-sm">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            {checkedAt && (
              <div>
                <span className="block font-medium">Inspected At</span>
                <span className="font-semibold text-foreground">
                  {new Date(checkedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 9-ELEMENT REPORT CARD BODY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Element 1: What was checked */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <Layers className="w-4 h-4" />
              <span>1. What Was Checked</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {report.whatWasChecked}
            </p>
          </div>

          {/* Element 2: What was found */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>2. What Was Found</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {report.whatWasFound}
            </p>
          </div>

          {/* Element 3: Why it matters */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
              <Info className="w-4 h-4" />
              <span>3. Why It Matters</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.whyItMatters}
            </p>
          </div>

          {/* Element 4: What the user should do */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>4. What You Should Do</span>
            </div>
            <ul className="text-sm text-foreground font-medium space-y-1">
              {report.whatTheUserShouldDo.map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Element 5: What could not be checked */}
        <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            <FileQuestion className="w-4 h-4" />
            <span>5. What Could Not Be Checked (Blind Spots)</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {report.whatCouldNotBeChecked.map((blind: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">✕</span>
                <span>{blind}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Elements 6, 7, 8: Meta Information */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-bold text-foreground">7. Data Sources Used: </span>
            <span>{report.dataSourcesUsed.join(", ")}</span>
          </div>
          <div>
            <span className="font-bold text-foreground">8. Key Limitations: </span>
            <span>{report.limitations.join(" ")}</span>
          </div>
        </div>

        {/* Element 9: Mandatory Legal & No Guarantee Notice */}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">9. Notice: </strong>
            {report.automatedCheckDisclaimer}
          </p>
        </div>
      </div>

      {/* 2. Technical Details Accordion */}
      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
        <button
          onClick={() => setTechnicalOpen(!technicalOpen)}
          className="w-full p-4 text-left font-bold text-sm flex items-center justify-between hover:bg-muted/40 transition-colors"
          aria-expanded={technicalOpen}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>Technical Inspection Details ({findings.length} observed findings)</span>
          </div>
          {technicalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {technicalOpen && (
          <div className="p-4 border-t border-border space-y-4">
            {report.technicalSummary && (
              <p className="text-xs font-mono bg-muted/60 p-3 rounded-lg">
                {report.technicalSummary}
              </p>
            )}

            <div className="space-y-3">
              {findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-background/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground">{f.title}</span>
                    <SeverityChip severity={f.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground">{f.plain_explanation}</p>
                  {f.technical_details && Object.keys(f.technical_details).length > 0 && (
                    <pre className="text-[11px] font-mono text-muted-foreground/80 bg-muted/30 p-2 rounded overflow-x-auto mt-2">
                      {JSON.stringify(f.technical_details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
