# Supabase authentication and storage setup

The app uses Supabase for email/password sign-in, Google and GitHub OAuth, secure sessions, and the private `user-assets` Storage bucket.

## 1. Create the project and add environment variables

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy the project URL and publishable key.
3. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Restart `npm run dev` after changing environment variables.

## 2. Create the data and Storage policies

Open **SQL Editor** in Supabase, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. It creates the `profiles` and `projects` tables (required for saved startup packages) and the private `user-assets` bucket with user-scoped access policies.

## 3. Enable sign-in methods

In **Authentication → Providers**:

- Enable **Email** for email/password accounts. Create test users under **Authentication → Users**, or enable email sign-ups if you add a sign-up screen later.
- Enable **Google** and provide its OAuth client ID and secret from Google Cloud Console.
- Enable **GitHub** and provide its OAuth client ID and secret from GitHub Developer Settings.

For both Google and GitHub, set the provider callback URL to:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

Then add these URLs under **Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback
https://your-production-domain.com/auth/callback
```

The local port must match the one printed by `npm run dev`.

## 4. Test

1. Start the app with `npm run dev`.
2. Open `/login`.
3. Use a Supabase email/password user, or select Google/GitHub.
4. A successful login returns through `/auth/callback` and opens `/build`.

Never expose a Supabase `service_role` key in `.env.local` values prefixed with `NEXT_PUBLIC_`.
