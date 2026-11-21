import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { unlinkSync } from "node:fs";
import { app, closeDemoDatabase } from "../src/app.js";

describe("public demo API boundaries", () => {
  it("allows static analysis of visitor SQL without executing it", async () => {
    const response = await request(app).post("/api/analyze").send({ sql: "SELECT id FROM users WHERE id = 7", dialect: "sqlite" });
    expect(response.status).toBe(200);
    expect(response.body.result.statementType).toBe("select");
  });

  it.each(["sqlite", "postgresql", "mysql"] as const)("analyzes a SELECT with the %s parser", async (dialect) => {
    const response = await request(app).post("/api/analyze").send({ sql: "SELECT 1 AS value", dialect });
    expect(response.status).toBe(200);
    expect(response.body.result.dialect).toBe(dialect);
  });

  it("returns a client error for empty, malformed, or multi-statement SQL", async () => {
    for (const sql of ["", "SELECT FROM", "SELECT 1; SELECT 2;"]) {
      const response = await request(app).post("/api/analyze").send({ sql, dialect: "sqlite" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    }

    const invalidDialect = await request(app).post("/api/analyze").send({ sql: "SELECT 1", dialect: "sqlserver" });
    expect(invalidDialect.status).toBe(400);
  });

  it("rejects execution SQL and accepts only curated sample identifiers", async () => {
    const arbitrary = await request(app).post("/api/profile").send({ sampleId: "customers-by-city", sql: "DROP TABLE customers" });
    expect(arbitrary.status).toBe(400);
    const unknown = await request(app).post("/api/profile").send({ sampleId: "visitor-sql" });
    expect(unknown.status).toBe(404);
    const curated = await request(app).post("/api/profile").send({ sampleId: "customers-by-city" });
    expect(curated.status).toBe(200);
    expect(curated.body.record.status).toBe("success");
    expect(curated.body.rows.length).toBeGreaterThan(0);
  });

  it("rejects oversized request bodies", async () => {
    const response = await request(app).post("/api/analyze").send({ sql: "x".repeat(9000), dialect: "sqlite" });
    expect(response.status).toBe(413);
  });

  it("does not grant CORS access to an unlisted browser origin", async () => {
    const response = await request(app).get("/api/health").set("Origin", "https://untrusted.invalid");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

afterAll(() => {
  closeDemoDatabase();
  try { unlinkSync("server/test/querylens-test.sqlite"); } catch { /* File may not exist after a failed setup. */ }
});
