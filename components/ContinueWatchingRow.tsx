"use client";
import { useEffect, useState } from "react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import MovieCard from "./MovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { MovieSummary } from "@/types/movie";
import { fetchContinueWatching, MAX_FRACTION } from "@/lib/watchProgress";

/** What the row actually needs, already shaped for MovieCard. */
interface ContinueWatchingItem {
	movie: MovieSummary;
	progress: number;
	subtitle?: string;
	/** Points straight at the resume episode instead of the title's default
	 *  landing spot — otherwise clicking back in restarts at episode 1 (or
	 *  S1E1), which then overwrites the very progress this row is showing.
	 *  Movies fall back to MovieCard's normal link — there's no episode to
	 *  resume, so nothing to override. */
	href?: string;
}

/**
 * Finishing episode N of a season doesn't necessarily mean episode N+1
 * exists in that same season — it might be the season finale. Checks the
 * show's actual season lengths (app/api/tv/[id]/seasons) so the next episode
 * we point at is a real one: same season if there's room, season+1 episode 1
 * if not, or null if there's no next season at all (genuinely finished).
 */
async function resolveTvRollover(
	tvId: number,
	season: number,
	finishedEpisode: number,
): Promise<{ season: number; episode: number } | null> {
	try {
		const res = await fetch(`/api/tv/${tvId}/seasons`);
		if (!res.ok) return { season, episode: finishedEpisode + 1 };

		const data: { seasons: { season_number: number; episode_count: number }[] } =
			await res.json();
		const current = data.seasons.find((s) => s.season_number === season);

		// Season not found in the list, or clearly more episodes left in it —
		// either way a same-season bump is safe.
		if (!current || finishedEpisode < current.episode_count) {
			return { season, episode: finishedEpisode + 1 };
		}

		const next = data.seasons.find((s) => s.season_number === season + 1);
		return next ? { season: next.season_number, episode: 1 } : null;
	} catch (error) {
		// Fails open with a same-season bump rather than dropping the row
		// outright over a network hiccup.
		console.error("Could not resolve season rollover:", error);
		return { season, episode: finishedEpisode + 1 };
	}
}

/**
 * Same idea as resolveTvRollover, but anime has no seasons — just one
 * continuous episode count — so this only ever answers "is there a next
 * episode at all", via AniList's own total (accurate even mid-run).
 */
async function resolveAnimeRollover(
	anilistId: number,
	finishedEpisode: number,
): Promise<number | null> {
	try {
		const res = await fetch(`/api/anime/${anilistId}`);
		if (!res.ok) return finishedEpisode + 1;

		const data: { episodes: number | null } = await res.json();
		// No known total (still airing with an unclear count, or the lookup
		// came back empty) — bump anyway rather than dropping the row.
		if (data.episodes == null) return finishedEpisode + 1;

		return finishedEpisode < data.episodes ? finishedEpisode + 1 : null;
	} catch (error) {
		console.error("Could not resolve anime rollover:", error);
		return finishedEpisode + 1;
	}
}

/**
 * Resume-watching strip, backed by Supabase (see lib/watchProgress.ts) —
 * signed-in only, since there's nowhere else to keep it that respects login
 * or survives across devices. Films/series progress comes from what the
 * VidLink embed broadcasts (TrailerPlayer.tsx); anime progress comes from
 * AniXo's bare timeupdate events, aggregated into the same shape ourselves
 * (AnimePlayer.tsx).
 */
export default function ContinueWatchingRow() {
	const { user } = useAuth();
	const [items, setItems] = useState<ContinueWatchingItem[]>([]);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			if (!user) {
				if (!cancelled) setItems([]);
				return;
			}
			const rows = await fetchContinueWatching(user.id);
			if (cancelled) return;

			const resolved = await Promise.all(
				rows.map(async (row) => {
					// Finishing an episode isn't finishing the show — bump tv/anime
					// forward to the next episode, starting fresh, instead of
					// pointing back at the credits of the one just finished.
					const isEpisodic = row.media_type === "tv" || row.media_type === "anime";
					const fraction = row.duration ? row.watched / row.duration : 0;
					const finished = isEpisodic && fraction >= MAX_FRACTION;

					let season = row.season;
					let episode = row.episode;

					if (finished && row.episode != null) {
						if (row.media_type === "tv" && row.season != null) {
							const rollover = await resolveTvRollover(row.movie_id, row.season, row.episode);
							// null means the show has no next season either — genuinely
							// nothing left to continue, same as a finished movie.
							if (!rollover) return null;
							season = rollover.season;
							episode = rollover.episode;
						} else if (row.media_type === "anime") {
							const nextEpisode = await resolveAnimeRollover(row.movie_id, row.episode);
							// null means that was the last episode — genuinely nothing
							// left to continue, same as a finished movie.
							if (nextEpisode == null) return null;
							episode = nextEpisode;
						}
					}

					const item: ContinueWatchingItem = {
						movie: {
							id: row.movie_id,
							media_type: row.media_type,
							title: row.title,
							poster_path: row.poster_path,
							// Suppressed deliberately — nothing here carries a rating, and
							// NaN fails MovieCard's `Number.isFinite` check that decides
							// whether to show the star badge at all.
							vote_average: NaN,
						},
						progress: finished ? 0 : Math.min(1, Math.max(0, fraction)),
						subtitle:
							row.media_type === "tv" && season != null && episode != null
								? `S${season} E${episode}${finished ? " · Next" : ""}`
								: row.media_type === "anime" && episode != null
									? `Episode ${episode}${finished ? " · Next" : ""}`
									: undefined,
						href:
							row.media_type === "tv" && season != null && episode != null
								? `/title/tv/${row.movie_id}?season=${season}&episode=${episode}`
								: row.media_type === "anime" && episode != null
									? `/anime/${row.movie_id}?episode=${episode}${finished ? "" : `&t=${Math.floor(row.watched)}`}`
									: undefined,
					};
					return item;
				}),
			);

			if (!cancelled) {
				setItems(resolved.filter((item): item is ContinueWatchingItem => item !== null));
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [user]);

	if (items.length === 0) return null;

	return (
		<section className="mb-10">
			<div className="flex items-center gap-2 mb-3 px-10 sm:px-12 xl:px-20">
				<h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
					<span aria-hidden className="h-5 w-1 rounded bg-(--purple-dark)" />
					Continue Watching
				</h2>
			</div>

			<Carousel
				opts={{ align: "start", slidesToScroll: "auto" }}
				className="w-full max-w-[88vw] sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-[85rem] mx-auto"
			>
				<CarouselContent className="-ml-2 md:-ml-4 items-stretch">
					{items.map((item) => (
						<CarouselItem
							key={`${item.movie.media_type}-${item.movie.id}`}
							className="pl-2 md:pl-4 basis-1/2 sm:basis-1/4 md:basis-1/4 lg:basis-1/6"
						>
							<MovieCard
								movie={item.movie}
								progress={item.progress}
								subtitle={item.subtitle}
								href={item.href}
							/>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="-left-3 md:-left-12 cursor-pointer text-(--purple-dark)" />
				<CarouselNext className="-right-3 md:-right-12 cursor-pointer text-(--purple-dark)" />
			</Carousel>
		</section>
	);
}
