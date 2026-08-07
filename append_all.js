const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/globals.css');
let src = fs.readFileSync(filePath, 'utf8');
src = src.replace(/\r\n/g, '\n');

// Verify we start clean
if (src.includes('account-strip') || src.includes('exec-header')) {
  console.error('FAIL: CSS already has styles - run git checkout first');
  process.exit(1);
}

const allNewCSS = `

/* ═══════════════════════════════════════════════════════════
   ACCOUNT STRIP & USER MENU
═══════════════════════════════════════════════════════════ */
.account-strip {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  overflow: hidden;
  margin-bottom: 32px;
}

.account-strip-identity {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  flex: 1;
}

.account-strip-identity h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.03em;
  margin: 4px 0 0;
}

.account-strip-identity h2 em {
  font-style: normal;
}

.account-strip-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(0,0,0,0.4);
  margin: 0;
}

.account-strip-email {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
  margin: 2px 0 0;
}

.account-strip-loading {
  padding: 28px 32px;
  font-size: 14px;
  color: rgba(0,0,0,0.4);
}

.account-strip-stats {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 32px;
  border-left: 1px solid rgba(0,0,0,0.06);
  border-right: 1px solid rgba(0,0,0,0.06);
}

.account-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 24px;
  text-align: center;
}

.account-stat + .account-stat {
  border-left: 1px solid rgba(0,0,0,0.06);
}

.account-stat span {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0,0,0,0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.account-stat strong {
  font-size: 22px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.03em;
}

.account-stat strong.live {
  color: #10b981;
  position: relative;
  padding-left: 14px;
}

.account-stat strong.live::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16,185,129,0.3);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
  70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}

.account-strip-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 28px 32px;
}

.account-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7C3AED, #3B82F6);
  color: white;
  font-size: 20px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-avatar.lg {
  width: 56px;
  height: 56px;
  font-size: 24px;
}

.account-avatar.guest {
  background: linear-gradient(135deg, #F59E0B, #EF4444);
}

@media (max-width: 980px) {
  .account-strip {
    flex-direction: column;
    align-items: stretch;
  }
  .account-strip-stats {
    border-left: none;
    border-right: none;
    border-top: 1px solid rgba(0,0,0,0.06);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    padding: 20px 32px;
  }
  .account-strip-actions {
    justify-content: flex-start;
  }
}

/* ── Account Dropdown (Navbar) ── */
.account-menu {
  position: relative;
  display: inline-block;
}

.account-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: 1px solid rgba(0,0,0,0.08);
  cursor: pointer;
  padding: 6px 14px 6px 6px;
  border-radius: 999px;
  transition: background-color 0.2s ease;
  font: inherit;
}

.account-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.account-trigger .account-avatar {
  width: 34px;
  height: 34px;
  font-size: 15px;
}

.account-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.account-meta strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.account-meta em {
  font-size: 11px;
  font-style: normal;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.account-caret {
  margin-left: 4px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease;
}

.account-trigger[aria-expanded="true"] .account-caret {
  transform: rotate(180deg);
}

.account-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 260px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 8px;
  z-index: 100;
  animation: dropdown-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

@keyframes dropdown-fade-in {
  from { opacity: 0; transform: scale(0.95) translateY(-6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.account-dropdown-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 4px;
}

.account-dropdown-head .account-avatar {
  width: 40px;
  height: 40px;
  font-size: 18px;
  flex-shrink: 0;
}

.account-dropdown-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}

.account-dropdown-email {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.account-dropdown-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.account-dropdown-links a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.account-dropdown-links a:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #7C3AED;
}

.account-signout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.15s ease;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.account-signout:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

/* ═══════════════════════════════════════════════════════════
   PREMIUM MULTI-AGENT EXECUTION UI
═══════════════════════════════════════════════════════════ */
.premium-execution-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 40px;
}

/* ── Execution Header ── */
.exec-header {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 22px;
  padding: 28px 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exec-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.exec-header-title h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 4px;
}

.exec-header-subtitle {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
  font-weight: 500;
}

.exec-header-stats {
  display: flex;
  gap: 32px;
  flex-shrink: 0;
}

.exec-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.exec-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgba(0,0,0,0.38);
}

.exec-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.exec-progress-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.exec-progress-bar-bg {
  flex: 1;
  height: 10px;
  background: rgba(0,0,0,0.05);
  border-radius: 999px;
  overflow: hidden;
}

.exec-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7C3AED, #8B5CF6, #3B82F6, #7C3AED);
  background-size: 200% 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation: gradient-shift 3s linear infinite;
}

@keyframes gradient-shift {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.exec-progress-pct {
  font-size: 18px;
  font-weight: 800;
  color: #7C3AED;
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ── Phase Stepper ── */
.exec-stepper {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.exec-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
}

.exec-step + .exec-step::before {
  content: "";
  position: absolute;
  left: 0;
  top: 18px;
  width: calc(50% - 18px);
  height: 2px;
  background: rgba(0,0,0,0.07);
  transform: translateX(-100%);
}

.exec-step.is-done + .exec-step::before {
  background: #10B981;
}

.exec-step-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.05);
  color: rgba(0,0,0,0.3);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.exec-step.is-done .exec-step-icon {
  background: #10B981;
  color: white;
}

.exec-step.is-active .exec-step-icon {
  background: linear-gradient(135deg, #7C3AED, #3B82F6);
  color: white;
  animation: step-pulse 2s infinite;
}

@keyframes step-pulse {
  0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
}

.exec-step-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0,0,0,0.35);
  text-align: center;
  line-height: 1.2;
}

.exec-step.is-done .exec-step-label {
  color: #10B981;
}

.exec-step.is-active .exec-step-label {
  color: #7C3AED;
  font-weight: 700;
}

/* ── Main Two-Column Area ── */
.exec-main-area {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

/* ── Current Phase Card ── */
.exec-current-phase {
  background: white;
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: 22px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(124,58,237,0.06);
}

.exec-phase-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  background: rgba(124,58,237,0.08);
  color: #7C3AED;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  margin-bottom: 16px;
}

.exec-phase-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-bottom: 10px;
}

.exec-phase-task {
  font-size: 15px;
  color: rgba(0,0,0,0.55);
  font-weight: 500;
  margin-bottom: 24px;
  line-height: 1.5;
}

.exec-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exec-checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0,0,0,0.5);
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(0,0,0,0.02);
  transition: all 0.3s ease;
}

.exec-checklist-item.is-done {
  color: #10B981;
  background: rgba(16,185,129,0.06);
}

.exec-checklist-item.is-waiting {
  color: rgba(0,0,0,0.35);
}

/* ── Live AI Terminal ── */
.exec-terminal {
  background: #0D1117;
  border-radius: 18px;
  padding: 22px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  margin-top: 20px;
}

.exec-terminal-title {
  font-size: 11px;
  font-weight: 700;
  color: #4B5563;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.exec-terminal-title::before {
  content: "";
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 6px #38BDF8;
  animation: blink 1.5s ease-in-out infinite;
}

.exec-terminal-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.exec-terminal-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4B5563;
  opacity: 0.7;
}

.exec-terminal-line.is-done {
  color: #10B981;
  opacity: 1;
}

.exec-terminal-line.is-active {
  color: #F9FAFB;
  opacity: 1;
}

.exec-type-cursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  background: #F9FAFB;
  margin-left: 2px;
  border-radius: 1px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ── Agent Status Grid ── */
.exec-agent-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exec-agent-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.25s ease;
}

.exec-agent-card.is-active {
  border-color: rgba(124,58,237,0.25);
  box-shadow: 0 4px 16px rgba(124,58,237,0.1);
  transform: translateX(-3px);
}

.exec-agent-card.is-done {
  border-color: rgba(16,185,129,0.2);
  background: rgba(16,185,129,0.02);
}

.exec-agent-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.35);
  flex-shrink: 0;
  transition: all 0.25s ease;
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
  min-width: 0;
}

.exec-agent-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}

.exec-agent-status {
  font-size: 12px;
  color: rgba(0,0,0,0.4);
  margin-top: 2px;
}

.exec-agent-card.is-active .exec-agent-status {
  color: #7C3AED;
}

.exec-agent-card.is-done .exec-agent-status {
  color: #10B981;
}

.exec-agent-meta {
  text-align: right;
  flex-shrink: 0;
}

.exec-agent-pct {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.exec-agent-card.is-active .exec-agent-pct {
  color: #7C3AED;
}

.exec-agent-card.is-done .exec-agent-pct {
  color: #10B981;
}

/* ── Celebration Screen ── */
.exec-celebration {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  text-align: center;
  background: white;
  border: 1px solid rgba(16,185,129,0.15);
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(16,185,129,0.08);
  animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scale-up {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.exec-celebration-icon {
  width: 88px;
  height: 88px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 16px 36px rgba(16,185,129,0.3);
}

.exec-celebration h2 {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}

.exec-celebration p {
  font-size: 17px;
  color: rgba(0,0,0,0.55);
  max-width: 480px;
  line-height: 1.6;
}

/* ── Responsive ── */
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
    flex-direction: row;
    align-self: stretch;
    justify-content: space-between;
  }
  .exec-stepper {
    overflow-x: auto;
  }
}
`;

src = src + allNewCSS;

fs.writeFileSync(filePath, src);
console.log('✅ All CSS appended cleanly. Total length:', src.split('\n').length, 'lines');
