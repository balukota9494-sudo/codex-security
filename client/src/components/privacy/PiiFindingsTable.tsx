import React from "react";
import type { PiiCategory, Severity } from "@trustguard/shared";
import { SeverityChip } from "../common/SeverityChip";
import { ShieldAlert, Key, CreditCard, Mail, Phone, Lock, FileText } from "lucide-react";

interface PiiItem {
  piiType: PiiCategory;
  maskedPreview: string;
  severity: Severity;
}

export const PiiFindingsTable: React.FC<{ findings: PiiItem[] }> = ({ findings }) => {
  if (findings.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
        No obvious sensitive data or credential patterns observed in this text.
      </div>
    );
  }

  const getIcon = (type: PiiCategory) => {
    switch (type) {
      case "FINANCIAL":
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case "PASSWORD_LIKE":
      case "PRIVATE_KEY":
        return <Key className="w-4 h-4 text-red-500" />;
      case "API_KEY":
      case "ACCESS_TOKEN":
        return <Lock className="w-4 h-4 text-amber-500" />;
      case "EMAIL":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "PHONE":
        return <Phone className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Masked Preview</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Defensive Guidance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {findings.map((item, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                  {getIcon(item.piiType)}
                  <span>{item.piiType}</span>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-foreground bg-muted/20">
                  {item.maskedPreview}
                </td>
                <td className="py-3 px-4">
                  <SeverityChip severity={item.severity} />
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  {["PASSWORD_LIKE", "PRIVATE_KEY", "API_KEY", "FINANCIAL"].includes(item.piiType)
                    ? "Do not share publicly. Revoke or replace immediately."
                    : "Remove from text before sharing in public forums."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
