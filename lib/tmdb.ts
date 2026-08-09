export const SORT_OPTIONS = [
	"Alphabet",
	"Popularity",
	"Release Date",
	"Rating",
] as const;

/**
 * Maps the labels shown in SortSelect onto TMDB's `sort_by` values. Sorting is
 * done by TMDB rather than in the browser: the API returns 20 results per
 * page, so sorting client-side only ever reordered the current page while
 * appearing to rank everything.
 */
export const TMDB_SORT_BY: Record<string, string> = {
	Alphabet: "original_title.asc",
	Popularity: "popularity.desc",
	"Release Date": "primary_release_date.desc",
	Rating: "vote_average.desc",
};
