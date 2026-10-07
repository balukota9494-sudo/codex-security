import React from "react";
import { Link } from "react-router-dom";
import { Globe, Link2, Bot, AlertTriangle, Bell } from "lucide-react";

export const SimpleModeNav: React.FC = () => {
  const actions = [
    {
      title: "Check a Website",
      desc: "Paste an address to see if it is suspicious or trying to trick you.",
      to: "/app/check-website",
      icon: Globe,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      title: "Check a Link from a Message",
      desc: "Check a link from SMS or WhatsApp safely without opening it.",
      to: "/app/check-link",
      icon: Link2,
      color: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
    {
      title: "Ask TrustGuard AI",
      desc: "Ask any question in plain English about an email or message.",
      to: "/app/ask",
      icon: Bot,
      color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    {
      title: "I Think I've Been Hacked",
      desc: "Emergency guided steps if you shared a password, OTP, or clicked something dangerous.",
      to: "/app/emergency",
      icon: AlertTriangle,
      color: "bg-red-600 hover:bg-red-700 text-white animate-pulse",
    },
    {
      title: "View Security Alerts",
      desc: "See recent warnings or notifications about your checks.",
      to: "/app/alerts",
      icon: Bell,
      color: "bg-slate-700 hover:bg-slate-800 text-white",
    },
  ];

  return (
    <div className="space-y-4 my-6">
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Choose What You Would Like To Do:
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.to}
              to={act.to}
              className={`min-h-[72px] p-5 rounded-2xl shadow-lg flex items-center justify-between gap-4 transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${act.color}`}
              aria-label={`${act.title}: ${act.desc}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold leading-tight">{act.title}</h3>
                  <p className="text-sm opacity-90 leading-snug">{act.desc}</p>
                </div>
              </div>
              <span className="text-xl font-bold">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
