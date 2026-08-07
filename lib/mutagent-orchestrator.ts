type AgentKey = "marketResearch" | "businessStrategy" | "financialPlanning" | "branding" | "websiteGenerator" | "pitchDeck";
type TraceStatus = "started" | "completed" | "failed";

export interface OrchestratorCallbacks {
  onAgentStart: (index: number, key: AgentKey) => void;
  onAgentUpdate: (key: AgentKey, text: string) => void;
  onAgentComplete: (index: number, key: AgentKey, finalOutput: string) => void;
  onWebsitePreview: (html: string) => void;
  onTraceUpdate: (agent: AgentKey) => (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void;
  isAborted: () => boolean;
}

export class MutagentOrchestrator {
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  private async streamAgentOutput(
    endpoint: string,
    body: Record<string, string>,
    onChunk: (text: string) => void,
    onTrace: (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void
  ): Promise<string> {
    const startedAt = performance.now();
    onTrace("started");
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Run-Id": this.runId },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      const message = `Network error — is the dev server running? (${networkErr})`;
      onTrace("failed", undefined, Math.round(performance.now() - startedAt), message);
      throw new Error(message);
    }

    if (!res.ok) {
      let msg = `Server error ${res.status}`;
      try {
        const json = await res.json();
        msg = json.error || msg;
      } catch { /* ignore parse error */ }
      onTrace("failed", undefined, Math.round(performance.now() - startedAt), msg);
      throw new Error(msg);
    }

    if (!res.body) {
      const message = "No response body from server";
      onTrace("failed", undefined, Math.round(performance.now() - startedAt), message);
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullText = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunkValue = decoder.decode(value, { stream: true });
        fullText += chunkValue;
        onChunk(fullText);
      }
    }

    onTrace("completed", fullText.length, Math.round(performance.now() - startedAt));
    return fullText;
  }

  /**
   * Executes the pipeline defined in agentspec.yaml
   */
  async executePipeline(idea: string, callbacks: OrchestratorCallbacks) {
    let marketResearch = "";
    let businessStrategy = "";
    let financialPlanning = "";
    let branding = "";
    let website = "";
    let pitchDeck = "";

    try {
      // 1. Market Research
      callbacks.onAgentStart(0, "marketResearch");
      marketResearch = await this.streamAgentOutput(
        "/api/mutagent/market-research",
        { idea },
        (text) => callbacks.onAgentUpdate("marketResearch", text),
        callbacks.onTraceUpdate("marketResearch")
      );
      callbacks.onAgentComplete(0, "marketResearch", marketResearch);
      if (callbacks.isAborted()) return;

      // 2. Business Strategy (depends on marketResearch)
      callbacks.onAgentStart(1, "businessStrategy");
      businessStrategy = await this.streamAgentOutput(
        "/api/mutagent/business-strategy",
        { idea, marketResearch },
        (text) => callbacks.onAgentUpdate("businessStrategy", text),
        callbacks.onTraceUpdate("businessStrategy")
      );
      callbacks.onAgentComplete(1, "businessStrategy", businessStrategy);
      if (callbacks.isAborted()) return;

      // 3. Financial Planning (depends on businessStrategy)
      callbacks.onAgentStart(2, "financialPlanning");
      financialPlanning = await this.streamAgentOutput(
        "/api/mutagent/financial-planning",
        { idea, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate("financialPlanning", text),
        callbacks.onTraceUpdate("financialPlanning")
      );
      callbacks.onAgentComplete(2, "financialPlanning", financialPlanning);
      if (callbacks.isAborted()) return;

      // 4. Branding (depends on businessStrategy)
      callbacks.onAgentStart(3, "branding");
      branding = await this.streamAgentOutput(
        "/api/mutagent/branding",
        { idea, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate("branding", text),
        callbacks.onTraceUpdate("branding")
      );
      callbacks.onAgentComplete(3, "branding", branding);
      if (callbacks.isAborted()) return;

      // 5. Website Generator (depends on branding and businessStrategy)
      callbacks.onAgentStart(4, "websiteGenerator");
      website = await this.streamAgentOutput(
        "/api/mutagent/website-generator",
        { idea, branding, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate("websiteGenerator", text),
        callbacks.onTraceUpdate("websiteGenerator")
      );
      
      if (!website.trim().startsWith("<!DOCTYPE html>") || !website.trim().endsWith("</html>")) {
        throw new Error("The launch site generation ended early. Please run the package again to generate a complete HTML/CSS/JS file.");
      }
      callbacks.onWebsitePreview(website);
      callbacks.onAgentComplete(4, "websiteGenerator", website);
      if (callbacks.isAborted()) return;

      // 6. Pitch Deck (depends on businessStrategy, financialPlanning, branding)
      callbacks.onAgentStart(5, "pitchDeck");
      pitchDeck = await this.streamAgentOutput(
        "/api/mutagent/pitch-deck",
        { idea, strategy: businessStrategy, financials: financialPlanning, branding },
        (text) => callbacks.onAgentUpdate("pitchDeck", text),
        callbacks.onTraceUpdate("pitchDeck")
      );
      callbacks.onAgentComplete(5, "pitchDeck", pitchDeck);

      return {
        marketResearch,
        businessStrategy,
        financialPlanning,
        branding,
        website,
        pitchDeck
      };
    } catch (err) {
      throw err;
    }
  }
}
