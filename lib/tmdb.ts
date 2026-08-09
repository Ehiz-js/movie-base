import { MovieType } from "@/types/movie";

export const SORT_OPTIONS = [
	"Alphabet",
	"Popularity",
	"Release Date",
	"Rating",
] as const;

/**
 * Returns a sorted copy of `movies`. An unrecognised query (including the
 * empty string) returns the list untouched.
 */
export function getSortedMovies(query: string, movies: MovieType[]) {
	if (query === "Alphabet") {
		return [...movies].sort((a, b) =>
			a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
		);
	}
	if (query === "Popularity") {
		return [...movies].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
	}
	if (query === "Release Date") {
		return [...movies].sort(
			(a, b) =>
				new Date(b.release_date ?? 0).getTime() -
				new Date(a.release_date ?? 0).getTime(),
		);
	}
	if (query === "Rating") {
		return [...movies].sort((a, b) => b.vote_average - a.vote_average);
	}
	return movies;
}
