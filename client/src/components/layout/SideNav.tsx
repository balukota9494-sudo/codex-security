import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Link2,
  FileLock2,
  Bot,
  AlertTriangle,
  EyeOff,
  Bell,
  History,
  Activity,
  ShieldCheck,
  HardDrive,
  GraduationCap,
  Settings,
} from "lucide-react";

interface SideNavProps {
  userMode: "standard" | "simple" | "teen";
  alertCount?: number;
}

export const SideNav: React.FC<SideNavProps> = ({ userMode, alertCount = 0 }) => {
  const navItems = [
    { label: "Dashboard", to: "/app", icon: LayoutDashboard },
    { label: "Check a Website", to: "/app/check-website", icon: Globe },
    { label: "Check a Link", to: "/app/check-link", icon: Link2 },
    { label: "Privacy Check", to: "/app/privacy-check", icon: FileLock2 },
    { label: "Ask TRUSTGUARD", to: "/app/ask", icon: Bot },
    {
      label: "I Think I'm Hacked",
      to: "/app/emergency",
      icon: AlertTriangle,
      badge: "Emergency",
      badgeColor: "bg-red-500/20 text-red-600 dark:text-red-400",
    },
    { label: "Blind Spots", to: "/app/blind-spots", icon: EyeOff },
    {
      label: "Security Alerts",
      to: "/app/alerts",
      icon: Bell,
      count: alertCount,
    },
    { label: "Security History", to: "/app/history", icon: History },
    { label: "Transparency Center", to: "/app/transparency", icon: Activity },
    { label: "Your Data", to: "/app/your-data", icon: ShieldCheck },
    { label: "Account Storage", to: "/app/storage", icon: HardDrive },
    ...(userMode === "teen"
      ? [{ label: "Learn Safety", to: "/app/learn", icon: GraduationCap }]
      : []),
    { label: "Settings", to: "/app/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-sm hidden md:flex flex-col py-6 px-3 shrink-0">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
