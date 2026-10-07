import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { BottomNavMobile } from "./BottomNavMobile";
import { Footer } from "./Footer";
import { OfflineBanner } from "./OfflineBanner";
import { DemoBanner } from "./DemoBanner";
import { supabase } from "../../lib/supabaseClient";

export const AppShell: React.FC = () => {
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userMode, setUserMode] = useState<"standard" | "simple" | "teen">("standard");
  const [theme, setTheme] = useState<string>("dark");
  const [textSize, setTextSize] = useState<string>("medium");

  // Load auth state and preferences
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync theme to document body
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "high-contrast", "colorblind");
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "high_contrast") root.classList.add("high-contrast");
    else if (theme === "colorblind") root.classList.add("colorblind");
  }, [theme]);

  // Sync text size to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-small", "text-medium", "text-large", "text-xlarge");
    root.classList.add(`text-${textSize}`);
  }, [textSize]);

  // If in Simple Mode, automatically boost font size
  useEffect(() => {
    if (userMode === "simple") {
      setTextSize("xlarge");
    }
  }, [userMode]);

  const isDemoRoute = location.pathname.startsWith("/demo");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Persistent Banners */}
      <OfflineBanner />
      {isDemoRoute && <DemoBanner />}

      {/* Top Header */}
      <TopBar
        userEmail={userEmail}
        userMode={userMode}
        theme={theme}
        onThemeChange={setTheme}
        textSize={textSize}
        onTextSizeChange={setTextSize}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (hidden on public / demo / login routes) */}
        {!location.pathname.startsWith("/login") &&
          !location.pathname.startsWith("/signup") &&
          location.pathname !== "/" && (
            <SideNav userMode={userMode} alertCount={1} />
          )}

        {/* Primary Page Content */}
        <main
          id="main-content"
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full"
        >
          <Outlet context={{ userMode, setUserMode, theme, setTheme }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!location.pathname.startsWith("/login") &&
        !location.pathname.startsWith("/signup") &&
        location.pathname !== "/" && <BottomNavMobile />}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
