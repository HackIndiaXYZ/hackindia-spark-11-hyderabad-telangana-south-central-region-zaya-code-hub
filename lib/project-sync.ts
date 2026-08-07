import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeProjects, normalizeProject, type SavedProjectRecord } from "@/lib/projects";

const REMOTE_SELECT_VARIANTS = [
  "id, user_id, idea, title, created_at, updated_at, deliverables",
  "id, user_id, idea, title, created_at, deliverables",
  "id, user_id, idea, created_at, deliverables",
  "id, user_id, idea, created_at",
] as const;

export function normalizeDeliverables(
  deliverables: Record<string, string> | null | undefined
): Record<string, string> | null {
  if (!deliverables || typeof deliverables !== "object") return null;
  const website = deliverables.websiteGenerator ?? deliverables.website ?? "";
  return {
    marketResearch: deliverables.marketResearch ?? "",
    businessStrategy: deliverables.businessStrategy ?? "",
    financialPlanning: deliverables.financialPlanning ?? "",
    branding: deliverables.branding ?? "",
    websiteGenerator: website,
    pitchDeck: deliverables.pitchDeck ?? "",
  };
}

export function isMissingProjectsTable(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("does not exist") || message.includes("schema cache");
}

export async function fetchRemoteProjects(
  supabase: SupabaseClient,
  userId: string,
  limit?: number
): Promise<{ projects: SavedProjectRecord[]; error: string | null; tableMissing: boolean }> {
  let lastError: string | null = null;

  for (const select of REMOTE_SELECT_VARIANTS) {
    let query = supabase
      .from("projects")
      .select(select)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (typeof limit === "number") {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (!error) {
      return {
        projects: (data ?? []).map((project) => {
          const projectRecord = project && typeof project === "object" ? (project as Record<string, unknown>) : {};
          const deliverables = normalizeDeliverables(
            typeof projectRecord.deliverables === "object" && projectRecord.deliverables !== null
              ? (projectRecord.deliverables as Record<string, string>)
              : undefined
          );

          return normalizeProject({
            ...projectRecord,
            deliverables,
          });
        }),
        error: null,
        tableMissing: false,
      };
    }

    lastError = error.message;
    if (isMissingProjectsTable(error)) {
      return { projects: [], error: lastError, tableMissing: true };
    }
  }

  return { projects: [], error: lastError, tableMissing: false };
}

type ProjectPayload = {
  user_id: string;
  idea: string;
  title: string | null;
  deliverables: Record<string, string>;
  updated_at?: string;
};

export async function upsertRemoteProject(
  supabase: SupabaseClient,
  projectId: string | null | undefined,
  payload: ProjectPayload
): Promise<SavedProjectRecord | null> {
  const deliverables = normalizeDeliverables(payload.deliverables) ?? payload.deliverables;
  const fullPayload = {
    ...(projectId ? { id: projectId } : {}),
    ...payload,
    deliverables,
    updated_at: payload.updated_at ?? new Date().toISOString(),
  };
  const minimalPayload = {
    ...(projectId ? { id: projectId } : {}),
    user_id: payload.user_id,
    idea: payload.idea,
    deliverables,
  };

  if (projectId) {
    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update(fullPayload)
      .eq("id", projectId)
      .eq("user_id", payload.user_id)
      .select("id, user_id, idea, title, created_at, updated_at, deliverables")
      .maybeSingle();

    if (!updateError && updated) {
      return normalizeProject({ ...updated, deliverables });
    }

    const { data: fallbackUpdated, error: fallbackUpdateError } = await supabase
      .from("projects")
      .update(minimalPayload)
      .eq("id", projectId)
      .eq("user_id", payload.user_id)
      .select("id, user_id, idea, created_at, deliverables")
      .maybeSingle();

    if (!fallbackUpdateError && fallbackUpdated) {
      return normalizeProject({
        ...fallbackUpdated,
        title: payload.title,
        deliverables,
      });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("projects")
    .insert(fullPayload)
    .select("id, user_id, idea, title, created_at, updated_at, deliverables")
    .single();

  if (!insertError && inserted) {
    return normalizeProject({ ...inserted, deliverables });
  }

  const { data: fallbackInserted, error: fallbackInsertError } = await supabase
    .from("projects")
    .insert(minimalPayload)
    .select("id, user_id, idea, created_at, deliverables")
    .single();

  if (!fallbackInsertError && fallbackInserted) {
    return normalizeProject({
      ...fallbackInserted,
      title: payload.title,
      deliverables,
    });
  }

  return null;
}

export async function syncLocalProjectsToRemote(
  supabase: SupabaseClient,
  userId: string,
  localProjects: SavedProjectRecord[],
  remoteProjects: SavedProjectRecord[]
) {
  const remoteIds = new Set(remoteProjects.map((project) => project.id));
  const unsynced = localProjects.filter((project) => !remoteIds.has(project.id));
  const synced: SavedProjectRecord[] = [];

  for (const project of unsynced) {
    const saved = await upsertRemoteProject(supabase, project.id, {
      user_id: userId,
      idea: project.idea,
      title: project.title,
      deliverables: (project.deliverables ?? {}) as Record<string, string>,
      updated_at: project.updated_at,
    });
    if (saved) synced.push(saved);
  }

  return mergeProjects([...remoteProjects, ...synced], localProjects);
}

export async function loadUserProjects(
  supabase: SupabaseClient,
  userId: string,
  localProjects: SavedProjectRecord[],
  limit?: number
) {
  await supabase.auth.getSession();

  const remote = await fetchRemoteProjects(supabase, userId, limit);
  let projects = mergeProjects(remote.projects, localProjects);
  let warning: string | null = null;

  if (remote.tableMissing) {
    warning =
      localProjects.length > 0
        ? "Showing projects saved on this device. Run supabase/schema.sql in your Supabase project to sync across devices."
        : "Project storage is not set up yet. Run supabase/schema.sql in Supabase SQL Editor, then generate a new package.";
  } else if (remote.error && localProjects.length > 0) {
    warning = "Showing locally saved projects. Cloud sync is temporarily unavailable.";
  } else if (remote.error) {
    return {
      projects: [],
      warning: null,
      error: remote.error,
    };
  }

  if (!remote.tableMissing && !remote.error && localProjects.length > 0) {
    projects = await syncLocalProjectsToRemote(supabase, userId, localProjects, remote.projects);
    if (typeof limit === "number") {
      projects = projects.slice(0, limit);
    }
  }

  return { projects, warning, error: null as string | null };
}
