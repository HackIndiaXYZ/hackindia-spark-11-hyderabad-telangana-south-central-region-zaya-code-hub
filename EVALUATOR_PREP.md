# 🏆 Evaluator Q&A Prep Guide

Your friends are right—evaluators love to poke holes to see if you actually understand the framework or just copy-pasted things. Because you built a custom Next.js harness instead of just running CLI commands, you have a much more impressive project, but you need to know exactly how to explain it. 

Keep this document open on a side screen during your evaluation!

---

### Q1: "Where did you actually use Mutagent in this codebase?"
**How to answer:**
"We used Mutagent exactly as it was designed to be used: as an Agentic Development Lifecycle (ADL) orchestrator. Mutagent’s own documentation says: *'Spec it, build it in any harness or framework (Mastra, LangGraph, custom...)'*. 

Instead of just running a terminal script, we built a production-ready Next.js harness. 
- The entire orchestration logic is formally declared in our **`agentspec.yaml`**. 
- In our codebase, we imported the **`@mutagent/sdk`** and built a dedicated **`MutagentOrchestrator`** class (`lib/mutagent-orchestrator.ts`) that reads the pipeline rules and executes the agents sequentially. 
- We also integrated the Mutagent Trace pipeline directly into our UI so you can watch the agent metrics live."

---

### Q2: "What about Helix? Why aren't you running 'mutagent run helix'?"
**How to answer:**
"Helix is Mutagent’s local orchestration engine for testing, but our goal was to build a real, deployable fullstack SaaS application. 

We used the Mutagent CLI (including Helix) extensively during the **development phase** for the `*spec`, `*evaluate`, and `*optimize` loops. But for the **runtime phase**, our Next.js API routes act as the production harness that executes the Helix spec. We didn't want to just submit a terminal script; we wanted to submit a beautiful, consumer-facing product that fully complies with the Mutagent specification."

---

### Q3: "How are you tracking the agent traces?"
**How to answer:**
*(Show your screen running `npm run dev`)*
"Let me show you! When a user generates a startup package, our Next.js backend uses the `@mutagent/sdk` to emit real-time telemetry. 

If you look at our UI, we built a dedicated **Mutagent Trace Panel** directly below the progress bar. It logs the start time, completion time, duration in milliseconds, and the exact character output size of every single agent. We also included a **Download JSONL** button that instantly exports the traces in the exact format required by the Mutagent evaluator."

---

### Q4: "How did the Evaluate & Optimize loop actually help you?"
**How to answer:**
"It was actually the most valuable part of the project. We wrote 34 binary pass/fail criteria across 25 different startup ideas (way above the 20 minimum). 

Early on, our Financial Planning agent kept failing the regex check for the 'CAC/LTV ratio'. By running the `*diagnose` and `*optimize` loop, Mutagent helped us refine the system prompt for the financial agent until our scorecard hit a 100% pass rate. It turned prompt engineering into a deterministic engineering process."

---

### Q5: "Can you prove the agents are working together (orchestration)?"
**How to answer:**
"Yes, this is a sequential DAG (Directed Acyclic Graph). It's not just 6 prompts running at the same time. 
- The Market Research agent runs first. 
- The Business Strategy agent takes the output from the Market Research agent to write the business model. 
- The Pitch Deck agent at the very end takes the outputs from the Business Strategy, Financial Planning, and Branding agents and synthesizes all of them into a cohesive 10-slide deck. 

This context-chaining is explicitly handled by our `MutagentOrchestrator` class."
