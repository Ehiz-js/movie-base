import { tmdbFetch } from "@/lib/tmdbServer";
import {
	EpisodeType,
	MediaType,
	MovieType,
	SeasonSummary,
	VideoType,
	WatchProviders,
} from "@/types/movie";
import { findGenre, genreNamesForTmdbId } from "@/lib/genres";
import { searchAnime } from "@/lib/anilist";

/**
 * TMDB's series payloads use different field names for the same ideas:
 * `name` for `title`, `original_name` for `original_title`, and
 * `first_air_date` for `release_date`.
 *
 * Everything is normalised here, at the boundary, so the rest of the app only
 * ever sees one shape and does not need to know which endpoint a result came
 * from. `media_type` is carried through because a film and a series can share
 * the same numeric id — 550 is both — so the pair is what identifies a title.
 */
type RawTitle = Record<string, unknown>;

export function normalizeTitle(raw: RawTitle, mediaType: MediaType): MovieType {
	const get = <T,>(key: string) => raw[key] as T | undefined;

	return {
		id: Number(get<number>("id")),
		media_type: mediaType,
		title:
			get<string>("title") ?? get<string>("name") ?? "Untitled",
		original_title:
			get<string>("original_title") ?? get<string>("original_name"),
		release_date:
			get<string>("release_date") ?? get<string>("first_air_date"),
		poster_path: get<string>("poster_path") ?? "",
		backdrop_path: get<string>("backdrop_path"),
		overview: get<string>("overview"),
		vote_average: Number(get<number>("vote_average") ?? 0),
		vote_count: get<number>("vote_count"),
		popularity: get<number>("popularity"),
		original_language: get<string>("original_language"),
		adult: get<boolean>("adult"),
		genre_ids: get<number[]>("genre_ids"),
		genres: get<{ id: number; name: string }[]>("genres"),
		seasons: get<SeasonSummary[]>("seasons")?.filter(
			// Season 0 is TMDB's bucket for specials; it is not part of the run.
			(season) => season.season_number > 0,
		),
	};
}

/**
 * Interleaves two lists so a blended page is not simply all films followed by
 * all series. Takes alternately from each and appends whatever remains.
 */
export function interleave<T>(a: T[], b: T[]): T[] {
	const out: T[] = [];
	const max = Math.max(a.length, b.length);
	for (let i = 0; i < max; i++) {
		if (i < a.length) out.push(a[i]);
		if (i < b.length) out.push(b[i]);
	}
	return out;
}

/**
 * True for TMDB entries that are actually anime (Animation genre + Japanese
 * origin) rather than genuinely Western/other animation. Anime has its own
 * AniList-backed pipeline end to end (lib/anilist.ts) — every TMDB list
 * filters these out so a title never has two different detail pages
 * depending on where you clicked it from.
 */
function isAnimeByGenre(title: MovieType): boolean {
	if (title.original_language !== "ja") return false;
	const ids = title.genres?.map((genre) => genre.id) ?? title.genre_ids ?? [];
	return ids.includes(16);
}

async function fetchSide(
	path: string,
	mediaType: MediaType,
	params: Record<string, string | number | undefined>,
): Promise<MovieType[]> {
	try {
		const data = await tmdbFetch<{ results: RawTitle[] }>(path, params);
		return (data.results ?? [])
			.map((item) => normalizeTitle(item, mediaType))
			.filter((title) => !isAnimeByGenre(title));
	} catch (error) {
		// One side failing should degrade the blend, not empty the page.
		console.error(`${path} failed`, error);
		return [];
	}
}

/**
 * Popular films and series, blended. With a genre name, both sides are
 * filtered by their own equivalent ids — see lib/genres.ts.
 */
export async function fetchBlendedTitles({
	page = "1",
	genre,
}: {
	page?: string;
	genre?: string | null;
}): Promise<MovieType[]> {
	if (!genre) {
		const [movies, shows] = await Promise.all([
			fetchSide("/movie/popular", "movie", { page }),
			fetchSide("/tv/popular", "tv", { page }),
		]);
		return interleave(movies, shows);
	}

	const mapping = findGenre(genre);
	if (!mapping) return [];

	const [movies, shows] = await Promise.all([
		mapping.movieIds.length
			? fetchSide("/discover/movie", "movie", {
					page,
					with_genres: mapping.movieIds.join("|"),
				})
			: Promise.resolve([]),
		mapping.tvIds.length
			? fetchSide("/discover/tv", "tv", {
					page,
					with_genres: mapping.tvIds.join("|"),
				})
			: Promise.resolve([]),
	]);
	return interleave(movies, shows);
}

/**
 * Search across movies, series, and anime. TMDB's multi-search covers the
 * first two; anime is searched separately against AniList and blended in, so
 * a result for e.g. "one piece" always opens the AniList-backed page rather
 * than whichever TMDB tv record happens to match the same title.
 */
export async function searchTitles(query: string): Promise<MovieType[]> {
	const [tmdbResults, anime] = await Promise.all([
		(async () => {
			try {
				const data = await tmdbFetch<{ results: RawTitle[] }>("/search/multi", {
					query,
				});
				return (data.results ?? [])
					// multi also returns people, which have no poster or title to show.
					.filter(
						(item) => item.media_type === "movie" || item.media_type === "tv",
					)
					.map((item) => normalizeTitle(item, item.media_type as MediaType))
					.filter((title) => !isAnimeByGenre(title));
			} catch (error) {
				console.error("search failed", error);
				throw error;
			}
		})(),
		searchAnime(query),
	]);

	return interleave(tmdbResults, anime);
}

