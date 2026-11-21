import { describe, expect, it } from "vitest";
import { parseHistory } from "./history.js";

const validEntry = {
  id: "fp-1",
  sql: "SELECT 1",
  dialect: "postgresql",
  score: 82,
  grade: "B",
  at: "2026-11-21T10:00:00.000Z",
  findings: 2,
};

describe("query history parsing", () => {
  it("restores a valid entry with its SQL dialect", () => {
    expect(parseHistory(JSON.stringify([validEntry]))).toEqual([validEntry]);
  });

  it("keeps older entries usable by defaulting a missing dialect to SQLite", () => {
    const legacyEntry = { ...validEntry };
    delete (legacyEntry as Partial<typeof validEntry>).dialect;
    expect(parseHistory(JSON.stringify([legacyEntry]))[0]?.dialect).toBe("sqlite");
  });

  it("discards malformed entries and invalid storage values", () => {
    expect(parseHistory("not json")).toEqual([]);
    expect(parseHistory(JSON.stringify({ ...validEntry }))).toEqual([]);
    expect(parseHistory(JSON.stringify([{ ...validEntry, score: 101 }]))).toEqual([]);
    expect(parseHistory(JSON.stringify([{ ...validEntry, dialect: "sqlserver" }]))[0]?.dialect).toBe("sqlite");
  });

  it("limits the restored history to the twenty most recent entries", () => {
    const entries = Array.from({ length: 25 }, (_, index) => ({ ...validEntry, id: "fp-" + index }));
    expect(parseHistory(JSON.stringify(entries))).toHaveLength(20);
  });
});
