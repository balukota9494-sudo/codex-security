import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Sun, Moon, LogOut, User, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface TopBarProps {
  userEmail?: string;
  userMode: "standard" | "simple" | "teen";
  theme: string;
  onThemeChange: (t: string) => void;
  textSize: string;
  onTextSizeChange: (s: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userEmail,
  userMode,
  theme,
  onThemeChange,
  textSize,
  onTextSizeChange,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    onThemeChange(next);
  };

  const cycleTextSize = () => {
    const sizes = ["small", "medium", "large", "xlarge"];
    const idx = sizes.indexOf(textSize);
    const next = sizes[(idx + 1) % sizes.length];
    onTextSizeChange(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-foreground block leading-tight">
                TRUSTGUARD AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                Defensive Security
              </span>
            </div>
          </Link>

          {/* Mode Pill */}
          {userMode !== "standard" && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                userMode === "simple"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {userMode === "simple" ? "Simple Mode" : "Teen Safety Mode"}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Button */}
          <Link
            to="/demo"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Mode</span>
          </Link>

          {/* Text Size Control */}
          <button
            onClick={cycleTextSize}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-bold"
            title={`Text Size: ${textSize}. Click to change.`}
            aria-label={`Cycle text size, current is ${textSize}`}
          >
            <span className="text-sm">A</span>
            <span className="text-base font-extrabold">A</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile / Logout */}
          {userEmail ? (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Link
                to="/app/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                title={userEmail}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline-block text-xs font-medium max-w-[120px] truncate">
                  {userEmail}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Log out"
                aria-label="Log out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
