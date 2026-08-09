import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const data = await tmdbFetch<MovieType>(`/movie/${encodeURIComponent(id)}`);
		return NextResponse.json(data);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: `Failed to GET movie ID: ${id}` },
			{ status: 500 },
		);
	}
}
