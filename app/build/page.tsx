"use client";
import { useState, useEffect, useRef, Suspense, type ComponentType, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/navbar";
import { createLocalProject, loadLocalProjects, saveLocalProjects, storeLocalProject } from "@/lib/projects";
import { loadUserProjects, normalizeDeliverables, upsertRemoteProject, fetchRemoteProjects } from "@/lib/project-sync";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MutagentOrchestrator, type LifecycleStage, type ScorecardEntry } from "@/lib/mutagent-orchestrator";
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
  user_id?: string;
  idea: string;
  title: string | null;
  created_at: string;
  updated_at?: string;
  deliverables?: Record<string, string> | null;
};

// ── Agent Configuration ────────────────────────────────
const AGENTS: AgentConfig[] = [
  { key: "marketResearch", label: "Market Research", Icon: IconResearch, endpoint: "/api/mutagent/market-research", color: "#4766D8" },
  { key: "businessStrategy", label: "Business Strategy", Icon: IconStrategy, endpoint: "/api/mutagent/business-strategy", color: "#805AD5" },
  { key: "financialPlanning", label: "Financial Planning", Icon: IconFinance, endpoint: "/api/mutagent/financial-planning", color: "#16805D" },
  { key: "branding", label: "Brand Identity", Icon: IconBrand, endpoint: "/api/mutagent/branding", color: "#B66A1D" },
  { key: "websiteGenerator", label: "Launch Site", Icon: IconWebsite, endpoint: "/api/mutagent/website-generator", color: "#A24D7C" },
  { key: "pitchDeck", label: "Investor Deck", Icon: IconPitch, endpoint: "/api/mutagent/pitch-deck", color: "#A44A3D" },
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
const AI_MESSAGES = [
  "Initializing AI agent network...",
  "Scanning market signals and trends...",
  "Estimating TAM / SAM / SOM...",
  "Validating problem-solution fit...",
  "Mapping competitive landscape...",
  "Identifying customer personas...",
  "Defining go-to-market strategy...",
  "Stress-testing business model assumptions...",
  "Modeling unit economics and LTV/CAC...",
  "Projecting 3-year revenue milestones...",
  "Crafting brand identity and voice...",
  "Designing conversion narrative...",
  "Generating landing page HTML/CSS/JS...",
  "Framing investor pitch narrative...",
  "Packaging startup into deliverables...",
];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}


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
// Moved to lib/mutagent-orchestrator.ts

