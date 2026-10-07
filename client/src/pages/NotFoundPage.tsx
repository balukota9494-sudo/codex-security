import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 max-w-md mx-auto text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-bold mx-auto text-muted-foreground">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-black text-foreground">404: Page Not Found</h1>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The destination you requested does not exist or may have been moved.
      </p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