/** A single film or series by id. */
export async function fetchTitle(
	mediaType: MediaType,
	id: string,
): Promise<MovieType | null> {
	try {
		const raw = await tmdbFetch<RawTitle>(
			`/${mediaType}/${encodeURIComponent(id)}`,
		);
		return normalizeTitle(raw, mediaType);
	} catch (error) {
		console.error(error);
		return null;
	}
}

/**
 * TMDB reads a comma in `with_genres` as AND and a pipe as OR. Suggestions use
 * AND: a title matching every genre of the one being viewed is actually
 * related, whereas OR degrades into "anything popular in any of these genres",
 * which returns the same handful of blockbusters no matter what you opened.
 *
 * Capped because ANDing four or more genres matches almost nothing.
 */
const MAX_SUGGESTION_GENRES = 3;

/** Other titles sharing this one's genres, blended across both media types. */
export async function fetchSuggested(title: MovieType): Promise<MovieType[]> {
	const ownIds = (title.genres?.map((genre) => genre.id) ?? []).slice(
		0,
		MAX_SUGGESTION_GENRES,
	);
	if (ownIds.length === 0) return [];
	// Anime is sourced from AniList entirely and never flows through here —
	// this only ever sees TMDB movie/tv titles in practice.
	if (title.media_type !== "movie" && title.media_type !== "tv") return [];

	const sameType = title.media_type;
	const otherType: "movie" | "tv" = sameType === "movie" ? "tv" : "movie";

	// The other side rarely uses the same ids, so each genre is translated
	// through the equivalence map — one id per genre, since ANDing a genre's
	// several equivalents at once would match nothing.
	const crossIds = [
		...new Set(
			ownIds.flatMap((id) =>
				genreNamesForTmdbId(sameType, id).flatMap((name) => {
					const mapping = findGenre(name);
					if (!mapping) return [];
					const ids = otherType === "movie" ? mapping.movieIds : mapping.tvIds;
					return ids.slice(0, 1);
				}),
			),
		),
	].slice(0, MAX_SUGGESTION_GENRES);

	const [same, cross] = await Promise.all([
		fetchSide(`/discover/${sameType}`, sameType, {
			with_genres: ownIds.join(","),
		}),
		crossIds.length
			? fetchSide(`/discover/${otherType}`, otherType, {
					with_genres: crossIds.join(","),
				})
			: Promise.resolve([]),
	]);

	return interleave(same, cross).filter(
		(suggestion) =>
			!(
				suggestion.id === title.id &&
				suggestion.media_type === title.media_type
			),
	);
}

/** Popular titles of one media type — backs the two lead carousels. */
export async function fetchPopular(
	mediaType: MediaType,
	page = "1",
): Promise<MovieType[]> {
	if (mediaType === "tv") {
		// TMDB's own /tv/popular ranks by raw view momentum, which regularly
		// puts old, low-rated reality shows (re-airing, or spiking for
		// unrelated reasons) ahead of what people actually mean by "popular".
		// Discover with the same sort plus quality floors keeps the intent
		// without the noise.
		return fetchSide("/discover/tv", "tv", {
			page,
			sort_by: "popularity.desc",
			"vote_count.gte": 200,
			"vote_average.gte": 6,
		});
	}
	return fetchSide(`/${mediaType}/popular`, mediaType, { page });
}

/** One genre row: both media types, interleaved. */
export async function fetchGenreTitles(
	genreName: string,
	page = "1",
): Promise<MovieType[]> {
	return fetchBlendedTitles({ page, genre: genreName });
}


/**
 * A title plus the extras its page needs. TMDB's append_to_response returns
 * them in the same request, so this is one round trip rather than three.
 */
export async function fetchTitleDetail(
	mediaType: MediaType,
	id: string,
): Promise<{
	title: MovieType;
	trailer: VideoType | null;
	providers: WatchProviders | null;
} | null> {
	try {
		const raw = await tmdbFetch<
			RawTitle & {
				videos?: { results: VideoType[] };
				"watch/providers"?: { results: Record<string, WatchProviders> };
			}
		>(`/${mediaType}/${encodeURIComponent(id)}`, {
			append_to_response: "videos,watch/providers",
		});

		return {
			title: normalizeTitle(raw, mediaType),
			trailer: pickTrailer(raw.videos?.results ?? []),
			// Providers are per country; US has the widest coverage, so it is the
			// fallback when the visitor's region has no listing.
			providers: raw["watch/providers"]?.results?.US ?? null,
		};
	} catch (error) {
		console.error(error);
		return null;
	}
}

/** Prefers an official trailer, then any trailer, then any teaser. */
function pickTrailer(videos: VideoType[]): VideoType | null {
	const youtube = videos.filter((video) => video.site === "YouTube");
	return (
		youtube.find((v) => v.type === "Trailer" && v.official) ??
		youtube.find((v) => v.type === "Trailer") ??
		youtube.find((v) => v.type === "Teaser") ??
		null
	);
}

/** Every episode of one season. */
export async function fetchSeason(
	tvId: string | number,
	seasonNumber: number,
): Promise<EpisodeType[]> {
	try {
		const data = await tmdbFetch<{ episodes: EpisodeType[] }>(
			`/tv/${encodeURIComponent(String(tvId))}/season/${seasonNumber}`,
		);
		return data.episodes ?? [];
	} catch (error) {
		console.error(error);
		return [];
	}
}
