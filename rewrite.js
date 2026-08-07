const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/build/page.tsx');
// Read as-is (CRLF preserved)
let src = fs.readFileSync(filePath, 'utf8');

// Normalize to LF for string matching/replacement, then we'll write back
src = src.replace(/\r\n/g, '\n');

// ─── 1. Insert AI_MESSAGES + formatTime after EMPTY_OUTPUTS ─────────────────
const injectAfter = `const EMPTY_OUTPUTS: AgentOutputs = {
  marketResearch: "",
  businessStrategy: "",
  financialPlanning: "",
  branding: "",
  websiteGenerator: "",
  pitchDeck: "",
};`;

const injectContent = `
const AI_MESSAGES = [
  "Initializing AI agent network...",
  "Scanning market signals and trends...",
  "Estimating TAM / SAM / SOM...",
  "Validating problem-solution fit...",
  "Mapping competitive landscape...",
  "Identifying customer personas...",
  "Defining go-to-market strategy...",
  "Stress-testing business model assumptions...",
  "Modeling unit economics and LTV/CAC...",
  "Projecting 3-year revenue milestones...",
  "Crafting brand identity and voice...",
  "Designing conversion narrative...",
  "Generating landing page HTML/CSS/JS...",
  "Framing investor pitch narrative...",
  "Packaging startup into deliverables...",
];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return \`\${m}:\${s}\`;
}
`;

if (!src.includes(injectAfter)) { console.error('FAIL: Could not find EMPTY_OUTPUTS block'); process.exit(1); }
src = src.replace(injectAfter, injectAfter + injectContent);
console.log('✅ Step 1: AI_MESSAGES + formatTime inserted');

// ─── 2. Add elapsedTime + liveMessageIndex states ───────────────────────────
const stateAnchor = `  const briefFileInputRef = useRef<HTMLInputElement>(null);`;
const stateReplacement = `  const briefFileInputRef = useRef<HTMLInputElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveMessageIndex, setLiveMessageIndex] = useState(0);`;

if (!src.includes(stateAnchor)) { console.error('FAIL: Could not find briefFileInputRef state'); process.exit(1); }
src = src.replace(stateAnchor, stateReplacement);
console.log('✅ Step 2: State variables added');

// ─── 3. Add timer useEffect after the cleanup useEffect ─────────────────────
const cleanupEffect = `  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);`;

const cleanupWithTimer = `  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    setElapsedTime(0);
    setLiveMessageIndex(0);
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    const msgTimer = setInterval(() => setLiveMessageIndex((i) => (i + 1) % AI_MESSAGES.length), 3000);
    return () => { clearInterval(timer); clearInterval(msgTimer); };
  }, [running]);`;

if (!src.includes(cleanupEffect)) { console.error('FAIL: Could not find cleanup useEffect'); process.exit(1); }
src = src.replace(cleanupEffect, cleanupWithTimer);
console.log('✅ Step 3: Timer useEffect added');

// ─── 4. Replace entire progress+trace+output+success section ────────────────
const OLD_START = `          {(running || completedAgents.size > 0) && (`;
const OLD_END   = `          {exportStatus && <div className="export-status">{exportStatus}</div>}
            </div>
          )}`;

const startIdx = src.indexOf(OLD_START);
const endIdx   = src.indexOf(OLD_END);

if (startIdx === -1) { console.error('FAIL: Could not find OLD_START'); process.exit(1); }
if (endIdx   === -1) { console.error('FAIL: Could not find OLD_END'); process.exit(1); }

