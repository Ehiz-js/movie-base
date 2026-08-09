import { GenreType } from "@/types/movie";

/**
 * TMDB keeps separate genre lists for films and series, and they do not line
 * up: TV collapses Action and Adventure into one "Action & Adventure", and
 * Science Fiction and Fantasy into "Sci-Fi & Fantasy", under different ids.
 *
 * This maps one visible genre onto the ids each side needs, so picking
 * "Sci-Fi & Fantasy" returns science-fiction films *and* fantasy films *and*
 * sci-fi series, rather than whichever half happened to match.
 *
 * A side with no counterpart is simply empty — picking Horror returns films
 * only, because TMDB has no horror genre for series.
 */
export type GenreMapping = {
	/** Shown in the dropdown, and used in the URL. */
	name: string;
	movieIds: number[];
	tvIds: number[];
};

export const GENRE_MAP: GenreMapping[] = [
	{ name: "Action & Adventure", movieIds: [28, 12], tvIds: [10759] },
	{ name: "Animation", movieIds: [16], tvIds: [16] },
	{ name: "Comedy", movieIds: [35], tvIds: [35] },
	{ name: "Crime", movieIds: [80], tvIds: [80] },
	{ name: "Documentary", movieIds: [99], tvIds: [99] },
	{ name: "Drama", movieIds: [18], tvIds: [18] },
	{ name: "Family", movieIds: [10751], tvIds: [10751] },
	{ name: "Kids", movieIds: [], tvIds: [10762] },
	{ name: "Mystery", movieIds: [9648], tvIds: [9648] },
	{ name: "News", movieIds: [], tvIds: [10763] },
	{ name: "Reality", movieIds: [], tvIds: [10764] },
	{ name: "Sci-Fi & Fantasy", movieIds: [878, 14], tvIds: [10765] },
	{ name: "Soap", movieIds: [], tvIds: [10766] },
	{ name: "Talk", movieIds: [], tvIds: [10767] },
	{ name: "War & Politics", movieIds: [10752], tvIds: [10768] },
	{ name: "Western", movieIds: [37], tvIds: [37] },
	// Film-only genres. TMDB has no series equivalent for any of these, so they
	// are excluded while the dropdown mirrors the (shorter) TV list. Move them
	// above this line to offer the full union instead.
];

/** Genres offered in the dropdown, in display order. */
export const VISIBLE_GENRES: GenreType[] = GENRE_MAP.map((genre, index) => ({
	// The id is positional: the app addresses genres by name, and TMDB's own
	// ids differ per media type so neither side's id can serve as the key.
	id: index,
	name: genre.name,
}));

export function findGenre(name: string): GenreMapping | undefined {
	return GENRE_MAP.find((genre) => genre.name === name);
}

/**
 * Reverse index: a TMDB genre id back to the visible genre names it belongs
 * to. Used to turn a title's own genres into suggestions on both sides.
 */
const REVERSE = new Map<string, string[]>();
for (const genre of GENRE_MAP) {
	for (const id of genre.movieIds) {
		const key = `movie:${id}`;
		REVERSE.set(key, [...(REVERSE.get(key) ?? []), genre.name]);
	}
	for (const id of genre.tvIds) {
		const key = `tv:${id}`;
		REVERSE.set(key, [...(REVERSE.get(key) ?? []), genre.name]);
	}
}

export function genreNamesForTmdbId(
	mediaType: "movie" | "tv",
	id: number,
): string[] {
	return REVERSE.get(`${mediaType}:${id}`) ?? [];
}

/** URL-safe slug for a genre name, e.g. "Sci-Fi & Fantasy" -> "sci-fi-fantasy". */
export function genreSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/&/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function findGenreBySlug(slug: string): GenreMapping | undefined {
	return GENRE_MAP.find((genre) => genreSlug(genre.name) === slug);
}

/** Genre rows shown on the home page, in order. */
export const HOME_GENRES = [
	"Action & Adventure",
	"Comedy",
	"Drama",
	"Sci-Fi & Fantasy",
	"Animation",
	"Crime",
	"Documentary",
];
