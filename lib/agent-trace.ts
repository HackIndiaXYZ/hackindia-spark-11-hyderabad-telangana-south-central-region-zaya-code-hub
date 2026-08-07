type TraceStatus = "started" | "completed" | "failed";

export type AgentTrace = {
  runId: string;
  agent: string;
  startedAt: number;
  inputChars: number;
};

function emit(event: Record<string, unknown>) {
  console.info(JSON.stringify({ service: "zing-ai-startup-builder", traceVersion: 1, ...event }));
}

export function startAgentTrace(agent: string, runId: string, inputChars: number): AgentTrace {
  const trace = { runId, agent, startedAt: Date.now(), inputChars };
  emit({ event: "agent.run", status: "started" satisfies TraceStatus, ...trace });
  return trace;
}

export function finishAgentTrace(
  trace: AgentTrace,
  status: Exclude<TraceStatus, "started">,
  details: { outputChars?: number; error?: unknown } = {}
) {
  emit({
    event: "agent.run",
    status,
    runId: trace.runId,
    agent: trace.agent,
    inputChars: trace.inputChars,
    durationMs: Date.now() - trace.startedAt,
    ...(details.outputChars !== undefined ? { outputChars: details.outputChars } : {}),
    ...(details.error ? { error: details.error instanceof Error ? details.error.message : "Unknown error" } : {}),
  });
}
