import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const genreId = searchParams.get("genreId");
	// Added during the merge so genre filtering and pagination compose:
	// the home page keeps its page number when a genre is selected.
	const page = searchParams.get("page") ?? "1";

	if (!genreId || genreId.trim() === "") {
		return NextResponse.json(
			{ error: "Missing query parameter" },
			{ status: 400 },
		);
	}

	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/discover/movie", {
			with_genres: genreId,
			page,
		});
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: `Failed to GET movies for genre: ${genreId}` },
			{ status: 500 },
		);
	}
}
