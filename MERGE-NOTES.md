# Merge notes

How `movie-base-full` was assembled from `movie-base` + `task-1` … `task-10`.

Each task branch was an **independent fork** of `movie-base`, not a cumulative
chain — task 2 did not contain task 1's search, and so on. So this was a
fan-in: eleven copies of the same site collapsed into one. Files that only one
task touched were copied across. Files that several tasks each rewrote had to
be reconciled by hand; those are listed below, with every behavioural change
called out.

---

## 1. Files multiple tasks rewrote

### `app/page.tsx` — tasks 2, 3, 4, 8

Four independent rewrites of the home page. Combined into one state model:

- `genreId` and `pageNum` drive a **single** fetch effect. With no genre it
  calls `/api/movies/movie_page?page=N`; with a genre,
  `/api/movies/filtered_movie_list?genreId=X&page=N`. Selecting a genre resets
  the page to 1.
- **Sorting is now derived, not stored.** Task 3 wrote the sorted array back
  into `movies` state, which permanently destroyed the order the API returned
  — you could never get back to unsorted, and each new sort operated on the
  previously sorted list. It is now a `useMemo` over the fetched list.
- Recently-viewed (task 8) sits above the grid, unchanged in behaviour.
- The grid renders exactly one of: spinner, error, empty-state, or results.

**Changed:** `/api/movies/filtered_movie_list` gained an optional `page`
parameter (defaults to `1`). Without it, filtering and pagination could not
compose — selecting a genre would silently ignore the page number.

**Changed:** pagination is capped at 10 pages, matching the original README's
"pagination, up to 10 pages". Task 4's next arrow was unbounded.

**Fixed:** task 4 called `setIsLoading(false)` *outside* its async function, so
it ran immediately on every render pass and the spinner never actually
appeared. It is now in a `finally` block.

**Fixed:** the list key was `movie.title` in every variant; duplicate titles
are common in TMDB results. Now `movie.id`.

### `components/MovieCard.tsx` — base, task 5, task 8

Three incompatible signatures: the base took props spread (`<MovieCard
{...movie} />`), task 5 took `{movie, handleDelete, isLoading}`, task 8 took
the spread plus a recent-view upsert. Unified to `{movie, onDelete?}`, doing
both jobs — record the view on click, show the remove button when `onDelete`
and `id_supabase` are present. All four call sites updated.

**Fixed:** task 8 passed `onConflict: ["user_id","movie_id"] as any` to
Supabase. That option takes a comma-separated **string**; the array was being
coerced and the `as any` was hiding the type error. Now
`onConflict: "user_id,movie_id"`.

**Fixed:** the upsert did not set `viewed_at`. On the update half of an upsert
a column default does not re-fire, so a re-viewed movie kept its original
timestamp and the "recently viewed" ordering never changed. Now set
explicitly.

**Fixed:** task 8's rows were read from `recent_movies` and rendered directly,
linking to `/movie/${movie.id}` — but `id` on a Supabase row is the row's own
primary key, not the TMDB id, so those links pointed at the wrong movies. Rows
are now mapped through `toMovieSummary()`, which maps `movie_id` → `id`.

### `components/WatchListButton.tsx` — tasks 5, 10

Both defined `addToWatchList` with different bodies. Now does both, in order:
insert into Supabase, and on success POST `/api/send_email`. A failing mailer
is logged but does **not** turn a successful save into an error — the save is
what the user asked for.

### `app/movie/[id]/page.tsx` — base, task 6, task 7

Base hero + task 6's suggested carousel + task 7's comment section, in that
order. The carousel is hidden when there are no suggestions.

### `contexts/AuthContext.tsx` — base, task 9

Took task 9's profile-aware version. See fixes below.

### `components/Navbar.tsx` — base, task 5, task 9

Task 9's `profile?.username ?? email` display name plus task 5's watchlist
link (relabelled "My List", since the old "Movies" link pointed at `/`).

### `types/movie.ts` — base, tasks 5, 6, 7

Four divergent versions. Restructured around a `MovieSummary` base (the four
fields a card needs) that `MovieType`, `WatchListMovieType` and the Supabase
row types extend. Task 6 had typed `genre_ids` as `GenreType[]`, which is
wrong — TMDB list endpoints return `genre_ids: number[]` and only the detail
endpoint returns `genres: GenreType[]`. Both are now modelled correctly.

### shadcn `components/ui/*`

`select.tsx` appeared in tasks 2, 3 and 9; `button.tsx` in 6 and 9; and
`label`/`separator`/`textarea` in 7 and 9. All were byte-identical apart from
tab-vs-space and semicolon formatting, so they deduplicated cleanly.

---

## 2. Bug fixes

These were pre-existing in the shared base code and would have been inherited
by the merged app.

