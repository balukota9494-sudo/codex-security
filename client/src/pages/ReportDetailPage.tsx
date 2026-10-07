import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { TrustReportCard } from "../components/scanning/TrustReportCard";
import { apiRequest } from "../lib/apiClient";

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await apiRequest<any>(`/api/website-scans/${id}`);
        setScan(data);
      } catch (err: any) {
        setError(err.message || "Unable to load scan report.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Loading report records...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-xl font-extrabold text-foreground">Report Not Available</h2>
        <p className="text-xs text-muted-foreground">{error || "Scan record could not be found."}</p>
        <Link
          to="/app/history"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Security History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/app/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </Link>
        <span className="text-xs text-muted-foreground font-mono">
          ID: {scan.id.slice(0, 8)}...
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          Trust Report: {scan.hostname}
        </h1>
        <p className="text-xs text-muted-foreground">
          Checked on {new Date(scan.created_at).toLocaleString()}
        </p>
      </div>

      <TrustReportCard
        status={scan.status}
        confidence={scan.confidence || 0.8}
        report={scan.report}
        findings={scan.website_findings || []}
        checkedAt={scan.created_at}
        isCached={true}
      />
    </div>
  );
};
