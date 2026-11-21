import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { QueryLens, Profiler, SQLiteAdapter } from "@shanmukha_npm/querylens";
import { openReadonlyDemoDatabase } from "./database.js";
import { findProfileSample, profileSamples } from "./samples.js";

const app = express();
const origins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173").split(",").map((value) => value.trim());
const database = openReadonlyDemoDatabase();
const profiler = new Profiler(new SQLiteAdapter(database));
const analysisRequest = z.object({
  sql: z.string().min(1).max(8000),
  dialect: z.enum(["sqlite", "postgresql", "mysql"]).default("sqlite"),
}).strict();
const profileRequest = z.object({ sampleId: z.string().min(1).max(64) }).strict();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.includes(origin)), methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "8kb", strict: true }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/samples", (_request, response) => response.json({ samples: profileSamples.map(({ id, name, description, sql }) => ({ id, name, description, sql })) }));

app.post("/api/analyze", (request, response) => {
  const parsed = analysisRequest.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Provide one SQL string up to 8000 characters and a supported dialect." });
  try {
    const lens = new QueryLens({ dialect: parsed.data.dialect });
    const result = lens.analyze(parsed.data.sql);
    return response.json({ result, htmlReport: lens.html(result) });
  } catch {
    return response.status(400).json({ error: "SQL could not be analyzed for the selected dialect." });
  }
});

app.post("/api/profile", async (request, response) => {
  const parsed = profileRequest.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "A curated sampleId is required." });
  const sample = findProfileSample(parsed.data.sampleId);
  if (!sample) return response.status(404).json({ error: "Unknown sample. Choose one from the sample list." });
  try {
    const { record, rows } = await profiler.profile(sample.sql, { parameters: sample.parameters });
    return response.json({ sampleId: sample.id, record, rows });
  } catch {
    return response.status(500).json({ error: "The selected sample could not be profiled." });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) return response.status(400).json({ error: "Request body must be valid JSON." });
  if (error && typeof error === "object" && "status" in error && error.status === 413) return response.status(413).json({ error: "Request body exceeds the 8 KB limit." });
  return response.status(500).json({ error: "Unexpected server error." });
});

export { app };
export function closeDemoDatabase(): void { database.close(); }

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 4179);
  const server = app.listen(port, "0.0.0.0", () => process.stdout.write(`QueryLens API listening on ${port}\n`));
  const close = () => { server.close(); database.close(); };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}
