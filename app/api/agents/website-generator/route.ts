import { NextRequest, NextResponse } from "next/server";
import { geminiKeyError, getGeminiKey, streamGeminiResponse } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  if (!getGeminiKey()) return geminiKeyError();

  let idea = "", branding = "", strategy = "";
  try {
    const body = await req.json();
    idea = body.idea || "";
    branding = body.branding || "";
    strategy = body.strategy || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = `You are an expert full-stack web developer and UI/UX designer. Generate a complete, beautiful, production-ready landing page for this startup.

**Startup Idea:** ${idea}

**Brand Context:**
${branding ? branding.substring(0, 600) : "Modern tech startup with professional aesthetic."}

**Strategy Context:**
${strategy ? strategy.substring(0, 400) : ""}

Generate a COMPLETE, single-file interactive landing page with:

REQUIREMENTS:
1. Output exactly one valid HTML document, from <!DOCTYPE html> through </html>.
2. It must contain a <style> tag with all CSS and a <script> tag with all JavaScript. Both are required.
3. Use no external libraries, CDNs, image URLs, fonts, or assets. Use system fonts and inline SVG only.
4. Mobile-responsive design with usable navigation on small screens.
5. Include real, lightweight JavaScript interactions: mobile navigation, FAQ accordion, smooth section navigation, and one additional interaction appropriate to the product (such as a pricing toggle, product demo state, or form validation).
6. Professional, bespoke design — avoid generic gradients, template-like layouts, and emoji icons.
7. Keep the implementation focused enough to finish in one response: use concise, reusable CSS and aim for 350-550 lines total. Never omit sections or close tags to save space.

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
- Refined typography, deliberate whitespace, inline SVG iconography, and subtle hover or reveal effects
- Accessible color contrast, visible keyboard focus states, and semantic HTML
- Mobile-first responsive CSS

OUTPUT ONLY THE COMPLETE HTML CODE. Start with <!DOCTYPE html> and end with </html>. Before finishing, verify internally that every required section, the <style> tag, the <script> tag, and the closing </html> tag are present. No markdown code fences, no explanation — just pure HTML.`;

  try {
    return await streamGeminiResponse(prompt, { maxOutputTokens: 32768 });
  } catch (err: unknown) {
    console.error("Website Generator Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
