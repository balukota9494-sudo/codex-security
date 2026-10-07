import React from "react";
import type { SecurityVisibilityResult } from "@trustguard/shared";
import { Eye, AlertCircle, Info } from "lucide-react";

export const VisibilityMeter: React.FC<{ visibility: SecurityVisibilityResult }> = ({
  visibility,
}) => {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight">Security Visibility</h3>
            <span className="text-xs text-muted-foreground">What TRUSTGUARD can verify</span>
          </div>
        </div>

        <div>
          {!visibility.assessmentComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Assessment Incomplete
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Inspection Complete
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>Inspection Coverage</span>
          <span className="text-primary font-mono text-sm">{visibility.percent}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500 rounded-full"
            style={{ width: `${visibility.percent}%` }}
          />
        </div>
      </div>

      {/* Radical Honesty Explainer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
        <p>{visibility.explanation}</p>
      </div>

      {/* Missing Critical Capabilities */}
      {visibility.missingCritical.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-foreground">
            Uninspectable in Browser Mode:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {visibility.missingCritical.map((item, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
