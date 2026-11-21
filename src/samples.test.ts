import { describe, expect, it } from "vitest";
import { QueryLens } from "@shanmukha_npm/querylens";
import { playgroundSamples } from "./samples.js";

describe("published QueryLens package integration", () => {
  it.each(playgroundSamples)("analyzes the $name sample with its selected dialect", (sample) => {
    const result = new QueryLens({ dialect: sample.dialect }).analyze(sample.sql);

    expect(result.dialect).toBe(sample.dialect);
    expect(result.statementType).toBe("select");
    expect(result.fingerprint).toBeTruthy();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("rejects malformed, empty, and multi-statement SQL", () => {
    const lens = new QueryLens({ dialect: "sqlite" });

    expect(() => lens.analyze("")).toThrow();
    expect(() => lens.analyze("SELECT FROM")).toThrow();
    expect(() => lens.analyze("SELECT 1; SELECT 2;")).toThrow();
  });
});
