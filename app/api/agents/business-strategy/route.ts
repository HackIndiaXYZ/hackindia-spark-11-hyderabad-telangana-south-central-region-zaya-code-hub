import { NextRequest, NextResponse } from "next/server";
import { geminiKeyError, getGeminiKey, streamGeminiResponse } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  if (!getGeminiKey()) return geminiKeyError();

  let idea = "", marketResearch = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    marketResearch = body.marketResearch || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = `You are a McKinsey-level business strategist. Based on the startup idea and market research below, create a comprehensive business strategy.

**Startup Idea:** ${idea}

**Market Research Summary:**
${marketResearch ? marketResearch.substring(0, 1500) : "Market research not yet available — proceed with general analysis."}

Provide a detailed business strategy covering:

## 1. Business Model Canvas
Map out all 9 blocks: Value Propositions, Customer Segments, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partners, Cost Structure.

## 2. Unique Value Proposition
Craft a compelling UVP statement:
> "We help [target customer] who [problem] by [solution] unlike [competitor]."

## 3. Go-to-Market Strategy
- Phase 1: Launch (0-3 months)
- Phase 2: Growth (3-12 months)
- Phase 3: Scale (12-24 months)

## 4. Positioning Strategy
Where to sit in the market. Premium vs value? Broad vs niche?

## 5. SWOT Analysis
| Strengths | Weaknesses |
|-----------|------------|
| ... | ... |

| Opportunities | Threats |
|---------------|---------|
| ... | ... |

## 6. Key Metrics & KPIs
Define the 5 most important metrics to track for this business.

## 7. Strategic Priorities (First 90 Days)
Top 10 action items in priority order.

Format in clean, detailed markdown with specific, actionable insights.`;

  try {
    return await streamGeminiResponse(prompt);
  } catch (err: unknown) {
    console.error("Business Strategy Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
