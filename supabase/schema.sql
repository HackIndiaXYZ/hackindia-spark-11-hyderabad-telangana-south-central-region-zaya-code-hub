-- Run this once in Supabase SQL Editor before using profile storage.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles for select using ((select auth.uid()) = id);
create policy "Users can create their own profile"
  on public.profiles for insert with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update using ((select auth.uid()) = id);;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea text not null,
  title text,
  deliverables jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Users can manage their own projects" on public.projects;
create policy "Users can manage their own projects"
  on public.projects for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('user-assets', 'user-assets', false)
on conflict (id) do nothing;

drop policy if exists "Users can manage their own assets" on storage.objects;
create policy "Users can manage their own assets"
  on storage.objects for all
  using (bucket_id = 'user-assets' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'user-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));
