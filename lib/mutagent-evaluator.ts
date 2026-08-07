export type EvaluatedAgentKey = "marketResearch" | "businessStrategy" | "financialPlanning" | "branding" | "websiteGenerator" | "pitchDeck";

export interface EvaluationResult {
  passed: boolean;
  score: number;
  maxScore: number;
  issues: string[];
  failedAgents: EvaluatedAgentKey[];
  summary: string;
  agentScores: Record<EvaluatedAgentKey, number>;
}

function scoreAgent(agent: EvaluatedAgentKey, output: string): { score: number; issues: string[] } {
  const normalized = output.trim();

  switch (agent) {
    case "marketResearch": {
      const checks = [
        { label: "Executive Summary", regex: /executive summary/i },
        { label: "TAM/SAM/SOM figures", regex: /\b(TAM|SAM|SOM)\b/i },
        { label: "Competitive analysis", regex: /competitive|competitor/i },
        { label: "CAGR", regex: /\bCAGR\b/i },
      ];
      const issues = checks.filter((check) => !check.regex.test(normalized)).map((check) => check.label);
      const score = Math.round(((checks.length - issues.length) / checks.length) * 100);
      return { score, issues };
    }
    case "businessStrategy": {
      const checks = [
        { label: "Business Model Canvas", regex: /business model canvas/i },
        { label: "UVP statement", regex: /uvp|unique value proposition/i },
        { label: "Go-to-Market", regex: /go-to-market|go to market/i },
        { label: "SWOT", regex: /swot/i },
        { label: "KPIs", regex: /kpi|metrics/i },
      ];
      const issues = checks.filter((check) => !check.regex.test(normalized)).map((check) => check.label);
      const score = Math.round(((checks.length - issues.length) / checks.length) * 100);
      return { score, issues };
    }
    case "financialPlanning": {
      const checks = [
        { label: "Revenue model", regex: /revenue model/i },
        { label: "Pricing strategy", regex: /pricing/i },
        { label: "Unit economics", regex: /unit economics|lifetime value|cac/i },
        { label: "Funding section", regex: /funding|raise|runway/i },
        { label: "Break-even", regex: /break-even|break even/i },
      ];
      const issues = checks.filter((check) => !check.regex.test(normalized)).map((check) => check.label);
      const score = Math.round(((checks.length - issues.length) / checks.length) * 100);
      return { score, issues };
    }
    case "branding": {
      const checks = [
        { label: "Brand name options", regex: /brand name|name options/i },
        { label: "Color palette", regex: /color palette|hex code/i },
        { label: "Typography", regex: /typography|font/i },
        { label: "Tagline", regex: /tagline/i },
        { label: "Elevator pitch", regex: /elevator pitch/i },
      ];
      const issues = checks.filter((check) => !check.regex.test(normalized)).map((check) => check.label);
      const score = Math.round(((checks.length - issues.length) / checks.length) * 100);
      return { score, issues };
    }
    case "websiteGenerator": {
      const issues: string[] = [];
      if (!normalized.startsWith("<!DOCTYPE html>")) issues.push("HTML document starts correctly");
      if (!normalized.endsWith("</html>")) issues.push("HTML document ends correctly");
      if (!/<!doctype html>|<style|<script|pricing|faq/i.test(normalized)) issues.push("Landing page sections and interactions");
      const score = Math.max(0, 100 - issues.length * 20);
      return { score, issues };
    }
    case "pitchDeck": {
      const checks = [
        { label: "Slide sections", regex: /## slide [1-9]|## slide 10/i },
        { label: "Problem slide", regex: /problem/i },
        { label: "Market opportunity", regex: /market opportunity/i },
        { label: "Funding ask", regex: /funding|raising|ask/i },
        { label: "Use of funds", regex: /use of funds/i },
      ];
      const issues = checks.filter((check) => !check.regex.test(normalized)).map((check) => check.label);
      const score = Math.round(((checks.length - issues.length) / checks.length) * 100);
      return { score, issues };
    }
    default:
      return { score: 0, issues: [] };
  }
}

export function evaluateAgentOutput(agent: EvaluatedAgentKey, output: string): { score: number; issues: string[] } {
  return scoreAgent(agent, output);
}

export function evaluatePipelineOutputs(outputs: Record<EvaluatedAgentKey, string>): EvaluationResult {
  const agentScores = {} as Record<EvaluatedAgentKey, number>;
  const issues: string[] = [];
  const failedAgents: EvaluatedAgentKey[] = [];

  (Object.keys(outputs) as EvaluatedAgentKey[]).forEach((agent) => {
    const result = scoreAgent(agent, outputs[agent]);
    agentScores[agent] = result.score;
    if (result.score < 80) {
      failedAgents.push(agent);
      issues.push(`${agent}: ${result.issues.join(", ") || "missing core structure"}`);
    }
  });

  const score = Math.round(Object.values(agentScores).reduce((sum, value) => sum + value, 0) / Object.keys(agentScores).length);
  const passed = score >= 85 && failedAgents.length === 0;
  const summary = passed
    ? `All deliverables passed the built-in evaluation with a ${score}% score.`
    : `Evaluation score ${score}% with ${failedAgents.length} deliverable(s) needing refinement.`;

  return { passed, score, maxScore: 100, issues, failedAgents, summary, agentScores };
}

export function buildDiagnosis(result: EvaluationResult): string {
  const lines = [
    `Evaluation score: ${result.score}%`,
    `Status: ${result.passed ? "pass" : "needs refinement"}`,
    "",
    "Issues to fix:",
  ];
  if (result.issues.length === 0) {
    lines.push("- No major issues detected.");
  } else {
    result.issues.forEach((issue) => lines.push(`- ${issue}`));
  }
  return lines.join("\n");
}

export function buildOptimizationPrompt(agent: EvaluatedAgentKey, revisionNotes: string, idea: string): string {
  return [
    `You are revising a startup deliverable for the idea: ${idea}`,
    "Improve the existing draft rather than replacing it wholesale.",
    "Preserve the strong parts, fix the missing structure, and make the output more specific and actionable.",
    `Revision notes: ${revisionNotes}`,
    "Return a stronger, more complete version of the deliverable with the missing sections filled in.",
  ].join("\n");
}
