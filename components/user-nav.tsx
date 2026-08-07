"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthUser = {
  email: string;
  name: string;
  initial: string;
};

function deriveUser(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!user?.email) return null;
  const metaName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  const name = metaName || user.email.split("@")[0];
  return {
    email: user.email,
    name,
    initial: name.charAt(0).toUpperCase(),
  };
}

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        setUser(deriveUser(data.user));
        setReady(true);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(deriveUser(session?.user ?? null));
        setReady(true);
      });
      return () => listener.subscription.unsubscribe();
    } catch {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleSignOut() {
    setOpen(false);
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  if (!ready) {
    return <span className="account-skeleton" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className="btn btn-secondary btn-sm account-signin">
        Sign in
      </Link>
    );
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account-avatar" aria-hidden>
          {user.initial}
        </span>
        <span className="account-meta">
          <strong>{user.name}</strong>
          <em>Account</em>
        </span>
        <span className="account-caret" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-dropdown-head">
            <span className="account-avatar lg" aria-hidden>
              {user.initial}
            </span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="account-dropdown-links">
            <Link href="/projects" role="menuitem" onClick={() => setOpen(false)}>
              My projects
            </Link>
            <Link href="/build" role="menuitem" onClick={() => setOpen(false)}>
              Workspace
            </Link>
          </div>
          <button type="button" className="account-signout" role="menuitem" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
