"use client";
import Link from "next/link";

const AGENTS = [
  { icon: "🔍", title: "Market Research Agent", desc: "Deep competitor analysis, market size, TAM/SAM/SOM, trends and opportunity mapping powered by real-time AI search." },
  { icon: "♟️", title: "Business Strategy Agent", desc: "SWOT analysis, go-to-market strategy, positioning, unique value proposition and business model canvas." },
  { icon: "💰", title: "Financial Planning Agent", desc: "Revenue projections, pricing models, unit economics, break-even analysis and 3-year financial forecast." },
  { icon: "🎨", title: "Branding Agent", desc: "Brand identity, naming strategy, color palette, typography guidelines and brand voice documentation." },
  { icon: "🌐", title: "Website Generator Agent", desc: "Full working landing page HTML/CSS/JS with hero, features, pricing and CTA — ready to deploy instantly." },
  { icon: "📊", title: "Pitch Deck Agent", desc: "Investor-ready pitch narrative, slide structure, traction story, ask and use of funds — all formatted for Series A." },
];

const EXAMPLES = [
  "AI-based agriculture startup",
  "Mental health app for Gen Z",
  "SaaS tool for remote teams",
  "EdTech platform for rural India",
  "Climate tech carbon credit marketplace",
];

// ── Hackathon Banner ──────────────────────────────────────────────────────────
function HackathonBanner() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(217,119,87,0.3)",
    }}>
      <span style={{ fontSize: 16 }}>🏆</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", letterSpacing: "0.02em" }}>
        HackIndia × <span style={{ color: "#7C3AED" }}>Mutagent</span> Challenge Track
      </span>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(217,119,87,0.15)", border: "1px solid rgba(217,119,87,0.35)",
        borderRadius: 99, padding: "3px 12px",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#D97757" }}>$250 Prize Pool</span>
      </div>
      <span style={{ fontSize: 12, color: "#94A3B8" }}>|</span>
      <span style={{ fontSize: 12, color: "#94A3B8" }}>
        Built with <span style={{ color: "#06B6D4", fontWeight: 600 }}>Mutagent ADL</span> —
        Spec · Build · Evaluate · Diagnose · Optimize
      </span>
      <a
        href="https://github.com/mutagent-io/mutagent-hackathon"
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600, marginLeft: 4 }}
      >
        View Challenge →
      </a>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hackathon Banner */}
      <HackathonBanner />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="currentColor" opacity="0.15"/>
              <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="14" cy="14" r="3" fill="currentColor"/>
            </svg>
            AI Startup Builder
          </div>
          <div className="navbar-links">
            <Link href="#agents" className="btn btn-ghost btn-sm">Agents</Link>
            <Link href="#how" className="btn btn-ghost btn-sm">How it works</Link>
            <Link href="/build" className="btn btn-primary btn-sm">Start Building →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-tag">
          <span>⚡</span> 6 AI Agents · Claude-Powered · Real-time Streaming
        </div>
        <h1 className="hero-title">
          Build your startup<br/>
          in <span className="accent">minutes.</span>
        </h1>
        <p className="hero-subtitle">
          Enter your startup idea. Watch 6 specialized AI agents generate your complete
          business plan, brand identity, landing page, and investor pitch — simultaneously.
        </p>
        <div className="hero-cta">
          <Link href="/build" className="btn btn-primary btn-lg">
            🚀 Start Building Free
          </Link>
          <a href="#how" className="btn btn-secondary btn-lg">See how it works</a>
        </div>

        {/* Demo chips */}
        <div style={{ marginTop: 40, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {EXAMPLES.map((ex) => (
            <Link
              key={ex}
              href={`/build?idea=${encodeURIComponent(ex)}`}
              className="example-chip"
            >
              {ex}
            </Link>
          ))}
        </div>
      </section>

      {/* Features / Agents */}
      <section className="features" id="agents">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Six Specialized Agents</div>
            <h2 className="section-title">Everything a startup needs</h2>
            <p className="section-desc">
              Each agent is an expert in its domain, powered by Claude and orchestrated to work together.
            </p>
          </div>
          <div className="features-grid">
            {AGENTS.map((a) => (
              <div key={a.title} className="feature-card">
                <div className="feature-icon">{a.icon}</div>
                <div className="feature-title">{a.title}</div>
                <div className="feature-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 24px", background: "var(--cream-dark)" }} id="how">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">How it works</div>
            <h2 className="section-title">From idea to launch-ready</h2>
            <p className="section-desc">Three steps. Six agents. One complete startup package.</p>
          </div>
          <div className="how-grid">
            {[
              { n: "1", title: "Describe Your Idea", desc: "Type your startup concept in plain English — no templates needed." },
              { n: "2", title: "Agents Go to Work", desc: "All 6 AI agents run in sequence, each building on the previous output." },
              { n: "3", title: "Download & Launch", desc: "Get your business plan, brand, website code, and pitch deck instantly." },
            ].map((s) => (
              <div key={s.n} className="how-step">
                <div className="how-num">{s.n}</div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 52 }}>
            <Link href="/build" className="btn btn-primary btn-lg">
              Try it now — it&apos;s free →
            </Link>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section style={{ padding: "80px 24px" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">What you get</div>
            <h2 className="section-title">A complete startup package</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 40 }}>
            {[
              { icon: "📋", label: "Business Plan", sub: "Full narrative + executive summary" },
              { icon: "🔍", label: "Competitor Analysis", sub: "TAM, SAM, SOM + competitive matrix" },
              { icon: "💵", label: "Pricing Strategy", sub: "3 tiers + unit economics model" },
              { icon: "🎨", label: "Logo Concepts", sub: "Brand identity + color palette" },
              { icon: "🌐", label: "Landing Page", sub: "Working HTML/CSS/JS — deploy-ready" },
              { icon: "📊", label: "Investor Pitch", sub: "10-slide narrative + ask amount" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "var(--card-bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "18px 20px"
              }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--charcoal)" }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "var(--charcoal-60)", marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p style={{ marginBottom: 8 }}>
            <strong>AI Startup Builder</strong> — Powered by{" "}
            <a href="https://www.anthropic.com" target="_blank" rel="noreferrer">Anthropic Claude</a>
          </p>
          <p>Built with CrewAI-style orchestration · Open source agents · Real-time streaming</p>
        </div>
      </footer>
    </>
  );
}
