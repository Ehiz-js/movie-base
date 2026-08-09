-- Movie Base — database schema
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It creates the four tables the app needs (watchlist, recent_movies,
-- comments, profiles) with row level security enabled.
--
-- Safe to run on a clean project OR on one that already has these tables from
-- working through tasks 5-9: it reshapes whatever is there to what the app
-- expects, preserves existing rows, and can be run more than once.
--
-- RLS is not optional here. The browser talks to Supabase with the anon key,
-- so without these policies that key would let anyone read and write every row.

begin;

-- ---------------------------------------------------------------------------
-- 1. Tables and columns
-- ---------------------------------------------------------------------------

create table if not exists public.watchlist (
  id_supabase uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade
);

create table if not exists public.recent_movies (
  id_supabase uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade
);

do $$
declare
  t text;
begin
  foreach t in array array['watchlist', 'recent_movies'] loop
    -- Task 5 stored the TMDB id in a column called `id`. The merged app calls
    -- it `movie_id` everywhere, so rename it rather than lose the data.
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'movie_id'
    ) then
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name = 'id'
          and data_type in ('bigint', 'integer', 'smallint', 'numeric')
      ) then
        execute format('alter table public.%I rename column id to movie_id', t);
      else
        execute format('alter table public.%I add column movie_id bigint', t);
      end if;
    end if;

    execute format('alter table public.%I add column if not exists id_supabase uuid default gen_random_uuid()', t);
    execute format('alter table public.%I add column if not exists user_id uuid', t);
    execute format('alter table public.%I add column if not exists title text', t);
    execute format('alter table public.%I add column if not exists poster_path text', t);
    execute format('alter table public.%I add column if not exists vote_average numeric', t);
    execute format('update public.%I set id_supabase = gen_random_uuid() where id_supabase is null', t);
  end loop;
end $$;

alter table public.watchlist     add column if not exists created_at timestamptz not null default now();
alter table public.recent_movies add column if not exists viewed_at  timestamptz not null default now();

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  movie_id   bigint not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  username   text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  username          text not null,
  selected_genres   jsonb not null default '[]'::jsonb,
  mature            boolean not null default false,
  selected_language text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Unique constraints
--
-- recent_movies REQUIRES this: MovieCard upserts with
-- onConflict "user_id,movie_id", and Postgres rejects ON CONFLICT without a
-- matching constraint. On watchlist the same pair is what produces the
-- duplicate-key error the "already added to watchlist" message relies on.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['watchlist', 'recent_movies'] loop
    -- Drop duplicates first, keeping one row per (user, movie), or the
    -- constraint cannot be created.
    execute format($f$
      delete from public.%I a using public.%I b
      where a.id_supabase < b.id_supabase
        and a.user_id = b.user_id and a.movie_id = b.movie_id
    $f$, t, t);

    if not exists (
      select 1 from pg_constraint
      where conrelid = format('public.%I', t)::regclass
        and contype = 'u'
        and conkey @> array[
          (select attnum from pg_attribute where attrelid = format('public.%I', t)::regclass and attname = 'user_id'),
          (select attnum from pg_attribute where attrelid = format('public.%I', t)::regclass and attname = 'movie_id')
        ]
    ) then
      execute format('alter table public.%I add constraint %I unique (user_id, movie_id)', t, t || '_user_movie_key');
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Row level security
--
-- Every existing policy on these tables is dropped first, so the end state is
-- known regardless of what tasks 5-9 left behind. This is also what the
-- original script tripped over: `create policy` fails outright on a duplicate
-- name, and one failure rolls back the whole run.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('watchlist', 'recent_movies', 'comments', 'profiles')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.watchlist     enable row level security;
alter table public.recent_movies enable row level security;
alter table public.comments      enable row level security;
alter table public.profiles      enable row level security;

create policy "watchlist: read own"   on public.watchlist for select using (auth.uid() = user_id);
create policy "watchlist: insert own" on public.watchlist for insert with check (auth.uid() = user_id);
create policy "watchlist: delete own" on public.watchlist for delete using (auth.uid() = user_id);

create policy "recent_movies: read own"   on public.recent_movies for select using (auth.uid() = user_id);
create policy "recent_movies: insert own" on public.recent_movies for insert with check (auth.uid() = user_id);
-- Required for the upsert: without an UPDATE policy, re-viewing a movie fails
-- with "new row violates row-level security policy (USING expression)".
create policy "recent_movies: update own" on public.recent_movies for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments: read all"   on public.comments for select using (true);
create policy "comments: insert own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own" on public.comments for delete using (auth.uid() = user_id);

create policy "profiles: read own"   on public.profiles for select using (auth.uid() = user_id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles: update own" on public.profiles for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Indexes and grants
-- ---------------------------------------------------------------------------

create index if not exists recent_movies_user_viewed_idx on public.recent_movies (user_id, viewed_at desc);
create index if not exists comments_movie_created_idx    on public.comments (movie_id, created_at desc);

grant select, insert, update, delete
  on public.watchlist, public.recent_movies, public.comments, public.profiles
  to authenticated;
grant select on public.comments to anon;

commit;
