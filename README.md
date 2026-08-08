# Zing — AI Startup Builder

Zing turns a startup brief into an investor-ready package using six coordinated Gemini-powered agents:

- Market research
- Business strategy
- Financial plan
- Brand identity
- Launch-ready landing page
- Investor pitch deck

It also includes a visible Mutagent trace panel for every run, with JSONL export for the hackathon submission.

-site url : https://ai-agents-startup-deck.vercel.app 

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/HackIndiaXYZ/hackindia-spark-11-hyderabad-telangana-south-central-region-zaya-code-hub.git
cd hackindia-spark-11-hyderabad-telangana-south-central-region-zaya-code-hub
```

### 2. Install dependencies

Use Node.js 18 or newer (Node.js 20 LTS is recommended), then run:

```bash
npm install
```

### 3. Configure Gemini

Create a local environment file from the example:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add a Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Never commit `.env.local` or share the key.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is at `/`; the AI workspace is at [http://localhost:3000/build](http://localhost:3000/build).

## Generate a startup package

1. Open `/build`.
2. Enter a startup idea, for example: `AI-based agriculture startup using drone technology`.
3. Select **Send**.
4. Watch the agents execute in sequence and review each output tab.
5. Use the download controls to save an individual deliverable, the full package, or an export folder.

The generated landing page is previewed directly in the workspace; its standalone HTML can be downloaded from the **Launch Site** tab.

## View and export Mutagent traces

Each build has one shared run ID. While a package is generating, the **Mutagent trace** panel beneath the progress tracker shows each agent as it starts, completes, or fails, with duration and output size.

Select **Download JSONL** in that panel to export the run. Save the resulting file under `traces/` when preparing the HackIndia/Mutagent submission. See [MUTAGENT_TRACING.md](./MUTAGENT_TRACING.md) for the trace format and server-log details.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project structure

```text
app/
  build/                  # Interactive six-agent workspace
  api/mutagent/           # Streaming Gemini routes for every specialist
components/               # Shared UI and agent icons
lib/gemini.ts             # Gemini streaming client
lib/agent-trace.ts        # Structured server-side trace events
MUTAGENT_TRACING.md       # Trace capture and export instructions
```
