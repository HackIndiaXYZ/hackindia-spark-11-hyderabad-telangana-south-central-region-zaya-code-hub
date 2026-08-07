import { NextRequest, NextResponse } from "next/server";
import { geminiKeyError, getGeminiKey, streamGeminiResponse } from "@/lib/gemini";

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

Be specific, use real data points and market figures where possible. Format everything in clean markdown.`;

  try {
    return await streamGeminiResponse(prompt);
  } catch (err: unknown) {
    console.error("Market Research Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
