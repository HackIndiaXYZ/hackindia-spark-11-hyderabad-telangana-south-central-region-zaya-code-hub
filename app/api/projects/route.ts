import { NextResponse } from "next/server";
import {
  fetchRemoteProjects,
  loadUserProjects,
  normalizeDeliverables,
  upsertRemoteProject,
} from "@/lib/project-sync";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const remote = await fetchRemoteProjects(supabase, user.id);
    return NextResponse.json({
      projects: remote.projects,
      tableMissing: remote.tableMissing,
      error: remote.error,
      userId: user.id,
      email: user.email ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load projects.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string | null;
      idea?: string;
      title?: string | null;
      deliverables?: Record<string, string>;
    };

    if (!body.idea?.trim()) {
      return NextResponse.json({ error: "Project idea is required." }, { status: 400 });
    }

    const saved = await upsertRemoteProject(supabase, body.id ?? null, {
      user_id: user.id,
      idea: body.idea.trim(),
      title: body.title ?? null,
      deliverables: normalizeDeliverables(body.deliverables) ?? {},
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Could not save project. Run supabase/schema.sql in Supabase SQL Editor." },
        { status: 503 }
      );
    }

    return NextResponse.json({ project: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save project.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
