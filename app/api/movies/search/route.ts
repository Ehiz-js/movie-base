import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query");

	if (!query || query.trim() === "") {
		return NextResponse.json(
			{ error: "Missing query parameter" },
			{ status: 400 },
		);
	}

	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/search/movie", {
			query,
		});
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: `Failed to GET search results for: ${query}` },
			{ status: 500 },
		);
	}
}
