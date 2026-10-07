import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Search,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  Calendar,
  Globe,
  Filter,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { apiRequest } from "../lib/apiClient";
import type { AssessmentStatus } from "@trustguard/shared";

export const HistoryPage: React.FC = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : "";
      const st = statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const data = await apiRequest<any>(
        `/api/website-scans?page=${page}&pageSize=15${q}${st}`
      );
      setScans(data.scans || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHistory();
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, page]);

  const handleDeleteScan = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;
    try {
      await apiRequest(`/api/website-scans/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch {}
  };

  const handleExportData = async () => {
    try {
      const res = await apiRequest<any>("/api/data/export", { method: "POST" });
      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      }
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              SECURITY HISTORY
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Search, review, export, and delete your saved security inspections.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary/20 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hostname..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SAFE_LOOKING">Safe Looking</option>
            <option value="CAUTION">Caution</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="CRITICAL_RISK">Critical Risk</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </div>

      {/* Scans List / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading history...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl space-y-2">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
          <p className="font-bold text-foreground text-sm">No scans found</p>
          <p>
            No website checks matched your criteria. Checks are only saved if history storage is enabled in settings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card/70 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-extrabold text-sm text-foreground truncate">
                    {scan.hostname}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                  </span>
                  <span>•</span>
                  <span>Confidence: {Math.round((scan.confidence || 0.8) * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <StatusBadge status={scan.status} size="sm" />
                <Link
                  to={`/app/reports/${scan.id}`}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Report</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => handleDeleteScan(scan.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete scan record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground font-semibold">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
