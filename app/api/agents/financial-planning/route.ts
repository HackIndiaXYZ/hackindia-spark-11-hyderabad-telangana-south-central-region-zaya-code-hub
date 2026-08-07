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

  let idea = "", strategy = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    strategy = body.strategy || "";
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
          content: `You are a CFO and financial modeling expert for early-stage startups. Create a comprehensive financial plan for this startup.

**Startup Idea:** ${idea}

**Business Strategy Context:**
${strategy ? strategy.substring(0, 1000) : "Standard SaaS/tech startup — apply best practices."}

Create a detailed financial plan:

## 1. Revenue Model
- Primary revenue streams
- Pricing tiers with specific price points
- One-time vs recurring revenue breakdown

## 2. Pricing Strategy
| Tier | Price/Month | Features | Target User |
|------|-------------|----------|-------------|
Create 3 pricing tiers (Free/Starter/Pro or equivalent).

## 3. Financial Projections (3 Years)

### Year 1 Projections
| Month | Users | MRR | ARR | Expenses | Net |
|-------|-------|-----|-----|----------|-----|
Show months 1-12 with realistic ramp-up.

### Summary Table
| Year | Customers | ARR | Gross Margin | Net Profit/Loss |
|------|-----------|-----|--------------|-----------------|
| Year 1 | | | | |
| Year 2 | | | | |
| Year 3 | | | | |

## 4. Unit Economics
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LTV:CAC Ratio
- Payback Period
- Churn Rate assumption

## 5. Startup Costs & Funding
- Initial capital required
- Burn rate (monthly)
- Runway calculation
- Break-even timeline

## 6. Funding Strategy
- Bootstrap vs raise recommendation
- Funding rounds needed
- Investor type at each stage
- Suggested ask amount with use of funds

## 7. Key Financial Risks
Top 5 financial risks and mitigation strategies.

Use realistic, specific numbers. Format in clean markdown with actual dollar figures.`,
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
    console.error("Financial Planning Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