// ── Typewriter component ────────────────────────────────
function Typewriter({ text, speed = 100 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setDisplayedText("");
    setIndex(0);
  }, [text, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed, mounted]);

  if (!mounted) {
    return <span className="typewriter-container" style={{ opacity: 0 }}>{text}</span>;
  }

  return (
    <span className="typewriter-container">
      {displayedText}
      <span className="typewriter-cursor">|</span>
    </span>
  );
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
  const [evaluationSummary, setEvaluationSummary] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardEntry[]>([]);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [approvalPending, setApprovalPending] = useState(false);
  const [projectSaveStatus, setProjectSaveStatus] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(searchParams.get("project"));
  const [loadingProject, setLoadingProject] = useState(Boolean(searchParams.get("project")));
  const abortRef = useRef<boolean>(false);
  const previewUrlRef = useRef<string | null>(null);
  const briefFileInputRef = useRef<HTMLInputElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveMessageIndex, setLiveMessageIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState("Describe the startup you want to build — customer, problem, and what makes it different");

  useEffect(() => {
    let active = true;
    let exampleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const basePlaceholder = "Describe the startup you want to build — e.g. ";

    function tick() {
      if (!active) return;
      const currentFullText = EXAMPLES[exampleIndex];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      const currentTyped = currentFullText.substring(0, charIndex);
      setPlaceholder(basePlaceholder + currentTyped);

      let delta = 70 - Math.random() * 20;

      if (isDeleting) {
        delta /= 2;
      }

      if (!isDeleting && charIndex === currentFullText.length) {
        delta = 3000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        exampleIndex = (exampleIndex + 1) % EXAMPLES.length;
        delta = 500;
      }

      timeoutId = setTimeout(tick, delta);
    }

    timeoutId = setTimeout(tick, 1000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderProgress, setPreloaderProgress] = useState(0);
  const [preloaderStatus, setPreloaderStatus] = useState("Initializing AI agent collective...");

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;
    let fadeTimeout: NodeJS.Timeout;

    const statuses = [
      "Initializing AI agent collective...",
      "Establishing secure workspace session...",
      "Loading 6-person venture team models...",
      "Syncing with Zaya Code Hub...",
      "Workspace ready."
    ];
    let statusIdx = 0;

    progressInterval = setInterval(() => {
      setPreloaderProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return p + 1;
      });
    }, 20);

    statusInterval = setInterval(() => {
      statusIdx = Math.min(statusIdx + 1, statuses.length - 1);
      setPreloaderStatus(statuses[statusIdx]);
    }, 500);

    fadeTimeout = setTimeout(() => {
      setShowPreloader(false);
    }, 2400);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      clearTimeout(fadeTimeout);
    };
  }, []);

  const progress = completedAgents.size / AGENTS.length;
  const hasOutputs = Object.values(outputs).some(Boolean);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    setElapsedTime(0);
    setLiveMessageIndex(0);
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    const msgTimer = setInterval(() => setLiveMessageIndex((i) => (i + 1) % AI_MESSAGES.length), 3000);
    return () => { clearInterval(timer); clearInterval(msgTimer); };
  }, [running]);

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

        const localProjects = loadLocalProjects(user.id);
        const { projects: loadedProjects, warning } = await loadUserProjects(supabase, user.id, localProjects, 6);
        let recentProjectsList = loadedProjects;
        if (mounted) {
          setRecentProjects(recentProjectsList);
          saveLocalProjects(user.id, recentProjectsList);
          if (warning) setProjectSaveStatus(warning);
        }

        if (typeof window !== "undefined") {
          const guestProjectStr = localStorage.getItem("zing_guest_project");
          if (guestProjectStr) {
            try {
              const guestData = JSON.parse(guestProjectStr);
              if (guestData && guestData.idea && guestData.outputs) {
                let savedRes =
                  (await upsertRemoteProject(supabase, null, {
                    user_id: user.id,
                    idea: guestData.idea,
                    title: titleFromIdea(guestData.idea),
                    deliverables: normalizeDeliverables(guestData.outputs) ?? guestData.outputs,
                  })) ??
                  createLocalProject({
                    user_id: user.id,
                    idea: guestData.idea,
                    title: titleFromIdea(guestData.idea),
                    deliverables: normalizeDeliverables(guestData.outputs) ?? guestData.outputs,
                  });

                storeLocalProject(savedRes);

                if (mounted) {
                  setIdea(guestData.idea);
                  setOutputs(guestData.outputs);
                  setActiveProjectId(savedRes.id);
                  setProjectSaveStatus("Your guest progress has been saved to your account!");

                  const done = new Set<number>();
                  AGENTS.forEach((agent, index) => {
                    if (guestData.outputs[agent.key]?.trim()) done.add(index);
                  });
                  setCompletedAgents(done);
                  if (guestData.outputs.websiteGenerator?.includes("<!DOCTYPE html>")) {
                    setWebsitePreview(guestData.outputs.websiteGenerator);
                  }
                  const firstWithContent = AGENTS.find((agent) => guestData.outputs[agent.key]?.trim());
                  if (firstWithContent) setActiveTab(firstWithContent.key);

                  recentProjectsList = [savedRes, ...recentProjectsList.filter((p) => p.id !== savedRes.id)].slice(0, 6);
                  setRecentProjects(recentProjectsList);
                  saveLocalProjects(user.id, recentProjectsList);
                }
              }
            } catch (err) {
              console.error("Failed to restore guest project:", err);
            } finally {
              localStorage.removeItem("zing_guest_project");
            }
          }
        }

        const projectId = searchParams.get("project");
        if (projectId) {
          const localProject = loadLocalProjects(user.id).find((item) => item.id === projectId) ?? null;
          const { projects: remoteProjects } = await fetchRemoteProjects(supabase, user.id);
          const project = remoteProjects.find((item) => item.id === projectId) ?? localProject;
          if (project && mounted) {
            const deliverables = (project.deliverables ?? {}) as Partial<AgentOutputs> & { website?: string };
            const nextOutputs: AgentOutputs = {
              marketResearch: deliverables.marketResearch ?? "",
              businessStrategy: deliverables.businessStrategy ?? "",
              financialPlanning: deliverables.financialPlanning ?? "",
              branding: deliverables.branding ?? "",
              websiteGenerator: deliverables.websiteGenerator ?? deliverables.website ?? "",
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
      const { data: listener } = supabase.auth.onAuthStateChange((_event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => {
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

  useEffect(() => {
    if (authReady && !account) {
      const hasContent = Object.values(outputs).some((val) => val && val.trim().length > 0);
      if (hasContent) {
        localStorage.setItem("zing_guest_project", JSON.stringify({ idea, outputs }));
      } else {
        localStorage.removeItem("zing_guest_project");
      }
    }
  }, [idea, outputs, account, authReady]);

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
    setEvaluationSummary(null);
    setScorecard([]);
    setLifecycleStage(null);
    setApprovalMessage(null);
    setApprovalPending(false);
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

    try {
      const orchestrator = new MutagentOrchestrator(runId);
      const results = await orchestrator.executePipeline(idea, {
        onLifecycleStage: (stage, message) => {
          setLifecycleStage(stage);
          if (message) setEvaluationSummary(message);
        },
        onScorecardUpdate: (nextScorecard) => setScorecard(nextScorecard),
        requestApproval: async (message) => {
          setApprovalPending(true);
          setApprovalMessage(message);
          return new Promise<boolean>((resolve) => {
            const confirmRetry = window.confirm(message);
            setApprovalPending(false);
            setApprovalMessage(null);
            resolve(confirmRetry);
          });
        },
        onAgentStart: (idx, key) => {
          setCurrentAgent(idx);
          setActiveTab(key);
        },
        onAgentUpdate: (key, text) => {
          setOutputs((p) => ({ ...p, [key]: text }));
        },
        onAgentComplete: (idx, key) => {
          setCompletedAgents((p) => new Set([...p, idx]));
        },
        onWebsitePreview: (websiteHtml) => {
          setWebsitePreview(websiteHtml);
          if (typeof window !== "undefined") {
            try {
              const blob = new Blob([websiteHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            } catch (err) {
              console.error("Popup block error:", err);
            }
          }
        },
        onTraceUpdate: updateTrace,
        isAborted: () => abortRef.current
      });

      if (!results) return; // Pipeline aborted
      
      const {
        marketResearch,
        businessStrategy,
        financialPlanning,
        branding,
        website,
        pitchDeck,
        evaluation,
      } = results;

      if (evaluation) {
        setEvaluationSummary(evaluation.passed ? evaluation.summary : `${evaluation.summary}\n\n${evaluation.issues.join("\n")}`);
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setProjectSaveStatus("Sign in to save this package to your account.");
        } else {
          const deliverables = normalizeDeliverables({
            marketResearch,
            businessStrategy,
            financialPlanning,
            branding,
            websiteGenerator: website,
            pitchDeck,
          }) ?? {
            marketResearch,
            businessStrategy,
            financialPlanning,
            branding,
            websiteGenerator: website,
            pitchDeck,
          };

          const remoteSaved = await upsertRemoteProject(supabase, activeProjectId, {
            user_id: user.id,
            idea,
            title: titleFromIdea(idea),
            deliverables,
          });
          const saved =
            remoteSaved ??
            createLocalProject({
              id: activeProjectId ?? undefined,
              user_id: user.id,
              idea,
              title: titleFromIdea(idea),
              deliverables,
            });

          storeLocalProject(saved);
          setActiveProjectId(saved.id);
          setRecentProjects((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 6));
          setProjectSaveStatus(
            remoteSaved
              ? "Saved privately to My projects."
              : "Saved on this device. Run supabase/schema.sql in Supabase SQL Editor to sync across devices."
          );
        }
      } catch (saveError) {
        console.error("Project save error:", saveError);
        if (!account) {
          setProjectSaveStatus("Package generated, but it could not be saved. Run the Supabase schema setup, then try again.");
          return;
        }
        const localProject = createLocalProject({
          id: activeProjectId,
          user_id: account.id,
          idea,
          title: titleFromIdea(idea),
          deliverables: {
            marketResearch,
            businessStrategy,
            financialPlanning,
            branding,
            websiteGenerator: website,
            pitchDeck,
          },
        });
        storeLocalProject(localProject);
        setActiveProjectId(localProject.id);
        setRecentProjects((current) => [localProject, ...current.filter((item) => item.id !== localProject.id)].slice(0, 6));
        setProjectSaveStatus("Saved on this device. Run the Supabase schema setup to sync projects across logins.");
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
      {showPreloader && (
        <div className="preloader-overlay">
          <div className="preloader-card">
            <div className="preloader-logo-area">
              <div className="preloader-logo-glow" />
              <div className="preloader-icon">🧠</div>
            </div>
            <h2 className="preloader-title">Zing AI Startup Builder</h2>
            <div className="preloader-tagline">
              <Typewriter text="Concept to Capital: Build your own startup." speed={50} />
            </div>
            
            <div className="preloader-progress-track">
              <div className="preloader-progress-fill" style={{ width: `${preloaderProgress}%` }} />
            </div>
            
            <div className="preloader-status">{preloaderStatus}</div>
          </div>
        </div>
      )}

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
              {activeProjectId ? "Your saved package, ready to refine." : <Typewriter text="Concept to Capital: Build your own startup." />}
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
                  placeholder={placeholder}
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
            <div className="premium-execution-layout">
              {completedAgents.size === AGENTS.length ? (
                <>
                  {/* ── Celebration Screen ── */}
                  <div className="exec-celebration">
                    <div className="exec-celebration-icon">
                      <ActionIcon name="check" size={48} />
                    </div>
                    <h2>🎉 Startup Blueprint Ready</h2>
                    <p>Your AI venture team has successfully generated your complete startup package.</p>
                    {projectSaveStatus && <div className="project-save-status" style={{ marginBottom: 8 }}>{projectSaveStatus}</div>}
                    <div className="success-actions" style={{ marginTop: 24, justifyContent: "center" }}>
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
                        <ActionIcon name="download" size={15} /> Download Full Package
                      </button>
                      <button className="btn btn-secondary" onClick={handleExportFolder}>
                        <ActionIcon name="download" size={15} /> Export Folder
                      </button>
                      <Link href="/projects" className="btn btn-secondary">My Projects</Link>
                    </div>
                    {exportStatus && <div className="export-status">{exportStatus}</div>}
                  </div>

                  {/* ── Output Tabs (revealed after completion) ── */}
                  <div className="output-shell premium-output" style={{ marginTop: 24 }}>
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
                            <span className="tab-check"><ActionIcon name="check" size={13} /></span>
                          )}
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
                          {completedAgents.has(activeAgentIndex) && (
                            <span className="badge badge-green"><ActionIcon name="check" size={12} /> Complete</span>
                          )}
                        </div>
                        {activeOutput && (
                          <div className="panel-actions">
                            {isWebsiteTab && previewUrl && (
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ghost-action"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                Open in New Tab
                              </a>
                            )}
                            <button className="ghost-action" onClick={handleCopy}>
                              <ActionIcon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
                            </button>
                            <button className="ghost-action" onClick={handleDownload}>
                              <ActionIcon name="download" size={14} /> Download
                            </button>
                          </div>
                        )}
                      </div>
                      {isWebsiteTab ? (
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
                              <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 500, whiteSpace: "pre-wrap" }}>{activeOutput}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="stream-box">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeOutput}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Live Execution Header ── */}
                  <div className="exec-header">
                    <div className="exec-header-top">
                      <div className="exec-header-title">
                        <h2><span>🧠</span> AI Startup Builder</h2>
                        <div className="exec-header-subtitle">Building your startup using multiple AI agents in real time...</div>
                      </div>
                      <div className="exec-header-stats">
                        <div className="exec-stat">
                          <span className="exec-stat-label">Estimated Remaining</span>
                          <span className="exec-stat-value">{formatTime(Math.max(0, 180 - elapsedTime))}</span>
                        </div>
                        <div className="exec-stat">
                          <span className="exec-stat-label">Elapsed Time</span>
                          <span className="exec-stat-value">{formatTime(elapsedTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="exec-progress-container">
                      <div className="exec-progress-bar-bg">
                        <div className="exec-progress-bar-fill" style={{ width: `${Math.max(2, progress * 100)}%` }} />
                      </div>
                      <div className="exec-progress-pct">{Math.round(progress * 100)}%</div>
                    </div>
                  </div>

                  {/* ── Phase Stepper ── */}
                  <div className="exec-stepper">
                    {AGENTS.map((a, i) => (
                      <div key={a.key} className={`exec-step ${completedAgents.has(i) ? "is-done" : currentAgent === i ? "is-active" : ""}`}>
                        <div className="exec-step-icon">
                          {completedAgents.has(i) ? <ActionIcon name="check" size={16} /> : <a.Icon size={16} />}
                        </div>
                        <div className="exec-step-label">{a.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Mutagent Trace Panel ── */}
                  {traceEntries.length > 0 && (
                    <div className="mutagent-trace-panel">
                      <div className="mutagent-trace-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>🧬</span>
                          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Mutagent Trace</h3>
                          <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "monospace" }}>{traceRunId}</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleDownloadTrace}>
                          <ActionIcon name="download" size={12} /> Download JSONL
                        </button>
                      </div>
                      <div className="mutagent-trace-list">
                        {traceEntries.map((t, i) => (
                          <div key={i} className={`mutagent-trace-item status-${t.status}`}>
                            <div className="trace-agent">
                              <strong>{AGENTS.find(a => a.key === t.agent)?.label || t.agent}</strong>
                            </div>
                            <div className="trace-meta">
                              <span className={`trace-badge badge-${t.status}`}>{t.status}</span>
                              {t.durationMs !== undefined && <span className="trace-stat">{t.durationMs}ms</span>}
                              {t.outputChars !== undefined && <span className="trace-stat">{t.outputChars} chars</span>}
                            </div>
                            {t.error && <div className="trace-err">{t.error}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(evaluationSummary || scorecard.length > 0 || lifecycleStage) && (
                    <div className="mutagent-trace-panel" style={{ marginTop: 16 }}>
                      <div className="mutagent-trace-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>🧪</span>
                          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Mutagent Scorecard & Lifecycle</h3>
                        </div>
                      </div>
                      <div style={{ padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
                        {lifecycleStage && (
                          <div style={{ marginBottom: 10, fontWeight: 600 }}>
                            Stage: <span style={{ textTransform: "capitalize" }}>{lifecycleStage}</span>
                          </div>
                        )}
                        {evaluationSummary && (
                          <div style={{ whiteSpace: "pre-wrap", marginBottom: 10 }}>{evaluationSummary}</div>
                        )}
                        {scorecard.length > 0 && (
                          <div style={{ display: "grid", gap: 8 }}>
                            {scorecard.map((entry) => (
                              <div key={entry.agent} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                  <strong>{entry.label}</strong>
                                  <span>{entry.score}% · {entry.passed ? "PASS" : "RETRY"}</span>
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                                  Attempts: {entry.attempts} · {entry.issues.length > 0 ? entry.issues.join(" • ") : "No critical issues detected"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Main Two-Column Area ── */}
                  <div className="exec-main-area">
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      <div className="exec-current-phase">
                        <div className="exec-phase-badge">Phase {Math.max(1, currentAgent + 1)} of {AGENTS.length}</div>
                        <div className="exec-phase-title">
                          {currentAgent >= 0 ? AGENTS[currentAgent].label : "Warming up..."}
                        </div>
                        <div className="exec-phase-task">
                          {currentAgent >= 0 ? AGENT_ACTIVITY[AGENTS[currentAgent].key].working : "Connecting AI agents..."}
                        </div>
                        <div className="exec-checklist">
                          {currentAgent >= 0 && AGENT_ACTIVITY[AGENTS[currentAgent].key].tasks.map((task, idx) => {
                            const isDone = elapsedTime > (currentAgent * 30 + idx * 7);
                            return (
                              <div key={task} className={`exec-checklist-item ${isDone ? "is-done" : "is-waiting"}`}>
                                {isDone ? <ActionIcon name="check" size={16} /> : <span>⏳</span>} {task}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="exec-terminal">
                        <div className="exec-terminal-title">Live AI Activity</div>
                        <div className="exec-terminal-lines">
                          {AI_MESSAGES.slice(Math.max(0, liveMessageIndex - 3), liveMessageIndex).map((msg, i) => (
                            <div key={i} className="exec-terminal-line is-done">
                              <ActionIcon name="check" size={14} /> {msg}
                            </div>
                          ))}
                          <div className="exec-terminal-line is-active">
                            <span style={{ color: "#3B82F6" }}>❯</span> {AI_MESSAGES[liveMessageIndex]}<span className="exec-type-cursor" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="exec-agent-grid">
                      {AGENTS.map((a, i) => (
                        <div key={a.key} className={`exec-agent-card ${completedAgents.has(i) ? "is-done" : currentAgent === i ? "is-active" : ""}`}>
                          <div className="exec-agent-icon">
                            {completedAgents.has(i) ? <ActionIcon name="check" size={20} /> : <a.Icon size={20} />}
                          </div>
                          <div className="exec-agent-info">
                            <div className="exec-agent-name">{a.label}</div>
                            <div className="exec-agent-status">
                              {completedAgents.has(i) ? "Completed" : currentAgent === i ? "Working..." : "Waiting..."}
                            </div>
                          </div>
                          <div className="exec-agent-meta">
                            <div className="exec-agent-pct">
                              {completedAgents.has(i) ? "100%" : currentAgent === i ? `${Math.round((elapsedTime % 30) / 30 * 100)}%` : "0%"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
