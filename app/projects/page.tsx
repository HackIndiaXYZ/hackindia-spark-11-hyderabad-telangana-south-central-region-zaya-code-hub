"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { loadUserProjects } from "@/lib/project-sync";
import {
  deleteLocalProject,
  loadLocalProjects,
  normalizeProject,
  projectErrorMessage,
  saveLocalProjects,
  type SavedProjectRecord,
} from "@/lib/projects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function projectTitle(project: SavedProjectRecord) {
  if (project.title?.trim()) return project.title.trim();
  const idea = project.idea.trim();
  if (idea.length <= 72) return idea;
  return `${idea.slice(0, 72).trim()}…`;
}

function deliverableCount(project: SavedProjectRecord) {
  if (!project.deliverables || typeof project.deliverables !== "object") return 0;
  return Object.values(project.deliverables).filter((value) => typeof value === "string" && value.trim()).length;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      let activeUserId: string | null = null;
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login?next=/projects");
          return;
        }
        activeUserId = user.id;
        setUserId(user.id);
        setEmail(user.email ?? null);

        const localProjects = loadLocalProjects(user.id);
        const result = await loadUserProjects(supabase, user.id, localProjects);

        if (result.error && !result.projects.length) {
          setError(projectErrorMessage(result.error, "Could not load projects."));
        } else {
          setProjects(result.projects);
          saveLocalProjects(user.id, result.projects);
          if (result.warning) setWarning(result.warning);
        }
      } catch (loadError) {
        const localOnly = activeUserId ? loadLocalProjects(activeUserId) : [];
        if (localOnly.length) {
          setProjects(localOnly);
          setWarning("Showing locally saved projects. Cloud sync is temporarily unavailable.");
        } else {
          setError(projectErrorMessage(loadError, "Could not load projects."));
        }
      } finally {
        setLoading(false);
      }
    }
    void loadProjects();
  }, [router]);

  async function handleDelete(projectId: string) {
    if (!window.confirm("Delete this project permanently?")) return;
    setDeletingId(projectId);
    try {
      const supabase = getSupabaseBrowserClient();
      const hadLocalCopy = Boolean(userId && loadLocalProjects(userId).some((project) => project.id === projectId));
      const query = supabase.from("projects").delete().eq("id", projectId);
      const { error: deleteError } = userId ? await query.eq("user_id", userId) : await query;
      if (deleteError && !hadLocalCopy) throw deleteError;
      if (userId) deleteLocalProject(userId, projectId);
      setProjects((current) => current.filter((project) => project.id !== projectId));
    } catch (deleteError) {
      setError(projectErrorMessage(deleteError, "Could not delete project."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navbar variant="build" />
      <main className="projects-page">
        <div className="container">
          <div className="projects-hero">
            <div>
              <p className="eyebrow">Your account</p>
              <h1>Saved projects</h1>
              <p className="projects-lede">
                Every startup package generated while you are signed in is stored privately here.
                {email ? (
                  <>
                    {" "}
                    Signed in as <strong>{email}</strong>.
                  </>
                ) : null}
              </p>
            </div>
            <div className="projects-hero-actions">
              <div className="projects-stat-card">
                <span>Projects</span>
                <strong>{loading ? "—" : projects.length}</strong>
              </div>
              <Link href="/build" className="btn btn-primary">
                New package
              </Link>
            </div>
          </div>

          {loading ? (
            <p className="projects-state">Loading your projects…</p>
          ) : (
            <>
              {warning ? <p className="projects-state">{warning}</p> : null}
              {error ? <p className="projects-state projects-error">{error}</p> : null}
              {projects.length ? (
                <div className="projects-grid">
                  {projects.map((project, index) => {
                    const count = deliverableCount(project);
                    return (
                      <article className="project-tile" key={project.id}>
                        <div className="project-tile-top">
                          <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        <strong>{projectTitle(project)}</strong>
                        <p className="project-snippet">{project.idea}</p>
                        <div className="project-tile-meta">
                          <em>{count}/6 deliverables</em>
                          <div className="project-tile-actions">
                            <Link href={`/build?project=${project.id}`} className="btn btn-primary btn-sm">
                              Open
                            </Link>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={deletingId === project.id}
                              onClick={() => handleDelete(project.id)}
                            >
                              {deletingId === project.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : !error ? (
                <div className="projects-empty">
                  <div className="projects-empty-orb" aria-hidden>
                    ✦
                  </div>
                  <h2>Your first project is waiting.</h2>
                  <p>Generate a startup package and it will be saved privately to this account.</p>
                  <Link href="/build" className="btn btn-primary">
                    Open workspace
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  );
}