| Fix | Where |
|---|---|
| **`/api/send_email` was an unauthenticated open relay.** It took the recipient from the request body and mailed anyone, using your Gmail credentials, with no session check. It now verifies the caller's Supabase access token and takes the recipient from the **verified session**, ignoring the body. Unauthenticated calls get 401. | `app/api/send_email/route.ts` |
| **HTML injection into that email.** `movie.title` and `poster_path` were interpolated raw into the message body. Both are now escaped, and the poster URL is validated against the TMDB path shape. | `lib/sendEmail.ts` |
| **TMDB key was exposed to the browser.** `NEXT_PUBLIC_TMDB_API_KEY` inlines the key into the client bundle. It is only ever used server-side, so it is now `TMDB_API_KEY`. **This is a required `.env` rename.** | all routes, `lib/tmdbServer.ts` |
| **Login and signup could lock permanently.** Both set `isLoading` true, then returned early on a short password without resetting it. Since the form renders `isLoading ? <Spinner/> : <form/>`, the entire form — including the error just set — was replaced by a spinner that never went away. Validation now runs *before* the spinner goes up. Same bug and fix in `OnboardForm`. | `LoginForm`, `SignupForm`, `OnboardForm` |
| **Pages crashed on API failure.** `.then(res => res.json())` with no `res.ok` check meant a 500 body `{error}` was destructured as a movie, and `vote_average.toFixed()` threw. Server components now call TMDB directly and render `notFound()`; client fetches check `res.ok` and show an error state. | home, movie detail, search |
| **`refreshProfile` always returned early.** It read `user` from the closure, but its first call happens during sign-in before that state is committed — so it saw `null` and bailed every time, and the profile never loaded. It now takes an explicit user id. | `contexts/AuthContext.tsx` |
| **`isLoading` in AuthContext was dead.** Initialised to `false` and only ever set to `false`, so it never reported the initial session load. Now starts `true`. | `contexts/AuthContext.tsx` |
| **`.single()` errored when a user had no profile row** (the normal case pre-onboarding). Now `.maybeSingle()`. | `contexts/AuthContext.tsx` |
| **Comment insert reported success on failure.** The error branch set `errorMsg` but fell through to also set the success message and fire the refetch. It now returns. | `CommentInputButton.tsx` |
| **`redirect()` called from client event handlers.** That is the server-component API; client code should use `useRouter().push()`. | `LoginForm`, `SignupForm`, `OnboardForm`, `Navbar` |
| **Signup redirected to `/` even with no session.** With email confirmation enabled Supabase returns no session, so the user landed logged out with no explanation. It now shows a "check your email" notice. | `SignupForm.tsx` |
| **Search query was not URL-encoded**, so a query containing `&` or `#` broke the request. | `Search.tsx`, `lib/tmdbServer.ts` |
| Missing 404 page, despite the original README claiming one. | `app/not-found.tsx` |
| `__pycache__` and `.pyc` files were committed and not ignored; `.env*` ignored everything so no `.env.example` could exist. | `.gitignore` |

---

## 3. Other changes

- **No more self-fetching.** The base's server components fetched their own
  API routes over HTTP via `NEXT_PUBLIC_BASE_URL` — an extra network hop to
  reach code in the same process, and a hard failure (`fetch("undefined/api/…")`)
  if the variable was unset. Server components now call `lib/tmdbServer.ts`
  directly and client components use relative URLs, so **`NEXT_PUBLIC_BASE_URL`
  is no longer needed at all**.
- **Eight routes deduplicated.** Each repeated the same API-key/base-URL
  boilerplate; that now lives in `tmdbFetch()`, which also handles query
  encoding and error propagation.
- `lib/tmdb.ts` declared `API_KEY` and `BASE_URL` constants it never used —
  removed. It ships to the client, so the key would have been `undefined`
  there anyway.
- Deleted the two empty 0-byte files (`Hero.tsx`, `Loader.tsx`) that no task
  ever used.
- Metadata was still `"Create Next App"`.
- Navbar's hardcoded `px-60` overflowed below ~1300px; now `px-6 xl:px-60`,
  with the nav list allowed to wrap. The movie detail hero stacks on mobile.
- Typos: `intialData` → `initialData`, and the `useAuth` error message.
- `supabase/schema.sql` is new — the code assumed four tables that existed
  nowhere in the repo. Column names are inferred from the queries; RLS
  policies are included because the anon key alone would otherwise expose
  every row.

## 4. Verification

`npx tsc --noEmit` clean, `npx eslint .` clean (5 warnings, all `<img>`-vs-
`next/image` advisories plus one in a vendored shadcn file), and
`npx next build` succeeds across all 16 routes.

The app was smoke-tested against a running production server. Because there is
no TMDB key in this environment, that covered structure and failure paths
rather than live data: all pages return 200, an unknown path and an unresolvable
movie both return 404, routes missing required params return 400, upstream
failures return 500, and `/api/send_email` returns 401 for an unauthenticated
call carrying an attacker-supplied recipient.

**Not verified:** anything requiring live TMDB or Supabase credentials — real
search results, the genre/sort/pagination flow against real data, watchlist
and comment writes, the onboarding insert, and actual email delivery. Those
need a run with real `.env.local` values and the schema applied.
