import { buildDiagnosis, buildOptimizationPrompt, evaluateAgentOutput, evaluatePipelineOutputs, type EvaluatedAgentKey } from "@/lib/mutagent-evaluator";

type AgentKey = "marketResearch" | "businessStrategy" | "financialPlanning" | "branding" | "websiteGenerator" | "pitchDeck";
type TraceStatus = "started" | "completed" | "failed";
export type LifecycleStage = "spec" | "build" | "evaluate" | "diagnose" | "optimize";

export interface ScorecardEntry {
  agent: AgentKey;
  label: string;
  score: number;
  passed: boolean;
  issues: string[];
  attempts: number;
}

export interface OrchestratorCallbacks {
  onAgentStart?: (index: number, key: AgentKey) => void;
  onAgentUpdate?: (key: AgentKey, text: string) => void;
  onAgentComplete?: (index: number, key: AgentKey, finalOutput: string) => void;
  onWebsitePreview?: (html: string) => void;
  onTraceUpdate?: (agent: AgentKey) => (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void;
  onLifecycleStage?: (stage: LifecycleStage, message?: string) => void;
  onScorecardUpdate?: (scorecard: ScorecardEntry[]) => void;
  requestApproval?: (message: string) => Promise<boolean>;
  isAborted?: () => boolean;
}

export class MutagentOrchestrator {
  private runId: string;
  private readonly maxRetries = 2;

  constructor(runId: string) {
    this.runId = runId;
  }

  private labelForAgent(agentKey: EvaluatedAgentKey): string {
    const labels: Record<EvaluatedAgentKey, string> = {
      marketResearch: "Market Research",
      businessStrategy: "Business Strategy",
      financialPlanning: "Financial Planning",
      branding: "Brand Identity",
      websiteGenerator: "Launch Site",
      pitchDeck: "Investor Deck",
    };
    return labels[agentKey];
  }

  private syncScorecard(
    scorecardEntries: ScorecardEntry[],
    agentKey: EvaluatedAgentKey,
    evaluation: { score: number; issues: string[] },
    attempts: number,
    onScorecardUpdate?: (scorecard: ScorecardEntry[]) => void
  ) {
    const entry: ScorecardEntry = {
      agent: agentKey as AgentKey,
      label: this.labelForAgent(agentKey),
      score: evaluation.score,
      passed: evaluation.score >= 80,
      issues: evaluation.issues,
      attempts,
    };

    const existingIndex = scorecardEntries.findIndex((item) => item.agent === entry.agent);
    if (existingIndex >= 0) {
      scorecardEntries[existingIndex] = entry;
    } else {
      scorecardEntries.push(entry);
    }

    onScorecardUpdate?.([...scorecardEntries]);
  }

  private async runAgentWithOptimization(
    agentKey: EvaluatedAgentKey,
    idea: string,
    endpoint: string,
    payload: Record<string, string>,
    onChunk: (text: string) => void,
    onTrace: (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void,
    callbacks: OrchestratorCallbacks,
    scorecardEntries: ScorecardEntry[]
  ): Promise<string> {
    let output = "";
    let evaluation = { score: 0, issues: ["No output generated"] };

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      if (callbacks.isAborted?.()) return output;
      const currentOutput = attempt === 1
        ? await this.streamAgentOutput(endpoint, payload, onChunk, onTrace)
        : await this.reoptimizeAgent(agentKey, idea, output, `Retry ${attempt} for ${this.labelForAgent(agentKey)}. Improve structure and completeness.`, endpoint, payload, onChunk, onTrace);

      evaluation = evaluateAgentOutput(agentKey, currentOutput);
      this.syncScorecard(scorecardEntries, agentKey, evaluation, attempt, callbacks.onScorecardUpdate);

      if (evaluation.score >= 85 || attempt >= this.maxRetries) {
        output = currentOutput;
        break;
      }

      callbacks.onLifecycleStage?.("diagnose", `${this.labelForAgent(agentKey)} scored ${evaluation.score}% and needs refinement.`);
      const approved = callbacks.requestApproval
        ? await callbacks.requestApproval(`${this.labelForAgent(agentKey)} scored ${evaluation.score}%. Approve a retry and optimization pass?`)
        : true;
      if (!approved) {
        output = currentOutput;
        break;
      }

      callbacks.onLifecycleStage?.("optimize", `Refining ${this.labelForAgent(agentKey)}.`);
      output = currentOutput;
    }

    return output;
  }

