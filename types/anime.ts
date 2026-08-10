import { MovieSummary } from "./movie";

/**
 * Anime, sourced entirely from AniList rather than TMDB. Keeping it a
 * separate pipeline end to end — its own id space, its own fetches, its own
 * detail route — is what makes the player always get an accurate episode
 * count instead of one translated from TMDB's, which is where the numbering
 * mismatches came from.
 *
 * Extends MovieSummary so an AnimeSummary can drop straight into MovieCard,
 * TitleRow, the watchlist, and recently-viewed without those needing to know
 * anime is a different kind of thing under the hood.
 */
export interface AnimeSummary extends MovieSummary {
	media_type: "anime";
	score: number | null;
	/** Total episodes aired so far — accurate even mid-run, via AniList's
	 *  nextAiringEpisode; null only if AniList itself has no episode data. */
	episodes: number | null;
}

/**
 * A season/part directly adjacent to this one in AniList's relation graph.
 * AniList (like MAL) gives every season of a show its own id rather than one
 * umbrella entry, so this is what lets the detail page offer a way to jump
 * from "Attack on Titan" to "Attack on Titan Season 2" and back.
 */
export interface AnimeSeasonLink {
	id: number;
	title: string;
	relation: "PREQUEL" | "SEQUEL";
}

export interface AnimeDetail extends AnimeSummary {
	synopsis?: string;
	genres: string[];
	status: string;
	/** AniList's own YouTube trailer embed, when it has one. */
	trailerEmbedUrl?: string;
	seasons: AnimeSeasonLink[];
	/** A real wide backdrop image, distinct from the poster — not every title
	 *  has one, so the hero still needs a fallback for when this is null. */
	bannerImage: string | null;
}

export interface AnimeEpisode {
	/** Continuous from 1 for the whole show — already what the player needs,
	 *  no season translation required. */
	number: number;
	title: string;
	aired: string | null;
	score: number | null;
	filler: boolean;
}
