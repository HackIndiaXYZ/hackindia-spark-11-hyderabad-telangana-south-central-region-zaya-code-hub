import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/build";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/build";
  const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.redirect(new URL("/login?error=supabase-not-configured", requestUrl.origin));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          items.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const fullName =
        (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name) ||
        (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name) ||
        data.user.email?.split("@")[0] ||
        null;

      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });

      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=authentication-failed", requestUrl.origin));
}
