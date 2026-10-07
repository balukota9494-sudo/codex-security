import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("Emergency API Integration", () => {
  const app = createApp();

  it("lists all 8 emergency scenarios on /api/emergency/scenarios", async () => {
    const res = await request(app).get("/api/emergency/scenarios");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(8);
  });

  it("retrieves deterministic recovery playbook for compromised-account", async () => {
    const res = await request(app).get("/api/emergency/scenarios/compromised-account");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("compromised-account");
    expect(res.body.data.checklist.length).toBeGreaterThan(0);
    expect(res.body.data.immediateActions.length).toBeGreaterThan(0);
  });

  it("returns 404 for unknown emergency scenario", async () => {
    const res = await request(app).get("/api/emergency/scenarios/non-existent-scenario");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
