import type { SqlDialect } from "@shanmukha_npm/querylens";

export type HistoryItem = {
  id: string;
  sql: string;
  dialect: SqlDialect;
  score: number;
  grade: string;
  at: string;
  findings: number;
};

const dialects = new Set<SqlDialect>(["sqlite", "postgresql", "mysql"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseHistory(raw: string | null): HistoryItem[] {
  if (raw === null) return [];

  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];

    return entries.flatMap((entry): HistoryItem[] => {
      if (!isRecord(entry)) return [];

      const { id, sql, score, grade, at, findings } = entry;
      const dialect = dialects.has(entry.dialect as SqlDialect) ? entry.dialect as SqlDialect : "sqlite";
      if (
        typeof id !== "string" || id.length === 0 ||
        typeof sql !== "string" || sql.length === 0 || sql.length > 8000 ||
        typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100 ||
        typeof grade !== "string" || grade.length === 0 || grade.length > 8 ||
        typeof at !== "string" || Number.isNaN(Date.parse(at)) ||
        typeof findings !== "number" || !Number.isInteger(findings) || findings < 0
      ) return [];

      return [{ id, sql, dialect, score, grade, at, findings }];
    }).slice(0, 20);
  } catch {
    return [];
  }
}
