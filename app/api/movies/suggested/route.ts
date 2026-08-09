import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const genres = searchParams.get("genres");

	if (!genres || genres.trim() === "") {
		return NextResponse.json(
			{ error: "Missing query parameter" },
			{ status: 400 },
		);
	}

	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/discover/movie", {
			with_genres: genres,
		});
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch suggested movies" },
			{ status: 500 },
		);
	}
}
