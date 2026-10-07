import React, { useState } from "react";
import {
  Bot,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SecretWarningBanner } from "../components/assistant/SecretWarningBanner";
import { StructuredAnswerCard } from "../components/assistant/StructuredAnswerCard";
import { apiRequest } from "../lib/apiClient";
import type { EmergencyScenario } from "@trustguard/shared";

export const AskAssistantPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<EmergencyScenario>("none");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scenarioQuickPicks: Array<{ id: EmergencyScenario; label: string }> = [
    { id: "clicked_link", label: "Clicked a suspicious link" },
    { id: "gave_password", label: "Typed my password on a website" },
    { id: "shared_otp", label: "Shared a verification OTP code" },
    { id: "account_strange", label: "Unrecognized account activity" },
    { id: "financial_exposed", label: "Payment card details typed" },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const userMsg = message.trim();
    setMessage("");

    const newEntry = {
      role: "user",
      text: userMsg,
      timestamp: new Date().toISOString(),
    };

    setConversationHistory((prev) => [...prev, newEntry]);

    try {
      const data = await apiRequest<any>("/api/assistant/messages", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg,
          scenario: selectedScenario,
          idempotencyKey: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }),
      });

      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          response: data.response,
          wasFallback: data.wasFallback,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reach assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              ASK TRUSTGUARD AI
            </h1>
            <span className="text-xs text-muted-foreground">
              Incident response decision support &amp; safety guidance
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ask questions about suspicious messages, unexpected pop-ups, or potential account compromises. TRUSTGUARD redacts sensitive secrets before processing and provides structured, safe next steps.
        </p>
      </div>

      {/* Mandatory Persistent Secret Warning Banner */}
      <SecretWarningBanner />

      {/* Scenario Quick Picks */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Quick Incident Context (Optional):
        </label>
        <div className="flex flex-wrap gap-2">
          {scenarioQuickPicks.map((pick) => (
            <button
              key={pick.id}
              type="button"
              onClick={() =>
                setSelectedScenario(selectedScenario === pick.id ? "none" : pick.id)
              }
              className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
                selectedScenario === pick.id
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-card border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {pick.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        {conversationHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl space-y-2">
            <Sparkles className="w-6 h-6 text-primary mx-auto opacity-70" />
            <p className="font-semibold text-foreground text-sm">
              How can TRUSTGUARD assist you today?
            </p>
            <p className="max-w-md mx-auto">
              Describe what happened—such as a strange email from your bank, an unexpected SMS, or a password prompt. We&apos;ll explain the risks and tell you what to do right now.
            </p>
          </div>
        ) : (
          conversationHistory.map((item, idx) => (
            <div key={idx} className="space-y-2">
              {item.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-2xl p-4 rounded-2xl bg-primary text-primary-foreground text-sm font-medium shadow-sm">
                    {item.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="w-full">
                    <StructuredAnswerCard
                      data={item.response}
                      wasFallback={item.wasFallback}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Redacting sensitive data and analyzing incident guidance...</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="space-y-2">
        <div className="relative">
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question or situation here... (e.g. 'I got a text asking to verify my bank account with a link. What should I do?')"
            className="w-full p-4 pr-14 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm resize-none"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="absolute right-3.5 bottom-4 p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 shadow-sm"
            aria-label="Send message to assistant"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          TRUSTGUARD AI provides decision support and education only. It is not a replacement for your bank, platform support, or law enforcement.
        </p>
      </form>
    </div>
  );
};
