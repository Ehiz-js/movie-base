import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { GenreType } from "@/types/movie";

export async function GET() {
	try {
		const data = await tmdbFetch<{ genres: GenreType[] }>("/genre/movie/list", {
			language: "en-US",
		});
		return NextResponse.json(data.genres);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to GET genre list" },
			{ status: 500 },
		);
	}
}
