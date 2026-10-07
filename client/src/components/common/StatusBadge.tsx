import React from "react";
import type { AssessmentStatus } from "@trustguard/shared";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface StatusBadgeProps {
  status: AssessmentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const config: Record<
    AssessmentStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    SAFE_LOOKING: {
      label: "SAFE-LOOKING",
      icon: <ShieldCheck className="w-4 h-4" />,
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30",
    },
    LOW_RISK: {
      label: "LOW RISK",
      icon: <ShieldCheck className="w-4 h-4" />,
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/30",
    },
    CAUTION: {
      label: "CAUTION",
      icon: <AlertTriangle className="w-4 h-4" />,
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-800 dark:text-amber-300",
      border: "border-amber-500/30",
    },
    HIGH_RISK: {
      label: "HIGH RISK",
      icon: <ShieldAlert className="w-4 h-4" />,
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      text: "text-orange-800 dark:text-orange-300",
      border: "border-orange-500/30",
    },
    CRITICAL_RISK: {
      label: "CRITICAL RISK",
      icon: <AlertOctagon className="w-4 h-4" />,
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-500/30",
    },
    UNKNOWN: {
      label: "UNKNOWN",
      icon: <HelpCircle className="w-4 h-4" />,
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/30",
    },
    UNABLE_TO_VERIFY: {
      label: "UNABLE TO VERIFY",
      icon: <HelpCircle className="w-4 h-4" />,
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/30",
    },
    NOT_CHECKED: {
      label: "NOT CHECKED",
      icon: <Clock className="w-4 h-4" />,
      bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
      text: "text-zinc-700 dark:text-zinc-300",
      border: "border-zinc-500/30",
    },
    DEMO_DATA: {
      label: "DEMO DATA",
      icon: <Sparkles className="w-4 h-4" />,
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/30",
    },
  };

  const item = config[status] || config.UNKNOWN;

  const sizeClass =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-base px-4 py-1.5 gap-2 font-bold"
      : "text-sm px-2.5 py-1 gap-1.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${item.bg} ${item.text} ${item.border} ${sizeClass} ${className}`}
      role="status"
      aria-label={`Security Status: ${item.label}`}
    >
      <span aria-hidden="true">{item.icon}</span>
      <span>{item.label}</span>
    </span>
  );
};
