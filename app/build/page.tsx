"use client";
import { useState, useEffect, useRef, Suspense, type ComponentType, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  IconBrand,
  IconFinance,
  IconPitch,
  IconResearch,
  IconStrategy,
  IconWebsite,
} from "@/components/agent-icons";

// ── Types ──────────────────────────────────────────────
type AgentKey =
  | "marketResearch"
  | "businessStrategy"
  | "financialPlanning"
  | "branding"
  | "websiteGenerator"
  | "pitchDeck";

interface AgentConfig {
  key: AgentKey;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
  endpoint: string;
  color: string;
}

interface AgentOutputs {
  marketResearch: string;
  businessStrategy: string;
  financialPlanning: string;
  branding: string;
  websiteGenerator: string;
  pitchDeck: string;
}

type TraceStatus = "started" | "completed" | "failed";

interface TraceEntry {
  agent: AgentKey;
  status: TraceStatus;
  startedAt: string;
  durationMs?: number;
  outputChars?: number;
  error?: string;
}

interface WritableFileStream {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface DirectoryHandle {
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<DirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{ createWritable: () => Promise<WritableFileStream> }>;
}

type AccountUser = {
  id: string;
  email: string;
  name: string;
  initial: string;
};

type SavedProject = {
  id: string;
  idea: string;
  title: string | null;
  created_at: string;
};

// ── Agent Configuration ────────────────────────────────
const AGENTS: AgentConfig[] = [
  { key: "marketResearch", label: "Market Research", Icon: IconResearch, endpoint: "/api/agents/market-research", color: "#4766D8" },
  { key: "businessStrategy", label: "Business Strategy", Icon: IconStrategy, endpoint: "/api/agents/business-strategy", color: "#805AD5" },
  { key: "financialPlanning", label: "Financial Planning", Icon: IconFinance, endpoint: "/api/agents/financial-planning", color: "#16805D" },
  { key: "branding", label: "Brand Identity", Icon: IconBrand, endpoint: "/api/agents/branding", color: "#B66A1D" },
  { key: "websiteGenerator", label: "Launch Site", Icon: IconWebsite, endpoint: "/api/agents/website-generator", color: "#A24D7C" },
  { key: "pitchDeck", label: "Investor Deck", Icon: IconPitch, endpoint: "/api/agents/pitch-deck", color: "#A44A3D" },
];

function ActionIcon({ name, size = 16 }: { name: "check" | "copy" | "download" | "stop" | "reset" | "alert" | "bolt" | "upload" | "arrowUp" | "folder" | "spark"; size?: number }) {
  const paths = {
    check: <path d="m5 12 4.2 4.2L19 6.7" />,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></>,
    download: <><path d="M12 3v11" /><path d="m8 10 4 4 4-4" /><path d="M5 19h14" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />,
    reset: <><path d="M20 11a8 8 0 1 1-2.3-5.7" /><path d="M20 4v7h-7" /></>,
    alert: <><path d="M12 3 21 20H3L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    bolt: <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" />,
    upload: <><path d="M12 16V4" /><path d="m8 8 4-4 4 4" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
    arrowUp: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></>,
    spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

const AGENT_ACTIVITY: Record<AgentKey, { working: string; upcoming: string; detail: string; tasks: string[] }> = {
  marketResearch: {
    working: "Mapping the market before you make a move.",
    upcoming: "Your research room is getting ready.",
    detail: "We are sizing the opportunity, scanning competitors, and surfacing the customer signals that matter.",
    tasks: ["Sizing the opportunity", "Scanning competitor moves", "Finding customer pain points"],
  },
  businessStrategy: {
    working: "Turning insight into a decisive strategy.",
    upcoming: "Your strategy studio is up next.",
    detail: "We are defining the wedge, positioning, and go-to-market choices that give this idea momentum.",
    tasks: ["Defining your market wedge", "Pressure-testing the business model", "Shaping the go-to-market plan"],
  },
  financialPlanning: {
    working: "Putting the numbers behind the ambition.",
    upcoming: "Your finance desk is queued next.",
    detail: "We are translating the strategy into pricing, unit economics, milestones, and a credible runway.",
    tasks: ["Designing pricing logic", "Modeling unit economics", "Mapping milestones and runway"],
  },
  branding: {
    working: "Giving the company a voice people remember.",
    upcoming: "Your brand atelier is warming up.",
    detail: "We are creating a name direction, verbal identity, and visual territory built around the strategy.",
    tasks: ["Exploring naming territory", "Defining the brand voice", "Building a visual direction"],
  },
  websiteGenerator: {
    working: "Turning the story into a launch-ready front door.",
    upcoming: "Your launch page is being prepared.",
    detail: "We are composing the value proposition, conversion flow, and page structure for your first landing page.",
    tasks: ["Writing the conversion narrative", "Structuring the landing page", "Preparing deployable HTML"],
  },
  pitchDeck: {
    working: "Packaging the story investors need to see.",
    upcoming: "Your investor narrative is the final step.",
    detail: "We are bringing the insight, strategy, financials, and brand into one concise fundraising narrative.",
    tasks: ["Framing the investment case", "Sequencing the narrative", "Clarifying the funding ask"],
  },
};

const EXAMPLES = [
  "AI-based agriculture startup using drone technology",
  "Mental health app for Gen Z with AI therapy",
  "SaaS tool for remote team collaboration",
  "EdTech platform for rural India",
  "Climate tech carbon credit marketplace",
  "AI-powered legal document automation",
];

const EMPTY_OUTPUTS: AgentOutputs = {
  marketResearch: "",
  businessStrategy: "",
  financialPlanning: "",
  branding: "",
  websiteGenerator: "",
  pitchDeck: "",
};

function titleFromIdea(idea: string) {
  const cleaned = idea.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Untitled project";
  if (cleaned.length <= 64) return cleaned;
  return `${cleaned.slice(0, 64).trim()}…`;
}

function deriveAccount(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AccountUser {
  const email = user.email ?? "signed-in user";
  const metaName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  const name = metaName || email.split("@")[0];
  return { id: user.id, email, name, initial: name.charAt(0).toUpperCase() };
}

// ── Streaming helper ──────────────────────────────────
async function streamAgentOutput(
  endpoint: string,
  body: Record<string, string>,
  runId: string,
  onChunk: (text: string) => void,
  onTrace: (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => void
): Promise<string> {
  const startedAt = performance.now();
  onTrace("started");
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Run-Id": runId },
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
  let full = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      full += text;
      onChunk(full);
    }
  } catch (streamError) {
    const message = streamError instanceof Error ? streamError.message : "Streaming response failed";
    onTrace("failed", full.length, Math.round(performance.now() - startedAt), message);
    throw streamError;
  }
  onTrace("completed", full.length, Math.round(performance.now() - startedAt));
  return full;
}

// ── Main Build Page ────────────────────────────────────
function BuildPageInner() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") || "");
  const [outputs, setOutputs] = useState<AgentOutputs>(EMPTY_OUTPUTS);
  const [activeTab, setActiveTab] = useState<AgentKey>("marketResearch");
  const [running, setRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<number>(-1);
  const [completedAgents, setCompletedAgents] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [traceRunId, setTraceRunId] = useState<string | null>(null);
  const [traceEntries, setTraceEntries] = useState<TraceEntry[]>([]);
  const [projectSaveStatus, setProjectSaveStatus] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(searchParams.get("project"));
  const [loadingProject, setLoadingProject] = useState(Boolean(searchParams.get("project")));
  const abortRef = useRef<boolean>(false);
  const previewUrlRef = useRef<string | null>(null);
  const briefFileInputRef = useRef<HTMLInputElement>(null);

  const progress = completedAgents.size / AGENTS.length;
  const hasOutputs = Object.values(outputs).some(Boolean);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;

        if (!user) {
          setAccount(null);
          setRecentProjects([]);
          setAuthReady(true);
          setLoadingProject(false);
          return;
        }

        const nextAccount = deriveAccount(user);
        setAccount(nextAccount);

        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name: nextAccount.name,
          updated_at: new Date().toISOString(),
        });

        const { data: projects } = await supabase
          .from("projects")
          .select("id, idea, title, created_at")
          .order("created_at", { ascending: false })
          .limit(6);

        if (mounted) setRecentProjects(projects ?? []);

        const projectId = searchParams.get("project");
        if (projectId) {
          const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, idea, title, deliverables")
            .eq("id", projectId)
            .maybeSingle();

          if (projectError) throw projectError;
          if (project && mounted) {
            const deliverables = (project.deliverables ?? {}) as Partial<AgentOutputs>;
            const nextOutputs: AgentOutputs = {
              marketResearch: deliverables.marketResearch ?? "",
              businessStrategy: deliverables.businessStrategy ?? "",
              financialPlanning: deliverables.financialPlanning ?? "",
              branding: deliverables.branding ?? "",
              websiteGenerator: deliverables.websiteGenerator ?? "",
              pitchDeck: deliverables.pitchDeck ?? "",
            };
            setIdea(project.idea);
            setOutputs(nextOutputs);
            setActiveProjectId(project.id);
            setProjectSaveStatus("Loaded from your account.");
            const done = new Set<number>();
            AGENTS.forEach((agent, index) => {
              if (nextOutputs[agent.key]?.trim()) done.add(index);
            });
            setCompletedAgents(done);
            if (nextOutputs.websiteGenerator?.includes("<!DOCTYPE html>")) {
              setWebsitePreview(nextOutputs.websiteGenerator);
            }
            const firstWithContent = AGENTS.find((agent) => nextOutputs[agent.key]?.trim());
            if (firstWithContent) setActiveTab(firstWithContent.key);
          }
        }
      } catch (bootError) {
        console.error("Workspace boot error:", bootError);
        if (mounted && searchParams.get("project")) {
          setError("Could not load that project. It may have been deleted or belongs to another account.");
        }
      } finally {
        if (mounted) {
          setAuthReady(true);
          setLoadingProject(false);
        }
      }
    }

    void boot();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setAccount(null);
          setRecentProjects([]);
          return;
        }
        setAccount(deriveAccount(session.user));
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } catch {
      return () => {
        mounted = false;
      };
    }
  }, [searchParams]);

  const setWebsitePreview = (html: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = html && html.includes("<!DOCTYPE html>")
      ? URL.createObjectURL(new Blob([html], { type: "text/html" }))
      : null;
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleBriefUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIdea(String(reader.result || ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleBuild = async () => {
    if (!idea.trim()) return;
    abortRef.current = false;
    setRunning(true);
    setError(null);
    setOutputs(EMPTY_OUTPUTS);
    setWebsitePreview(null);
    setCompletedAgents(new Set());
    setCurrentAgent(0);
    setActiveTab("marketResearch");
    setProjectSaveStatus(null);
    setActiveProjectId(null);
    const runId = crypto.randomUUID();
    setTraceRunId(runId);
    setTraceEntries([]);
    const updateTrace = (agent: AgentKey) => (status: TraceStatus, outputChars?: number, durationMs?: number, error?: string) => {
      setTraceEntries((current) => {
        if (status === "started") return [...current, { agent, status, startedAt: new Date().toISOString() }];
        return current.map((entry) =>
          entry.agent === agent && entry.status === "started"
            ? { ...entry, status, durationMs, outputChars, error }
            : entry
        );
      });
    };

    let marketResearch = "";
    let businessStrategy = "";
    let financialPlanning = "";
    let branding = "";
    let pitchDeck = "";

    try {
      setCurrentAgent(0);
      marketResearch = await streamAgentOutput(
        "/api/agents/market-research",
        { idea },
        runId,
        (text) => setOutputs((p) => ({ ...p, marketResearch: text })),
        updateTrace("marketResearch")
      );
      setCompletedAgents((p) => new Set([...p, 0]));
      if (abortRef.current) return;

      setCurrentAgent(1);
      setActiveTab("businessStrategy");
      businessStrategy = await streamAgentOutput(
        "/api/agents/business-strategy",
        { idea, marketResearch },
        runId,
        (text) => setOutputs((p) => ({ ...p, businessStrategy: text })),
        updateTrace("businessStrategy")
      );
      setCompletedAgents((p) => new Set([...p, 1]));
      if (abortRef.current) return;

      setCurrentAgent(2);
      setActiveTab("financialPlanning");
      financialPlanning = await streamAgentOutput(
        "/api/agents/financial-planning",
        { idea, strategy: businessStrategy },
        runId,
        (text) => setOutputs((p) => ({ ...p, financialPlanning: text })),
        updateTrace("financialPlanning")
      );
      setCompletedAgents((p) => new Set([...p, 2]));
      if (abortRef.current) return;

      setCurrentAgent(3);
      setActiveTab("branding");
      branding = await streamAgentOutput(
        "/api/agents/branding",
        { idea, strategy: businessStrategy },
        runId,
        (text) => setOutputs((p) => ({ ...p, branding: text })),
        updateTrace("branding")
      );
      setCompletedAgents((p) => new Set([...p, 3]));
      if (abortRef.current) return;

      setCurrentAgent(4);
      setActiveTab("websiteGenerator");
      const website = await streamAgentOutput(
        "/api/agents/website-generator",
        { idea, branding, strategy: businessStrategy },
        runId,
        (text) => setOutputs((p) => ({ ...p, websiteGenerator: text })),
        updateTrace("websiteGenerator")
      );
      if (!website.trim().startsWith("<!DOCTYPE html>") || !website.trim().endsWith("</html>")) {
        throw new Error("The launch site generation ended early. Please run the package again to generate a complete HTML/CSS/JS file.");
      }
      setWebsitePreview(website);
      setCompletedAgents((p) => new Set([...p, 4]));
      if (abortRef.current) return;

      setCurrentAgent(5);
      setActiveTab("pitchDeck");
      pitchDeck = await streamAgentOutput(
        "/api/agents/pitch-deck",
        { idea, strategy: businessStrategy, financials: financialPlanning, branding },
        runId,
        (text) => setOutputs((p) => ({ ...p, pitchDeck: text })),
        updateTrace("pitchDeck")
      );
      setCompletedAgents((p) => new Set([...p, 5]));

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setProjectSaveStatus("Sign in to save this package to your account.");
        } else {
          const payload = {
            user_id: user.id,
            idea,
            title: titleFromIdea(idea),
            deliverables: {
              marketResearch,
              businessStrategy,
              financialPlanning,
              branding,
              website,
              pitchDeck,
            },
            updated_at: new Date().toISOString(),
          };
          const { data: saved, error: saveError } = await supabase
            .from("projects")
            .insert(payload)
            .select("id, idea, title, created_at")
            .single();
          if (saveError) throw saveError;
          setActiveProjectId(saved.id);
          setRecentProjects((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 6));
          setProjectSaveStatus("Saved privately to My projects.");
        }
      } catch (saveError) {
        console.error("Project save error:", saveError);
        setProjectSaveStatus("Package generated, but it could not be saved. Run the Supabase schema setup, then try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Agent error:", err);
      setError(msg);
    } finally {
      setRunning(false);
      setCurrentAgent(-1);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setRunning(false);
    setCurrentAgent(-1);
  };

  const handleCopy = () => {
    const content = outputs[activeTab];
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const agent = AGENTS.find((a) => a.key === activeTab);
    if (!agent) return;
    const content = outputs[activeTab];
    if (!content) return;

    if (activeTab === "websiteGenerator") {
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "landing-page.html";
      a.click();
    } else {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agent.key}.md`;
      a.click();
    }
  };

  const handleDownloadTrace = () => {
    if (!traceRunId || !traceEntries.length) return;
    const events = traceEntries
      .map((entry) =>
        JSON.stringify({
          service: "zing-ai-startup-builder",
          traceVersion: 1,
          event: "agent.run",
          runId: traceRunId,
          agent: entry.agent,
          status: entry.status,
          startedAt: entry.startedAt,
          ...(entry.durationMs !== undefined ? { durationMs: entry.durationMs } : {}),
          ...(entry.outputChars !== undefined ? { outputChars: entry.outputChars } : {}),
          ...(entry.error ? { error: entry.error } : {}),
        })
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([events], { type: "application/x-ndjson" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mutagent-trace-${traceRunId}.jsonl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFolder = async () => {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<DirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      setError("Folder export is supported in Chromium-based browsers. Use Download full package as a fallback.");
      return;
    }

    try {
      setExportStatus("Choose a folder for your startup package…");
      const destination = await picker();
      const folder = await destination.getDirectoryHandle("zing-startup-package", { create: true });
      const files: Array<{ path: string; content: string }> = AGENTS.map((agent, index) => ({
        path: `${String(index + 1).padStart(2, "0")}-${agent.key === "websiteGenerator" ? "launch-site.html" : `${agent.key}.md`}`,
        content: outputs[agent.key],
      }));
      const manifest = [
        "# Zing Startup Package",
        "",
        `Startup brief: ${idea}`,
        "",
        "## Deliverables",
        ...files.map(({ path }, index) => `- \`${path}\` — ${AGENTS[index].label}`),
        "",
        "All analyses are markdown files. `05-launch-site.html` is a self-contained HTML, CSS, and JavaScript landing page.",
      ].join("\n");
      files.unshift({ path: "README.md", content: manifest });

      for (const file of files) {
        const fileHandle = await folder.getFileHandle(file.path, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file.content);
        await writable.close();
      }
      setExportStatus("Saved to zing-startup-package/");
    } catch (exportError) {
      if (exportError instanceof DOMException && exportError.name === "AbortError") {
        setExportStatus(null);
        return;
      }
      setError("Could not save the package folder. Please try again or use Download full package.");
      setExportStatus(null);
    }
  };

  const resetWorkspace = () => {
    setOutputs(EMPTY_OUTPUTS);
    setWebsitePreview(null);
    setCompletedAgents(new Set());
    setCurrentAgent(-1);
    setIdea("");
    setActiveProjectId(null);
    setProjectSaveStatus(null);
    setTraceRunId(null);
    setTraceEntries([]);
    setError(null);
    setExportStatus(null);
  };

  const activeAgent = AGENTS.find((a) => a.key === activeTab)!;
  const activeAgentIndex = AGENTS.findIndex((a) => a.key === activeTab);
  const activeOutput = outputs[activeTab];
  const isWebsiteTab = activeTab === "websiteGenerator";
  const isUpcoming = running && activeAgentIndex > currentAgent;
  const isActiveAgent = running && activeAgentIndex === currentAgent;
  const activity = AGENT_ACTIVITY[activeTab];
  const CurrentAgentIcon = currentAgent >= 0 ? AGENTS[currentAgent].Icon : null;
  const ActiveAgentIcon = activeAgent.Icon;

  return (
    <>
      <Navbar variant="build" />

      <main className="workspace premium-workspace">
        <div className="container workspace-layout">
          {/* Account / session strip */}
          <section className={`account-strip ${account ? "is-signed-in" : "is-guest"}`} aria-live="polite">
            {authReady ? (
              account ? (
                <>
                  <div className="account-strip-identity">
                    <span className="account-avatar lg" aria-hidden>
                      {account.initial}
                    </span>
                    <div>
                      <p className="account-strip-kicker">Signed in workspace</p>
                      <h2>
                        Welcome back, <em>{account.name}</em>
                      </h2>
                      <p className="account-strip-email">{account.email}</p>
                    </div>
                  </div>
                  <div className="account-strip-stats">
                    <div className="account-stat">
                      <span>Projects</span>
                      <strong>{recentProjects.length}</strong>
                    </div>
                    <div className="account-stat">
                      <span>Agents</span>
                      <strong>6</strong>
                    </div>
                    <div className="account-stat">
                      <span>Status</span>
                      <strong className="live">{activeProjectId ? "Loaded" : running ? "Building" : "Ready"}</strong>
                    </div>
                  </div>
                  <div className="account-strip-actions">
                    <Link href="/projects" className="btn btn-secondary btn-sm">
                      <ActionIcon name="folder" size={14} /> My projects
                    </Link>
                    <button type="button" className="btn btn-primary btn-sm" onClick={resetWorkspace} disabled={running}>
                      New build
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="account-strip-identity">
                    <span className="account-avatar lg guest" aria-hidden>
                      <ActionIcon name="spark" size={18} />
                    </span>
                    <div>
                      <p className="account-strip-kicker">Guest mode</p>
                      <h2>Build now, save forever with an account</h2>
                      <p className="account-strip-email">Sign in to keep every package private under your projects.</p>
                    </div>
                  </div>
                  <div className="account-strip-actions">
                    <Link href="/login?next=/build" className="btn btn-primary btn-sm">
                      Sign in
                    </Link>
                    <Link href="/login?next=/build" className="btn btn-secondary btn-sm">
                      Create account
                    </Link>
                  </div>
                </>
              )
            ) : (
              <p className="account-strip-loading">Checking your account…</p>
            )}
          </section>

          {account && recentProjects.length > 0 && (
            <section className="recent-projects" aria-label="Recent projects">
              <div className="recent-projects-head">
                <div>
                  <p className="composer-group-label">Your projects</p>
                  <h3>Continue where you left off</h3>
                </div>
                <Link href="/projects" className="ghost-action">
                  View all
                </Link>
              </div>
              <div className="recent-projects-row">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/build?project=${project.id}`}
                    className={`recent-project-chip ${activeProjectId === project.id ? "is-active" : ""}`}
                  >
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    <strong>{project.title || titleFromIdea(project.idea)}</strong>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="workspace-header">
            <p className="eyebrow">Founder workspace</p>
            <h1 className="workspace-title">
              {activeProjectId ? "Your saved package, ready to refine." : "Turn a sharp idea into a fundable company."}
            </h1>
            <p className="workspace-sub">
              Your six-person AI venture team turns one brief into research, strategy, brand, website, and pitch — then saves it to your account when you are signed in.
            </p>
          </div>

          {loadingProject ? (
            <div className="compose-card premium-loading-card">Loading your project…</div>
          ) : (
            <div className="compose-card composer-shell premium-composer">
              <div className="idea-field" data-active={idea.length > 0 || undefined}>
                <span className="idea-field-icon">
                  <ActionIcon name="bolt" size={18} />
                </span>
                <textarea
                  id="startup-idea"
                  className="idea-textarea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe the startup you want to build — customer, problem, and what makes it different"
                  disabled={running}
                  rows={4}
                />
                <div className="idea-field-actions">
                  <input
                    ref={briefFileInputRef}
                    className="brief-file-input"
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    onChange={handleBriefUpload}
                    disabled={running}
                  />
                  <button className="upload-brief" type="button" onClick={() => briefFileInputRef.current?.click()} disabled={running}>
                    <ActionIcon name="upload" size={18} />
                    Upload brief
                  </button>
                  <span className="idea-count">{idea.length ? `${idea.length} characters` : "Add detail for stronger output"}</span>
                  <button className="prompt-send" type="button" onClick={handleBuild} disabled={running || !idea.trim()}>
                    {running ? <span className="stream-cursor" /> : <ActionIcon name="arrowUp" size={20} />}
                    {running ? "Building" : "Generate package"}
                  </button>
                </div>
              </div>

              <div className="composer-groups">
                <div className="composer-group">
                  <span className="composer-group-label">Try a prompt</span>
                  <div className="example-list floating-suggestions">
                    {EXAMPLES.map((ex) => (
                      <button key={ex} className="example-chip" onClick={() => setIdea(ex)} disabled={running}>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="composer-group composer-team-group">
                  <span className="composer-group-label">Your venture team</span>
                  <div className="pipeline-pills">
                    {AGENTS.map((a, i) => (
                      <div key={a.key} className={`pipeline-pill ${currentAgent === i ? "is-active" : ""} ${completedAgents.has(i) ? "is-done" : ""}`}>
                        <a.Icon size={14} />
                        {a.label}
                      </div>
                    ))}
                  </div>
                </div>
                {running && (
                  <button className="btn btn-secondary composer-stop" onClick={handleStop}>
                    <ActionIcon name="stop" size={12} /> Stop build
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <span className="error-icon">
                <ActionIcon name="alert" size={20} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="error-banner-title">Agent Error</div>
                <div className="error-banner-msg">{error}</div>
                {error.includes("GEMINI_API_KEY") && (
                  <div className="error-hint">
                    1. Open <strong>.env.local</strong>
                    <br />
                    2. Set <code>GEMINI_API_KEY=your_key_here</code> from{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                      aistudio.google.com/apikey
                    </a>
                    <br />
                    3. Restart the dev server: <code>npm run dev</code>
                  </div>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-dim)", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}

          {(running || completedAgents.size > 0) && (
            <div className="progress-card premium-progress">
              <div className="progress-top">
                <div className="progress-label">
                  {running && currentAgent >= 0 ? (
                    <>
                      {CurrentAgentIcon && <CurrentAgentIcon size={16} />} {AGENT_ACTIVITY[AGENTS[currentAgent].key].working}
                    </>
                  ) : completedAgents.size === AGENTS.length ? (
                    <>
                      <ActionIcon name="check" size={16} /> All deliverables are ready to review.
                    </>
                  ) : (
                    "Agents paused"
                  )}
                  {running && <span className="phase-loader" aria-label="Current phase is loading" />}
                </div>
                <div className="progress-pct">{Math.round(progress * 100)}%</div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="progress-steps">
                {AGENTS.map((a, i) => (
                  <div key={a.key} className="progress-step">
                    <div className={`step-badge ${completedAgents.has(i) ? "done" : currentAgent === i ? "active" : ""}`}>
                      {completedAgents.has(i) ? <ActionIcon name="check" size={17} /> : <a.Icon size={17} />}
                    </div>
                    <div className="step-name">{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {traceRunId && (
            <section className="trace-card" aria-label="Mutagent agent run trace">
              <div className="trace-head">
                <div>
                  <p className="trace-kicker">Mutagent trace</p>
                  <div className="trace-run-id" title={traceRunId}>
                    Run {traceRunId}
                  </div>
                </div>
                <button className="ghost-action" onClick={handleDownloadTrace} disabled={!traceEntries.length}>
                  <ActionIcon name="download" size={14} /> Download JSONL
                </button>
              </div>
              <div className="trace-list">
                {AGENTS.map((agent) => {
                  const entry = traceEntries.find((item) => item.agent === agent.key);
                  return (
                    <div className={`trace-row ${entry ? `is-${entry.status}` : "is-pending"}`} key={agent.key}>
                      <span className="trace-status" aria-label={entry?.status ?? "pending"}>
                        {entry?.status === "completed" ? (
                          <ActionIcon name="check" size={14} />
                        ) : entry?.status === "failed" ? (
                          <ActionIcon name="alert" size={14} />
                        ) : entry?.status === "started" ? (
                          <span className="trace-pulse" />
                        ) : (
                          "·"
                        )}
                      </span>
                      <span className="trace-agent">{agent.label}</span>
                      <span className="trace-meta">
                        {entry?.status === "started"
                          ? "Streaming…"
                          : entry?.status === "completed"
                            ? `${entry.outputChars?.toLocaleString() ?? 0} chars · ${entry.durationMs ?? 0} ms`
                            : entry?.status === "failed"
                              ? entry.error
                              : "Waiting"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(running || hasOutputs) && (
            <div className="output-shell premium-output">
              <div className="tabs-row">
                {AGENTS.map((a, i) => (
                  <button
                    key={a.key}
                    className={`tab-btn ${activeTab === a.key ? "active" : ""}`}
                    onClick={() => setActiveTab(a.key)}
                    style={activeTab === a.key ? { color: a.color, borderBottomColor: a.color } : {}}
                  >
                    <a.Icon size={15} /> {a.label}
                    {completedAgents.has(i) && (
                      <span className="tab-check">
                        <ActionIcon name="check" size={13} />
                      </span>
                    )}
                    {currentAgent === i && <span className="stream-cursor" style={{ marginLeft: 4 }} />}
                  </button>
                ))}
              </div>

              <div>
                <div className="panel-head">
                  <div className="panel-title">
                    <span className="panel-title-icon" style={{ color: activeAgent.color }}>
                      <ActiveAgentIcon size={18} />
                    </span>
                    {activeAgent.label} Agent
                    {completedAgents.has(AGENTS.findIndex((a) => a.key === activeTab)) && (
                      <span className="badge badge-green">
                        <ActionIcon name="check" size={12} /> Complete
                      </span>
                    )}
                    {currentAgent === AGENTS.findIndex((a) => a.key === activeTab) && (
                      <span className="badge badge-live">
                        <ActionIcon name="bolt" size={12} /> Building
                      </span>
                    )}
                  </div>
                  {activeOutput && (
                    <div className="panel-actions">
                      <button className="ghost-action" onClick={handleCopy}>
                        <ActionIcon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
                      </button>
                      <button className="ghost-action" onClick={handleDownload}>
                        <ActionIcon name="download" size={14} /> Download
                      </button>
                    </div>
                  )}
                </div>

                {!activeOutput ? (
                  <div className="stream-box empty activity-empty">
                    <div className={`activity-orb ${isActiveAgent ? "is-working" : ""}`} style={{ color: activeAgent.color }}>
                      <activeAgent.Icon size={26} />
                    </div>
                    <div className="activity-kicker">
                      {isActiveAgent ? "In progress now" : isUpcoming ? "Up next in your pipeline" : "Ready when you are"}
                    </div>
                    <div className="activity-title">
                      {isActiveAgent ? activity.working : isUpcoming ? activity.upcoming : `Bring ${activeAgent.label.toLowerCase()} into focus.`}
                    </div>
                    <div className="activity-copy">
                      {isActiveAgent || isUpcoming
                        ? activity.detail
                        : "Start the pipeline and every specialist will build on the work that comes before it."}
                    </div>
                    {(isActiveAgent || isUpcoming) && (
                      <div className="thinking-chain" aria-label="Agent workflow">
                        {activity.tasks.map((task, index) => (
                          <div className="thinking-node" key={task}>
                            <span className="thinking-index">{String(index + 1).padStart(2, "0")}</span>
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isWebsiteTab ? (
                  <div style={{ padding: 0 }}>
                    <div className="preview-note">Live preview — your landing page code is ready to deploy</div>
                    {previewUrl ? (
                      <div className="website-preview" style={{ margin: "20px", borderRadius: "var(--radius-md)" }}>
                        <div className="browser-bar">
                          <div className="browser-dots">
                            <div className="browser-dot dot-red" />
                            <div className="browser-dot dot-yellow" />
                            <div className="browser-dot dot-green" />
                          </div>
                          <div className="browser-url">your-startup.com — AI Generated Landing Page</div>
                        </div>
                        <iframe src={previewUrl} className="preview-iframe" title="Generated Website Preview" sandbox="allow-same-origin allow-scripts" />
                      </div>
                    ) : (
                      <div className="stream-box">
                        <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 500, whiteSpace: "pre-wrap" }}>
                          {activeOutput}
                          {currentAgent === 4 && <span className="stream-cursor" />}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="stream-box">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeOutput}</ReactMarkdown>
                    {currentAgent === AGENTS.findIndex((a) => a.key === activeTab) && <span className="stream-cursor" />}
                  </div>
                )}
              </div>
            </div>
          )}

          {completedAgents.size === AGENTS.length && (
            <div className="success-band premium-success">
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Your startup package is ready</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  All 6 agents completed · Business plan, brand, website, and pitch deck generated
                </div>
                {projectSaveStatus && <div className="project-save-status">{projectSaveStatus}</div>}
              </div>
              <div className="success-actions">
                <button className="btn btn-secondary" onClick={resetWorkspace}>
                  <ActionIcon name="reset" size={15} /> Start over
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const bundle = AGENTS.map((a) => `# ${a.label}\n\n${outputs[a.key]}`).join("\n\n---\n\n");
                    const blob = new Blob([bundle], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "startup-package.md";
                    link.click();
                  }}
                >
                  <ActionIcon name="download" size={15} /> Download full package
                </button>
                <button className="btn btn-secondary" onClick={handleExportFolder}>
                  <ActionIcon name="download" size={15} /> Export folder
                </button>
                <Link href="/projects" className="btn btn-secondary">
                  My projects
                </Link>
              </div>
              {exportStatus && <div className="export-status">{exportStatus}</div>}
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <span>
            <Image
              className="footer-zing-logo"
              src="/WhatsApp_Image_2026-08-07_at_13.37.59-removebg-preview.png"
              alt="Zing"
              width={68}
              height={25}
            />{" "}
            — Developed by Zaya Code Hub · AI startup intelligence
          </span>
          <span>A Zaya Code Hub product</span>
        </div>
      </footer>
    </>
  );
}

export default function BuildPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-screen">Loading workspace…</div>
      }
    >
      <BuildPageInner />
    </Suspense>
  );
}
