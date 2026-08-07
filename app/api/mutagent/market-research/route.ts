import { NextRequest, NextResponse } from "next/server";
import { geminiKeyError, getGeminiKey, streamGeminiResponse } from "@/lib/gemini";
import { finishAgentTrace, startAgentTrace } from "@/lib/agent-trace";

export async function POST(req: NextRequest) {
  if (!getGeminiKey()) return geminiKeyError();

  let idea = "", context = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    context = body.context || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = `You are a world-class market research analyst. Conduct a comprehensive market research report for the following startup idea:

**Startup Idea:** ${idea}

${context ? `**Additional Context:** ${context}` : ""}

Please provide a detailed market research report covering:

## 1. Executive Summary
Brief overview of the market opportunity.

## 2. Market Size & Opportunity
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)
- Market growth rate (CAGR)

## 3. Target Audience
- Primary customer segments
- Demographics & psychographics
- Customer pain points
- Jobs-to-be-done

## 4. Competitive Landscape
| Competitor | Stage | Funding | Key Strength | Weakness |
|------------|-------|---------|--------------|----------|
Create a competitive analysis table with 5-7 real competitors.

## 5. Market Trends
Top 5 trends driving this market in 2024-2026.

## 6. Regulatory & Risk Factors
Key risks and regulatory considerations.

## 7. Opportunity Assessment
Why NOW is the right time to enter this market. Score the opportunity 1-10 with justification.

Be specific, use real data points and market figures where possible. Format everything in clean markdown. Keep prose concise: lead each section with a 1-2 sentence takeaway, then use tables, bullets, and quantified facts instead of long paragraphs.`;
  const trace = startAgentTrace("market-research", req.headers.get("x-run-id") ?? crypto.randomUUID(), idea.length + context.length);

  try {
    return await streamGeminiResponse(prompt, { trace });
  } catch (err: unknown) {
    console.error("Market Research Agent error:", err);
    finishAgentTrace(trace, "failed", { error: err });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
