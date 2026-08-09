export interface GenreType {
	id: number;
	name: string;
}

export interface LanguageType {
	iso_639_1: string;
	english_name: string;
	name: string;
}

/**
 * The minimum a movie needs to render as a card. Rows coming back from
 * Supabase (watchlist, recent_movies) only carry these columns, so anything
 * that renders a card should accept this rather than the full TMDB shape.
 */
export interface MovieSummary {
	id: number;
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
	title: string;
	poster_path: string;
	vote_average: number;
	created_at: string;
}

export interface RecentMovieRow {
	id_supabase: string;
	user_id: string;
	movie_id: number;
	title: string;
	poster_path: string;
	vote_average: number;
	viewed_at: string;
}

export function toMovieSummary(row: {
	movie_id: number;
	title: string;
	poster_path: string;
	vote_average: number;
}): MovieSummary {
	return {
		id: row.movie_id,
		title: row.title,
		poster_path: row.poster_path,
		vote_average: row.vote_average,
	};
}

export interface CommentType {
	id: string;
	movie_id: number;
	user_id: string;
	username: string;
	content: string;
	created_at?: string;
}
