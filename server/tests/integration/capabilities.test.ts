import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("Capabilities & Blind Spots API Integration", () => {
  const app = createApp();

  it("evaluates capabilities transparently on /api/capabilities/evaluate", async () => {
    const res = await request(app).get("/api/capabilities/evaluate");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.auditedAt).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
  });

  it("returns blind spots matrix on /api/blind-spots", async () => {
    const res = await request(app).get("/api/blind-spots");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.blindSpots)).toBe(true);
    expect(res.body.data.blindSpots.length).toBeGreaterThan(0);
  });
});
