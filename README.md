<div align="center">

<img src="public/assets/logo.png" alt="Movie Base" width="72" />

# Movie Base

**A film and series discovery app — browse by genre, watch trailers, track a watchlist, and talk about it.**

[**Live site →**](https://ehiz-movies.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TMDB](https://img.shields.io/badge/Data-TMDB-01B4E4?logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org)

</div>

---

## What it does

Films and series, side by side, from [TMDB](https://www.themoviedb.org/).

**Discover** — a rotating hero of the week's biggest films, then rows for Popular Series, Popular Movies and seven genres. Every row opens into a paginated grid of its own.

**Search** — one debounced box searching films *and* series together, five results in the dropdown and the rest on a full results page.

**Every title** — trailer, synopsis, genres, rating, and where it's legally streaming, renting or selling. Series add a season switcher and an episode grid: pick a season, pick an episode, see its still, air date, runtime, rating and synopsis.

**Yours** — a watchlist with a confirmation email, a comment thread per title, and a recently-viewed strip that remembers the last day of browsing.

## Features

|  | |
|---|---|
| 🎬 **Films and series together** | One normalised shape across two very different TMDB APIs |
| 🎞️ **Genre rows** | Seven curated rows, each blending films and series |
| 📺 **Season & episode browser** | Season pills, episode grid, full episode detail |
| ▶️ **Trailers** | Official trailer per title, loaded only when pressed |
| 🍿 **Where to watch** | Stream / rent / buy providers, via JustWatch |
| 🔍 **Search** | Debounced, multi-search, dropdown preview + results page |
| ⭐ **Watchlist** | Saved per user, with an email confirmation |
| 💬 **Comments** | Per title, with delete and relative timestamps |
| 🕘 **Recently viewed** | Last 24 hours, collapsed by default |
| 🔐 **Auth** | Email/password, password reset, profile with a display name |
| 🌗 **Themed** | Dark-first, driven by CSS custom properties |

## Built with

| Layer | |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Embla, react-icons |
| Data | TMDB API |
| Auth & database | Supabase (Postgres + row level security) |
| Email | Resend, with SMTP fallback |
| Hosting | Vercel |

## Getting started

**1 — Install**

```bash
git clone https://github.com/Ehiz-js/movie-base.git
cd movie-base
npm install
```

**2 — Configure**

```bash
cp .env.example .env.local
```

| Variable | Required | What it's for |
|---|---|---|
| `TMDB_API_KEY` | ✅ | All film and series data. [Get one free](https://www.themoviedb.org/settings/api). Deliberately **not** `NEXT_PUBLIC_` — it must stay server-side |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | Supabase anon key — safe to expose *only* because RLS is on |
| `RESEND_API_KEY` | — | Watchlist emails over HTTPS. Without it, SMTP is used |
| `EMAIL_USER` / `EMAIL_PASS` | — | SMTP fallback. Gmail needs an app password |
| `EMAIL_HOST` / `EMAIL_PORT` | — | Defaults to `smtp.gmail.com:465`. Try `587` if your network blocks 465 |

**3 — Create the database**

Paste [`supabase/schema.sql`](supabase/schema.sql) into the Supabase SQL editor and run it. It creates four tables — `watchlist`, `recent_movies`, `comments`, `profiles` — with row level security enabled, and is safe to re-run.

> RLS is not optional here. The browser talks to Supabase with the anon key, so without those policies that key would let anyone read and write every row.

**4 — Run**

```bash
npm run dev     # http://localhost:3000
```

`npm run build` · `npm start` · `npm run lint`

## Under the hood

A few decisions worth knowing about if you're reading the source.

<details>
<summary><b>One shape for two different APIs</b></summary>

<br>

TMDB describes series with different field names than films — `name` for `title`, `first_air_date` for `release_date`, `original_name` for `original_title`. Rather than teach every component about both, `lib/titles.ts` normalises at the API boundary, so a component only ever sees one shape.

Every title also carries a `media_type`, because **a film and a series can share the same numeric id** — `550` is both *Fight Club* and an unrelated show. The pair is what identifies a title, which is why database rows and URLs both include it.

</details>

<details>
<summary><b>Genre equivalence</b></summary>

<br>

TMDB keeps separate genre lists for films and series, and they disagree. Series collapse Action and Adventure into one genre, and Science Fiction and Fantasy into another, under different ids.

`lib/genres.ts` maps one visible genre onto the ids each side needs, so picking **Sci-Fi & Fantasy** returns science-fiction films, fantasy films *and* sci-fi series. Genres with no counterpart — Horror has no series equivalent — simply return one side.

</details>

<details>
<summary><b>AND, not OR</b></summary>

<br>

TMDB reads a comma in `with_genres` as AND and a pipe as OR. Suggestions use AND deliberately: a title matching *every* genre of the one you're viewing is genuinely related, whereas OR degrades into "anything popular in any of these genres" and returns the same blockbusters no matter what you opened.

</details>

<details>
<summary><b>Fetching</b></summary>

<br>

Pages are Server Components, so the browser never fetches the grid after load. A title page pulls its details, trailer and providers in a **single** TMDB request via `append_to_response`. Series load only their opening season with the page — a nine-season run would otherwise be dozens of requests for episodes nobody opened — and the rest arrive on demand.

</details>

## Project structure

```
app/
├─ page.tsx                      Home — hero + genre rows
├─ browse/[slug]/                A row's full grid, paginated
├─ title/[type]/[id]/            Film or series detail
├─ search/                       Full search results
├─ movielist/                    The signed-in user's watchlist
├─ onboarding/                   Profile
├─ auth/                         Login, signup, password reset
└─ api/                          TMDB proxy + watchlist email

components/                      UI (components/ui/* are shadcn primitives)
contexts/AuthContext.tsx         Session and profile
lib/
├─ titles.ts                     TMDB normalisation and fetching
├─ genres.ts                     Genre equivalence map
├─ tmdbServer.ts                 Server-only TMDB client
├─ supabase.ts                   Browser Supabase client
├─ supabaseServer.ts             Route-handler client + token verification
├─ sendEmail.ts                  Resend / SMTP
└─ rateLimit.ts                  Per-user limiter
supabase/schema.sql              Tables, constraints and RLS policies
```

## Roadmap

- [ ] `next/image` for posters, to cut layout shift
- [ ] Filters on the browse pages
- [ ] Cast and crew on title pages
- [ ] Watchlist sorting and filtering

## Credits

Film and series data from [The Movie Database](https://www.themoviedb.org/). Streaming availability from [JustWatch](https://www.justwatch.com/).

<sub>This product uses the TMDB API but is not endorsed or certified by TMDB.</sub>

---

<div align="center">

Built by [**Ehiz**](https://github.com/Ehiz-js)

</div>
