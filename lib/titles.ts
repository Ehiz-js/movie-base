import { tmdbFetch } from "@/lib/tmdbServer";
import { MediaType, MovieType } from "@/types/movie";
import { findGenre, genreNamesForTmdbId, type GenreMapping } from "@/lib/genres";

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

async function fetchSide(
	path: string,
	mediaType: MediaType,
	params: Record<string, string | number | undefined>,
): Promise<MovieType[]> {
	try {
		const data = await tmdbFetch<{ results: RawTitle[] }>(path, params);
		return (data.results ?? []).map((item) => normalizeTitle(item, mediaType));
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

/** Search across both, using TMDB's multi endpoint. */
export async function searchTitles(query: string): Promise<MovieType[]> {
	try {
		const data = await tmdbFetch<{ results: RawTitle[] }>("/search/multi", {
			query,
		});
		return (data.results ?? [])
			// multi also returns people, which have no poster or title to show.
			.filter((item) => item.media_type === "movie" || item.media_type === "tv")
			.map((item) => normalizeTitle(item, item.media_type as MediaType));
	} catch (error) {
		console.error("search failed", error);
		throw error;
	}
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

	const sameType = title.media_type;
	const otherType: MediaType = sameType === "movie" ? "tv" : "movie";

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
	return fetchSide(`/${mediaType}/popular`, mediaType, { page });
}

/** One genre row: both media types, interleaved. */
export async function fetchGenreTitles(
	genreName: string,
	page = "1",
): Promise<MovieType[]> {
	return fetchBlendedTitles({ page, genre: genreName });
}
