import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  FileLock2,
  Bot,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { ADVISORY } from "@trustguard/shared";

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Radically Honest Digital Safety</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
          Security You Can See. <br />
          <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Privacy You Can Control.
          </span> <br />
          AI You Can Trust.
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
          A personal digital-safety decision-support platform that helps ordinary people understand online risks—while being radically honest about what it can and cannot know.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/app"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Launch TRUSTGUARD</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/demo"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground font-bold text-base hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>Interactive Demo Mode</span>
          </Link>
        </div>

        {/* Core Principle Callout */}
        <div className="pt-6">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary">
              &ldquo;{ADVISORY.corePrinciple}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-lg text-foreground">Passive Website Checks</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Passively inspects URLs, domain lookalikes, TLS certificates, and defensive headers without ever executing malicious scripts.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FileLock2 className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-lg text-foreground">Protect My Data (PII)</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Detects credentials, API keys, and private data in text. Replaces them with safe tokens before you share. Raw text is never stored.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-lg text-foreground">Ask TrustGuard AI</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Incident-response guidance powered by Gemini with a 5-section plain-language framework and instant deterministic fallback.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-lg text-foreground">Security Blind Spots</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Full transparency into browser sandbox boundaries. We clearly state what web apps can and cannot see on your device.
          </p>
        </div>
      </section>

      {/* Radical Honesty & Limitations Section */}
      <section className="p-8 rounded-3xl border border-border bg-muted/30 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">
              What TRUSTGUARD AI Promises Never To Do
            </h2>
            <p className="text-xs text-muted-foreground">
              Security tools must never give false comfort or fabricate impossible data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-foreground">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Never claims a website is &ldquo;100% safe&rdquo; or &ldquo;guaranteed secure&rdquo;.</span>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Never pretends to scan installed apps or background processes in browser mode.</span>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Never converts unverified or incomplete checks into a reassuring green checkmark.</span>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Never stores raw user passwords, secret keys, or unredacted privacy check text.</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
          <strong>Important Advisory: </strong>{ADVISORY.disclaimerShort}
        </div>
      </section>
    </div>
  );
};
