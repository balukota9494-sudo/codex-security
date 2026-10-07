import React from "react";
import type { Severity } from "@trustguard/shared";

export const SeverityChip: React.FC<{ severity: Severity; className?: string }> = ({
  severity,
  className = "",
}) => {
  const styles: Record<Severity, string> = {
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
    high: "bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/30",
    critical: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  };

  return (
    <span
      className={`inline-block text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${styles[severity]} ${className}`}
    >
      {severity}
    </span>
  );
};
