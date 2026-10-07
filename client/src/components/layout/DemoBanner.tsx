import React from "react";
import { ADVISORY } from "@trustguard/shared";
import { Sparkles } from "lucide-react";

export const DemoBanner: React.FC = () => {
  return (
    <div
      className="bg-purple-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
      role="banner"
      aria-label="Demo Mode Indicator"
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <span>{ADVISORY.demoBanner}</span>
    </div>
  );
};
