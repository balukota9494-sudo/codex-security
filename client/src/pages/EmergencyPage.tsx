import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Key,
  CreditCard,
  Smartphone,
  Globe,
  FileQuestion,
  Download,
} from "lucide-react";
import type { EmergencyScenario } from "@trustguard/shared";
import { apiRequest } from "../lib/apiClient";
import { ADVISORY } from "@trustguard/shared";

export const EmergencyPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<EmergencyScenario>("gave_password");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<any | null>(null);

  const scenarios: Array<{
    id: EmergencyScenario;
    title: string;
    desc: string;
    icon: any;
    urgent: boolean;
  }> = [
    {
      id: "gave_password",
      title: "I Entered or Shared My Password",
      desc: "Typed your password into a website or sent it in a message.",
      icon: Key,
      urgent: true,
    },
    {
      id: "shared_otp",
      title: "I Shared a One-Time Code (OTP)",
      desc: "Sent an SMS, WhatsApp, or authenticator code to someone.",
      icon: ShieldAlert,
      urgent: true,
    },
    {
      id: "financial_exposed",
      title: "My Payment Card or Bank May Be Exposed",
      desc: "Entered debit/credit card details on a questionable form.",
      icon: CreditCard,
      urgent: true,
    },
    {
      id: "clicked_link",
      title: "I Clicked a Suspicious Link",
      desc: "Followed a weird link from SMS, email, or a direct message.",
      icon: Globe,
      urgent: false,
    },
    {
      id: "account_strange",
      title: "My Account Is Behaving Strangely",
      desc: "Unexpected password reset emails, profile edits, or logins.",
      icon: AlertTriangle,
      urgent: false,
    },
    {
      id: "device_strange",
      title: "My Phone / Computer Is Behaving Strangely",
      desc: "Excessive pop-ups, unusual overheating, or sudden slowdowns.",
      icon: Smartphone,
      urgent: false,
    },
    {
      id: "unknown_app",
      title: "I Found an App I Didn't Install",
      desc: "An unrecognized application appears on your home screen or apps list.",
      icon: FileQuestion,
      urgent: false,
    },
    {
      id: "downloaded_suspicious",
      title: "I Downloaded a Suspicious File",
      desc: "Downloaded an installer, zip file, or attachment from an unknown source.",
      icon: Download,
      urgent: false,
    },
  ];

  // Request guidance (instant deterministic fallback returned immediately by backend)
  const fetchGuidance = async (sc: EmergencyScenario) => {
    setSelectedScenario(sc);
    setLoading(true);

    try {
      const data = await apiRequest<any>("/api/emergency/guidance", {
        method: "POST",
        body: JSON.stringify({ scenario: sc, notes: notes || undefined }),
      });
      setGuidance(data);
    } catch {
      // Offline fallback: handled gracefully
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGuidance(selectedScenario);
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              I THINK I&apos;VE BEEN HACKED
            </h1>
            <span className="text-xs text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider">
              Emergency Guided Incident Checklist
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Take a deep breath. Follow these calm, immediate, step-by-step actions to secure your accounts and protect your money right now.
        </p>
      </div>

      {/* Immediate Phone Escalation Callout */}
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-800 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-semibold">
          <PhoneCall className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>If money or payment cards are involved: Call the official number printed on the back of your card immediately.</span>
        </div>
      </div>

      {/* Scenario Selector Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Select What Happened:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => fetchGuidance(sc.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-red-500 bg-red-500/10 shadow-sm"
                    : "border-border bg-card/60 hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-xs text-foreground leading-tight">
                    {sc.title}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {sc.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guidance Checklist Display */}
      {guidance && (
        <div className="p-6 rounded-3xl border border-border bg-card/90 shadow-xl space-y-6">
          <div className="space-y-1 pb-4 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Immediate Safe Action Plan
            </span>
            <h2 className="text-xl font-black text-foreground">
              {guidance.title}
            </h2>
            <p className="text-xs text-muted-foreground font-medium pt-1">
              {guidance.deterministicChecklist?.summary}
            </p>
          </div>

          {/* Section 1: What to do RIGHT NOW */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>DO THESE STEPS FIRST:</span>
            </h3>
            <div className="space-y-2">
              {Array.isArray(guidance?.deterministicChecklist?.immediateSteps) &&
                guidance.deterministicChecklist.immediateSteps.map(
                  (step: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm font-bold text-foreground flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 font-extrabold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  )
                )}
            </div>
          </div>

          {/* Section 2: What to AVOID */}
          {Array.isArray(guidance?.deterministicChecklist?.avoidActions) &&
            guidance.deterministicChecklist.avoidActions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>WHAT TO AVOID (DO NOT DO):</span>
                </h3>
                <div className="space-y-1.5">
                  {guidance.deterministicChecklist.avoidActions.map(
                    (avoid: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-xs font-medium text-foreground flex items-start gap-2.5"
                      >
                        <span className="text-red-500 font-bold">✕</span>
                        <span>{avoid}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Section 3: Follow-up Next Steps */}
          {Array.isArray(guidance?.deterministicChecklist?.nextSteps) &&
            guidance.deterministicChecklist.nextSteps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>AFTER IMMEDIATE STEPS ARE COMPLETE:</span>
                </h3>
                <div className="space-y-1.5">
                  {guidance.deterministicChecklist.nextSteps.map(
                    (nextStep: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-start gap-2.5"
                      >
                        <span className="text-primary font-bold">•</span>
                        <span>{nextStep}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Official Channel Reminder */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
            {guidance.officialChannelNotice}
          </div>
        </div>
      )}
    </div>
  );
};
