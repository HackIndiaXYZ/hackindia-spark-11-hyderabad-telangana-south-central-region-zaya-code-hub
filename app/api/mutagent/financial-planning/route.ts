import { NextRequest, NextResponse } from "next/server";
import { geminiKeyError, getGeminiKey, streamGeminiResponse } from "@/lib/gemini";
import { finishAgentTrace, startAgentTrace } from "@/lib/agent-trace";

export async function POST(req: NextRequest) {
  if (!getGeminiKey()) return geminiKeyError();

  let idea = "", strategy = "", revisionNotes = "", currentOutput = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    strategy = body.strategy || "";
    revisionNotes = body.revisionNotes || "";
    currentOutput = body.currentOutput || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = `You are a CFO and financial modeling expert for early-stage startups. Create a comprehensive financial plan for this startup.

**Startup Idea:** ${idea}

**Business Strategy Context:**
${strategy ? strategy.substring(0, 1000) : "Standard SaaS/tech startup — apply best practices."}
${revisionNotes ? `\n**Revision Notes:** ${revisionNotes}` : ""}
${currentOutput ? `\n**Current Draft to Improve:** ${currentOutput.substring(0, 2000)}` : ""}

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

Use realistic, specific numbers. Format in clean markdown with actual dollar figures. Prefer tables, assumptions, and short interpretation callouts over long explanatory paragraphs.`;
  const trace = startAgentTrace("financial-planning", req.headers.get("x-run-id") ?? crypto.randomUUID(), idea.length + strategy.length);

  try {
    return await streamGeminiResponse(prompt, { trace });
  } catch (err: unknown) {
    console.error("Financial Planning Agent error:", err);
    finishAgentTrace(trace, "failed", { error: err });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
