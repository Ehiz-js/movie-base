export interface GenreType {
	id: number;
	name: string;
}

/**
 * The minimum a movie needs to render as a card. Rows coming back from
 * Supabase (watchlist, recent_movies) only carry these columns, so anything
 * that renders a card should accept this rather than the full TMDB shape.
 */
export type MediaType = "movie" | "tv";

export interface MovieSummary {
	id: number;
	/**
	 * A film and a series can share the same numeric id — 550 is both — so a
	 * title is only identified by the pair.
	 */
	media_type: MediaType;
	title: string;
	poster_path: string;
	vote_average: number;
}

/**
 * A movie from TMDB. The list endpoints (popular, search, discover) return
 * `genre_ids`, while the single-movie endpoint returns `genres` — hence both,
 * both optional.
 */
export interface MovieType extends MovieSummary {
	adult?: boolean;
	backdrop_path?: string;
	genre_ids?: number[];
	genres?: GenreType[];
	original_language?: string;
	original_title?: string;
	overview?: string;
	popularity?: number;
	release_date?: string;
	video?: boolean;
	/** Series only: the seasons that make up the run, specials excluded. */
	seasons?: SeasonSummary[];
	vote_count?: number;
}

export interface WatchListMovieType extends MovieSummary {
	id_supabase: string;
}

/**
 * Raw Supabase row shapes. Both tables key on `movie_id` (the TMDB id) and
 * carry their own `id_supabase` primary key, so a row is mapped to a
 * MovieSummary before it is rendered — see `toMovieSummary`.
 */
export interface WatchListRow {
	id_supabase: string;
	user_id: string;
	movie_id: number;
	media_type: MediaType;
	title: string;
	poster_path: string;
	vote_average: number;
	created_at: string;
}

export interface RecentMovieRow {
	id_supabase: string;
	user_id: string;
	movie_id: number;
	media_type: MediaType;
	title: string;
	poster_path: string;
	vote_average: number;
	viewed_at: string;
}

export function toMovieSummary(row: {
	movie_id: number;
	media_type?: MediaType | null;
	title: string;
	poster_path: string;
	vote_average: number;
}): MovieSummary {
	return {
		id: row.movie_id,
		// Rows saved before series support carry no media_type; they were all
		// films, so that is the safe default.
		media_type: row.media_type ?? "movie",
		title: row.title,
		poster_path: row.poster_path,
		vote_average: row.vote_average,
	};
}

export interface CommentType {
	id: string;
	movie_id: number;
	media_type?: MediaType;
	user_id: string;
	username: string;
	content: string;
	created_at?: string;
}

export interface SeasonSummary {
	id: number;
	season_number: number;
	name: string;
	episode_count: number;
	air_date?: string;
	poster_path?: string;
	overview?: string;
}

export interface EpisodeType {
	id: number;
	episode_number: number;
	season_number: number;
	name: string;
	overview?: string;
	still_path?: string;
	air_date?: string;
	runtime?: number;
	vote_average?: number;
}

export interface VideoType {
	key: string;
	name: string;
	site: string;
	type: string;
	official?: boolean;
}

export interface WatchProvider {
	provider_id: number;
	provider_name: string;
	logo_path: string;
}

export interface WatchProviders {
	link?: string;
	flatrate?: WatchProvider[];
	rent?: WatchProvider[];
	buy?: WatchProvider[];
}
