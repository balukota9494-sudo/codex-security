import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VisibilityMeter } from "../../components/visibility/VisibilityMeter";
import type { SecurityVisibilityResult } from "@trustguard/shared";

describe("VisibilityMeter Component", () => {
  it("renders visibility percentage and progress bar", () => {
    const mockVisibility: SecurityVisibilityResult = {
      percent: 85,
      checkedCapabilities: 10,
      totalCapabilities: 12,
      missingCritical: ["OS Processes", "Local Disk"],
      explanation: "Browser mode inspects HTTP headers, TLS, and DNS records.",
      assessmentComplete: true,
    };

    render(<VisibilityMeter visibility={mockVisibility} />);

    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Inspection Coverage")).toBeInTheDocument();
    expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    expect(screen.getByText(/Browser mode inspects HTTP headers/)).toBeInTheDocument();
    expect(screen.getByText("OS Processes")).toBeInTheDocument();
    expect(screen.getByText("Local Disk")).toBeInTheDocument();
  });

  it("shows Assessment Incomplete badge when assessmentComplete is false", () => {
    const mockVisibility: SecurityVisibilityResult = {
      percent: 40,
      checkedCapabilities: 4,
      totalCapabilities: 12,
      missingCritical: ["TLS Certificate"],
      explanation: "Connection timed out before inspection completed.",
      assessmentComplete: false,
    };

    render(<VisibilityMeter visibility={mockVisibility} />);

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Assessment Incomplete")).toBeInTheDocument();
  });

  it("safely handles undefined or missing missingCritical array without throwing", () => {
    const incompleteVisibility = {
      percent: 21,
      assessmentComplete: true,
      explanation: "Browser Sandbox Perimeter.",
    } as any;

    expect(() => {
      render(<VisibilityMeter visibility={incompleteVisibility} />);
    }).not.toThrow();

    expect(screen.getByText("21%")).toBeInTheDocument();
    expect(screen.getByText("Browser Sandbox Perimeter.")).toBeInTheDocument();
  });

  it("safely renders null when visibility is null or undefined", () => {
    const { container } = render(<VisibilityMeter visibility={null} />);
    expect(container.firstChild).toBeNull();
  });
});
