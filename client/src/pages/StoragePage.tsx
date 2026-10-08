import React, { useState, useEffect } from "react";
import { HardDrive, AlertCircle, Shield, Database, FileText, Bell, Bot, Image } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { ADVISORY } from "@trustguard/shared";

export const StoragePage: React.FC = () => {
  const [storageData, setStorageData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/api/storage")
      .then(setStorageData)
      .finally(() => setLoading(false));
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i] || "KB"}`;
  };

  const accountStorage = storageData?.accountStorage;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              ACCOUNT CLOUD STORAGE
            </h1>
            <span className="text-xs text-muted-foreground">
              Real account usage (Never fabricated device disk data)
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          See the exact storage consumed by your TRUSTGUARD AI account. Unlike misleading tools that pretend to audit your hard drive, we strictly state what we can and cannot see.
        </p>
      </div>

      {/* Radical Honesty Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          {ADVISORY.deviceStorage} Web applications run inside an isolated browser sandbox and cannot inspect other apps or your physical hard drive.
        </span>
      </div>

      {/* Storage Breakdown Cards */}
      {accountStorage && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Total Account Cloud Usage
                </span>
                <span className="text-3xl font-black text-foreground">
                  {formatBytes(accountStorage.total_bytes)}
                </span>
              </div>
              <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                Cloud Tier: Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Website Scans</span>
                </div>
                <span className="text-lg font-black text-foreground block">
                  {formatBytes(accountStorage.scans_bytes)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Alerts History</span>
                </div>
                <span className="text-lg font-black text-foreground block">
                  {formatBytes(accountStorage.alerts_bytes)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span>Assistant Messages</span>
                </div>
                <span className="text-lg font-black text-foreground block">
                  {formatBytes(accountStorage.ai_bytes)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Image className="w-4 h-4 text-emerald-500" />
                  <span>Avatar &amp; Uploads</span>
                </div>
                <span className="text-lg font-black text-foreground block">
                  {formatBytes(accountStorage.avatar_bytes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