const newBlock = `          {(running || completedAgents.size > 0) && (
            <div className="premium-execution-layout">
              {completedAgents.size === AGENTS.length ? (
                <>
                  {/* ── Celebration Screen ── */}
                  <div className="exec-celebration">
                    <div className="exec-celebration-icon">
                      <ActionIcon name="check" size={48} />
                    </div>
                    <h2>🎉 Startup Blueprint Ready</h2>
                    <p>Your AI venture team has successfully generated your complete startup package.</p>
                    {projectSaveStatus && <div className="project-save-status" style={{ marginBottom: 8 }}>{projectSaveStatus}</div>}
                    <div className="success-actions" style={{ marginTop: 24, justifyContent: "center" }}>
                      <button className="btn btn-secondary" onClick={resetWorkspace}>
                        <ActionIcon name="reset" size={15} /> Start over
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const bundle = AGENTS.map((a) => \`# \${a.label}\\n\\n\${outputs[a.key]}\`).join("\\n\\n---\\n\\n");
                          const blob = new Blob([bundle], { type: "text/markdown" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "startup-package.md";
                          link.click();
                        }}
                      >
                        <ActionIcon name="download" size={15} /> Download Full Package
                      </button>
                      <button className="btn btn-secondary" onClick={handleExportFolder}>
                        <ActionIcon name="download" size={15} /> Export Folder
                      </button>
                      <Link href="/projects" className="btn btn-secondary">My Projects</Link>
                    </div>
                    {exportStatus && <div className="export-status">{exportStatus}</div>}
                  </div>

                  {/* ── Output Tabs (revealed after completion) ── */}
                  <div className="output-shell premium-output" style={{ marginTop: 24 }}>
                    <div className="tabs-row">
                      {AGENTS.map((a, i) => (
                        <button
                          key={a.key}
                          className={\`tab-btn \${activeTab === a.key ? "active" : ""}\`}
                          onClick={() => setActiveTab(a.key)}
                          style={activeTab === a.key ? { color: a.color, borderBottomColor: a.color } : {}}
                        >
                          <a.Icon size={15} /> {a.label}
                          {completedAgents.has(i) && (
                            <span className="tab-check"><ActionIcon name="check" size={13} /></span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="panel-head">
                        <div className="panel-title">
                          <span className="panel-title-icon" style={{ color: activeAgent.color }}>
                            <ActiveAgentIcon size={18} />
                          </span>
                          {activeAgent.label} Agent
                          {completedAgents.has(activeAgentIndex) && (
                            <span className="badge badge-green"><ActionIcon name="check" size={12} /> Complete</span>
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
                      {isWebsiteTab ? (
                        <div style={{ padding: 0 }}>
                          <div className="preview-note">Live preview — your landing page code is ready to deploy</div>
                          {previewUrl ? (
                            <div className="website-preview" style={{ margin: "20px", borderRadius: "var(--radius-md)" }}>
                              <div className="browser-bar">
                                <div className="browser-dots">
                                  <div className="browser-dot dot-red" />
                                  <div className="browser-dot dot-yellow" />
                                  <div className="browser-dot dot-green" />
                                </div>
                                <div className="browser-url">your-startup.com — AI Generated Landing Page</div>
                              </div>
                              <iframe src={previewUrl} className="preview-iframe" title="Generated Website Preview" sandbox="allow-same-origin allow-scripts" />
                            </div>
                          ) : (
                            <div className="stream-box">
                              <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 500, whiteSpace: "pre-wrap" }}>{activeOutput}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="stream-box">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeOutput}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Live Execution Header ── */}
                  <div className="exec-header">
                    <div className="exec-header-top">
                      <div className="exec-header-title">
                        <h2><span>🧠</span> AI Startup Builder</h2>
                        <div className="exec-header-subtitle">Building your startup using multiple AI agents in real time...</div>
                      </div>
                      <div className="exec-header-stats">
                        <div className="exec-stat">
                          <span className="exec-stat-label">Estimated Remaining</span>
                          <span className="exec-stat-value">{formatTime(Math.max(0, 180 - elapsedTime))}</span>
                        </div>
                        <div className="exec-stat">
                          <span className="exec-stat-label">Elapsed Time</span>
                          <span className="exec-stat-value">{formatTime(elapsedTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="exec-progress-container">
                      <div className="exec-progress-bar-bg">
                        <div className="exec-progress-bar-fill" style={{ width: \`\${Math.max(2, progress * 100)}%\` }} />
                      </div>
                      <div className="exec-progress-pct">{Math.round(progress * 100)}%</div>
                    </div>
                  </div>

                  {/* ── Phase Stepper ── */}
                  <div className="exec-stepper">
                    {AGENTS.map((a, i) => (
                      <div key={a.key} className={\`exec-step \${completedAgents.has(i) ? "is-done" : currentAgent === i ? "is-active" : ""}\`}>
                        <div className="exec-step-icon">
                          {completedAgents.has(i) ? <ActionIcon name="check" size={16} /> : <a.Icon size={16} />}
                        </div>
                        <div className="exec-step-label">{a.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Main Two-Column Area ── */}
                  <div className="exec-main-area">
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      <div className="exec-current-phase">
                        <div className="exec-phase-badge">Phase {Math.max(1, currentAgent + 1)} of {AGENTS.length}</div>
                        <div className="exec-phase-title">
                          {currentAgent >= 0 ? AGENTS[currentAgent].label : "Warming up..."}
                        </div>
                        <div className="exec-phase-task">
                          {currentAgent >= 0 ? AGENT_ACTIVITY[AGENTS[currentAgent].key].working : "Connecting AI agents..."}
                        </div>
                        <div className="exec-checklist">
                          {currentAgent >= 0 && AGENT_ACTIVITY[AGENTS[currentAgent].key].tasks.map((task, idx) => {
                            const isDone = elapsedTime > (currentAgent * 30 + idx * 7);
                            return (
                              <div key={task} className={\`exec-checklist-item \${isDone ? "is-done" : "is-waiting"}\`}>
                                {isDone ? <ActionIcon name="check" size={16} /> : <span>⏳</span>} {task}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="exec-terminal">
                        <div className="exec-terminal-title">Live AI Activity</div>
                        <div className="exec-terminal-lines">
                          {AI_MESSAGES.slice(Math.max(0, liveMessageIndex - 3), liveMessageIndex).map((msg, i) => (
                            <div key={i} className="exec-terminal-line is-done">
                              <ActionIcon name="check" size={14} /> {msg}
                            </div>
                          ))}
                          <div className="exec-terminal-line is-active">
                            <span style={{ color: "#3B82F6" }}>❯</span> {AI_MESSAGES[liveMessageIndex]}<span className="exec-type-cursor" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="exec-agent-grid">
                      {AGENTS.map((a, i) => (
                        <div key={a.key} className={\`exec-agent-card \${completedAgents.has(i) ? "is-done" : currentAgent === i ? "is-active" : ""}\`}>
                          <div className="exec-agent-icon">
                            {completedAgents.has(i) ? <ActionIcon name="check" size={20} /> : <a.Icon size={20} />}
                          </div>
                          <div className="exec-agent-info">
                            <div className="exec-agent-name">{a.label}</div>
                            <div className="exec-agent-status">
                              {completedAgents.has(i) ? "Completed" : currentAgent === i ? "Working..." : "Waiting..."}
                            </div>
                          </div>
                          <div className="exec-agent-meta">
                            <div className="exec-agent-pct">
                              {completedAgents.has(i) ? "100%" : currentAgent === i ? \`\${Math.round((elapsedTime % 30) / 30 * 100)}%\` : "0%"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}`;

const endOfOldBlock = endIdx + OLD_END.length;
src = src.substring(0, startIdx) + newBlock + src.substring(endOfOldBlock);
console.log('✅ Step 4: Premium UI block replaced');

fs.writeFileSync(filePath, src);
console.log('✅ DONE: page.tsx successfully rewritten!');
