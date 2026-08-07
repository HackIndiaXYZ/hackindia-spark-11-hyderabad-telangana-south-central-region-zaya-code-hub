"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function SocialIcon({ name }: { name: "google" | "github" | "apple" }) {
  if (name === "google") return <span className="social-google">G</span>;
  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-2 1.03-2.71-.1-.25-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.03A9.5 9.5 0 0 1 12 6.8c.85 0 1.7.12 2.5.34 1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.66.65.71 1.03 1.61 1.03 2.71 0 3.85-2.34 4.69-4.57 4.94.36.31.68.9.68 1.8v2.67c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
        />
      </svg>
    );
  }
  return <span className="social-apple">●</span>;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 12s3.3-5.7 9.2-5.7 9.2 5.7 9.2 5.7-3.3 5.7-9.2 5.7S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="m4 20 16-16" />
    </svg>
  );
}

function WorkspaceIllustration() {
  return (
    <svg className="login-illustration" viewBox="0 0 600 520" role="img" aria-label="A founder surrounded by connected collaborators">
      <g fill="none" stroke="#A2D395" strokeLinecap="round" strokeWidth="3">
        <path d="M180 200c-32-75 52-115 83-56 31-80 129-64 111 8 57-39 96 46 39 83" />
        <path d="M184 205c-45-10-61 31-32 57" />
        <circle cx="260" cy="114" r="11" />
        <circle cx="365" cy="121" r="11" />
        <circle cx="434" cy="179" r="11" />
      </g>
      <circle cx="110" cy="183" r="45" fill="#D2E7CC" stroke="#101010" strokeWidth="2" />
      <circle cx="110" cy="169" r="14" fill="#fff" stroke="#101010" strokeWidth="2" />
      <path d="M82 218c8-32 49-32 56 0" fill="#101010" />
      <path d="M97 166c5-18 26-19 30 3l-9 5-13-2Z" fill="#101010" />
      <circle cx="510" cy="370" r="45" fill="#fff" stroke="#101010" strokeWidth="2" />
      <circle cx="510" cy="355" r="15" fill="#fff" stroke="#101010" />
      <path d="M483 405c8-34 49-34 57 0" fill="#101010" />
      <path d="M494 354c4-20 29-22 33 1l-8 7-16-2Z" fill="#101010" />
      <path d="M274 229c-37 7-64 46-55 102l19 69h129l18-69c10-56-19-95-55-102" fill="#A2D395" stroke="#101010" strokeWidth="3" />
      <circle cx="329" cy="202" r="46" fill="#fff" stroke="#101010" strokeWidth="3" />
      <path d="M286 200c2-57 83-67 88-2l-23-17-22 7-19-11Z" fill="#101010" />
      <path d="M303 204v11m49-11v11" stroke="#101010" strokeWidth="3" strokeLinecap="round" />
      <path d="M318 231c8 6 18 6 25 0" fill="none" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
      <path d="M307 280c11-20 35-20 46 0-11 24-35 24-46 0Z" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M253 281c-41 11-54 42-48 75m170-75c42 11 55 42 49 75" fill="none" stroke="#101010" strokeWidth="4" strokeLinecap="round" />
      <path d="M205 354c-14-15-24 10-9 24m238-24c14-15 24 10 9 24" fill="#fff" stroke="#101010" strokeWidth="3" />
      <path d="M246 391c10 55 40 73 84 74 45 0 74-19 91-74" fill="#fff" stroke="#101010" strokeWidth="3" />
      <path d="M265 411c30 17 62 17 93 0m-93 13c29 31 88 36 122 0" fill="none" stroke="#101010" strokeWidth="3" />
    </svg>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/build";
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/build";
  const [message, setMessage] = useState(
    searchParams.get("error") ? "We could not complete that sign-in. Please try again." : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }: { data: { user: import('@supabase/supabase-js').User | null } }) => {
        if (data.user) {
          router.replace(safeNext);
          router.refresh();
        }
      });
    } catch {
      /* Supabase not configured */
    }
  }, [router, safeNext]);

  async function ensureProfile() {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const fullName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      user.email?.split("@")[0] ||
      null;
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const supabase = getSupabaseBrowserClient();
      const credentials = {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      };

      const redirectToWorkspace = () => {
        router.replace(safeNext);
        router.refresh();
      };

      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          await ensureProfile();
          setMessage("Congratulations! You are successfully logged in.");
          window.setTimeout(redirectToWorkspace, 900);
          return;
        }
        setMessage("Account created. Check your inbox to confirm your email, then sign in.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      await ensureProfile();
      setMessage("Congratulations! You are successfully logged in.");
      window.setTimeout(redirectToWorkspace, 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWith(provider: "google" | "github") {
    setMessage("");
    setIsLoading(true);
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start social sign-in.");
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell login-shell-clean">
        <div className="login-form-panel">
          <Link href="/" className="login-mark login-mark-clean" aria-label="Back to Zing home">
            <i /> <span>Zing</span>
          </Link>
          <div className="login-form-wrap">
            <h1>{isRegistering ? "Create account" : "Welcome back!"}</h1>
            <p className="login-intro">
              {isRegistering
                ? "Create your private space for startup packages and projects."
                : "Build your startup package, one sharper decision at a time."}
            </p>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                autoComplete="email"
                required
              />
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon />
                </button>
              </div>
              <div className="login-options">
                <button type="button" className="forgot-button">
                  Forgot password?
                </button>
              </div>
              <button className="login-submit" type="submit" disabled={isLoading}>
                {isLoading
                  ? isRegistering
                    ? "Creating account…"
                    : "Logging in…"
                  : isRegistering
                    ? "Create account"
                    : "Login"}
              </button>
              {message && (
                <p className="login-message" role="status">
                  {message}
                </p>
              )}
            </form>
            <div className="social-section">
              <div className="social-divider">
                <span />
                or continue with
                <span />
              </div>
              <div className="social-row" aria-label="Sign in with a social account">
                {(["google", "github"] as const).map((name) => (
                  <button
                    className="social-button"
                    key={name}
                    type="button"
                    disabled={isLoading}
                    onClick={() => signInWith(name)}
                    aria-label={`Continue with ${name}`}
                  >
                    <SocialIcon name={name} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="login-footer">
            {isRegistering ? "Already a member? " : "New to Zing? "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering((value) => !value);
                setMessage("");
              }}
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
        <aside className="login-story-panel login-story-panel-clean">
          <WorkspaceIllustration />
          <article className="project-card">
            <strong>Zing Workspace</strong>
            <span>6 AI agents</span>
            <div className="project-progress">
              <i />
              <b>84%</b>
            </div>
            <em>In progress</em>
          </article>
          <div className="story-dots">
            <i />
            <i />
            <i />
          </div>
          <p className="story-caption">
            Make your next venture clearer
            <br />
            with <strong>Zing</strong>
          </p>
        </aside>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-page">
          <div className="loading-screen">Loading…</div>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