  private async reoptimizeAgent(
    agentKey: EvaluatedAgentKey,
    idea: string,
    currentOutput: string,
    revisionNotes: string,
    endpoint: string,
    payload: Record<string, string>,
    onChunk: (text: string) => void,
    onTrace: (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void
  ): Promise<string> {
    const optimizedPrompt = buildOptimizationPrompt(agentKey, revisionNotes, idea);
    const enhancedPayload = {
      ...payload,
      revisionNotes: optimizedPrompt,
      currentOutput,
    };

    return this.streamAgentOutput(endpoint, enhancedPayload, onChunk, onTrace);
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
      callbacks.onLifecycleStage?.("spec", "Preparing the startup brief and agent spec.");
      callbacks.onLifecycleStage?.("build", "Generating the startup package across specialist agents.");

      const scorecardEntries: ScorecardEntry[] = [];

      // 1. Market Research
      callbacks.onAgentStart?.(0, "marketResearch");
      const marketTrace = callbacks.onTraceUpdate?.("marketResearch") ?? (() => undefined);
      marketResearch = await this.runAgentWithOptimization(
        "marketResearch",
        idea,
        "/api/mutagent/market-research",
        { idea },
        (text) => callbacks.onAgentUpdate?.("marketResearch", text),
        marketTrace,
        callbacks,
        scorecardEntries
      );
      callbacks.onAgentComplete?.(0, "marketResearch", marketResearch);
      if (callbacks.isAborted?.()) return;

      // 2. Business Strategy (depends on marketResearch)
      callbacks.onAgentStart?.(1, "businessStrategy");
      const strategyTrace = callbacks.onTraceUpdate?.("businessStrategy") ?? (() => undefined);
      businessStrategy = await this.runAgentWithOptimization(
        "businessStrategy",
        idea,
        "/api/mutagent/business-strategy",
        { idea, marketResearch },
        (text) => callbacks.onAgentUpdate?.("businessStrategy", text),
        strategyTrace,
        callbacks,
        scorecardEntries
      );
      callbacks.onAgentComplete?.(1, "businessStrategy", businessStrategy);
      if (callbacks.isAborted?.()) return;

      // 3. Financial Planning (depends on businessStrategy)
      callbacks.onAgentStart?.(2, "financialPlanning");
      const financeTrace = callbacks.onTraceUpdate?.("financialPlanning") ?? (() => undefined);
      financialPlanning = await this.runAgentWithOptimization(
        "financialPlanning",
        idea,
        "/api/mutagent/financial-planning",
        { idea, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate?.("financialPlanning", text),
        financeTrace,
        callbacks,
        scorecardEntries
      );
      callbacks.onAgentComplete?.(2, "financialPlanning", financialPlanning);
      if (callbacks.isAborted?.()) return;

      // 4. Branding (depends on businessStrategy)
      callbacks.onAgentStart?.(3, "branding");
      const brandingTrace = callbacks.onTraceUpdate?.("branding") ?? (() => undefined);
      branding = await this.runAgentWithOptimization(
        "branding",
        idea,
        "/api/mutagent/branding",
        { idea, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate?.("branding", text),
        brandingTrace,
        callbacks,
        scorecardEntries
      );
      callbacks.onAgentComplete?.(3, "branding", branding);
      if (callbacks.isAborted?.()) return;

      // 5. Website Generator (depends on branding and businessStrategy)
      callbacks.onAgentStart?.(4, "websiteGenerator");
      const websiteTrace = callbacks.onTraceUpdate?.("websiteGenerator") ?? (() => undefined);
      website = await this.runAgentWithOptimization(
        "websiteGenerator",
        idea,
        "/api/mutagent/website-generator",
        { idea, branding, strategy: businessStrategy },
        (text) => callbacks.onAgentUpdate?.("websiteGenerator", text),
        websiteTrace,
        callbacks,
        scorecardEntries
      );
      
      if (!website.trim().startsWith("<!DOCTYPE html>") || !website.trim().endsWith("</html>")) {
        throw new Error("The launch site generation ended early. Please run the package again to generate a complete HTML/CSS/JS file.");
      }
      callbacks.onWebsitePreview?.(website);
      callbacks.onAgentComplete?.(4, "websiteGenerator", website);
      if (callbacks.isAborted?.()) return;

      // 6. Pitch Deck (depends on businessStrategy, financialPlanning, branding)
      callbacks.onAgentStart?.(5, "pitchDeck");
      const pitchTrace = callbacks.onTraceUpdate?.("pitchDeck") ?? (() => undefined);
      pitchDeck = await this.runAgentWithOptimization(
        "pitchDeck",
        idea,
        "/api/mutagent/pitch-deck",
        { idea, strategy: businessStrategy, financials: financialPlanning, branding },
        (text) => callbacks.onAgentUpdate?.("pitchDeck", text),
        pitchTrace,
        callbacks,
        scorecardEntries
      );
      callbacks.onAgentComplete?.(5, "pitchDeck", pitchDeck);

      const evaluation = evaluatePipelineOutputs({
        marketResearch,
        businessStrategy,
        financialPlanning,
        branding,
        websiteGenerator: website,
        pitchDeck,
      });

      callbacks.onLifecycleStage?.("evaluate", `Scoring the final package. Overall score: ${evaluation.score}%`);
      if (!evaluation.passed) {
        const diagnosis = buildDiagnosis(evaluation);
        callbacks.onLifecycleStage?.("diagnose", diagnosis);
        callbacks.onAgentUpdate?.("pitchDeck", `${pitchDeck}\n\n--- MUTAGENT EVALUATION ---\n${diagnosis}`);
      }

      return {
        marketResearch,
        businessStrategy,
        financialPlanning,
        branding,
        website,
        pitchDeck,
        evaluation,
        scorecard: scorecardEntries,
      };
    } catch (err) {
      throw err;
    }
  }
}
