import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DemoPage } from "./pages/DemoPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CheckWebsitePage } from "./pages/CheckWebsitePage";
import { CheckLinkPage } from "./pages/CheckLinkPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { PrivacyCheckPage } from "./pages/PrivacyCheckPage";
import { AskAssistantPage } from "./pages/AskAssistantPage";
import { EmergencyPage } from "./pages/EmergencyPage";
import { BlindSpotsPage } from "./pages/BlindSpotsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { StoragePage } from "./pages/StoragePage";
import { TransparencyPage } from "./pages/TransparencyPage";
import { YourDataPage } from "./pages/YourDataPage";
import { LearnPage } from "./pages/LearnPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "demo", element: <DemoPage /> },
      {
        path: "app",
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "check-website", element: <CheckWebsitePage /> },
          { path: "check-link", element: <CheckLinkPage /> },
          { path: "reports/:id", element: <ReportDetailPage /> },
          { path: "privacy-check", element: <PrivacyCheckPage /> },
          { path: "ask", element: <AskAssistantPage /> },
          { path: "emergency", element: <EmergencyPage /> },
          { path: "blind-spots", element: <BlindSpotsPage /> },
          { path: "activity", element: <TransparencyPage /> },
          { path: "alerts", element: <AlertsPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "storage", element: <StoragePage /> },
          { path: "transparency", element: <TransparencyPage /> },
          { path: "your-data", element: <YourDataPage /> },
          { path: "learn", element: <LearnPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
      { path: "admin", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
