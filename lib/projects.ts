export type SavedProjectRecord = {
  id: string;
  user_id?: string;
  idea: string;
  title: string | null;
  created_at: string;
  updated_at?: string;
  deliverables?: Record<string, string> | null;
};

type ProjectLike = Partial<SavedProjectRecord> & {
  [key: string]: unknown;
};

type ProjectDraft = {
  id?: string | null;
  user_id: string;
  idea: string;
  title: string | null;
  deliverables: Record<string, string>;
};

const STORAGE_PREFIX = "zing_saved_projects:";

export function projectErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function normalizeProject(project: ProjectLike): SavedProjectRecord {
  const createdAt = typeof project.created_at === "string" ? project.created_at : new Date().toISOString();
  return {
    ...project,
    id: typeof project.id === "string" ? project.id : crypto.randomUUID(),
    user_id: typeof project.user_id === "string" ? project.user_id : undefined,
    idea: typeof project.idea === "string" ? project.idea : "",
    title: typeof project.title === "string" ? project.title : null,
    created_at: createdAt,
    updated_at: typeof project.updated_at === "string" ? project.updated_at : createdAt,
    deliverables:
      project.deliverables && typeof project.deliverables === "object"
        ? project.deliverables
        : null,
  };
}

export function loadLocalProjects(userId: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProject);
  } catch {
    return [];
  }
}

export function mergeProjects(primary: SavedProjectRecord[], fallback: SavedProjectRecord[]) {
  const merged = new Map<string, SavedProjectRecord>();
  fallback.forEach((project) => merged.set(project.id, normalizeProject(project)));
  primary.forEach((project) => merged.set(project.id, normalizeProject(project)));
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function storeLocalProject(project: SavedProjectRecord) {
  if (typeof window === "undefined" || !project.user_id) return;
  const current = loadLocalProjects(project.user_id);
  const next = [normalizeProject(project), ...current.filter((item) => item.id !== project.id)]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  localStorage.setItem(`${STORAGE_PREFIX}${project.user_id}`, JSON.stringify(next));
}

export function saveLocalProjects(userId: string, projects: SavedProjectRecord[]) {
  if (typeof window === "undefined") return;
  const next = projects
    .map((project) => normalizeProject({ ...project, user_id: userId }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(next));
}

export function deleteLocalProject(userId: string, projectId: string) {
  if (typeof window === "undefined") return;
  const next = loadLocalProjects(userId).filter((project) => project.id !== projectId);
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(next));
}

export function createLocalProject(draft: ProjectDraft): SavedProjectRecord {
  const timestamp = new Date().toISOString();
  return {
    id: draft.id || crypto.randomUUID(),
    user_id: draft.user_id,
    idea: draft.idea,
    title: draft.title,
    deliverables: draft.deliverables,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
