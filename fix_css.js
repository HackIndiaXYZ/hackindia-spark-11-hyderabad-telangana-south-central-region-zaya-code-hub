const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/globals.css');
let content = fs.readFileSync(filePath, 'utf8');

const badBlock = `  background: #10b981;\\n  box-shadow: 0 0 12px #10b981;\\n  animation: pulse-dot 2s infinite;\\n}`;
content = content.replace(badBlock, '');

// If the file ends with a pulse-dot animation that got inserted weirdly
const badKeyframes = `@keyframes pulse-dot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}`;
content = content.replace(badKeyframes, '');

// Append the premium CSS
const premiumCSS = `
/* ── Premium Multi-Agent Execution UI ── */
.premium-execution-layout {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.exec-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,248,250,0.85));
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1);
  backdrop-filter: blur(20px);
}

.exec-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exec-header-title {
  display: flex;
  flex-direction: column;
}

.exec-header-title h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 12px;
}

.exec-header-title h2 span {
  font-size: 1.6rem;
}

.exec-header-subtitle {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
  font-weight: 500;
  margin-top: 4px;
}

.exec-header-stats {
  display: flex;
  gap: 32px;
}

.exec-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.exec-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(0,0,0,0.4);
}

.exec-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.exec-progress-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.exec-progress-bar-bg {
  flex: 1;
  height: 12px;
  background: rgba(0,0,0,0.04);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.exec-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7C3AED, #8B5CF6, #3B82F6, #7C3AED);
  background-size: 200% 100%;
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  animation: gradient-shift 3s linear infinite;
}

.exec-progress-pct {
  font-size: 18px;
  font-weight: 800;
  color: #7C3AED;
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@keyframes gradient-shift {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.exec-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.exec-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
}

.exec-step::after {
  content: "";
  position: absolute;
  top: 18px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: rgba(0,0,0,0.05);
  z-index: 0;
}

.exec-step:last-child::after {
  display: none;
}

.exec-step-icon {
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F3F4F6;
  color: #9CA3AF;
  font-size: 16px;
  transition: all 0.3s ease;
}

.exec-step-label {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  text-align: center;
  transition: all 0.3s ease;
}

.exec-step.is-done .exec-step-icon {
  background: #10B981;
  color: white;
}

.exec-step.is-done .exec-step-label {
  color: #10B981;
}

.exec-step.is-done::after {
  background: #10B981;
}

.exec-step.is-active .exec-step-icon {
  background: linear-gradient(135deg, #7C3AED, #3B82F6);
  color: white;
  box-shadow: 0 0 0 4px rgba(124,58,237,0.2);
  animation: pulse-border 2s infinite;
}

.exec-step.is-active .exec-step-label {
  color: #7C3AED;
  font-weight: 700;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
}

.exec-main-area {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

.exec-current-phase {
  background: white;
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(124,58,237,0.06);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.exec-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(124,58,237,0.1);
  color: #7C3AED;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 999px;
  width: fit-content;
}

.exec-phase-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.exec-phase-task {
  font-size: 16px;
  color: rgba(0,0,0,0.6);
  font-weight: 500;
}

.exec-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.exec-checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

.exec-checklist-item.is-done {
  color: #10B981;
}

.exec-checklist-item.is-waiting {
  color: #9CA3AF;
  opacity: 0.8;
}

.exec-terminal {
  background: #0F172A;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
  position: relative;
}

.exec-terminal::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 40px;
  background: linear-gradient(180deg, rgba(15,23,42,1), rgba(15,23,42,0));
  z-index: 1;
}

.exec-terminal-title {
  font-size: 12px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  z-index: 2;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.exec-terminal-title::before {
  content: "";
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 8px #38BDF8;
  animation: pulse-dot 2s infinite;
}

.exec-terminal-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  z-index: 2;
  position: relative;
}

.exec-terminal-line {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.7;
}

.exec-terminal-line.is-done {
  color: #10B981;
}

.exec-terminal-line.is-active {
  color: white;
  opacity: 1;
}

.exec-type-cursor {
  display: inline-block;
  width: 8px;
  height: 14px;
  background: white;
  margin-left: 4px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.exec-agent-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exec-agent-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.exec-agent-card.is-active {
  border-color: rgba(124,58,237,0.3);
  box-shadow: 0 8px 24px rgba(124,58,237,0.08);
  transform: translateX(-4px);
}

.exec-agent-card.is-done {
  border-color: rgba(16,185,129,0.2);
  background: rgba(16,185,129,0.02);
}

.exec-agent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #F3F4F6;
  color: #6B7280;
}

.exec-agent-card.is-active .exec-agent-icon {
  background: rgba(124,58,237,0.1);
  color: #7C3AED;
}

.exec-agent-card.is-done .exec-agent-icon {
  background: rgba(16,185,129,0.1);
  color: #10B981;
}

.exec-agent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exec-agent-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.exec-agent-status {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
}

.exec-agent-card.is-active .exec-agent-status {
  color: #7C3AED;
}

.exec-agent-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.exec-agent-pct {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.exec-agent-time {
  font-size: 11px;
  color: #9CA3AF;
  font-variant-numeric: tabular-nums;
}

.exec-celebration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.exec-celebration-icon {
  width: 96px;
  height: 96px;
  background: #10B981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin-bottom: 24px;
  box-shadow: 0 16px 32px rgba(16,185,129,0.3);
}

.exec-celebration h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}

.exec-celebration p {
  font-size: 18px;
  color: rgba(0,0,0,0.6);
  margin-bottom: 32px;
}

@keyframes scale-up {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 980px) {
  .exec-main-area {
    grid-template-columns: 1fr;
  }
  
  .exec-header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .exec-header-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .exec-stepper {
    overflow-x: auto;
    padding: 16px;
  }
  
  .exec-step {
    min-width: 80px;
  }
}
`;

fs.writeFileSync(filePath, content + premiumCSS);
console.log("Syntax fixed and premium CSS successfully appended.");
