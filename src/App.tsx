import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { keymap } from "@codemirror/view";
import type { AnalysisResult, SqlDialect } from "@shanmukha_npm/querylens";
import { Activity, ArrowDownToLine, Check, CircleHelp, Clock3, Copy, Database, FileCode2, Gauge, History, Lightbulb, Play, RotateCcw, TriangleAlert } from "lucide-react";
import { parseHistory, type HistoryItem } from "./history.js";
import { playgroundSamples } from "./samples.js";

type Analysis = AnalysisResult;
type Profile = { timestamp: string; dialect: string; fingerprint: string; durationMs: number; rowCount: number | null; status: string; plan?: { raw: Array<Record<string, unknown>>; findings: Array<{ kind: string; detail: string; confidence: number }> } };
type View = "workspace" | "history" | "guidance";

const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const profilingAvailable = import.meta.env.DEV || Boolean(API);
const initialSample = playgroundSamples[0];
const initialSql = initialSample.sql;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}

function readHistory(): HistoryItem[] {
  try { return parseHistory(localStorage.getItem("querylens-history")); } catch { return []; }
}

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export default function App() {
  const [view, setView] = useState<View>("workspace");
  const [dialect, setDialect] = useState<SqlDialect>(initialSample.dialect);
  const [sqlText, setSqlText] = useState(initialSql);
  const [sampleId, setSampleId] = useState(initialSample.id);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [htmlReport, setHtmlReport] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(readHistory);
  const [loading, setLoading] = useState<"analysis" | "profile" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedSample = useMemo(() => playgroundSamples.find((sample) => sample.id === sampleId), [sampleId]);

  async function analyze() {
    setError(""); setProfile(null); setAnalysis(null); setHtmlReport("");
    if (!sqlText.trim()) { setError("Enter a SQL query to analyze."); return; }
    if (sqlText.length > 8000) { setError("Queries must be 8,000 characters or fewer."); return; }
    setLoading("analysis");
    try {
      const { QueryLens } = await import("@shanmukha_npm/querylens");
      const lens = new QueryLens({ dialect });
      const result = lens.analyze(sqlText);
      setAnalysis(result); setHtmlReport(lens.html(result));
      const next = [{ id: result.fingerprint, sql: sqlText, dialect, score: result.score, grade: result.grade, findings: result.findings.length, at: new Date().toISOString() }, ...readHistory()].slice(0, 20);
      setHistory(next);
      try { localStorage.setItem("querylens-history", JSON.stringify(next)); }
      catch { setError("Analysis succeeded, but this browser could not save query history."); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Analysis failed."); }
    finally { setLoading(null); }
  }

  async function profileSample() {
    if (!selectedSample?.profileSampleId || dialect !== "sqlite") { setError("Profiling is available only for curated SQLite samples."); return; }
    setLoading("profile"); setError(""); setProfile(null);
    try { const data = await request<{ record: Profile }>("/api/profile", { method: "POST", body: JSON.stringify({ sampleId: selectedSample.profileSampleId }) }); setProfile(data.record); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Profiling failed."); }
    finally { setLoading(null); }
  }

  async function copyResult() {
    if (!analysis) return;
    try { await navigator.clipboard.writeText(JSON.stringify(analysis, null, 2)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
    catch { setError("Copy failed. Use the JSON download button instead."); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#workspace" onClick={() => setView("workspace")} aria-label="QueryLens home"><span className="brand-mark"><Activity size={19} /></span><span>QueryLens</span><span className="brand-divider" /><span className="brand-context">Playground</span></a>
      <div className="topbar-status"><span className="status-dot" /> Browser analysis ready</div>
      <a className="icon-button help-button" aria-label="Open QueryLens package documentation" title="QueryLens documentation" href="https://github.com/cshanmukha777/querylens#readme" target="_blank" rel="noreferrer"><CircleHelp size={18} /></a>
    </header>

    <div className="app-frame">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="nav-caption">WORKSPACE</div>
        <button className={`nav-item ${view === "workspace" ? "active" : ""}`} onClick={() => setView("workspace")}><FileCode2 size={17} /> SQL analyzer</button>
        <button className={`nav-item ${view === "history" ? "active" : ""}`} onClick={() => setView("history")}><History size={17} /> Query history <span className="nav-count">{history.length}</span></button>
        <button className={`nav-item ${view === "guidance" ? "active" : ""}`} onClick={() => setView("guidance")}><Lightbulb size={17} /> Recommendations</button>
        <div className="sidebar-rule" />
        <div className="nav-caption">DATABASE</div>
        <div className="database-row"><span className="db-icon"><Database size={15} /></span><div><strong>{profilingAvailable ? "Sample store" : "SQLite profiler"}</strong><small>{profilingAvailable ? "SQLite · read only" : "Available in local development"}</small></div>{profilingAvailable && <span className="connected-dot" aria-label="Connected" />}</div>
        <div className="sidebar-foot"><div className="foot-label">CURRENT DATASET</div><div className="dataset-name">Developer shop</div><div className="dataset-meta">{profilingAvailable ? "5 tables · seeded demo data" : "Static analysis · no database connection"}</div></div>
      </aside>

      <main className="main-content">
        {view === "workspace" && <>
          <div className="page-heading"><div><div className="eyebrow">QUERY WORKSPACE</div><h1>SQL analyzer</h1><p>Run the QueryLens package in your browser. Analysis never executes your SQL.</p></div><div className="heading-meta"><span className="live-indicator" /> Static analysis</div></div>
          <section className="workspace-grid" aria-label="SQL workspace">
            <div className="editor-column">
              <div className="panel editor-panel">
                <div className="panel-toolbar"><div className="panel-title"><span className="file-icon"><FileCode2 size={15} /></span><span>Untitled query</span><span className="unsaved-dot" aria-label="Unsaved changes" /></div><div className="toolbar-actions"><label className="select-label" htmlFor="dialect">Dialect</label><select id="dialect" value={dialect} onChange={(event) => setDialect(event.target.value as SqlDialect)}><option value="sqlite">SQLite</option><option value="postgresql">PostgreSQL</option><option value="mysql">MySQL</option></select></div></div>
                <div className="sample-row"><label htmlFor="sample">Start from a sample</label><select id="sample" value={sampleId} onChange={(event) => { const id = event.target.value; setSampleId(id); const sample = playgroundSamples.find((item) => item.id === id); if (sample) { setSqlText(sample.sql); setDialect(sample.dialect); } }}><option value="">Choose query</option>{playgroundSamples.map((sample) => <option value={sample.id} key={sample.id}>{sample.name}</option>)}</select><button className="text-button" onClick={() => { setSampleId(""); setSqlText(""); setAnalysis(null); setProfile(null); setError(""); }}><RotateCcw size={14} /> Clear</button></div>
                <div className="code-editor" aria-label="SQL editor"><CodeMirror value={sqlText} height="318px" extensions={[sql(), keymap.of([{ key: "Mod-Enter", run: () => { void analyze(); return true; } }])]} onChange={setSqlText} basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, highlightSelectionMatches: true }} aria-label="SQL query input" /></div>
                <div className="editor-footer"><span><kbd>⌘</kbd> + <kbd>↵</kbd> to analyze</span><span>{sqlText.length.toLocaleString()} / 8,000 characters</span></div>
                <div className="editor-actions"><button className="primary-button" onClick={analyze} disabled={loading !== null || !sqlText.trim() || sqlText.length > 8000}><Play size={16} fill="currentColor" />{loading === "analysis" ? "Analyzing…" : "Analyze query"}</button>{profilingAvailable && <button className="secondary-button" onClick={profileSample} disabled={loading !== null || !selectedSample?.profileSampleId || dialect !== "sqlite"}><Gauge size={16} />{loading === "profile" ? "Profiling…" : "Profile sample"}</button>}<span className="profile-note">{profilingAvailable ? selectedSample?.profileSampleId && dialect === "sqlite" ? "Runs a curated SQLite sample, not editor text" : "Profiling uses curated SQLite samples only" : "SQLite profiling is available in local development"}</span></div>
              </div>
              {error && <div className="inline-error" role="alert"><TriangleAlert size={17} /><span>{error}</span></div>}
              {profile && <ProfilePanel profile={profile} />}
              <div className="safety-note"><CircleHelp size={15} /><span>Editor SQL is analyzed statically. Only server-defined sample queries can run against the demo database.</span></div>
            </div>
            <div className="results-column">
              <div className="results-header"><div><div className="eyebrow">ANALYSIS</div><h2>Results</h2></div><div className="result-actions">{analysis && <><button className="icon-button" onClick={copyResult} aria-label="Copy JSON result" title="Copy JSON"><Copy size={16} />{copied ? <Check size={14} /> : null}</button><button className="icon-button" onClick={() => download("querylens-report.json", JSON.stringify(analysis, null, 2), "application/json")} aria-label="Download JSON report" title="Download JSON"><ArrowDownToLine size={16} /></button><button className="icon-button" onClick={() => download("querylens-report.html", htmlReport, "text/html")} aria-label="Download HTML report" title="Download HTML"><FileCode2 size={16} /></button></>}</div></div>
              {analysis ? <>
                <div className="score-panel"><div className="score-main"><div className="score-kicker">STRUCTURAL SCORE <span title="Static signals only; not a speed estimate">ⓘ</span></div><div className="score-number">{analysis.score}<span>/100</span></div><div className="score-caption">Grade {analysis.grade} · {analysis.statementType.toUpperCase()}</div></div><div className={`grade-stamp grade-${analysis.grade.toLowerCase()}`}>{analysis.grade}</div><div className="score-breakdown"><SeverityCount label="Critical" count={analysis.summary.critical ?? 0} color="critical" /><SeverityCount label="Warnings" count={analysis.summary.warning ?? 0} color="warning" /><SeverityCount label="Info" count={analysis.summary.info ?? 0} color="info" /></div></div>
                <div className="fingerprint-row"><span>FINGERPRINT</span><code>{analysis.fingerprint}</code></div>
                <section className="findings-section"><div className="section-heading"><h3>Findings</h3><span>{analysis.findings.length} detected</span></div>{analysis.findings.length ? <div className="finding-list">{analysis.findings.map((finding) => <article className="finding" key={finding.id}><div className="finding-heading"><span className={`severity-mark ${finding.severity}`} /> <span className="finding-severity">{finding.severity}</span><h4>{finding.title}</h4></div><p>{finding.explanation}</p><div className="why-line"><strong>Why it matters</strong><span>{finding.whyItMatters}</span></div><div className="fix-line"><strong>Consider</strong><span>{finding.remediation}</span></div><div className="finding-meta">Confidence {Math.round(finding.confidence * 100)}% <span>·</span> Static recommendation</div></article>)}</div> : <div className="empty-findings"><Check size={17} /><span>No configured structural concerns found. Review the actual execution plan before drawing performance conclusions.</span></div>}</section>
                <div className="complexity-row"><div className="section-heading"><h3>Structure</h3><span>Parsed indicators</span></div><div className="structure-list"><span>Joins <b>{analysis.complexity.joins ?? 0}</b></span><span>Nested queries <b>{analysis.complexity.nestedQueries ?? 0}</b></span><span>OR branches <b>{analysis.complexity.booleanBranches ?? 0}</b></span><span>Projection <b>{analysis.complexity.projectionColumns ?? 0} fields</b></span></div></div>
              </> : <div className="empty-results"><div className="empty-mark"><FileCode2 size={22} /></div><h3>Analysis will appear here</h3><p>Run the query analyzer to see structural findings, evidence, and cautious next steps.</p><div className="empty-hint"><span className="keycap">01</span><span>Choose a sample or write SQL</span></div><div className="empty-hint"><span className="keycap">02</span><span>Select its SQL dialect</span></div><div className="empty-hint"><span className="keycap">03</span><span>Analyze the query</span></div></div>}
              <div className="method-note"><span className="method-icon"><Activity size={14} /></span><span>Scores summarize syntax and structure. They do not predict execution time or promise a speedup.</span></div>
            </div>
          </section>
        </>}

        {view === "history" && <HistoryView history={history} onSelect={(item) => { setSqlText(item.sql); setDialect(item.dialect); setView("workspace"); }} />}
        {view === "guidance" && <GuidanceView analysis={analysis} />}
      </main>
    </div>
  </div>;
}

function SeverityCount({ label, count, color }: { label: string; count: number; color: string }) { return <div className="severity-count"><span className={`severity-mark ${color}`} /><span>{label}</span><strong>{count}</strong></div>; }

function ProfilePanel({ profile }: { profile: Profile }) {
  return <section className="panel profile-panel"><div className="section-heading"><h3><Gauge size={16} /> Curated sample profile</h3><span>{profile.status}</span></div><div className="profile-metrics"><div><span><Clock3 size={14} /> Duration</span><strong>{profile.durationMs.toFixed(3)} <small>ms</small></strong></div><div><span>Rows returned</span><strong>{profile.rowCount ?? "—"}</strong></div><div><span>Database</span><strong>SQLite</strong></div></div><div className="plan-title">EXPLAIN QUERY PLAN <span>Non-executing plan</span></div><ul className="plan-list">{profile.plan?.raw.map((row, index) => <li key={index}><span className="plan-tree">{index === 0 ? "└" : "├"}</span><code>{String(row.detail ?? JSON.stringify(row))}</code></li>)}</ul><div className="profile-fingerprint"><span>QUERY FINGERPRINT</span><code>{profile.fingerprint}</code></div><p className="profile-disclaimer">This is one local execution against the seeded sample database. It is not a benchmark.</p></section>;
}

function HistoryView({ history, onSelect }: { history: HistoryItem[]; onSelect: (item: HistoryItem) => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">LOCAL SESSION</div><h1>Query history</h1><p>Recent static analyses stored in this browser.</p></div></div><section className="panel history-panel">{history.length ? <div className="history-table-wrap"><table><thead><tr><th>QUERY</th><th>SCORE</th><th>FINDINGS</th><th>ANALYZED</th><th></th></tr></thead><tbody>{history.map((item, index) => <tr key={`${item.id}-${index}`}><td><code>{item.sql.replace(/\s+/g, " ").slice(0, 90)}</code><small>{item.id}</small></td><td><strong>{item.score}</strong><span className={`table-grade grade-${item.grade.toLowerCase()}`}>{item.grade}</span></td><td>{item.findings}</td><td>{new Date(item.at).toLocaleString()}</td><td><button className="text-button" onClick={() => onSelect(item)}>Open query</button></td></tr>)}</tbody></table></div> : <div className="empty-history"><History size={22} /><h3>No query history yet</h3><p>Analyze a query to save its structural result in this browser.</p></div>}</section></>;
}

function GuidanceView({ analysis }: { analysis: Analysis | null }) {
  return <><div className="page-heading"><div><div className="eyebrow">EVIDENCE FIRST</div><h1>Recommendations</h1><p>Review suggestions with their reasons and limits before changing query semantics.</p></div></div>{analysis?.findings.length ? <div className="guidance-list">{analysis.findings.map((finding) => <article className="panel guidance-item" key={finding.id}><div className="guidance-title"><span className={`severity-mark ${finding.severity}`} /><span>{finding.severity}</span><h3>{finding.remediation}</h3></div><p>{finding.explanation}</p><div className="guidance-grid"><div><strong>Why it matters</strong><p>{finding.whyItMatters}</p></div><div><strong>Evidence</strong><p>{finding.evidence.join("; ")}</p></div><div><strong>Confidence</strong><p>{Math.round(finding.confidence * 100)}% · Static analysis</p></div><div><strong>Limitations</strong><p>Check equivalent semantics and validate using an actual plan and representative data.</p></div></div></article>)}</div> : <div className="panel empty-history"><Lightbulb size={22} /><h3>No recommendation to show</h3><p>Run an analysis first. Each suggestion is tied to a detected SQL structure and includes caveats.</p></div>}</>;
}
