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

  let idea = "", branding = "", strategy = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    branding = body.branding || "";
    strategy = body.strategy || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const stream = await client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert full-stack web developer and UI/UX designer. Generate a complete, beautiful, production-ready landing page for this startup.

**Startup Idea:** ${idea}

**Brand Context:**
${branding ? branding.substring(0, 600) : "Modern tech startup with professional aesthetic."}

**Strategy Context:**
${strategy ? strategy.substring(0, 400) : ""}

Generate a COMPLETE single-file HTML landing page with:

REQUIREMENTS:
1. Fully self-contained HTML (inline CSS + JS, no external dependencies except Google Fonts)
2. Mobile-responsive design
3. Dark mode toggle
4. Smooth scroll animations
5. Professional, modern design

SECTIONS TO INCLUDE:
- Hero section with headline, subtitle, CTA buttons
- Features/benefits section (3-6 features with icons)
- How it works (3 steps)
- Pricing section (3 tiers)
- Testimonials (3 fake but realistic testimonials)
- FAQ section (5 questions)
- Footer with links

DESIGN REQUIREMENTS:
- Use a modern color scheme appropriate for the startup (derive from the brand context)
- CSS animations and hover effects
- Google Fonts import
- Glassmorphism or gradient effects
- Mobile-first responsive

OUTPUT ONLY THE COMPLETE HTML CODE. Start with <!DOCTYPE html> and end with </html>. No markdown code fences, no explanation — just pure HTML.`,
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
    console.error("Website Generator Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
