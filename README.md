<div align="center">

<img src="public/assets/logo.png" alt="Movie Base" width="72" />

# Movie Base

**A film, series and anime discovery app — browse, watch trailers, stream, track a watchlist, and talk about it.**

[**Live site →**](https://ehiz-movies.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TMDB](https://img.shields.io/badge/Data-TMDB-01B4E4?logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org)
[![AniList](https://img.shields.io/badge/Anime-AniList-02A9FF)](https://anilist.co)

</div>

---

## What it does

Films and series from [TMDB](https://www.themoviedb.org/), anime from [AniList](https://anilist.co/) — three different kinds of thing, kept in their own lane end to end rather than forced into one shape.

**Discover** — a rotating hero of the week's biggest films, then rows for Popular Series, Popular Movies, Popular Anime, and seven genres. Every row opens into a paginated grid of its own.

**Search** — one debounced box searching films, series *and* anime together, five results in the dropdown and the rest on a full results page.

**Films & series** — trailer, synopsis, genres, rating. Series add a season switcher and an episode grid: pick a season, pick an episode, see its still, air date, runtime, rating and synopsis. Playback offers four servers to fall back on if one is down.

**Anime** — synopsis, genres, score, and a season/part switcher (AniList gives every season of a show its own id, so "Attack on Titan" and "Attack on Titan Season 2" are linked, not merged). Long-running shows — One Piece, Naruto — get an accurate episode count even mid-run, and a "Newest first" toggle so catching up doesn't mean paging through a thousand episodes from the start. Playback supports Sub/Dub.

**Yours** — a watchlist with a confirmation email, a comment thread per title, and a recently-viewed strip that remembers the last day of browsing — anime included.

## Features

|  | |
|---|---|
| 🎬 **Films, series & anime** | Three independent data pipelines, one consistent UI |
| 🎞️ **Genre rows** | Seven curated rows blending films and series, plus a dedicated Popular Anime row |
| 📺 **Season & episode browser** | Season pills and an episode grid for series; a season/part switcher and a flat, paginated episode grid for anime |
| ▶️ **Trailers** | Loaded only when pressed, for films/series and anime alike |
| 🌀 **Multi-server playback** | Four fallback servers for films/series; a dedicated Sub/Dub player for anime |
| ⏪ **Newest-first episodes** | One click to jump to the latest episode of a 1000+ episode show, instead of paging through from #1 |
| 🔍 **Search** | Debounced, blends TMDB and AniList results, dropdown preview + results page |
| ⭐ **Watchlist** | Saved per user, with an email confirmation |
| 💬 **Comments** | Per title, with delete and relative timestamps |
| 🕘 **Recently viewed** | Last 24 hours, collapsed into a carousel by default |
| 🔐 **Auth** | Email/password, password reset, profile with a display name |
| 📱 **Responsive nav** | Collapses to a single row behind a hamburger menu on mobile |
| 🌗 **Themed** | Dark-first, driven by CSS custom properties |

## Built with

| Layer | |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Embla, react-icons |
| Film & series data | TMDB API |
| Anime data | AniList GraphQL API |
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

Anime data needs nothing configured — AniList's GraphQL API is public, no key or registration required.

**3 — Create the database**

Paste [`supabase/schema.sql`](supabase/schema.sql) into the Supabase SQL editor and run it. It creates four tables — `watchlist`, `recent_movies`, `comments`, `profiles` — with row level security enabled, and is safe to re-run. `media_type` on each accepts `'movie'`, `'tv'` or `'anime'`.

> RLS is not optional here. The browser talks to Supabase with the anon key, so without those policies that key would let anyone read and write every row.

**4 — Run**

```bash
npm run dev     # http://localhost:3000
```

`npm run build` · `npm start` · `npm run lint`

## Under the hood

A few decisions worth knowing about if you're reading the source.

<details>
<summary><b>One shape for two different TMDB APIs</b></summary>

<br>

TMDB describes series with different field names than films — `name` for `title`, `first_air_date` for `release_date`, `original_name` for `original_title`. Rather than teach every component about both, `lib/titles.ts` normalises at the API boundary, so a component only ever sees one shape.

Every title also carries a `media_type`, because **a film and a series can share the same numeric id** — `550` is both *Fight Club* and an unrelated show. The pair is what identifies a title, which is why database rows and URLs both include it.

</details>

<details>
<summary><b>Why anime is a completely separate pipeline</b></summary>

<br>

Anime was originally folded into the TMDB pipeline (filtered by Animation genre + Japanese origin) and played through TMDB's own tv/movie id. That broke in a specific way: TMDB splits long-running shows into many "seasons" by story arc — One Piece has 23 of them — while streaming embeds keyed off MyAnimeList/AniList ids number episodes *continuously* across the whole run. Season 5, episode 1 on TMDB might really be episode 90 of the actual show, so the player would load the wrong episode.

`lib/anilist.ts` now sources anime from [AniList's GraphQL API](https://docs.anilist.co/guide/introduction) end to end — its own id space, its own search, its own detail route (`app/anime/[id]`) — so the episode number the player receives is always the real one, no translation involved. `lib/titles.ts` also filters anime *out* of every TMDB list (popular, genre rows, search, suggestions), so a title never has two different detail pages depending on where you clicked it from.

AniList was chosen over two alternatives tried first:
- **Jikan** (unofficial, scraped MAL) — works, but is rate-limited and occasionally returns transient 504s.
- **The official MyAnimeList API** — needs an app registration, and critically has *no* per-episode endpoint and reports `0` episodes for anything still airing (One Piece included). AniList's `nextAiringEpisode` field gives an always-accurate episode count for ongoing shows with no guessing, plus a `relations` field that backs the season/part switcher (MAL/AniList both give each season of a show its own id rather than one umbrella entry).

</details>

<details>
<summary><b>Playback</b></summary>

<br>

Films and series get four fallback embeds (VidLink, two VidSrc mirrors, SuperEmbed) so one server being down doesn't take playback with it — all keyed by TMDB id.

Anime plays through [AniXo](https://anixo.buzz/), keyed by AniList id, with a Sub/Dub toggle. It's the one embed provider found that also exposes a documented `postMessage` API for player control; its `embed-sdk.js` is required for the iframe to unlock at all (it answers a same-origin sandbox check, nothing more — worth reading before trusting a third-party script).

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

Pages are Server Components, so the browser never fetches the grid after load. A film/series page pulls its details and trailer in a **single** TMDB request via `append_to_response`. Series load only their opening season with the page — a nine-season run would otherwise be dozens of requests for episodes nobody opened — and the rest arrive on demand, same as an anime's episode pages. Every route that fetches on navigation has its own `loading.tsx`, so clicking into a title shows a spinner immediately instead of appearing frozen.

</details>

## Project structure

```
app/
├─ page.tsx                      Home — hero + genre rows
├─ browse/[slug]/                A row's full grid, paginated
├─ title/[type]/[id]/            Film or series detail
├─ anime/[id]/                   Anime detail (AniList-backed)
├─ search/                       Full search results
├─ movielist/                    The signed-in user's watchlist
├─ onboarding/                   Profile
├─ auth/                         Login, signup, password reset
└─ api/                          TMDB/AniList proxies + watchlist email

components/                      UI (components/ui/* are shadcn primitives)
├─ TrailerPlayer.tsx             Film/series player — 4 fallback servers
├─ AnimePlayer.tsx               Anime player — AniXo, Sub/Dub
├─ SeasonBrowser.tsx             Series season/episode picker
└─ AnimeEpisodeBrowser.tsx       Anime episode picker — paginated, reversible

contexts/AuthContext.tsx         Session and profile
lib/
├─ titles.ts                     TMDB normalisation and fetching
├─ anilist.ts                    AniList GraphQL fetching
├─ genres.ts                     Genre equivalence map
├─ tmdbServer.ts                 Server-only TMDB client
├─ supabase.ts                   Browser Supabase client
├─ supabaseServer.ts             Route-handler client + token verification
├─ sendEmail.ts                  Resend / SMTP
└─ rateLimit.ts                  Per-user limiter
supabase/schema.sql              Tables, constraints and RLS policies
```

## Roadmap

- [ ] Suggested titles on the anime detail page (film/series pages already have this)
- [ ] Cast and crew on title pages
- [ ] Watchlist sorting and filtering
- [ ] Filters on the browse pages

## Credits

Film and series data from [The Movie Database](https://www.themoviedb.org/). Anime data from [AniList](https://anilist.co/).

<sub>This product uses the TMDB API but is not endorsed or certified by TMDB. Anime data is provided by AniList; this product is not endorsed or certified by AniList.</sub>

---

<div align="center">

Built by [**Ehiz**](https://github.com/Ehiz-js)

</div>
