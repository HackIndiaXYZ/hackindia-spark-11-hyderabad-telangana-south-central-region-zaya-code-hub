const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/build/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\\n');

// Find start and end indices
const startIndex = lines.findIndex(l => l.includes('{(running || completedAgents.size > 0) && ('));
// Find the end of the success-band block (after export-status)
const exportStatusIndex = lines.findIndex(l => l.includes('{exportStatus && <div className="export-status">{exportStatus}</div>}'));
// The closing brace and parenthesis of that condition is 2 lines below
const endIndex = exportStatusIndex + 2;

if (startIndex === -1 || exportStatusIndex === -1) {
  console.error("Could not find boundaries.");
  process.exit(1);
}

const newJSX = `          {/* PREMIUM MULTI-AGENT EXECUTION UI */}
          {(running || completedAgents.size > 0) && (
            <div className="premium-execution-layout">
              {completedAgents.size === AGENTS.length ? (
                <>
                  <div className="exec-celebration">
                    <div className="exec-celebration-icon">
                      <ActionIcon name="check" size={48} />
                    </div>
                    <h2>🎉 Startup Blueprint Ready</h2>
                    <p>Your AI venture team has successfully generated your complete startup package.</p>
                    <div className="success-actions" style={{ marginTop: 24, justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={resetWorkspace}>
                        <ActionIcon name="reset" size={15} /> Start over
                      </button>
                      <button className="btn btn-primary" onClick={() => {
                        const bundle = AGENTS.map((a) => \`# \${a.label}\\n\\n\${outputs[a.key]}\`).join("\\n\\n---\\n\\n");
                        const blob = new Blob([bundle], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "startup-package.md";
                        link.click();
                      }}>
                        <ActionIcon name="download" size={15} /> Download Full Package
                      </button>
                      <button className="btn btn-secondary" onClick={handleExportFolder}>
                        <ActionIcon name="download" size={15} /> Export Folder
                      </button>
                      <Link href="/projects" className="btn btn-secondary">
                        My Projects
                      </Link>
                    </div>
                  </div>

                  {/* Outputs are revealed below the celebration */}
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
                            <span className="tab-check">
                              <ActionIcon name="check" size={13} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div>
                      <div className="panel-head">
                        <div className="panel-title">
                          <span className="panel-title-icon" style={{ color: AGENTS.find(a => a.key === activeTab)?.color }}>
                            {(() => {
                              const ActiveAgentIcon = AGENTS.find(a => a.key === activeTab)?.Icon || IconResearch;
                              return <ActiveAgentIcon size={18} />;
                            })()}
                          </span>
                          {AGENTS.find(a => a.key === activeTab)?.label} Agent
                          <span className="badge badge-green">
                            <ActionIcon name="check" size={12} /> Complete
                          </span>
                        </div>
                        {outputs[activeTab] && (
                          <div className="panel-actions">
                            <button className="ghost-action" onClick={handleCopy}>
                              <ActionIcon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      {activeTab === "websiteGenerator" ? (
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
                              <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 500, whiteSpace: "pre-wrap" }}>
                                {outputs[activeTab]}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="stream-box">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{outputs[activeTab]}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="exec-header">
                    <div className="exec-header-top">
                      <div className="exec-header-title">
                        <h2>
                          <span>🧠</span> AI Startup Builder
                        </h2>
                        <div className="exec-header-subtitle">Building your startup using multiple AI agents...</div>
                      </div>
                      <div className="exec-header-stats">
                        <div className="exec-stat">
                          <span className="exec-stat-label">Estimated Time Remaining</span>
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

                  <div className="exec-stepper">
                    {AGENTS.map((a, i) => (
                      <div key={a.key} className={\`exec-step \${completedAgents.has(i) ? 'is-done' : currentAgent === i ? 'is-active' : ''}\`}>
                        <div className="exec-step-icon">
                          {completedAgents.has(i) ? <ActionIcon name="check" size={16} /> : <a.Icon size={16} />}
                        </div>
                        <div className="exec-step-label">{a.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="exec-main-area">
                    <div className="exec-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                            // Pseudo-random check based on time for realism
                            const isDone = elapsedTime > (currentAgent * 30 + idx * 7); 
                            return (
                              <div key={task} className={\`exec-checklist-item \${isDone ? 'is-done' : 'is-waiting'}\`}>
                                {isDone ? <ActionIcon name="check" size={16} /> : "⏳"} {task}
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
                            <span style={{ color: '#3B82F6' }}>❯</span> {AI_MESSAGES[liveMessageIndex]}<span className="exec-type-cursor" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="exec-agent-grid">
                      {AGENTS.map((a, i) => (
                        <div key={a.key} className={\`exec-agent-card \${completedAgents.has(i) ? 'is-done' : currentAgent === i ? 'is-active' : ''}\`}>
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
                            <div className="exec-agent-time">
                              {completedAgents.has(i) ? "00:30" : currentAgent === i ? formatTime(elapsedTime % 30) : "--:--"}
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

const newLines = [
  ...lines.slice(0, startIndex),
  newJSX,
  ...lines.slice(endIndex + 1)
];

fs.writeFileSync(filePath, newLines.join('\\n'));
console.log("Successfully patched page.tsx using line slicing.");
