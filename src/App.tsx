import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Network,
  FlaskConical,
  ScanLine,
  History,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Plus,
  Play,
  Search,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Command,
  MoreHorizontal,
  ExternalLink,
  Download,
  SlidersHorizontal,
  RotateCcw,
  X,
  Menu,
  Activity,
  Server,
  LockKeyhole,
  Clock3,
  Loader2,
  CircleDot,
  AlertTriangle,
  Eye,
  GitCompareArrows,
  Fingerprint,
  Database,
  Globe2,
  Circle,
} from "lucide-react";
import { scenarios, findings, initialState, trend } from "./data";
import type { State, Run, Scenario, Finding } from "./types";
import { Badge, Count, Panel, Modal, OutcomeIcon } from "./components/ui";
import Topology, { assets } from "./components/Topology";
import Landing from "./pages/Landing";
const nav = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "topology", name: "Network Topology", icon: Network },
  { id: "scenarios", name: "Test Scenarios", icon: FlaskConical },
  { id: "findings", name: "Security Findings", icon: ScanLine },
  { id: "history", name: "Test History", icon: History },
  { id: "reports", name: "Reports", icon: FileText },
];
const pageInfo: Record<string, [string, string]> = {
  overview: ["Security Overview", "Your environment at a glance."],
  topology: [
    "Network Topology",
    "Understand the paths. Validate the boundaries.",
  ],
  scenarios: [
    "Controlled Security Tests",
    "Run repeatable checks against your isolated demonstration environment.",
  ],
  findings: [
    "Security Findings",
    "Evidence first. Understand what needs your attention.",
  ],
  history: [
    "Test History",
    "A traceable record of every check and every outcome.",
  ],
  reports: ["Reports", "Turn validation results into reviewable evidence."],
  settings: ["Environment Settings", "Define your scope. Stay in control."],
  remediation: [
    "Fix. Verify. Improve.",
    "A proposed change is only as good as the evidence behind it.",
  ],
};
const time = (d: string) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
const date = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
function load(): State {
  try {
    const raw = localStorage.getItem("sentinel-state-v1");
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.runs) && s.runs.length) return s;
    }
  } catch {}
  return initialState();
}
export default function App() {
  const prefersReduced = useReducedMotion();
  const [state, setState] = useState<State>(load);
  const [page, setPage] = useState(location.hash.slice(1) || "overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [detail, setDetail] = useState<{ kind: string; id: string } | null>(
    null,
  );
  const [search, setSearch] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [execution, setExecution] = useState<{
    scenario: Scenario;
    progress: number;
    result?: Run;
    fix?: boolean;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [historyFilter, setHistoryFilter] = useState("All outcomes");
  const [scenarioFilter, setScenarioFilter] = useState("All scenarios");
  const [dateFilter, setDateFilter] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [findingFilter, setFindingFilter] = useState("All findings");
  const [topologyMode, setTopologyMode] = useState("Logical view");
  const [reportRuns, setReportRuns] = useState<string[]>([]);
  const [reportFindings, setReportFindings] = useState(
    findings.map((f) => f.id),
  );
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("sentinel-state-v1", JSON.stringify(state));
    } catch {
      setToast(
        "Browser storage unavailable. Changes will last only for this session.",
      );
    }
  }, [state]);
  useEffect(() => {
    const fn = () => setPage(location.hash.slice(1) || "overview");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch("");
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  function go(p: string) {
    location.hash = p;
    setPage(p);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const openFindings = findings.filter(
    (f) => !state.fixed || f.id === "FND-002",
  );
  const passed = state.runs.filter((r) => r.outcome === "Passed").length;
  const passRate = Math.round((passed / state.runs.length) * 100);
  const exposure = openFindings.reduce(
    (n, f) =>
      n + (f.severity === "High" ? 22 : f.severity === "Medium" ? 10 : 4),
    0,
  );
  function run(s: Scenario, fix = false) {
    if (timer.current) return;
    setDetail(null);
    setExecution({ scenario: s, progress: 0, fix });
    let progress = 0;
    timer.current = setInterval(() => {
      progress += 10;
      if (progress < 100) {
        setExecution({ scenario: s, progress, fix });
        return;
      }
      clearInterval(timer.current!);
      timer.current = null;
      const current = stateRef.current;
      const restricted = fix || current.policy;
      const make = (scenario: Scenario, idx = 0): Run => {
        const remediated =
          restricted &&
          (scenario.id === "SCN-001" || scenario.id === "SCN-003");
        return {
          id: `RUN-${Date.now().toString().slice(-7)}${idx}`,
          scenarioId: scenario.id,
          title: scenario.title,
          date: new Date().toISOString(),
          outcome: remediated ? "Passed" : scenario.outcome,
          duration: "2.8s",
          environment: current.environment,
          observed: remediated
            ? "Simulated source restricted to 10.0.1.0/24. Unexpected access blocked; approved application traffic remains permitted."
            : scenario.observed,
          expected: scenario.expected,
          fixed: restricted,
          finding: remediated ? undefined : scenario.finding,
        };
      };
      const result = make(s);
      const results = fix
        ? [result, make(scenarios[1], 1), make(scenarios[2], 2)]
        : [result];
      setState((prev) => ({
        ...prev,
        runs: [...results, ...prev.runs],
        fixed: fix ? true : prev.fixed,
        policy: restricted,
      }));
      setExecution({ scenario: s, progress: 100, result, fix });
      setToast(
        fix
          ? "Correction verified. Three checks passed and evidence saved."
          : "Validation complete. Evidence added to test history.",
      );
    }, 280);
  }
  function reportData() {
    const runs = state.runs.filter((r) => reportRuns.includes(r.id));
    return {
      title: "SENTINEL — Security validation report",
      generatedAt: new Date().toISOString(),
      notice: "SIMULATED ENVIRONMENT — NO LIVE NETWORK ACTIVITY",
      environment: state.environment,
      scope:
        "Isolated demonstration environment. Deterministic local policy and path simulations only.",
      executiveSummary: `${runs.length} tests selected; ${runs.filter((r) => r.outcome === "Passed").length} passed. ${reportFindings.length} findings included.`,
      tests: runs,
      findings: findings
        .filter((f) => reportFindings.includes(f.id))
        .map((f) => ({
          ...f,
          status: state.fixed && f.id !== "FND-002" ? "Resolved" : "Open",
        })),
      retestResults: runs.filter((r) => r.fixed),
      limitations: [
        "Illustrative, simulated evidence only. No network probes or real database access occurred.",
        "Network reachability does not establish authentication or authorization.",
        "Human review of real logs and authorized testing would be required for confirmation.",
      ],
    };
  }
  async function exportReport(format: string) {
    const data = reportData();
    if (!data.tests.length) {
      setToast("Select at least one test run to generate a report.");
      return;
    }
    if (format === "JSON") {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "sentinel-validation-report.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 24;
      const line = (text: string, size = 10) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, 170);
        for (const l of lines) {
          if (y > 276) {
            doc.addPage();
            y = 22;
          }
          doc.setTextColor(40, 45, 35);
          doc.text(l, 20, y);
          y += size * 0.48 + 2;
        }
        y += 3;
      };
      line("SENTINEL / VALIDATION REPORT", 20);
      line(data.notice, 9);
      line("01 / Environment and scope", 13);
      line(data.environment);
      line(data.scope);
      line("02 / Executive summary", 13);
      line(data.executiveSummary);
      line("03 / Tests, observed results & evidence", 13);
      data.tests.forEach((r) => {
        line(`${r.id} | ${r.title} | ${r.outcome}`, 11);
        line(`Expected: ${r.expected}`);
        line(`Observed: ${r.observed}`);
        line(`Record: ${r.date} / ${r.duration} / ${r.environment}`);
      });
      line("04 / Findings and recommendations", 13);
      data.findings.forEach((f) => {
        line(`${f.id} | ${f.severity} | ${f.status} | ${f.title}`, 11);
        line(`Evidence: ${f.evidence}`);
        line(`Recommendation: ${f.recommendation}`);
      });
      line("05 / Retest results", 13);
      line(
        data.retestResults.length
          ? data.retestResults.map((r) => `${r.id}: ${r.outcome}`).join("; ")
          : "No verified retest in the selected records.",
      );
      line("06 / Limitations and assumptions", 13);
      data.limitations.forEach((l) => line(l));
      doc.save("sentinel-validation-report.pdf");
    }
    setToast(`${format} report exported.`);
  }
  const filteredRuns = state.runs.filter(
    (r) =>
      (historyFilter === "All outcomes" || r.outcome === historyFilter) &&
      (scenarioFilter === "All scenarios" || r.scenarioId === scenarioFilter) &&
      (!dateFilter || r.date.slice(0, 10) >= dateFilter) &&
      (!dateEnd || r.date.slice(0, 10) <= dateEnd),
  );
  function table(runs: Run[], full = false) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TEST SCENARIO</th>
              <th>OUTCOME</th>
              <th>{full ? "DATE & TIME" : "LAST RUN"}</th>
              <th>DURATION</th>
              {full && (
                <>
                  <th>FINDING</th>
                  <th>ENVIRONMENT</th>
                </>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr
                key={r.id}
                onClick={() => setDetail({ kind: "run", id: r.id })}
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && setDetail({ kind: "run", id: r.id })
                }
              >
                <td>
                  <div className="test-cell">
                    <span className="table-icon">
                      <FlaskConical size={16} />
                    </span>
                    <div>
                      <strong>{r.title}</strong>
                      <small>
                        {r.scenarioId} <span>·</span> {r.id}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge value={r.outcome} />
                </td>
                <td className="muted mono">
                  {full && date(r.date) + " · "}
                  {time(r.date)}
                </td>
                <td className="mono muted">{r.duration}</td>
                {full && (
                  <>
                    <td className="mono muted">{r.finding || "—"}</td>
                    <td className="muted">{r.environment}</td>
                  </>
                )}
                <td>
                  <ArrowUpRight size={15} className="row-arrow" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!runs.length && (
          <div className="empty">
            <Search size={25} />
            <h3>No matching test runs</h3>
            <p>Adjust your filters or execute a new scenario.</p>
          </div>
        )}
      </div>
    );
  }
  function eventFeed() {
    return (
      <div className="events">
        {state.activity ? (
          state.runs.slice(0, 4).map((r, i) => (
            <button
              className="event"
              key={r.id}
              onClick={() => setDetail({ kind: "run", id: r.id })}
            >
              <div className="event-track">
                <span
                  className={`event-icon ${r.outcome === "Passed" ? "green" : r.outcome === "Finding detected" ? "red" : "amber"}`}
                >
                  <OutcomeIcon value={r.outcome} />
                </span>
                {i < 3 && <i />}
              </div>
              <div className="event-body">
                <div className="event-time">
                  {time(r.date)}
                  <span>SIMULATED</span>
                </div>
                <strong>
                  {r.scenarioId === "SCN-001"
                    ? r.outcome === "Passed"
                      ? "Unexpected access blocked"
                      : "Unexpected access scenario flagged"
                    : r.scenarioId === "SCN-002"
                      ? "Trusted application path verified"
                      : r.scenarioId === "SCN-003"
                        ? "Broad source rule identified"
                        : "Security boundary needs review"}
                </strong>
                <small>
                  {r.scenarioId} <span>·</span> {r.environment}
                </small>
              </div>
              <ChevronRight size={14} />
            </button>
          ))
        ) : (
          <div className="empty">
            <p>Activity feed is paused in Settings.</p>
          </div>
        )}
      </div>
    );
  }
  const heading = pageInfo[page] || pageInfo.overview;
  return (
    <MotionConfig reducedMotion={state.reduced ? "always" : "user"}>
      <div
        className={`app ${collapsed ? "sidebar-collapsed" : ""} ${state.reduced ? "reduce-motion" : ""} ${state.theme === "Contrast" ? "high-contrast" : ""}`}
      >
        {mobile && (
          <div className="drawer-backdrop" onClick={() => setMobile(false)} />
        )}
        <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
          <button
            className="brand"
            onClick={() => go("overview")}
            aria-label="Sentinel overview"
          >
            <span className="brand-mark">
              <Shield size={27} strokeWidth={1.8} />
              <i />
            </span>
            <span>
              SENTINEL<span className="brand-period">.</span>
            </span>
          </button>
          <button className="workspace" onClick={() => go("settings")}>
            <span className="workspace-icon">
              <LayersIcon />
            </span>
            <div>
              <strong>{state.environment}</strong>
              <small>
                <i /> Demo environment
              </small>
            </div>
            <ChevronDown size={15} />
          </button>
          <div className="nav-label">WORKSPACE</div>
          <nav>
            {nav.map((n) => (
              <button
                key={n.id}
                title={collapsed ? n.name : undefined}
                onClick={() => go(n.id)}
                className={`nav-item ${page === n.id ? "active" : ""}`}
              >
                <n.icon size={18} strokeWidth={1.65} />
                <span>{n.name}</span>
                {n.id === "findings" && <b>{openFindings.length}</b>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="scope-box" onClick={() => setShowNotice(true)}>
              <span>
                <ShieldCheck size={17} /> SAFE BY DESIGN
              </span>
              <p>
                Simulated tests.
                <br />
                Real security insights.
              </p>
              <small>
                Explore the platform <ArrowUpRight size={13} />
              </small>
            </button>
            <button
              className={`nav-item ${page === "settings" ? "active" : ""}`}
              onClick={() => go("settings")}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button className="nav-item" onClick={() => go("landing")}>
              <CircleHelp size={18} />
              <span>About the platform</span>
              <ArrowUpRight size={14} />
            </button>
            <div className="profile">
              <span className="avatar">AK</span>
              <div>
                <strong>Alex Kim</strong>
                <small>Workspace admin</small>
              </div>
              <button
                title="Workspace settings"
                className="icon-btn"
                onClick={() => go("settings")}
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronsRight size={15} />
              ) : (
                <>
                  <ChevronsLeft size={15} />
                  <span>Collapse sidebar</span>
                  <kbd>⌘ [</kbd>
                </>
              )}
            </button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-btn"
                onClick={() => setMobile(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <ShieldCheck size={15} />
              <span>Workspace</span>
              <ChevronRight size={12} />
              <strong>
                {page === "landing"
                  ? "The platform"
                  : heading[0] === "Security Overview"
                    ? "Overview"
                    : nav.find((n) => n.id === page)?.name || heading[0]}
              </strong>
            </div>
            <div className="topbar-right">
              <span className="demo-tag">
                <i /> Demo mode
              </span>
              <span className="top-divider" />
              <button
                className="search-button"
                onClick={() => setSearch("")}
                aria-label="Search workspace"
              >
                <Search size={17} />
                <kbd>⌘ K</kbd>
              </button>
              <button
                className="icon-btn notification-button"
                onClick={() => setShowNotice(true)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <i />
              </button>
              <button className="top-avatar" onClick={() => go("settings")}>
                AK
              </button>
            </div>
          </header>
          <main>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {page === "landing" ? (
                  <Landing
                    go={go}
                    onSelect={(id, edge) =>
                      setDetail({ kind: edge ? "edge" : "asset", id })
                    }
                  />
                ) : (
                  <>
                    <div className="page-title">
                      <div>
                        <div className="micro page-eyebrow">
                          {page === "overview"
                            ? "VISIBILITY. VALIDATION. CONFIDENCE."
                            : "SENTINEL / SECURITY WORKSPACE"}
                        </div>
                        <h1>{heading[0]}</h1>
                        <p>{heading[1]}</p>
                      </div>
                      <div className="page-actions">
                        {page === "overview" ? (
                          <>
                            <button
                              className="btn secondary"
                              onClick={() => go("reports")}
                            >
                              <Download size={15} />
                              Export report
                            </button>
                            <button
                              className="btn primary"
                              onClick={() => go("scenarios")}
                            >
                              <Plus size={17} />
                              Run a test
                            </button>
                          </>
                        ) : page === "topology" ? (
                          <button
                            className="btn primary"
                            onClick={() => run(scenarios[0])}
                          >
                            <Play size={15} />
                            Run Path Validation
                          </button>
                        ) : page === "findings" ? (
                          <button
                            className="btn primary"
                            onClick={() => go("remediation")}
                          >
                            <GitCompareArrows size={16} />
                            Review proposed fix
                          </button>
                        ) : page === "history" ? (
                          <button
                            className="btn secondary"
                            onClick={() => go("scenarios")}
                          >
                            <Plus size={16} />
                            New test
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="environment-banner">
                      <div>
                        <ShieldCheck size={14} />
                        <span>SIMULATED ENVIRONMENT</span>
                        <i />
                        <p>
                          No live network activity. All results are generated
                          from local test data.
                        </p>
                      </div>
                      <button onClick={() => setShowNotice(true)}>
                        View scope <ArrowUpRight size={13} />
                      </button>
                    </div>
                    {page === "overview" && (
                      <>
                        <div className="metrics">
                          {[
                            {
                              label: "Tests Executed",
                              value: state.runs.length,
                              icon: FlaskConical,
                              sub: "Across 4 controlled scenarios",
                              trend: `+${state.runs.length - 16} this session`,
                              color: "neutral",
                            },
                            {
                              label: "Checks Passed",
                              value: passed,
                              icon: ShieldCheck,
                              sub: `${passRate}% of all checks passed`,
                              trend: "Expected behavior verified",
                              color: "green",
                            },
                            {
                              label: "Open Findings",
                              value: openFindings.length,
                              icon: ScanLine,
                              sub: `${state.fixed ? "0 high · 1 medium · 0 low" : "1 high · 1 medium · 1 low"}`,
                              trend: "Review recommended",
                              color: "amber",
                            },
                            {
                              label: "Exposure Indicator",
                              value: exposure,
                              icon: Activity,
                              sub: "Lower is better",
                              trend: state.fixed
                                ? "Low exposure"
                                : "Moderate exposure",
                              color: "amber",
                            },
                          ].map((m, i) => (
                            <motion.div
                              key={m.label}
                              className="metric-card"
                              whileHover={{ y: -3 }}
                            >
                              <div className="metric-top">
                                <span>{m.label}</span>
                                <m.icon size={18} />
                              </div>
                              <div className="metric-value">
                                <Count value={m.value} />
                                {i === 3 && <small>/100</small>}
                                {i === 1 && (
                                  <div className="mini-bars">
                                    {[
                                      7, 12, 9, 19, 16, 24, 21, 29, 25, 33, 31,
                                      38,
                                    ].map((h, k) => (
                                      <i key={k} style={{ height: h }} />
                                    ))}
                                  </div>
                                )}
                                {i === 3 && (
                                  <span className="exposure-dial">
                                    <i />
                                  </span>
                                )}
                              </div>
                              <div className="metric-sub">{m.sub}</div>
                              <div className={`metric-trend ${m.color}`}>
                                {i === 0 ? (
                                  <ArrowUpRight size={12} />
                                ) : i === 1 ? (
                                  <CheckCircle2 size={12} />
                                ) : i === 2 ? (
                                  <CircleDot size={12} />
                                ) : (
                                  <span className="badge-dot" />
                                )}
                                {m.trend}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="overview-main">
                          <Panel
                            title="Network at a glance"
                            action={
                              <button
                                className="text-btn"
                                onClick={() => go("topology")}
                              >
                                Explore topology <ArrowUpRight size={14} />
                              </button>
                            }
                            className="network-panel"
                          >
                            <div className="panel-subline">
                              <span>
                                Policy boundaries and service connections
                              </span>
                              <span className="live-label">
                                <i /> SIMULATION READY
                              </span>
                            </div>
                            <Topology
                              fixed={state.policy}
                              reduced={state.reduced}
                              onSelect={(id, edge) =>
                                setDetail({ kind: edge ? "edge" : "asset", id })
                              }
                              onFullscreen={() => go("topology")}
                            />
                            <div className="network-foot">
                              <span>
                                <ShieldCheck size={14} />
                                All assets within defined scope
                              </span>
                              <button
                                className="text-btn"
                                onClick={() => run(scenarios[0])}
                              >
                                <Play size={12} />
                                Validate paths
                              </button>
                            </div>
                          </Panel>
                          <Panel
                            title="Security posture"
                            action={
                              <button
                                title="About the exposure indicator"
                                className="icon-btn"
                                onClick={() =>
                                  setDetail({ kind: "posture", id: "" })
                                }
                              >
                                <CircleHelp size={16} />
                              </button>
                            }
                            className="posture-panel"
                          >
                            <div className="posture-summary">
                              <div>
                                <span className="micro">EXPOSURE SCORE</span>
                                <strong>
                                  {exposure}
                                  <small>/100</small>
                                </strong>
                              </div>
                              <span className="trend-pill">
                                <ArrowDownRight size={14} />
                                {68 - exposure} pts <small>vs. baseline</small>
                              </span>
                            </div>
                            <div className="risk-chart">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={trend.map((t, i) => ({
                                    ...t,
                                    risk: i === 6 ? exposure : t.risk,
                                  }))}
                                  margin={{
                                    top: 8,
                                    right: 5,
                                    left: -29,
                                    bottom: 0,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id="risk-fill"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#b7f36b"
                                        stopOpacity={0.18}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#b7f36b"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    stroke="#292d25"
                                    vertical={false}
                                    strokeDasharray="3 4"
                                  />
                                  <XAxis
                                    dataKey="day"
                                    tick={{ fill: "#777e70", fontSize: 9 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={2}
                                  />
                                  <YAxis
                                    domain={[0, 100]}
                                    ticks={[0, 50, 100]}
                                    tick={{ fill: "#777e70", fontSize: 9 }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#191c17",
                                      border: "1px solid #30332b",
                                      borderRadius: 6,
                                      color: "#f4f2e9",
                                      fontSize: 12,
                                    }}
                                    labelStyle={{ color: "#a5a69b" }}
                                    formatter={(v) => [v, "Exposure"]}
                                    cursor={{ stroke: "#657a50" }}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="risk"
                                    stroke="#B7F36B"
                                    strokeWidth={2}
                                    fill="url(#risk-fill)"
                                    isAnimationActive={
                                      !state.reduced && !prefersReduced
                                    }
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="severity">
                              <div className="section-micro">
                                <span>FINDINGS BY SEVERITY</span>
                                <span>{openFindings.length} total</span>
                              </div>
                              <div className="severity-bar">
                                {openFindings.map((f) => (
                                  <span
                                    key={f.id}
                                    className={f.severity.toLowerCase()}
                                  />
                                ))}
                              </div>
                              <div className="severity-legend">
                                {["High", "Medium", "Low"].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      setFindingFilter(s);
                                      go("findings");
                                    }}
                                  >
                                    <i className={s.toLowerCase()} />
                                    {s}
                                    <b>
                                      {
                                        openFindings.filter(
                                          (f) => f.severity === s,
                                        ).length
                                      }
                                    </b>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              className="posture-note"
                              onClick={() => go("remediation")}
                            >
                              <GitCompareArrows size={15} />
                              <span>
                                {state.fixed
                                  ? "Policy correction verified"
                                  : "See what a verified fix changes"}
                              </span>
                              <ArrowRight size={15} />
                            </button>
                          </Panel>
                        </div>
                        <div className="overview-bottom">
                          <Panel
                            title="Recent test runs"
                            action={
                              <button
                                className="text-btn"
                                onClick={() => go("history")}
                              >
                                View history <ArrowUpRight size={14} />
                              </button>
                            }
                          >
                            <div className="panel-subline">
                              Repeatable checks. Traceable outcomes.
                            </div>
                            {table(state.runs.slice(0, 4))}
                            <div className="table-footer">
                              <span>
                                Showing 4 of {state.runs.length} test runs
                              </span>
                              <span>
                                <i className="small-dot" /> All results
                                simulated
                              </span>
                            </div>
                          </Panel>
                          <Panel
                            title="Activity feed"
                            action={
                              <span className="micro feed-tag">SIMULATED</span>
                            }
                          >
                            {eventFeed()}
                            <button
                              className="feed-footer"
                              onClick={() => go("history")}
                            >
                              View all activity <ArrowRight size={14} />
                            </button>
                          </Panel>
                        </div>
                        <div className="bottom-note">
                          <LockKeyhole size={12} />
                          <span>
                            Controlled by design. Evidence at every step.
                          </span>
                          <span className="right-note">
                            Local simulation engine <i /> v1.0.0
                          </span>
                        </div>
                      </>
                    )}
                    {page === "topology" && (
                      <>
                        <Panel
                          title="Environment map"
                          action={
                            <div className="segmented">
                              {["Logical view", "Asset inventory"].map((v) => (
                                <button
                                  className={
                                    topologyMode === v ? "selected" : ""
                                  }
                                  key={v}
                                  onClick={() => setTopologyMode(v)}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          }
                        >
                          {topologyMode === "Logical view" ? (
                            <Topology
                              large
                              fixed={state.policy}
                              reduced={state.reduced}
                              onSelect={(id, edge) =>
                                setDetail({ kind: edge ? "edge" : "asset", id })
                              }
                            />
                          ) : (
                            <div className="asset-grid">
                              {assets.map((a) => (
                                <button
                                  className="asset-card"
                                  key={a.id}
                                  onClick={() =>
                                    setDetail({ kind: "asset", id: a.id })
                                  }
                                >
                                  <Server size={22} />
                                  <h3>{a.name}</h3>
                                  <p>{a.description}</p>
                                  <Badge value={a.status} />
                                  <span>
                                    Inspect asset <ArrowUpRight size={14} />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </Panel>
                        <div className="info-strip">
                          <CircleHelp size={17} />
                          <p>
                            Select an asset or connection to inspect its
                            configuration and evidence. Drag nodes to rearrange
                            the logical view.
                          </p>
                        </div>
                      </>
                    )}
                    {page === "scenarios" && (
                      <>
                        <div className="section-toolbar">
                          <div>
                            <span className="small-dot" /> 4 scenarios available{" "}
                            <span className="muted">
                              / Deterministic local simulations
                            </span>
                          </div>
                          <button
                            className="text-btn"
                            onClick={() => go("settings")}
                          >
                            <SlidersHorizontal size={15} />
                            Configure policy
                          </button>
                        </div>
                        <div className="scenario-grid">
                          {scenarios.map((s, i) => {
                            const last = state.runs.find(
                              (r) => r.scenarioId === s.id,
                            );
                            return (
                              <motion.div
                                whileHover={{ y: -3 }}
                                className="panel scenario-card"
                                key={s.id}
                              >
                                <div className="scenario-top">
                                  <span className="scenario-icon">
                                    {i === 0 ? (
                                      <Globe2 />
                                    ) : i === 1 ? (
                                      <Server />
                                    ) : i === 2 ? (
                                      <Shield />
                                    ) : (
                                      <Database />
                                    )}
                                  </span>
                                  <span className="micro">
                                    {s.id} / {s.category.toUpperCase()}
                                  </span>
                                </div>
                                <h2>{s.title}</h2>
                                <p>{s.description}</p>
                                <div className="expected">
                                  <span className="micro">
                                    EXPECTED BEHAVIOR
                                  </span>
                                  <div>
                                    <ShieldCheck size={15} />
                                    {s.expected}
                                  </div>
                                </div>
                                <div className="scenario-bottom">
                                  <div>
                                    <small>PREVIOUS EXECUTION</small>
                                    {last ? (
                                      <Badge value={last.outcome} />
                                    ) : (
                                      <Badge value="Not executed" />
                                    )}
                                  </div>
                                  <button
                                    className="btn primary"
                                    onClick={() => run(s)}
                                  >
                                    <Play size={14} />
                                    Run Test
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="info-strip">
                          <LockKeyhole size={17} />
                          <p>
                            These scenarios never contact a network target.
                            Outcomes change only when the simulated policy
                            configuration changes.
                          </p>
                        </div>
                      </>
                    )}
                    {page === "findings" && (
                      <>
                        <div className="finding-summary">
                          {["High", "Medium", "Low"].map((s) => (
                            <button
                              key={s}
                              onClick={() =>
                                setFindingFilter(
                                  findingFilter === s ? "All findings" : s,
                                )
                              }
                              className={`panel severity-summary ${findingFilter === s ? "selected" : ""}`}
                            >
                              <span
                                className={`severity-dot ${s.toLowerCase()}`}
                              />
                              <span>{s} severity</span>
                              <strong>
                                {
                                  openFindings.filter((f) => f.severity === s)
                                    .length
                                }
                              </strong>
                              <ChevronRight size={16} />
                            </button>
                          ))}
                        </div>
                        <Panel
                          title="Findings register"
                          action={
                            <select
                              value={findingFilter}
                              onChange={(e) => setFindingFilter(e.target.value)}
                            >
                              <option>All findings</option>
                              <option>High</option>
                              <option>Medium</option>
                              <option>Low</option>
                              <option>Open</option>
                              <option>Resolved</option>
                            </select>
                          }
                        >
                          <div className="table-scroll">
                            <table>
                              <thead>
                                <tr>
                                  <th>FINDING</th>
                                  <th>SEVERITY</th>
                                  <th>AFFECTED COMPONENT</th>
                                  <th>STATUS</th>
                                  <th>FIRST DETECTED</th>
                                  <th>LAST TESTED</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {findings
                                  .filter(
                                    (f) =>
                                      findingFilter === "All findings" ||
                                      f.severity === findingFilter ||
                                      (findingFilter === "Resolved"
                                        ? state.fixed && f.id !== "FND-002"
                                        : findingFilter === "Open"
                                          ? !state.fixed || f.id === "FND-002"
                                          : false),
                                  )
                                  .map((f) => (
                                    <tr
                                      tabIndex={0}
                                      key={f.id}
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        setDetail({ kind: "finding", id: f.id })
                                      }
                                      onClick={() =>
                                        setDetail({ kind: "finding", id: f.id })
                                      }
                                    >
                                      <td>
                                        <strong>{f.title}</strong>
                                        <small className="table-small">
                                          {f.id}
                                        </small>
                                      </td>
                                      <td>
                                        <Badge value={f.severity} />
                                      </td>
                                      <td className="muted">{f.component}</td>
                                      <td>
                                        <Badge
                                          value={
                                            state.fixed && f.id !== "FND-002"
                                              ? "Resolved"
                                              : "Open"
                                          }
                                        />
                                      </td>
                                      <td className="mono muted">
                                        04 Oct 2026
                                      </td>
                                      <td className="mono muted">
                                        {time(state.runs[0].date)}
                                      </td>
                                      <td>
                                        <ArrowUpRight size={15} />
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="table-footer">
                            Illustrative findings are not confirmed
                            vulnerabilities. Review observed facts and
                            assumptions in each record.
                          </div>
                        </Panel>
                      </>
                    )}
                    {page === "remediation" && (
                      <>
                        <div className="comparison-grid">
                          <Panel title="Before" eyebrow="01 / OBSERVED POLICY">
                            <div className="comparison-inner">
                              <Badge value="Finding detected" />
                              <code>
                                source: 0.0.0.0/0
                                <br />
                                destination: db.internal
                                <br />
                                port: 3306
                                <br />
                                action: allow
                              </code>
                              <ul>
                                <li>Broad source range</li>
                                <li>
                                  Unintended segment can reach the database path
                                </li>
                                <li>No successful baseline retest record</li>
                              </ul>
                            </div>
                          </Panel>
                          <Panel
                            title="Proposed correction"
                            eyebrow="02 / DEFENSIVE CHANGE"
                          >
                            <div className="comparison-inner">
                              <span className="change-icon">
                                <ShieldCheck size={28} />
                              </span>
                              <ul className="check-list">
                                <li>
                                  <Check size={16} />
                                  Restrict source to 10.0.1.0/24
                                </li>
                                <li>
                                  <Check size={16} />
                                  Apply least-privilege access
                                </li>
                                <li>
                                  <Check size={16} />
                                  Review default-deny behavior
                                </li>
                                <li>
                                  <Check size={16} />
                                  Preserve an audit record
                                </li>
                              </ul>
                              <p className="muted">
                                Applies only to the local simulated policy.
                              </p>
                            </div>
                          </Panel>
                          <Panel
                            title="After verification"
                            eyebrow="03 / REPEATABLE EVIDENCE"
                          >
                            <div className="comparison-inner">
                              <Badge
                                value={
                                  state.fixed ? "Verified" : "Pending retest"
                                }
                              />
                              <div className="after-row">
                                <span>Unexpected access</span>
                                <strong>
                                  {state.fixed ? "Blocked" : "Awaiting check"}
                                </strong>
                              </div>
                              <div className="after-row">
                                <span>Approved access</span>
                                <strong>
                                  {state.fixed ? "Allowed" : "Awaiting check"}
                                </strong>
                              </div>
                              <div className="after-row">
                                <span>Retest status</span>
                                <Badge
                                  value={
                                    state.fixed ? "Passed" : "Not executed"
                                  }
                                />
                              </div>
                              <p className="muted">
                                Confirmation requires the same checks against
                                the corrected policy.
                              </p>
                            </div>
                          </Panel>
                        </div>
                        <div className="remediation-cta panel">
                          <div>
                            <h3>
                              {state.fixed
                                ? "Verified against the proposed policy"
                                : "Close the loop with evidence."}
                            </h3>
                            <p>
                              Recheck unexpected access, approved application
                              access, and the source rule.
                            </p>
                          </div>
                          <button
                            className="btn primary"
                            onClick={() => run(scenarios[0], true)}
                          >
                            <RotateCcw size={16} />
                            {state.fixed
                              ? "Repeat verification"
                              : "Verify Proposed Fix"}
                          </button>
                        </div>
                      </>
                    )}
                    {page === "history" && (
                      <Panel
                        title={`Execution history · ${filteredRuns.length} runs`}
                      >
                        <div className="filters">
                          <div className="filter-label">
                            <SlidersHorizontal size={16} />
                            Filters
                          </div>
                          <select
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                          >
                            {[
                              "All outcomes",
                              "Passed",
                              "Finding detected",
                              "Needs review",
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <select
                            value={scenarioFilter}
                            onChange={(e) => setScenarioFilter(e.target.value)}
                          >
                            <option>All scenarios</option>
                            {scenarios.map((s) => (
                              <option value={s.id} key={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                          <label className="date-filter">
                            Since{" "}
                            <input
                              aria-label="Runs since date"
                              type="date"
                              value={dateFilter}
                              onChange={(e) => setDateFilter(e.target.value)}
                            />
                          </label>
                          <label className="date-filter">
                            Until{" "}
                            <input
                              aria-label="Runs until date"
                              type="date"
                              value={dateEnd}
                              onChange={(e) => setDateEnd(e.target.value)}
                            />
                          </label>
                          <button
                            className="text-btn"
                            onClick={() => {
                              setHistoryFilter("All outcomes");
                              setScenarioFilter("All scenarios");
                              setDateFilter("");
                              setDateEnd("");
                            }}
                          >
                            Clear
                          </button>
                        </div>
                        {table(filteredRuns, true)}
                      </Panel>
                    )}
                    {page === "reports" && (
                      <div className="report-layout">
                        <Panel
                          title="Configure your report"
                          eyebrow="01 / SELECT EVIDENCE"
                        >
                          <div className="report-config">
                            <div className="section-micro">
                              <span>TEST RUNS</span>
                              <button
                                className="text-btn"
                                onClick={() =>
                                  setReportRuns(
                                    reportRuns.length === state.runs.length
                                      ? []
                                      : state.runs.map((r) => r.id),
                                  )
                                }
                              >
                                {reportRuns.length === state.runs.length
                                  ? "Deselect all"
                                  : "Select all"}
                              </button>
                            </div>
                            <div className="report-run-list">
                              {state.runs.map((r) => (
                                <label className="check-row" key={r.id}>
                                  <input
                                    type="checkbox"
                                    checked={reportRuns.includes(r.id)}
                                    onChange={(e) =>
                                      setReportRuns(
                                        e.target.checked
                                          ? [...reportRuns, r.id]
                                          : reportRuns.filter(
                                              (id) => id !== r.id,
                                            ),
                                      )
                                    }
                                  />
                                  <span>
                                    <strong>{r.title}</strong>
                                    <small>
                                      {r.id} · {date(r.date)} · {time(r.date)}
                                    </small>
                                  </span>
                                  <OutcomeIcon value={r.outcome} />
                                </label>
                              ))}
                            </div>
                            <div className="section-micro">
                              <span>INCLUDE FINDINGS</span>
                            </div>
                            {findings.map((f) => (
                              <label key={f.id} className="check-row">
                                <input
                                  type="checkbox"
                                  checked={reportFindings.includes(f.id)}
                                  onChange={(e) =>
                                    setReportFindings(
                                      e.target.checked
                                        ? [...reportFindings, f.id]
                                        : reportFindings.filter(
                                            (id) => id !== f.id,
                                          ),
                                    )
                                  }
                                />
                                <span>
                                  <strong>{f.title}</strong>
                                  <small>
                                    {f.id} · {f.severity}
                                  </small>
                                </span>
                              </label>
                            ))}
                            <button
                              className="btn primary full"
                              onClick={() => {
                                if (!reportRuns.length) {
                                  setToast(
                                    "Select at least one test run to preview the report.",
                                  );
                                  return;
                                }
                                setPreview(true);
                              }}
                            >
                              <Eye size={16} />
                              Generate preview
                            </button>
                          </div>
                        </Panel>
                        <Panel
                          title="Report preview"
                          action={
                            preview ? (
                              <div className="button-group">
                                <button
                                  className="btn secondary small"
                                  onClick={() => exportReport("JSON")}
                                >
                                  JSON <Download size={13} />
                                </button>
                                <button
                                  className="btn primary small"
                                  onClick={() => exportReport("PDF")}
                                >
                                  PDF <Download size={13} />
                                </button>
                              </div>
                            ) : (
                              <FileText size={18} className="muted" />
                            )
                          }
                        >
                          {!preview ? (
                            <div className="report-empty">
                              <span>
                                <FileText size={34} />
                              </span>
                              <h2>Evidence, ready to share.</h2>
                              <p>
                                Select test runs and findings to create a clear,
                                auditable validation report.
                              </p>
                              <div className="micro">JSON & PDF EXPORT</div>
                            </div>
                          ) : (
                            <div className="report-paper">
                              <div className="micro">
                                SENTINEL / SECURITY VALIDATION
                              </div>
                              <h2>Environment validation report</h2>
                              <span className="report-notice">
                                SIMULATED RESULTS — NO LIVE TESTING
                              </span>
                              <h3>01 — Environment & scope</h3>
                              <p>
                                {reportData().environment}. {reportData().scope}
                              </p>
                              <h3>02 — Executive summary</h3>
                              <p>{reportData().executiveSummary}</p>
                              <h3>03 — Tests & observed evidence</h3>
                              {reportData().tests.map((r) => (
                                <div className="report-record" key={r.id}>
                                  <strong>{r.title}</strong>
                                  <Badge value={r.outcome} />
                                  <p>
                                    <b>Expected:</b> {r.expected}
                                    <br />
                                    <b>Observed:</b> {r.observed}
                                  </p>
                                  <small>
                                    {r.id} · {r.date}
                                  </small>
                                </div>
                              ))}
                              <h3>04 — Findings & recommendations</h3>
                              {reportData().findings.map((f) => (
                                <div key={f.id} className="report-record">
                                  <strong>
                                    {f.id} · {f.title}
                                  </strong>
                                  <p>{f.evidence}</p>
                                  <p>{f.recommendation}</p>
                                </div>
                              ))}
                              <h3>05 — Retest results</h3>
                              <p>
                                {reportData().retestResults.length} selected
                                records run with restricted policy.
                              </p>
                              <h3>06 — Limitations & assumptions</h3>
                              {reportData().limitations.map((l) => (
                                <p key={l}>{l}</p>
                              ))}
                            </div>
                          )}
                        </Panel>
                      </div>
                    )}
                    {page === "settings" && (
                      <div className="settings-layout">
                        <Panel
                          title="Environment & policy"
                          eyebrow="SIMULATION CONFIGURATION"
                        >
                          <div className="settings-body">
                            <label className="field-label">
                              Demo environment
                              <select
                                value={state.environment}
                                onChange={(e) =>
                                  setState({
                                    ...state,
                                    environment: e.target.value,
                                  })
                                }
                              >
                                <option>Sentinel Sandbox</option>
                                <option>Staging Lab</option>
                                <option>Isolated Research Lab</option>
                              </select>
                              <small>
                                Environment labels organize new local test
                                records. No live target is configured.
                              </small>
                            </label>
                            <div className="setting-row">
                              <div>
                                <h3>Restricted source policy</h3>
                                <p>
                                  Permit only approved application
                                  infrastructure.
                                </p>
                              </div>
                              <button
                                role="switch"
                                aria-checked={state.policy}
                                className={`toggle ${state.policy ? "on" : ""}`}
                                onClick={() =>
                                  setState({
                                    ...state,
                                    policy: !state.policy,
                                    fixed: false,
                                  })
                                }
                              >
                                <i />
                              </button>
                            </div>
                            <label className="field-label">
                              Simulated source range
                              <select
                                value={state.policy ? "restricted" : "broad"}
                                onChange={(e) =>
                                  setState({
                                    ...state,
                                    policy: e.target.value === "restricted",
                                    fixed: false,
                                  })
                                }
                              >
                                <option value="broad">
                                  0.0.0.0/0 — broad access
                                </option>
                                <option value="restricted">
                                  10.0.1.0/24 — approved application segment
                                </option>
                              </select>
                            </label>
                            <div className="policy-code">
                              <div>
                                <span className="micro">POLICY / FW-014</span>
                                <Badge value="Local only" />
                              </div>
                              <code>
                                <span>source</span>{" "}
                                {state.policy ? "10.0.1.0/24" : "0.0.0.0/0"}
                                <br />
                                <span>destination</span> 10.0.2.10
                                <br />
                                <span>service</span> mysql / tcp:3306
                                <br />
                                <span>action</span> allow
                                <br />
                                <span>default</span> deny
                              </code>
                            </div>
                            <button
                              className="btn secondary"
                              onClick={() => {
                                go("scenarios");
                                setToast(
                                  "Policy saved locally. Choose a scenario to validate it.",
                                );
                              }}
                            >
                              <FlaskConical size={16} />
                              Test this configuration
                            </button>
                          </div>
                        </Panel>
                        <div>
                          <Panel title="Console preferences">
                            <div className="settings-body">
                              {[
                                {
                                  key: "activity",
                                  title: "Activity feed",
                                  description:
                                    "Display simulated events in the overview.",
                                },
                                {
                                  key: "reduced",
                                  title: "Reduce motion",
                                  description:
                                    "Minimize transitions and animated effects.",
                                },
                              ].map((s) => (
                                <div className="setting-row" key={s.key}>
                                  <div>
                                    <h3>{s.title}</h3>
                                    <p>{s.description}</p>
                                  </div>
                                  <button
                                    aria-label={s.title}
                                    role="switch"
                                    aria-checked={Boolean(
                                      state[s.key as keyof State],
                                    )}
                                    className={`toggle ${state[s.key as keyof State] ? "on" : ""}`}
                                    onClick={() =>
                                      setState({
                                        ...state,
                                        [s.key]: !state[s.key as keyof State],
                                      })
                                    }
                                  >
                                    <i />
                                  </button>
                                </div>
                              ))}
                              <label className="field-label">
                                Theme preference
                                <select
                                  value={state.theme}
                                  onChange={(e) =>
                                    setState({
                                      ...state,
                                      theme: e.target.value,
                                    })
                                  }
                                >
                                  <option>Graphite</option>
                                  <option>Contrast</option>
                                </select>
                              </label>
                            </div>
                          </Panel>
                          <Panel
                            title="Reset demonstration"
                            className="reset-panel"
                          >
                            <div className="settings-body">
                              <p>
                                Restore the original policy, findings, and 24
                                sample test runs. Locally generated records will
                                be removed.
                              </p>
                              <button
                                className="btn danger"
                                onClick={() => setConfirmReset(true)}
                              >
                                <RotateCcw size={15} />
                                Reset demo data
                              </button>
                            </div>
                          </Panel>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          <footer className="app-footer">
            <span>
              SENTINEL <span>/</span> Firewall & Database Security Validation
            </span>
            <span>
              <i /> Isolated environment
            </span>
          </footer>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              className="toast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <CheckCircle2 size={18} />
              <span>{toast}</span>
              <button
                onClick={() => setToast("")}
                className="icon-btn"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {search !== null && (
          <Modal title="Search workspace" onClose={() => setSearch(null)}>
            <div className="search-dialog">
              <div className="search-input">
                <Search size={19} />
                <input
                  autoFocus
                  placeholder="Search pages, scenarios, or findings…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {[
                ...nav.map((n) => ({ name: n.name, type: "page", id: n.id })),
                ...scenarios.map((s) => ({
                  name: s.title,
                  type: "scenario",
                  id: s.id,
                })),
                ...findings.map((f) => ({
                  name: f.title,
                  type: "finding",
                  id: f.id,
                })),
              ]
                .filter(
                  (r) =>
                    r.name.toLowerCase().includes(search.toLowerCase()) ||
                    r.id.toLowerCase().includes(search.toLowerCase()),
                )
                .map((r) => (
                  <button
                    className="search-result"
                    key={r.type + r.id}
                    onClick={() => {
                      setSearch(null);
                      if (r.type === "page") go(r.id);
                      else if (r.type === "scenario") {
                        go("scenarios");
                        setToast(`${r.id} selected. Use Run Test to begin.`);
                      } else setDetail({ kind: "finding", id: r.id });
                    }}
                  >
                    <span>
                      <small>{r.type.toUpperCase()}</small>
                      {r.name}
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
            </div>
          </Modal>
        )}
        {showNotice && (
          <Modal
            title="A controlled environment. By design."
            onClose={() => setShowNotice(false)}
          >
            <div className="detail-body">
              <div className="notice-hero">
                <ShieldCheck size={35} />
                <h3>No live network activity</h3>
                <p>
                  Every test, asset, and event in SENTINEL is simulated locally
                  in your browser. No traffic is sent to a real firewall,
                  server, or database.
                </p>
              </div>
              <div className="detail-section">
                <h3>Defined scope</h3>
                <p>
                  Six demonstration assets, five logical connections, and four
                  deterministic validation scenarios.
                </p>
              </div>
              <div className="detail-section">
                <h3>Evidence with limitations</h3>
                <p>
                  Illustrative findings help demonstrate an investigation
                  workflow. Network reachability does not prove database access
                  or a confirmed vulnerability.
                </p>
              </div>
              <button
                className="btn primary full"
                onClick={() => setShowNotice(false)}
              >
                Understood <Check size={16} />
              </button>
            </div>
          </Modal>
        )}
        {confirmReset && (
          <Modal
            title="Reset local demonstration data?"
            onClose={() => setConfirmReset(false)}
          >
            <div className="detail-body">
              <p>
                All newly generated tests and configuration changes will be
                removed. Export any reports you need before continuing.
              </p>
              <div className="modal-actions">
                <button
                  className="btn secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Keep my data
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    setState(initialState());
                    setConfirmReset(false);
                    setReportRuns([]);
                    setPreview(false);
                    setToast("Demo restored to its original state.");
                  }}
                >
                  Reset demo
                </button>
              </div>
            </div>
          </Modal>
        )}
        {execution && (
          <Modal
            title={
              execution.fix
                ? "Verify proposed correction"
                : "Controlled test execution"
            }
            onClose={() => {
              if (execution.progress === 100) setExecution(null);
              else
                setToast(
                  "A local simulation is running. It will finish in a moment.",
                );
            }}
            wide
          >
            <div className="execution-body">
              <div className="execution-title">
                <div>
                  <span className="micro">
                    {execution.scenario.id} / SIMULATED VALIDATION
                  </span>
                  <h2>{execution.scenario.title}</h2>
                </div>
                {execution.result ? (
                  <Badge value={execution.result.outcome} />
                ) : (
                  <Loader2 size={23} className="spinner" />
                )}
              </div>
              <Topology
                running={execution.progress < 100}
                fixed={execution.fix || state.policy}
                reduced={state.reduced}
                onSelect={() => {}}
              />
              <div className="execution-progress">
                <div>
                  <span>
                    {execution.progress < 20
                      ? "Preparing isolated scenario"
                      : execution.progress < 60
                        ? "Evaluating simulated traffic path"
                        : execution.progress < 100
                          ? "Collecting policy evidence"
                          : "Validation complete"}
                  </span>
                  <strong>{execution.progress}%</strong>
                </div>
                <div className="progress-track">
                  <motion.i animate={{ width: `${execution.progress}%` }} />
                </div>
                <div className="execution-steps">
                  {["Prepare", "Simulate", "Evaluate", "Record"].map((s, i) => (
                    <span
                      key={s}
                      className={execution.progress >= i * 25 ? "done" : ""}
                    >
                      {execution.progress >= (i + 1) * 25 ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Circle size={13} />
                      )}{" "}
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {execution.result && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="execution-result"
                >
                  <p>{execution.result.observed}</p>
                  {execution.fix && (
                    <p className="text-green">
                      3 checks passed. FND-001 and FND-003 resolved in this
                      demonstration.
                    </p>
                  )}
                  <div className="modal-actions">
                    <button
                      className="btn secondary"
                      onClick={() => setExecution(null)}
                    >
                      Close
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => {
                        setDetail({ kind: "run", id: execution.result!.id });
                        setExecution(null);
                      }}
                    >
                      View evidence <ArrowUpRight size={15} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </Modal>
        )}
        {detail && (
          <Modal
            title={
              detail.kind === "finding"
                ? "Finding detail"
                : detail.kind === "run"
                  ? "Test evidence record"
                  : detail.kind === "asset"
                    ? "Asset configuration"
                    : detail.kind === "edge"
                      ? "Connection inspection"
                      : "Understanding security posture"
            }
            onClose={() => setDetail(null)}
          >
            <div className="detail-body">
              {detail.kind === "finding" &&
                (() => {
                  const f = findings.find((f) => f.id === detail.id)!;
                  return (
                    <>
                      <span className="micro">
                        {f.id} / ILLUSTRATIVE FINDING
                      </span>
                      <h2>{f.title}</h2>
                      <div className="detail-badges">
                        <Badge value={f.severity} />
                        <Badge
                          value={
                            state.fixed && f.id !== "FND-002"
                              ? "Resolved"
                              : "Open"
                          }
                        />
                      </div>
                      <div className="detail-key-grid">
                        <div>
                          <small>AFFECTED ASSET</small>
                          <strong>{f.component}</strong>
                        </div>
                        <div>
                          <small>CONFIDENCE</small>
                          <strong>{f.confidence}</strong>
                        </div>
                      </div>
                      {[
                        { title: "Observed evidence", text: f.evidence },
                        {
                          title: "Expected behavior",
                          text:
                            f.id === "FND-001"
                              ? "Only approved application sources should reach TCP 3306."
                              : f.id === "FND-002"
                                ? "Network and database-level outcomes must be independently verified."
                                : "A policy change should be followed by the same repeatable tests.",
                        },
                        {
                          title: "Potential impact · not confirmed",
                          text: f.impact,
                        },
                        {
                          title: "Recommended next steps",
                          text: f.recommendation,
                        },
                        {
                          title: "Retest status",
                          text:
                            state.fixed && f.id !== "FND-002"
                              ? "Verified with restricted simulated policy. Repeat checks passed."
                              : "Verification is pending. Preserve the original evidence and rerun the scenario.",
                        },
                      ].map((s) => (
                        <div className="detail-section" key={s.title}>
                          <h3>{s.title}</h3>
                          <p>{s.text}</p>
                        </div>
                      ))}
                      <div className="detail-section">
                        <h3>Related events</h3>
                        {state.runs
                          .filter((r) => r.finding === f.id)
                          .slice(0, 3)
                          .map((r) => (
                            <button
                              className="related-event"
                              key={r.id}
                              onClick={() =>
                                setDetail({ kind: "run", id: r.id })
                              }
                            >
                              {r.id} · {r.title}
                              <ArrowUpRight size={14} />
                            </button>
                          ))}
                      </div>
                      <button
                        className="btn primary full"
                        onClick={() => {
                          setDetail(null);
                          go("remediation");
                        }}
                      >
                        Review remediation <ArrowRight size={15} />
                      </button>
                    </>
                  );
                })()}
              {detail.kind === "run" &&
                (() => {
                  const r = state.runs.find((r) => r.id === detail.id);
                  if (!r) return <p>Record no longer available.</p>;
                  return (
                    <>
                      <span className="micro">
                        {r.id} / {r.scenarioId}
                      </span>
                      <h2>{r.title}</h2>
                      <Badge value={r.outcome} />
                      <div className="detail-key-grid">
                        <div>
                          <small>EXECUTED AT</small>
                          <strong>{new Date(r.date).toLocaleString()}</strong>
                        </div>
                        <div>
                          <small>DURATION / ENVIRONMENT</small>
                          <strong>
                            {r.duration} / {r.environment}
                          </strong>
                        </div>
                      </div>
                      <div className="detail-section">
                        <h3>Expected behavior</h3>
                        <p>{r.expected}</p>
                      </div>
                      <div className="detail-section">
                        <h3>Observed behavior</h3>
                        <p>{r.observed}</p>
                      </div>
                      <div className="evidence-code">
                        <span className="micro">LOCAL EVIDENCE RECORD</span>
                        <code>
                          engine: sentinel-local-v1
                          <br />
                          scenario: {r.scenarioId}
                          <br />
                          policy:{" "}
                          {r.fixed ? "restricted-source" : "baseline-demo"}
                          <br />
                          network_activity: none
                          <br />
                          database_authentication: not_tested
                          <br />
                          result: {r.outcome.toLowerCase().replaceAll(" ", "_")}
                        </code>
                      </div>
                      <div className="detail-section">
                        <h3>Limitations & assumptions</h3>
                        <p>
                          This is simulated evidence, not a real network
                          observation. Database access and exploitability are
                          not established.
                        </p>
                      </div>
                      <div className="modal-actions">
                        {r.finding && (
                          <button
                            className="btn secondary"
                            onClick={() =>
                              setDetail({ kind: "finding", id: r.finding! })
                            }
                          >
                            Related finding
                          </button>
                        )}
                        <button
                          className="btn primary"
                          onClick={() =>
                            run(scenarios.find((s) => s.id === r.scenarioId)!)
                          }
                        >
                          <RotateCcw size={15} />
                          Repeat test
                        </button>
                      </div>
                    </>
                  );
                })()}
              {detail.kind === "asset" &&
                (() => {
                  const a = assets.find((a) => a.id === detail.id)!;
                  return (
                    <>
                      <span className="micro">
                        DEMO ASSET / {a.id.toUpperCase()}
                      </span>
                      <h2>{a.name}</h2>
                      <Badge value={a.status} />
                      <div className="detail-section">
                        <h3>Simulated configuration</h3>
                        <p>{a.description}</p>
                        <p>
                          Source policy:{" "}
                          {state.policy
                            ? "10.0.1.0/24 · restricted"
                            : "0.0.0.0/0 · broad"}
                        </p>
                        <p>
                          Default action: deny · No real endpoint configured
                        </p>
                      </div>
                      <div className="detail-section">
                        <h3>Connected services</h3>
                        <p>
                          {a.id === "firewall"
                            ? "External test segment, application server, database, API service, and internal network."
                            : "Sentinel Firewall · scoped local connection"}
                        </p>
                      </div>
                      <div className="detail-section">
                        <h3>Risks & recommendations</h3>
                        <p>
                          {state.policy
                            ? "Restricted policy is active. Verify that approved application traffic still works."
                            : "Broad source ranges may allow unintended network paths. Restrict the source range and repeat the checks."}
                        </p>
                      </div>
                      <div className="detail-section">
                        <h3>Latest relevant result</h3>
                        <Badge
                          value={
                            state.runs.find(
                              (r) =>
                                r.scenarioId ===
                                (a.id === "app" ? "SCN-002" : "SCN-001"),
                            )?.outcome || "Not executed"
                          }
                        />
                      </div>
                      <button
                        className="btn primary full"
                        onClick={() =>
                          run(a.id === "app" ? scenarios[1] : scenarios[0])
                        }
                      >
                        <Play size={15} />
                        Validate this path
                      </button>
                    </>
                  );
                })()}
              {detail.kind === "edge" && (
                <>
                  <span className="micro">SIMULATED CONNECTION</span>
                  <h2>{detail.id.split("-").join(" → ")}</h2>
                  <div className="detail-section">
                    <h3>Expected traffic behavior</h3>
                    <p>
                      {detail.id.startsWith("external")
                        ? "Untrusted segment must be blocked at the firewall."
                        : "Permit scoped application traffic to approved services only."}
                    </p>
                  </div>
                  <div className="detail-section">
                    <h3>Current policy prediction</h3>
                    <p>
                      {detail.id.startsWith("external") && !state.policy
                        ? "Baseline source policy is too broad; this simulated path is permitted."
                        : "This path follows the configured scope. Run validation to record observed evidence."}
                    </p>
                  </div>
                  <div className="detail-section">
                    <h3>Related test history</h3>
                    {state.runs
                      .filter(
                        (r) =>
                          r.scenarioId ===
                          (detail.id.startsWith("external")
                            ? "SCN-001"
                            : "SCN-002"),
                      )
                      .slice(0, 3)
                      .map((r) => (
                        <button
                          className="related-event"
                          key={r.id}
                          onClick={() => setDetail({ kind: "run", id: r.id })}
                        >
                          {r.id} · {r.outcome}
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                  </div>
                  <button
                    className="btn primary full"
                    onClick={() =>
                      run(
                        detail.id.startsWith("external")
                          ? scenarios[0]
                          : scenarios[1],
                      )
                    }
                  >
                    <Play size={15} />
                    Run Path Validation
                  </button>
                </>
              )}
              {detail.kind === "posture" && (
                <>
                  <h2>A directional indicator, not a security rating.</h2>
                  <p>
                    The current exposure score is derived from open simulated
                    findings: high adds 22, medium adds 10, and low adds 4
                    points.
                  </p>
                  <div className="detail-section">
                    <h3>Historical context</h3>
                    <p>
                      The chart includes an illustrative seven-day baseline.
                      Today’s value updates when a proposed fix is verified.
                    </p>
                  </div>
                  <div className="detail-section">
                    <h3>Before / current</h3>
                    <p>
                      68 baseline → {exposure} current. A successful remediation
                      reduces today’s score to 10, with the medium finding
                      awaiting human review.
                    </p>
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => {
                      setDetail(null);
                      go("remediation");
                    }}
                  >
                    Explore verification <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}
function LayersIcon() {
  return (
    <div className="layers-icon">
      <span />
      <span />
      <span />
    </div>
  );
}
