import React from "react";
import { Link } from "react-router-dom";
import { ADVISORY } from "@trustguard/shared";
import { Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card/60 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg">TRUSTGUARD AI</span>
              <p className="text-xs text-muted-foreground">
                Security You Can See. Privacy You Can Control. AI You Can Trust.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <Link to="/app/transparency" className="hover:text-foreground transition-colors">
              Transparency Center
            </Link>
            <Link to="/app/your-data" className="hover:text-foreground transition-colors">
              Privacy & Your Data
            </Link>
            <Link to="/app/blind-spots" className="hover:text-foreground transition-colors">
              Security Blind Spots
            </Link>
            <Link to="/app/learn" className="hover:text-foreground transition-colors">
              Safety Learning Hub
            </Link>
            <Link to="/demo" className="hover:text-foreground transition-colors text-purple-600 dark:text-purple-400">
              Interactive Demo
            </Link>
          </div>
        </div>

        {/* Core Principle Banner */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-center">
          <p className="text-sm font-semibold text-primary">
            &ldquo;{ADVISORY.corePrinciple}&rdquo;
          </p>
        </div>

        {/* Legal Decision-Support Advisory */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>{ADVISORY.disclaimerShort}</p>
          <p>{ADVISORY.noGuarantee}</p>
          <p className="pt-2 text-[11px] opacity-80">
            &copy; {new Date().getFullYear()} TRUSTGUARD AI. Built for transparency, privacy, and accessible security education.
          </p>
        </div>
      </div>
    </footer>
  );
};
