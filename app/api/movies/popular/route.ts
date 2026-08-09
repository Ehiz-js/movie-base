import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET() {
	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/movie/popular");
		return NextResponse.json(data.results);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to GET popular movies" },
			{ status: 500 },
		);
	}
}
