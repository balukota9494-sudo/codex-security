import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Globe, FileLock2, Bot, AlertTriangle } from "lucide-react";

export const BottomNavMobile: React.FC = () => {
  const items = [
    { label: "Home", to: "/app", icon: LayoutDashboard },
    { label: "Website", to: "/app/check-website", icon: Globe },
    { label: "Privacy", to: "/app/privacy-check", icon: FileLock2 },
    { label: "Ask AI", to: "/app/ask", icon: Bot },
    { label: "Emergency", to: "/app/emergency", icon: AlertTriangle, alert: true },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-colors ${
                isActive
                  ? item.alert
                    ? "text-red-500 font-bold"
                    : "text-primary font-bold"
                  : item.alert
                  ? "text-red-400"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
