import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [step, setStep] = useState<"credentials" | "consents">("credentials");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Privacy consents: STRICTLY OFF BY DEFAULT per Section 7
  const [consents, setConsents] = useState({
    storeHistory: false,
    aiProcessing: false,
    reputationLookup: false,
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      return setErrorMessage("Password must contain at least 8 characters.");
    }
    setErrorMessage(null);
    setStep("consents");
  };

  const handleFinalSignup = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "TrustGuard User",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setStep("credentials");
      } else {
        // Save initial consents if user was immediately confirmed or auto-logged-in
        navigate("/app");
      }
    } catch {
      setErrorMessage("Registration service encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="p-8 rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto shadow-md shadow-primary/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Create Your Account</h1>
          <p className="text-xs text-muted-foreground">
            {step === "credentials"
              ? "Join TRUSTGUARD AI for radical transparency and digital safety."
              : "Step 2: Transparent Privacy Choices (Off by Default)"}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Create Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Privacy Choices</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              We never collect data without explicit opt-in. Review your data processing preferences below:
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/50 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.storeHistory}
                  onChange={(e) =>
                    setConsents({ ...consents, storeHistory: e.target.checked })
                  }
                  className="mt-1 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">
                    Store Scan History
                  </span>
                  <span className="text-muted-foreground">
                    Save past website and link checks in your account so you can review them later.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/50 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.aiProcessing}
                  onChange={(e) =>
                    setConsents({ ...consents, aiProcessing: e.target.checked })
                  }
                  className="mt-1 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">
                    Allow AI Processing (Gemini)
                  </span>
                  <span className="text-muted-foreground">
                    Send redacted incident text to Google Gemini for plain-language assistance.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/50 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.reputationLookup}
                  onChange={(e) =>
                    setConsents({ ...consents, reputationLookup: e.target.checked })
                  }
                  className="mt-1 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">
                    Allow Reputation Provider Lookups
                  </span>
                  <span className="text-muted-foreground">
                    Query Google Safe Browsing threat databases when checking links.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="px-4 py-2.5 rounded-xl border border-border font-semibold text-xs hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSignup}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading ? <span>Creating Account...</span> : <span>Confirm &amp; Register</span>}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
