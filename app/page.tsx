"use client";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { AgentPipelineDiagram } from "@/components/agent-pipeline-diagram";
import {
  IconResearch,
  IconStrategy,
  IconFinance,
  IconBrand,
  IconWebsite,
  IconPitch,
} from "@/components/agent-icons";

const AGENTS = [
  { Icon: IconResearch, title: "Market research", desc: "Competitive landscape, TAM/SAM/SOM sizing, and trend analysis with cited figures." },
  { Icon: IconStrategy, title: "Business strategy", desc: "Go-to-market plan, positioning, SWOT, and a filled business model canvas." },
  { Icon: IconFinance, title: "Financial planning", desc: "Pricing tiers, unit economics, burn rate, and three-year projections." },
  { Icon: IconBrand, title: "Brand identity", desc: "Naming directions, palette, typography, voice, and messaging framework." },
  { Icon: IconWebsite, title: "Landing page", desc: "Single-file HTML you can deploy — hero, pricing, FAQ, and responsive layout." },
  { Icon: IconPitch, title: "Pitch deck", desc: "Ten-slide investor narrative with ask, milestones, and use of funds." },
];

const EXAMPLES = [
  "Vertical farming for urban grocers",
  "Compliance automation for fintech",
  "Care coordination for rural clinics",
  "B2B procurement for manufacturers",
];

const PREVIEW_STEPS = [
  { Icon: IconResearch, name: "Market research", desc: "Sizing the opportunity" },
  { Icon: IconStrategy, name: "Strategy", desc: "Defining the wedge" },
  { Icon: IconFinance, name: "Financials", desc: "Modeling the business" },
  { Icon: IconBrand, name: "Brand", desc: "Naming and identity" },
  { Icon: IconWebsite, name: "Website", desc: "Drafting the landing page" },
  { Icon: IconPitch, name: "Pitch", desc: "Packaging for investors" },
];

const OUTPUTS = [
  { title: "Business plan", detail: "Narrative, executive summary, and strategic priorities" },
  { title: "Competitive matrix", detail: "Direct and indirect players with positioning notes" },
  { title: "Pricing model", detail: "Tier structure with unit economics assumptions" },
  { title: "Brand system", detail: "Palette, typography guidance, and voice rules" },
  { title: "Deploy-ready site", detail: "Self-contained HTML/CSS you can ship today" },
  { title: "Investor deck", detail: "Slide-by-slide story with funding ask" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="landing-hero">
          <div className="container landing-hero-grid">
            <div>
              <p className="eyebrow">Startup workspace</p>
              <h1 className="hero-headline">
                From rough idea to <em>launch package</em>
              </h1>
              <p className="hero-lede">
                Describe what you&apos;re building once. A sequenced pipeline produces
                research, strategy, financials, brand, site, and pitch — each step
                informed by the last.
              </p>
              <div className="hero-actions">
                <Link href="/build" className="btn btn-primary btn-lg">
                  Open workspace
                </Link>
                <a href="#workflow" className="btn btn-secondary btn-lg">
                  See the workflow
                </a>
              </div>
              <p className="hero-examples-label">Example prompts</p>
              <div className="example-list">
                {EXAMPLES.map((ex) => (
                  <Link key={ex} href={`/build?idea=${encodeURIComponent(ex)}`} className="example-chip">
                    {ex}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="preview-panel" aria-label="Pipeline preview">
              <div className="preview-panel-head">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <span className="preview-title">Pipeline · 6 stages</span>
              </div>
              <div className="preview-body">
                {PREVIEW_STEPS.map((step) => (
                  <div key={step.name} className="preview-step">
                    <div className="preview-step-icon">
                      <step.Icon size={16} />
                    </div>
                    <div>
                      <div className="preview-step-name">{step.name}</div>
                      <div className="preview-step-desc">{step.desc}</div>
                    </div>
                    <span className="preview-step-status">Ready</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="section section-alt" id="workflow">
          <div className="container">
            <div className="section-intro">
              <p className="section-kicker">Workflow</p>
              <h2 className="section-heading">Six agents, one coherent story</h2>
              <p className="section-copy">
                Each stage runs in order and receives context from prior outputs,
                so your financial model reflects your GTM and your pitch reflects your numbers.
              </p>
            </div>
            <div className="pipeline-diagram-wrap">
              <AgentPipelineDiagram className="pipeline-diagram" />
            </div>
            <div className="agent-grid">
              {AGENTS.map((agent) => (
                <article key={agent.title} className="agent-card">
                  <div className="agent-card-icon">
                    <agent.Icon />
                  </div>
                  <h3 className="agent-card-title">{agent.title}</h3>
                  <p className="agent-card-copy">{agent.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-intro">
              <p className="section-kicker">Process</p>
              <h2 className="section-heading">Three steps, no templates</h2>
            </div>
            <div className="workflow-grid">
              {[
                { n: "01", title: "Write the idea", copy: "Plain language is enough. Include the customer, problem, and what makes your approach different." },
                { n: "02", title: "Run the pipeline", copy: "Agents execute in sequence with streaming output. Follow progress stage by stage." },
                { n: "03", title: "Export and ship", copy: "Copy sections, download markdown, grab the HTML landing page, or export the full bundle." },
              ].map((item) => (
                <article key={item.n} className="workflow-item">
                  <div className="workflow-num">{item.n}</div>
                  <h3 className="workflow-title">{item.title}</h3>
                  <p className="workflow-copy">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt" id="outputs">
          <div className="container">
            <div className="section-intro">
              <p className="section-kicker">Deliverables</p>
              <h2 className="section-heading">What lands in your workspace</h2>
            </div>
            <div className="output-grid">
              {OUTPUTS.map((item) => (
                <div key={item.title} className="output-item">
                  <span className="output-marker" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="container">
            <div className="cta-inner">
              <div>
                <h2>Start with one paragraph</h2>
                <p>The rest of the package follows from there.</p>
              </div>
              <Link href="/build" className="btn btn-primary btn-lg">
                Open workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <Image className="footer-zing-logo" src="/WhatsApp_Image_2026-08-07_at_13.37.59-removebg-preview.png" alt="Zing" width={68} height={25} />
          <span>Developed by Zaya Code Hub</span>
        </div>
      </footer>
    </>
  );
}
