import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart." },
      { status: 500 }
    );
  }
  const client = new Anthropic({ apiKey });

  let idea = "", marketResearch = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    marketResearch = body.marketResearch || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const stream = await client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a McKinsey-level business strategist. Based on the startup idea and market research below, create a comprehensive business strategy.

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

Format in clean, detailed markdown with specific, actionable insights.`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  } catch (err: unknown) {
    console.error("Business Strategy Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
