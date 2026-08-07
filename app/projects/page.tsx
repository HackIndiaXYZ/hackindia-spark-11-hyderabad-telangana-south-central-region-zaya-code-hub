"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  idea: string;
  title: string | null;
  created_at: string;
  updated_at?: string;
  deliverables?: Record<string, string> | null;
};

function projectTitle(project: Project) {
  if (project.title?.trim()) return project.title.trim();
  const idea = project.idea.trim();
  if (idea.length <= 72) return idea;
  return `${idea.slice(0, 72).trim()}…`;
}

function deliverableCount(project: Project) {
  if (!project.deliverables || typeof project.deliverables !== "object") return 0;
  return Object.values(project.deliverables).filter((value) => typeof value === "string" && value.trim()).length;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login?next=/projects");
          return;
        }
        setEmail(user.email ?? null);

        const { data, error: queryError } = await supabase
          .from("projects")
          .select("id, idea, title, created_at, updated_at, deliverables")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        setProjects(data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load projects.");
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
      const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);
      if (deleteError) throw deleteError;
      setProjects((current) => current.filter((project) => project.id !== projectId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete project.");
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
          ) : error ? (
            <p className="projects-state projects-error">{error}</p>
          ) : projects.length ? (
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
                      <em>
                        {count}/6 deliverables
                      </em>
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
          ) : (
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
          )}
        </div>
      </main>
    </>
  );
}
