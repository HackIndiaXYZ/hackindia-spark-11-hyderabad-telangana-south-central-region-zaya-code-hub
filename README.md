# Zing — AI Startup Builder

**Zing** turns a startup brief into an investor-ready package using six coordinated Gemini-powered agents:

* 🔎 Market research
* 📊 Business strategy
* 💰 Financial plan
* 🎨 Brand identity
* 🌐 Launch-ready landing page
* 🧑‍💼 Investor pitch deck

It also includes a visible **Mutagent trace panel** for every run, with JSONL export for the hackathon submission.

## 🚀 Live Demo

<p align="center">
  <a href="https://zing.hamrolearning.com">
    <strong>🌐 Launch Zing → zing.hamrolearning.com</strong>
  </a>
</p>

<p align="center">
  <em>Turn your startup idea into a complete investor-ready package.</em>
</p>

## 🧩 Agent Workflow

Zing orchestrates six Gemini-powered agents that work together to transform a startup idea into a complete startup package.

<p align="center">
  <img src="./public/zing-pipeline.svg" alt="Zing AI Agent Workflow" width="750">
</p>

<p align="center">
  <em>Six coordinated AI agents working together to build a complete startup package.</em>
</p>

## ✨ What Zing Generates

Given a single startup idea, Zing generates:

| Agent                    | Output                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| 🔎 **Market Research**   | Market analysis, competitors, trends, target customers, and opportunities |
| 📊 **Business Strategy** | Business model, positioning, value proposition, and growth strategy       |
| 💰 **Financial Plan**    | Revenue model, costs, projections, and financial assumptions              |
| 🎨 **Brand Identity**    | Brand name, positioning, visual direction, and identity                   |
| 🌐 **Launch Site**       | A launch-ready landing page generated from the startup strategy           |
| 🧑‍💼 **Pitch Deck**     | Investor-focused presentation covering the startup and its opportunity    |

## 🔥 Key Features

* **Six coordinated AI agents** working as a pipeline
* **Gemini-powered generation** for every specialist agent
* **Startup-to-package workflow** from one initial idea
* **Real-time agent progress tracking**
* **Mutagent tracing** for every build
* **JSONL trace export** for hackathon submission
* **Generated landing page preview**
* **Downloadable startup deliverables**
* **Investor-ready pitch deck generation**
* **Brand and business strategy generation**

## 🛠️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/HackIndiaXYZ/hackindia-spark-11-hyderabad-telangana-south-central-region-zaya-code-hub.git
cd hackindia-spark-11-hyderabad-telangana-south-central-region-zaya-code-hub
```

### 2. Install dependencies

Use **Node.js 18 or newer**.

Node.js 20 LTS is recommended.

```bash
npm install
```

### 3. Configure Gemini

Create a local environment file from the example:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

> **Important:** Never commit `.env.local` or expose your Gemini API key.

### 4. Start the development server

```bash
npm run dev
```

The application will be available at:

**http://localhost:3000**

The main routes are:

* **Landing page:** `/`
* **AI workspace:** `/build`

## 🚀 Generate a Startup Package

1. Open `/build`.

2. Enter a startup idea.

   Example:

   ```text
   AI-based agriculture startup using drone technology
   ```

3. Select **Send**.

4. Watch the six agents execute through the pipeline.

5. Review the output from each agent.

6. Use the download controls to save individual deliverables or the complete startup package.

The generated landing page is previewed directly inside the workspace.

Its standalone HTML can be downloaded from the **Launch Site** tab.

## 🤖 Mutagent Tracing

Every startup build has a shared **run ID**.

While a package is being generated, the **Mutagent trace** panel beneath the progress tracker displays the status of each agent.

The trace records events such as:

* Agent started
* Agent completed
* Agent failed
* Execution duration
* Output size

### Export traces

Select **Download JSONL** from the Mutagent trace panel to export the complete run trace.

For the HackIndia / Mutagent submission, save exported traces under:

```text
traces/
```

For more information about the trace format and server-side logging, see:

[MUTAGENT_TRACING.md](./MUTAGENT_TRACING.md)

## 🧠 How It Works

```text
Startup Idea
     │
     ▼
┌──────────────────────┐
│   Zing AI Workspace  │
└──────────┬───────────┘
           │
           ▼
    ┌───────────────┐
    │ Market Agent  │
    └───────┬───────┘
            │
            ▼
    ┌────────────────┐
    │ Strategy Agent │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Financial Agent│
    └───────┬────────┘
            │
            ▼
    ┌───────────────┐
    │  Brand Agent  │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Launch Site  │
    │     Agent     │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ Pitch Deck    │
    │     Agent     │
    └───────┬───────┘
            │
            ▼
┌───────────────────────────┐
│ Investor-Ready Startup    │
│         Package           │
└───────────────────────────┘
```

The animated workflow diagram in the section above provides a visual representation of this pipeline.

## 📦 Generated Deliverables

A completed Zing build can include:

```text
Market Research
Business Strategy
Financial Plan
Brand Identity
Launch Landing Page
Investor Pitch Deck
Mutagent JSONL Trace
```

The workspace provides download controls for individual deliverables as well as the complete package.

## 🔍 Checks

Run the following commands before submitting the project:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three checks should complete successfully.

## 📁 Project Structure

```text
app/
  build/                  # Interactive six-agent workspace
  api/mutagent/           # Streaming Gemini routes for every specialist

components/               # Shared UI components and agent icons

lib/
  gemini.ts               # Gemini streaming client
  agent-trace.ts          # Structured server-side trace events

public/
  zing-pipeline.svg       # Animated six-agent workflow diagram

traces/                   # Exported Mutagent JSONL traces

MUTAGENT_TRACING.md       # Trace capture and export instructions
```

## 🌐 Links

### Live Application

**https://zing.hamrolearning.com**

### Source Code

**https://github.com/HackIndiaXYZ/hackindia-spark-11-hyderabad-telangana-south-central-region-zaya-code-hub**

### Gemini API

**https://aistudio.google.com/apikey**

## 🏆 Hackathon

Zing was built for **HackIndia**, with **Mutagent tracing** integrated into the AI generation workflow to provide transparent execution traces for every startup build.

The goal is simple:

> **One startup idea → Six AI agents → One investor-ready startup package.**

---

<p align="center">
  <strong>🚀 Zing — From Idea to Investor-Ready Startup</strong>
</p>

<p align="center">
  <a href="https://zing.hamrolearning.com">Try Zing →</a>
</p>
