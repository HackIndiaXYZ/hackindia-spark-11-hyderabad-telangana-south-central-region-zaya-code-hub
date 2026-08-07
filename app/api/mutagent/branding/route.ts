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

  const prompt = `You are a world-class brand strategist and creative director. Design a complete brand identity for this startup.

**Startup Idea:** ${idea}

**Business Context:**
${strategy ? strategy.substring(0, 800) : "Early-stage tech startup."}
${revisionNotes ? `\n**Revision Notes:** ${revisionNotes}` : ""}
${currentOutput ? `\n**Current Draft to Improve:** ${currentOutput.substring(0, 2000)}` : ""}

Create a comprehensive brand identity document:

## 1. Brand Name Suggestions
Provide 5 startup name options with rationale:

| Name | Meaning | Domain Available | Tagline |
|------|---------|-----------------|---------|
List 5 creative, memorable names.

**Recommended Name:** [Pick the best one and explain why]

## 2. Brand Personality
Define the brand using 5 personality traits (e.g., "Innovative, Trustworthy, Bold, Human, Expert")

**Brand Archetype:** [Choose from: Creator, Sage, Hero, Outlaw, Explorer, Ruler, Caregiver, Jester, Lover, Everyman, Innocent, Magician]

## 3. Visual Identity

### Color Palette
| Color | Hex Code | Usage | Emotion |
|-------|----------|-------|---------|
Define primary, secondary, and accent colors with hex codes.

### Typography
- **Primary Font:** [Name + why] — for headlines
- **Secondary Font:** [Name + why] — for body text
- **Code/Data Font:** [Name + why] — for technical content (if applicable)

### Logo Concept
Describe in detail what the logo should look like, including:
- Shape/symbol concept
- Style (geometric, organic, wordmark, etc.)
- How it represents the brand values

## 4. Brand Voice & Tone
- **Voice:** [3-4 descriptors, e.g., "Expert but accessible"]
- **Writing style:** [Formal/casual, technical level]
- **Words we use:** [5 words always in vocabulary]
- **Words we avoid:** [5 words never to use]

## 5. Brand Messaging Framework

### Tagline
> "[Punchy 3-6 word tagline]"

### Elevator Pitch (30 seconds)
Write the perfect 30-second pitch.

### Social Media Bio (160 chars)
Twitter/Instagram bio.

## 6. Brand Application Examples
Show how the brand would appear on:
- App icon concept
- Business card copy
- Email signature
- LinkedIn company description

Make it memorable, differentiated, and aligned with the market opportunity. Use compact tables, palettes, examples, and bullet frameworks; avoid long narrative paragraphs.`;
  const trace = startAgentTrace("branding", req.headers.get("x-run-id") ?? crypto.randomUUID(), idea.length + strategy.length);

  try {
    return await streamGeminiResponse(prompt, { trace });
  } catch (err: unknown) {
    console.error("Branding Agent error:", err);
    finishAgentTrace(trace, "failed", { error: err });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
