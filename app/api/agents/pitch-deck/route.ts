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

  let idea = "", strategy = "", financials = "", branding = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    strategy = body.strategy || "";
    financials = body.financials || "";
    branding = body.branding || "";
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
          content: `You are a top-tier venture capital pitch consultant who has helped companies raise Series A through IPO. Create a comprehensive investor pitch deck narrative for this startup.

**Startup Idea:** ${idea}

**Business Strategy Summary:**
${strategy ? strategy.substring(0, 600) : "Early-stage startup — use best practices."}

**Financial Summary:**
${financials ? financials.substring(0, 500) : "Pre-revenue, seeking seed funding."}

**Brand Summary:**
${branding ? branding.substring(0, 300) : ""}

Create a complete pitch deck narrative (10 slides):

---

# 🎯 Investor Pitch Deck

## Slide 1: Cover
**Company Name:** [Name from branding]
**Tagline:** [Punchy tagline]
**Presenter:** [Founder Name]
**Date:** Q3 2025

---

## Slide 2: The Problem 🔥
Describe the problem in 3 bullet points. Make it visceral and relatable.
Include: **Market Pain Score: X/10** with justification.

---

## Slide 3: The Solution ✨
Your product/service in 3 clear points.
Include a mock product description that sounds real.
**"Aha moment":** [The moment users realize they can't live without this]

---

## Slide 4: Market Opportunity 📈
- TAM: $X billion
- SAM: $X billion  
- SOM: $X million (Year 3 target)
- Growth rate: X% CAGR
Include why this market is being disrupted NOW.

---

## Slide 5: Product & Traction 🚀
- Key features (3-5)
- Current traction metrics (realistic early-stage numbers)
- Product roadmap highlights
- Tech stack/moat

---

## Slide 6: Business Model 💰
How you make money. Simple, clear, defensible.
- Revenue model
- Unit economics
- Path to profitability

---

## Slide 7: Competitive Landscape 🗺️
Positioning map description:
- X-axis: [dimension]
- Y-axis: [dimension]
- Where you sit vs. competitors
Why your approach wins.

---

## Slide 8: Go-to-Market Strategy 🎯
- Channel 1: [Name + expected CAC]
- Channel 2: [Name + expected CAC]
- Channel 3: [Name + expected CAC]
First 100 customers playbook.

---

## Slide 9: Team 👥
Create 3-4 realistic founder profiles with relevant backgrounds for this startup type.
Include advisors if relevant.

---

## Slide 10: The Ask 💵

**Raising:** $[Amount] Seed Round

**Use of Funds:**
| Category | % | Amount |
|----------|---|--------|
| Engineering | 40% | $X |
| Sales & Marketing | 30% | $X |
| Operations | 20% | $X |
| Reserve | 10% | $X |

**Key Milestones with this funding:**
- Month 6: [milestone]
- Month 12: [milestone]
- Month 18: [milestone]

**Contact:** [email] | [website]

---

## Appendix: Key Metrics Dashboard
Include 6 key metrics you'll report to investors monthly.

Make this compelling, specific, and investor-ready. Use real-sounding numbers and market references.`,
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
    console.error("Pitch Deck Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
