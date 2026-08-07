import { NextResponse } from "next/server";
import { finishAgentTrace, type AgentTrace } from "@/lib/agent-trace";

export function getGeminiKey(): string | null {
  // Return dummy key to prevent key check from blocking
  return "ollama-configured";
}

export function geminiKeyError() {
  return NextResponse.json(
    {
      error: "Ollama API is not configured.",
    },
    { status: 500 }
  );
}

export async function streamGeminiResponse(
  prompt: string,
  options?: { maxOutputTokens?: number; model?: string; trace?: AgentTrace }
): Promise<Response> {
  const url = "https://ollama.com/api/chat";
  const authHeader = "Bearer 654d04675ffd4002a0e6471d6ae1b828.Id9ullJFLVBdU3ng_z9yJjLB";

  let responseText = "";
  let outputChars = 0;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        model: "minimax-m3",
        messages: [{
          role: "user",
          content: prompt
        }],
        stream: false
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("API error response:", errText);
      throw new Error(`API error: ${res.status} - ${errText}`);
    }

    const json = await res.json();
    responseText = json.message?.content || "";
    outputChars = responseText.length;
  } catch (err) {
    console.error("API call failed:", err);
    if (options?.trace) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      finishAgentTrace(options.trace, "failed", { error: errObj });
    }
    throw err;
  }

  if (options?.trace) {
    finishAgentTrace(options.trace, "completed", { outputChars });
  }

  // Stream the response back to the client to simulate the streaming experience
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(responseText));
      controller.close();
    }
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
