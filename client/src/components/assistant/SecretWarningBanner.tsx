import React from "react";
import { ADVISORY } from "@trustguard/shared";
import { ShieldAlert } from "lucide-react";

export const SecretWarningBanner: React.FC = () => {
  return (
    <div
      className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm"
      role="alert"
    >
      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>{ADVISORY.chatBanner}</span>
    </div>
  );
};
