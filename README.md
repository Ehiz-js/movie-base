# Movie Base

A movie browser built on [TMDB](https://www.themoviedb.org/) and
[Supabase](https://supabase.com/), with Next.js 16 (App Router), React 19,
TypeScript and Tailwind 4.

This folder is the **merged app** — the ten feature branches in `task-1` …
`task-10`, each of which added one feature to the barebones `movie-base`,
combined into a single working site. See [`MERGE-NOTES.md`](./MERGE-NOTES.md)
for what came from where and what changed in the process.

## Features

| Feature | From |
|---|---|
| Debounced movie search in the navbar | task 1 |
| Filter the home grid by genre | task 2 |
| Sort by title, popularity, release date or rating | task 3 |
| Paginated home grid (up to 10 pages) | task 4 |
| Watchlist saved to Supabase, with a `/movielist` page | task 5 |
| Suggested-movies carousel on the movie page | task 6 |
| Comment thread per movie | task 7 |
| Recently-viewed strip (last 4, past 24h) | task 8 |
| Onboarding profile at `/onboarding` | task 9 |
| Confirmation email when adding to the watchlist | task 10 |

Plus email/password auth (Supabase) and a 404 page, from the base app.

## Getting started

**1. Install**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env.local
```

Then fill in all five values — see the comments in `.env.example` for where
each one comes from. The app will build without them but every TMDB request
returns 500 and Supabase calls throw.

**3. Create the database tables**

Open your Supabase project → SQL Editor → New query, paste the contents of
[`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the
four tables the app needs (`watchlist`, `recent_movies`, `comments`,
`profiles`) with row level security enabled.

RLS is not optional here: the browser talks to Supabase with the anon key, so
without the policies in that file, anyone could read and write every row.

**4. Run**

```bash
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`.

## Project layout

```
app/
  page.tsx                 Home: recently viewed + genre/sort/paginated grid
  movie/[id]/page.tsx      Movie detail + suggested carousel + comments
  movielist/page.tsx       The signed-in user's watchlist
  onboarding/page.tsx      Profile setup
  auth/login, auth/signup  Supabase email/password auth
  not-found.tsx            404
  api/movies/*             TMDB proxy routes (server-side, key never exposed)
  api/send_email           Watchlist confirmation email (auth required)
components/                UI; components/ui/* are shadcn primitives
contexts/AuthContext.tsx   Session + profile state
hooks/useDebounce.ts       Used by the search box
lib/
  tmdbServer.ts            Server-only TMDB fetch helper
  tmdb.ts                  Client-side sorting
  supabase.ts              Browser Supabase client
  supabaseServer.ts        Route-handler client + bearer-token verification
  sendEmail.ts             Nodemailer watchlist email
types/movie.ts             Shared types
supabase/schema.sql        Database schema + RLS policies
```

## Notes

- TMDB posters render with plain `<img>` rather than `next/image`. Switching
  would need `images.remotePatterns` configured for `image.tmdb.org` and
  explicit dimensions on each usage; it is a worthwhile follow-up, not a
  blocker.
- `/api/movies/popular` and `/api/movies/[id]` are still served for API
  parity with the original task branches, but the pages no longer call them
  over HTTP — server components go through `lib/tmdbServer.ts` directly.
