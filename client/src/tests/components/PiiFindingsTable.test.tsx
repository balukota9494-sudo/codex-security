import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PiiFindingsTable } from "../../components/privacy/PiiFindingsTable";

describe("PiiFindingsTable Component", () => {
  it("displays empty state notice when no findings exist", () => {
    render(<PiiFindingsTable findings={[]} />);
    expect(
      screen.getByText(/No obvious sensitive data or credential patterns observed/)
    ).toBeInTheDocument();
  });

  it("renders table with masked findings and category icons", () => {
    const findings = [
      {
        piiType: "FINANCIAL" as const,
        maskedPreview: "****-****-****-0007",
        severity: "critical" as const,
      },
      {
        piiType: "EMAIL" as const,
        maskedPreview: "us****r@example.com",
        severity: "medium" as const,
      },
    ];

    render(<PiiFindingsTable findings={findings} />);

    expect(screen.getByText("FINANCIAL")).toBeInTheDocument();
    expect(screen.getByText("****-****-****-0007")).toBeInTheDocument();
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("us****r@example.com")).toBeInTheDocument();
  });
});
