"use client";
import { useState, useEffect, useRef, Suspense, type ComponentType, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/navbar";
import {
  IconBrand,
  IconFinance,
  IconPitch,
  IconResearch,
  IconStrategy,
  IconWebsite,
} from "@/components/agent-icons";

// ── Types ──────────────────────────────────────────────
type AgentKey =
  | "marketResearch"
  | "businessStrategy"
  | "financialPlanning"
  | "branding"
  | "websiteGenerator"
  | "pitchDeck";

interface AgentConfig {
  key: AgentKey;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
  endpoint: string;
  color: string;
}

interface AgentOutputs {
  marketResearch: string;
  businessStrategy: string;
  financialPlanning: string;
  branding: string;
  websiteGenerator: string;
  pitchDeck: string;
}

// ── Agent Configuration ────────────────────────────────
const AGENTS: AgentConfig[] = [
  { key: "marketResearch",    label: "Market Research",   Icon: IconResearch, endpoint: "/api/agents/market-research",    color: "#4766D8" },
  { key: "businessStrategy",  label: "Business Strategy", Icon: IconStrategy, endpoint: "/api/agents/business-strategy",  color: "#805AD5" },
  { key: "financialPlanning", label: "Financial Planning",Icon: IconFinance, endpoint: "/api/agents/financial-planning", color: "#16805D" },
  { key: "branding",          label: "Brand Identity",    Icon: IconBrand, endpoint: "/api/agents/branding",           color: "#B66A1D" },
  { key: "websiteGenerator",  label: "Launch Site",       Icon: IconWebsite, endpoint: "/api/agents/website-generator",  color: "#A24D7C" },
  { key: "pitchDeck",         label: "Investor Deck",     Icon: IconPitch, endpoint: "/api/agents/pitch-deck",         color: "#A44A3D" },
];

function ActionIcon({ name, size = 16 }: { name: "check" | "copy" | "download" | "stop" | "reset" | "alert" | "bolt" | "upload" | "arrowUp"; size?: number }) {
  const paths = {
    check: <path d="m5 12 4.2 4.2L19 6.7" />,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></>,
    download: <><path d="M12 3v11" /><path d="m8 10 4 4 4-4" /><path d="M5 19h14" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />,
    reset: <><path d="M20 11a8 8 0 1 1-2.3-5.7" /><path d="M20 4v7h-7" /></>,
    alert: <><path d="M12 3 21 20H3L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    bolt: <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" />,
    upload: <><path d="M12 16V4" /><path d="m8 8 4-4 4 4" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
    arrowUp: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

const AGENT_ACTIVITY: Record<AgentKey, { working: string; upcoming: string; detail: string; tasks: string[] }> = {
  marketResearch: {
    working: "Mapping the market before you make a move.",
    upcoming: "Your research room is getting ready.",
    detail: "We are sizing the opportunity, scanning competitors, and surfacing the customer signals that matter.",
    tasks: ["Sizing the opportunity", "Scanning competitor moves", "Finding customer pain points"],
  },
  businessStrategy: {
    working: "Turning insight into a decisive strategy.",
    upcoming: "Your strategy studio is up next.",
    detail: "We are defining the wedge, positioning, and go-to-market choices that give this idea momentum.",
    tasks: ["Defining your market wedge", "Pressure-testing the business model", "Shaping the go-to-market plan"],
  },
  financialPlanning: {
    working: "Putting the numbers behind the ambition.",
    upcoming: "Your finance desk is queued next.",
    detail: "We are translating the strategy into pricing, unit economics, milestones, and a credible runway.",
    tasks: ["Designing pricing logic", "Modeling unit economics", "Mapping milestones and runway"],
  },
  branding: {
    working: "Giving the company a voice people remember.",
    upcoming: "Your brand atelier is warming up.",
    detail: "We are creating a name direction, verbal identity, and visual territory built around the strategy.",
    tasks: ["Exploring naming territory", "Defining the brand voice", "Building a visual direction"],
  },
  websiteGenerator: {
    working: "Turning the story into a launch-ready front door.",
    upcoming: "Your launch page is being prepared.",
    detail: "We are composing the value proposition, conversion flow, and page structure for your first landing page.",
    tasks: ["Writing the conversion narrative", "Structuring the landing page", "Preparing deployable HTML"],
  },
  pitchDeck: {
    working: "Packaging the story investors need to see.",
    upcoming: "Your investor narrative is the final step.",
    detail: "We are bringing the insight, strategy, financials, and brand into one concise fundraising narrative.",
    tasks: ["Framing the investment case", "Sequencing the narrative", "Clarifying the funding ask"],
  },
};

const EXAMPLES = [
  "AI-based agriculture startup using drone technology",
  "Mental health app for Gen Z with AI therapy",
  "SaaS tool for remote team collaboration",
  "EdTech platform for rural India",
  "Climate tech carbon credit marketplace",
  "AI-powered legal document automation",
];

const EMPTY_OUTPUTS: AgentOutputs = {
  marketResearch: "",
  businessStrategy: "",
  financialPlanning: "",
  branding: "",
  websiteGenerator: "",
  pitchDeck: "",
};

// ── Streaming helper ──────────────────────────────────
async function streamAgentOutput(
  endpoint: string,
  body: Record<string, string>,
  onChunk: (text: string) => void
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Network error — is the dev server running? (${networkErr})`);
  }

  // Server returned an error — parse it as JSON
  if (!res.ok) {
    let msg = `Server error ${res.status}`;
    try {
      const json = await res.json();
      msg = json.error || msg;
    } catch { /* ignore parse error */ }
    throw new Error(msg);
  }

  if (!res.body) throw new Error("No response body from server");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    onChunk(full);
  }
  return full;
}

// ── Main Build Page ────────────────────────────────────
function BuildPageInner() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [outputs, setOutputs] = useState<AgentOutputs>(EMPTY_OUTPUTS);
  const [activeTab, setActiveTab] = useState<AgentKey>("marketResearch");
  const [running, setRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<number>(-1);
  const [completedAgents, setCompletedAgents] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);
  const previewUrlRef = useRef<string | null>(null);
  const briefFileInputRef = useRef<HTMLInputElement>(null);

  const progress = completedAgents.size / AGENTS.length;

  // Release the generated preview when this page unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setWebsitePreview = (html: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = html && html.includes("<!DOCTYPE html>")
      ? URL.createObjectURL(new Blob([html], { type: "text/html" }))
      : null;

    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleBriefUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setIdea(String(reader.result || ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleBuild = async () => {
    if (!idea.trim()) return;
    abortRef.current = false;
    setRunning(true);
    setError(null);
    setOutputs(EMPTY_OUTPUTS);
    setWebsitePreview(null);
    setCompletedAgents(new Set());
    setCurrentAgent(0);
    setActiveTab("marketResearch");

    let marketResearch = "";
    let businessStrategy = "";
    let financialPlanning = "";
    let branding = "";

    try {
      // 1. Market Research
      setCurrentAgent(0);
      marketResearch = await streamAgentOutput(
        "/api/agents/market-research",
        { idea },
        (text) => setOutputs((p) => ({ ...p, marketResearch: text }))
      );
      setCompletedAgents((p) => new Set([...p, 0]));
      if (abortRef.current) return;

      // 2. Business Strategy
      setCurrentAgent(1);
      setActiveTab("businessStrategy");
      businessStrategy = await streamAgentOutput(
        "/api/agents/business-strategy",
        { idea, marketResearch },
        (text) => setOutputs((p) => ({ ...p, businessStrategy: text }))
      );
      setCompletedAgents((p) => new Set([...p, 1]));
      if (abortRef.current) return;

      // 3. Financial Planning
      setCurrentAgent(2);
      setActiveTab("financialPlanning");
      financialPlanning = await streamAgentOutput(
        "/api/agents/financial-planning",
        { idea, strategy: businessStrategy },
        (text) => setOutputs((p) => ({ ...p, financialPlanning: text }))
      );
      setCompletedAgents((p) => new Set([...p, 2]));
      if (abortRef.current) return;

      // 4. Branding
      setCurrentAgent(3);
      setActiveTab("branding");
      branding = await streamAgentOutput(
        "/api/agents/branding",
        { idea, strategy: businessStrategy },
        (text) => setOutputs((p) => ({ ...p, branding: text }))
      );
      setCompletedAgents((p) => new Set([...p, 3]));
      if (abortRef.current) return;

      // 5. Website Generator
      setCurrentAgent(4);
      setActiveTab("websiteGenerator");
      const website = await streamAgentOutput(
        "/api/agents/website-generator",
        { idea, branding, strategy: businessStrategy },
        (text) => setOutputs((p) => ({ ...p, websiteGenerator: text }))
      );
      setWebsitePreview(website);
      setCompletedAgents((p) => new Set([...p, 4]));
      if (abortRef.current) return;

      // 6. Pitch Deck
      setCurrentAgent(5);
      setActiveTab("pitchDeck");
      await streamAgentOutput(
        "/api/agents/pitch-deck",
        { idea, strategy: businessStrategy, financials: financialPlanning, branding },
        (text) => setOutputs((p) => ({ ...p, pitchDeck: text }))
      );
      setCompletedAgents((p) => new Set([...p, 5]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Agent error:", err);
      setError(msg);
    } finally {
      setRunning(false);
      setCurrentAgent(-1);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setRunning(false);
    setCurrentAgent(-1);
  };

  const handleCopy = () => {
    const content = outputs[activeTab];
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const agent = AGENTS.find((a) => a.key === activeTab);
    if (!agent) return;
    const content = outputs[activeTab];
    if (!content) return;

    if (activeTab === "websiteGenerator") {
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "landing-page.html";
      a.click();
    } else {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agent.key}.md`;
      a.click();
    }
  };

  const activeAgent = AGENTS.find((a) => a.key === activeTab)!;
  const activeAgentIndex = AGENTS.findIndex((a) => a.key === activeTab);
  const activeOutput = outputs[activeTab];
  const isWebsiteTab = activeTab === "websiteGenerator";
  const isUpcoming = running && activeAgentIndex > currentAgent;
  const isActiveAgent = running && activeAgentIndex === currentAgent;
  const activity = AGENT_ACTIVITY[activeTab];
  const CurrentAgentIcon = currentAgent >= 0 ? AGENTS[currentAgent].Icon : null;
  const ActiveAgentIcon = activeAgent.Icon;

  return (
    <>
      <Navbar variant="build" />

      <main className="workspace">
        <div className="container">
          {/* Header */}
          <div className="workspace-header">
            <p className="eyebrow">Founder workspace</p>
            <h1 className="workspace-title">Turn a sharp idea into a fundable company.</h1>
            <p className="workspace-sub">
              Your six-person AI venture team will turn one brief into the research, strategy, brand, website, and pitch you need to move.
            </p>
          </div>

          {/* Input Card */}
          <div className="compose-card composer-shell">
            <div className="idea-field" data-active={idea.length > 0 || undefined}>
              <span className="idea-field-icon"><ActionIcon name="bolt" size={18} /></span>
              <textarea
                id="startup-idea"
                className="idea-textarea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe the startup you want to build"
                disabled={running}
                rows={4}
              />
              <div className="idea-field-actions">
                <input
                  ref={briefFileInputRef}
                  className="brief-file-input"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={handleBriefUpload}
                  disabled={running}
                />
                <button className="upload-brief" type="button" onClick={() => briefFileInputRef.current?.click()} disabled={running}>
                  <ActionIcon name="upload" size={18} />
                  Upload brief
                </button>
                <span className="idea-count">{idea.length ? `${idea.length} characters` : "Add detail for stronger output"}</span>
                <button
                  className="prompt-send"
                  type="button"
                  onClick={handleBuild}
                  disabled={running || !idea.trim()}
                >
                  {running ? <span className="stream-cursor" /> : <ActionIcon name="arrowUp" size={20} />}
                  {running ? "Building" : "Send"}
                </button>
              </div>
            </div>

            <div className="composer-groups">
              <div className="composer-group">
                <span className="composer-group-label">Try a prompt</span>
                <div className="example-list floating-suggestions">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      className="example-chip"
                      onClick={() => setIdea(ex)}
                      disabled={running}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
              <div className="composer-group composer-team-group">
                <span className="composer-group-label">Your venture team</span>
                <div className="pipeline-pills">
                  {AGENTS.map((a, i) => (
                    <div key={a.key} className={`pipeline-pill ${currentAgent === i ? "is-active" : ""} ${completedAgents.has(i) ? "is-done" : ""}`}>
                      <a.Icon size={14} />
                      {a.label}
                    </div>
                  ))}
                </div>
              </div>
              {running && (
                <button className="btn btn-secondary composer-stop" onClick={handleStop}>
                  <ActionIcon name="stop" size={12} /> Stop build
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span className="error-icon"><ActionIcon name="alert" size={20} /></span>
              <div style={{ flex: 1 }}>
                <div className="error-banner-title">Agent Error</div>
                <div className="error-banner-msg">{error}</div>
                {error.includes("GEMINI_API_KEY") && (
                  <div className="error-hint">
                    1. Open <strong>.env.local</strong><br/>
                    2. Set <code>GEMINI_API_KEY=your_key_here</code> from{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a><br/>
                    3. Restart the dev server: <code>npm run dev</code>
                  </div>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-dim)", flexShrink: 0 }}
              >✕</button>
            </div>
          )}

          {/* Progress Card */}
          {(running || completedAgents.size > 0) && (
            <div className="progress-card">
                <div className="progress-top">
                  <div className="progress-label">
                    {running && currentAgent >= 0
                    ? <>{CurrentAgentIcon && <CurrentAgentIcon size={16} />} {AGENT_ACTIVITY[AGENTS[currentAgent].key].working}</>
                    : completedAgents.size === AGENTS.length
                    ? <> <ActionIcon name="check" size={16} /> All deliverables are ready to review.</>
                    : "Agents paused"}
                </div>
                <div className="progress-pct">
                  {Math.round(progress * 100)}%
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="progress-steps">
                {AGENTS.map((a, i) => (
                  <div key={a.key} className="progress-step">
                    <div
                      className={`step-badge ${
                        completedAgents.has(i) ? "done" : currentAgent === i ? "active" : ""
                      }`}
                      style={completedAgents.has(i) ? { fontSize: 18 } : {}}
                    >
                      {completedAgents.has(i) ? <ActionIcon name="check" size={17} /> : <a.Icon size={17} />}
                    </div>
                    <div className="step-name">{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Tabs */}
          {(running || Object.values(outputs).some(Boolean)) && (
            <div className="output-shell">
              <div className="tabs-row">
                {AGENTS.map((a, i) => (
                  <button
                    key={a.key}
                    className={`tab-btn ${activeTab === a.key ? "active" : ""}`}
                    onClick={() => setActiveTab(a.key)}
                    style={activeTab === a.key ? { color: a.color, borderBottomColor: a.color } : {}}
                  >
                    <a.Icon size={15} /> {a.label}
                    {completedAgents.has(i) && (
                      <span className="tab-check"><ActionIcon name="check" size={13} /></span>
                    )}
                    {currentAgent === i && (
                      <span className="stream-cursor" style={{ marginLeft: 4 }} />
                    )}
                  </button>
                ))}
              </div>

              <div>
                {/* Tab Header */}
                <div className="panel-head">
                  <div className="panel-title">
                    <span className="panel-title-icon" style={{ color: activeAgent.color }}><ActiveAgentIcon size={18} /></span>
                    {activeAgent.label} Agent
                    {completedAgents.has(AGENTS.findIndex((a) => a.key === activeTab)) && (
                      <span className="badge badge-green"><ActionIcon name="check" size={12} /> Complete</span>
                    )}
                    {currentAgent === AGENTS.findIndex((a) => a.key === activeTab) && (
                      <span className="badge badge-live"><ActionIcon name="bolt" size={12} /> Building</span>
                    )}
                  </div>
                  {activeOutput && (
                    <div className="panel-actions">
                      <button className="ghost-action" onClick={handleCopy}>
                        <ActionIcon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
                      </button>
                      <button className="ghost-action" onClick={handleDownload}>
                        <ActionIcon name="download" size={14} /> Download
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab Body */}
                {!activeOutput ? (
                  <div className="stream-box empty activity-empty">
                    <div className={`activity-orb ${isActiveAgent ? "is-working" : ""}`} style={{ color: activeAgent.color }}><activeAgent.Icon size={26} /></div>
                    <div className="activity-kicker">
                      {isActiveAgent ? "In progress now" : isUpcoming ? "Up next in your pipeline" : "Ready when you are"}
                    </div>
                    <div className="activity-title">
                      {isActiveAgent ? activity.working : isUpcoming ? activity.upcoming : `Bring ${activeAgent.label.toLowerCase()} into focus.`}
                    </div>
                    <div className="activity-copy">
                      {isActiveAgent || isUpcoming
                        ? activity.detail
                        : "Start the pipeline and every specialist will build on the work that comes before it."}
                    </div>
                    {(isActiveAgent || isUpcoming) && (
                      <div className="thinking-chain" aria-label="Agent workflow">
                        {activity.tasks.map((task, index) => (
                          <div className="thinking-node" key={task}>
                            <span className="thinking-index">{String(index + 1).padStart(2, "0")}</span>
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isWebsiteTab ? (
                  /* Website Preview */
                  <div style={{ padding: 0 }}>
                    {/* Show raw HTML option */}
                    <div style={{ padding: "12px 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
                        Live preview — your landing page code is ready to deploy
                      </span>
                    </div>
                    {previewUrl ? (
                      <div className="website-preview" style={{ margin: "20px", borderRadius: "var(--radius-md)" }}>
                        <div className="browser-bar">
                          <div className="browser-dots">
                            <div className="browser-dot dot-red" />
                            <div className="browser-dot dot-yellow" />
                            <div className="browser-dot dot-green" />
                          </div>
                          <div className="browser-url">
                            your-startup.com — AI Generated Landing Page
                          </div>
                        </div>
                        <iframe
                          src={previewUrl}
                          className="preview-iframe"
                          title="Generated Website Preview"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      </div>
                    ) : (
                      <div className="stream-box">
                        <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 500, whiteSpace: "pre-wrap" }}>
                          {activeOutput}
                          {currentAgent === 4 && <span className="stream-cursor" />}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Markdown Output */
                  <div className="stream-box">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeOutput}
                    </ReactMarkdown>
                    {currentAgent === AGENTS.findIndex((a) => a.key === activeTab) && (
                      <span className="stream-cursor" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download all CTA */}
          {completedAgents.size === AGENTS.length && (
            <div className="success-band">
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  Your startup package is ready
                </div>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  All 6 agents completed · Business plan, brand, website, and pitch deck generated
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOutputs(EMPTY_OUTPUTS);
                    setWebsitePreview(null);
                    setCompletedAgents(new Set());
                    setCurrentAgent(-1);
                    setIdea("");
                  }}
                >
                  <ActionIcon name="reset" size={15} /> Start over
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Download all as a text bundle
                    const bundle = AGENTS.map(
                      (a) => `# ${a.label}\n\n${outputs[a.key]}`
                    ).join("\n\n---\n\n");
                    const blob = new Blob([bundle], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "startup-package.md";
                    link.click();
                  }}
                >
                  <ActionIcon name="download" size={15} /> Download full package
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container site-footer-inner">
          <span><Image className="footer-zing-logo" src="/WhatsApp_Image_2026-08-07_at_13.37.59-removebg-preview.png" alt="Zing" width={68} height={25} /> — Developed by Zaya Code Hub · AI startup intelligence</span>
          <span>A Zaya Code Hub product</span>
        </div>
      </footer>
    </>
  );
}

export default function BuildPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--charcoal-60)" }}>
        Loading...
      </div>
    }>
      <BuildPageInner />
    </Suspense>
  );
}
