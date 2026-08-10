import { NextResponse } from "next/server";
import { searchTitles } from "@/lib/titles";

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
		// Multi-search, so films and series come back together.
		return NextResponse.json(await searchTitles(query));
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: `Failed to GET search results for: ${query}` },
			{ status: 500 },
		);
	}
}
