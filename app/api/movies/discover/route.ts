import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";
import { TMDB_SORT_BY } from "@/lib/tmdb";

/**
 * Backs the home grid. Genre, sort and page are all applied by TMDB, so
 * sorting ranks the whole catalogue rather than reordering the 20 results
 * that happen to be on screen.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const page = searchParams.get("page") ?? "1";
	const genreId = searchParams.get("genreId");
	const sort = searchParams.get("sort") ?? "";

	const sortBy = TMDB_SORT_BY[sort] ?? TMDB_SORT_BY.Popularity;

	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/discover/movie", {
			page,
			sort_by: sortBy,
			with_genres: genreId || undefined,
			// Sorting by rating without a vote floor surfaces obscure titles with a
			// single 10/10 vote, which reads as broken.
			"vote_count.gte": sortBy.startsWith("vote_average") ? 200 : undefined,
		});
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch movies" },
			{ status: 500 },
		);
	}
}
