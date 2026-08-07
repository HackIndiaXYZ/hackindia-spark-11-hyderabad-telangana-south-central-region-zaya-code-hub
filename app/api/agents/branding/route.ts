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
          content: `You are a world-class brand strategist and creative director. Design a complete brand identity for this startup.

**Startup Idea:** ${idea}

**Business Context:**
${strategy ? strategy.substring(0, 800) : "Early-stage tech startup."}

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

Make it memorable, differentiated, and aligned with the market opportunity.`,
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
    console.error("Branding Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
