"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  icon: string;
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
  { key: "marketResearch",    label: "Market Research",   icon: "🔍", endpoint: "/api/agents/market-research",    color: "#3B82F6" },
  { key: "businessStrategy",  label: "Business Strategy", icon: "♟️", endpoint: "/api/agents/business-strategy",  color: "#8B5CF6" },
  { key: "financialPlanning", label: "Financial Planning",icon: "💰", endpoint: "/api/agents/financial-planning", color: "#10B981" },
  { key: "branding",          label: "Branding",          icon: "🎨", endpoint: "/api/agents/branding",           color: "#F59E0B" },
  { key: "websiteGenerator",  label: "Website Generator", icon: "🌐", endpoint: "/api/agents/website-generator",  color: "#EC4899" },
  { key: "pitchDeck",         label: "Pitch Deck",        icon: "📊", endpoint: "/api/agents/pitch-deck",         color: "#D97757" },
];

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

  const progress = completedAgents.size / AGENTS.length;

  // Generate preview URL when website is ready
  useEffect(() => {
    if (outputs.websiteGenerator && outputs.websiteGenerator.includes("<!DOCTYPE html>")) {
      const blob = new Blob([outputs.websiteGenerator], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [outputs.websiteGenerator]);

  const handleBuild = async () => {
    if (!idea.trim()) return;
    abortRef.current = false;
    setRunning(true);
    setError(null);
    setOutputs(EMPTY_OUTPUTS);
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
      await streamAgentOutput(
        "/api/agents/website-generator",
        { idea, branding, strategy: businessStrategy },
        (text) => setOutputs((p) => ({ ...p, websiteGenerator: text }))
      );
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
  const activeOutput = outputs[activeTab];
  const isWebsiteTab = activeTab === "websiteGenerator";

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" style={{ textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="currentColor" opacity="0.15" />
              <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="14" cy="14" r="3" fill="currentColor" />
            </svg>
            AI Startup Builder
          </Link>
          <div className="navbar-links">
            <Link href="/" className="btn btn-ghost btn-sm">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="builder-page">
        <div className="container">
          {/* Header */}
          <div className="builder-header">
            <h1 className="builder-title">Build Your Startup</h1>
            <p className="builder-sub">
              Describe your idea → 6 AI agents generate your complete startup package
            </p>
          </div>

          {/* Input Card */}
          <div className="input-card">
            <label className="input-label">Your Startup Idea</label>
            <div className="input-wrapper">
              <textarea
                className="idea-textarea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your startup idea in detail... e.g. 'An AI-powered platform that helps farmers in India predict crop diseases using drone imagery and machine learning'"
                disabled={running}
                rows={4}
              />
            </div>

            <div className="example-chips">
              <span style={{ fontSize: 12, color: "var(--charcoal-30)", alignSelf: "center" }}>Try:</span>
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

            <div className="input-footer">
              <div className="agents-pills">
                {AGENTS.map((a, i) => (
                  <div key={a.key} className="agent-pill">
                    <div
                      className="dot"
                      style={{
                        background: completedAgents.has(i)
                          ? "#22c55e"
                          : currentAgent === i
                          ? a.color
                          : "var(--charcoal-30)",
                      }}
                    />
                    {a.icon} {a.label}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {running && (
                  <button className="btn btn-secondary" onClick={handleStop}>
                    ⏹ Stop
                  </button>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleBuild}
                  disabled={running || !idea.trim()}
                >
                  {running ? (
                    <>
                      <span className="stream-cursor" style={{ marginRight: 4 }} />
                      Generating...
                    </>
                  ) : (
                    "🚀 Generate Startup Package"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: "rgba(239,68,68,0.06)",
              border: "1.5px solid rgba(239,68,68,0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 20px",
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#b91c1c", marginBottom: 4 }}>
                  Agent Error
                </div>
                <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>{error}</div>
                {error.includes("ANTHROPIC_API_KEY") && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--charcoal-60)", background: "var(--cream-dark)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "monospace" }}>
                    1. Open <strong>.env.local</strong><br/>
                    2. Replace <code>your_anthropic_api_key_here</code> with your real key from{" "}
                    <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a><br/>
                    3. Restart the dev server: <code>npm run dev</code>
                  </div>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--charcoal-30)", flexShrink: 0 }}
              >✕</button>
            </div>
          )}

          {/* Progress Card */}
          {(running || completedAgents.size > 0) && (
            <div className="progress-card">
              <div className="progress-header">
                <div className="progress-title">
                  {running && currentAgent >= 0
                    ? `Running: ${AGENTS[currentAgent].icon} ${AGENTS[currentAgent].label} Agent...`
                    : completedAgents.size === AGENTS.length
                    ? "✅ All agents complete! Your startup package is ready."
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
                      className={`step-icon ${
                        completedAgents.has(i) ? "done" : currentAgent === i ? "active" : ""
                      }`}
                      style={completedAgents.has(i) ? { fontSize: 18 } : {}}
                    >
                      {completedAgents.has(i) ? "✓" : a.icon}
                    </div>
                    <div className="step-label">{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Tabs */}
          {(running || Object.values(outputs).some(Boolean)) && (
            <div className="output-tabs">
              <div className="tabs-nav">
                {AGENTS.map((a, i) => (
                  <button
                    key={a.key}
                    className={`tab-btn ${activeTab === a.key ? "active" : ""}`}
                    onClick={() => setActiveTab(a.key)}
                    style={activeTab === a.key ? { color: a.color, borderBottomColor: a.color } : {}}
                  >
                    {a.icon} {a.label}
                    {completedAgents.has(i) && (
                      <span style={{ color: "#22c55e", marginLeft: 2 }}>✓</span>
                    )}
                    {currentAgent === i && (
                      <span className="stream-cursor" style={{ marginLeft: 4 }} />
                    )}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {/* Tab Header */}
                <div className="tab-header">
                  <div className="tab-title">
                    <span style={{ fontSize: 18 }}>{activeAgent.icon}</span>
                    {activeAgent.label} Agent
                    {completedAgents.has(AGENTS.findIndex((a) => a.key === activeTab)) && (
                      <span className="badge badge-green">✓ Complete</span>
                    )}
                    {currentAgent === AGENTS.findIndex((a) => a.key === activeTab) && (
                      <span className="badge badge-coral">⚡ Generating...</span>
                    )}
                  </div>
                  {activeOutput && (
                    <div className="tab-actions">
                      <button className="copy-btn" onClick={handleCopy}>
                        {copied ? "✓ Copied!" : "📋 Copy"}
                      </button>
                      <button className="copy-btn" onClick={handleDownload}>
                        ⬇ Download
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab Body */}
                {!activeOutput ? (
                  <div className="stream-box empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Waiting for agent...</div>
                    <div style={{ fontSize: 13 }}>
                      {currentAgent > AGENTS.findIndex((a) => a.key === activeTab)
                        ? "This agent hasn't run yet"
                        : "Click 'Generate Startup Package' to start"}
                    </div>
                  </div>
                ) : isWebsiteTab ? (
                  /* Website Preview */
                  <div style={{ padding: 0 }}>
                    {/* Show raw HTML option */}
                    <div style={{ padding: "12px 20px", background: "var(--cream-dark)", borderBottom: "1px solid var(--border)", display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--charcoal-60)", alignSelf: "center" }}>
                        🌐 Live preview below — your landing page code is ready to deploy
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
            <div
              style={{
                marginTop: 32,
                padding: "28px 32px",
                background: "linear-gradient(135deg, rgba(217,119,87,0.08), rgba(217,119,87,0.04))",
                border: "1px solid rgba(217,119,87,0.25)",
                borderRadius: "var(--radius-xl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--charcoal)", marginBottom: 4 }}>
                  🎉 Your startup package is ready!
                </div>
                <div style={{ fontSize: 14, color: "var(--charcoal-60)" }}>
                  All 6 agents completed · Business plan, brand, website, and pitch deck generated
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOutputs(EMPTY_OUTPUTS);
                    setCompletedAgents(new Set());
                    setCurrentAgent(-1);
                    setIdea("");
                  }}
                >
                  🔄 Start Over
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Download all as a text bundle
                    const bundle = AGENTS.map(
                      (a) => `# ${a.icon} ${a.label}\n\n${outputs[a.key]}`
                    ).join("\n\n---\n\n");
                    const blob = new Blob([bundle], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "startup-package.md";
                    link.click();
                  }}
                >
                  ⬇ Download Full Package
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>AI Startup Builder</strong> — Powered by{" "}
          <a href="https://www.anthropic.com" target="_blank" rel="noreferrer">
            Anthropic Claude
          </a>{" "}
          · 6 Specialized AI Agents
        </p>
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
