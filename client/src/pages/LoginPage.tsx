import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Non-enumerating safe error message
        setErrorMessage("Invalid credentials provided. Please check your email and password.");
      } else {
        navigate("/app");
      }
    } catch {
      setErrorMessage("Unable to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@trustguard.ai",
        password: "Password123!",
      });
      if (error) {
        setErrorMessage("Unable to sign in as demo user: " + error.message);
      } else {
        navigate("/app");
      }
    } catch {
      setErrorMessage("Unable to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  const handleDemoMode = () => {
    navigate("/demo");
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="p-8 rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto shadow-md shadow-primary/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Sign In to TRUSTGUARD</h1>
          <p className="text-xs text-muted-foreground">
            Radically honest defensive security and privacy decision-support.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Instant Demo Login */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Instant 1-Click Demo Sign In</span>
        </button>

        {/* Test Credentials Quick-Fill Cards */}
        <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/40 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Pre-Configured Accounts</span>
            <span className="text-[10px] text-primary lowercase font-medium">Click to fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("demo@trustguard.ai", "Password123!")}
              className="p-2 rounded-xl border border-border hover:border-primary/50 bg-background text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-foreground">🛡️ Demo User</div>
              <div className="text-[10px] text-muted-foreground truncate">demo@trustguard.ai</div>
              <div className="text-[9px] text-muted-foreground/75 font-mono">Password123!</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("balukota9494@gmail.com", "Password123!")}
              className="p-2 rounded-xl border border-border hover:border-primary/50 bg-background text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-foreground">🔑 Admin User</div>
              <div className="text-[10px] text-muted-foreground truncate">balukota9494@...</div>
              <div className="text-[9px] text-muted-foreground/75 font-mono">Password123!</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
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
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span>Signing In...</span> : <span>Sign In</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-semibold">Or</span>
          </div>
        </div>

        {/* Demo Mode Instant Action */}
        <button
          onClick={handleDemoMode}
          className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Interactive Demo Sandbox (No Auth Needed)</span>
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};
