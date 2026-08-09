import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const page = searchParams.get("page");

	if (!page || page.trim() === "") {
		return NextResponse.json(
			{ error: "Missing query parameter" },
			{ status: 400 },
		);
	}

	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/movie/popular", {
			page,
		});
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch popular movies" },
			{ status: 500 },
		);
	}
}
