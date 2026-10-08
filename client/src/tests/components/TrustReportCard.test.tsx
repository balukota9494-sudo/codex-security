import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustReportCard } from "../../components/scanning/TrustReportCard";

describe("TrustReportCard Component", () => {
  it("renders report card and handles undefined findings and partial report arrays gracefully", () => {
    const incompleteReport = {
      whatWasChecked: "Checked website example.com",
      whatWasFound: "No issues found",
      whyItMatters: "Connection security is normal",
      whatTheUserShouldDo: ["Continue browsing normally"],
      // whatCouldNotBeChecked, dataSourcesUsed, limitations missing!
      confidenceLevel: 0.9,
    } as any;

    expect(() => {
      render(
        <TrustReportCard
          status="SAFE_LOOKING"
          confidence={0.9}
          report={incompleteReport}
          findings={undefined as any}
        />
      );
    }).not.toThrow();

    expect(screen.getByText("Checked website example.com")).toBeInTheDocument();
    expect(screen.getByText("No issues found")).toBeInTheDocument();
    expect(screen.getByText(/Technical Inspection Details \(0 observed findings\)/)).toBeInTheDocument();
  });
});
