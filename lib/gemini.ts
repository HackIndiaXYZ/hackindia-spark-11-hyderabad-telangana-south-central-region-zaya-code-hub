import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function getGeminiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") return null;
  return apiKey;
}

export function geminiKeyError() {
  return NextResponse.json(
    {
      error:
        "GEMINI_API_KEY is not configured. Please add it to .env.local and restart the server.",
    },
    { status: 500 }
  );
}

export async function streamGeminiResponse(
  prompt: string,
  options?: { maxOutputTokens?: number; model?: string }
): Promise<Response> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 8192,
      temperature: 0.7,
    },
  });

  const result = await model.generateContentStream(prompt);

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (streamErr) {
        console.error("Gemini stream error:", streamErr);
        controller.error(streamErr);
        return;
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
