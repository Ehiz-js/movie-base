import { NextResponse } from "next/server";
import { fetchAnimeEpisodesPage } from "@/lib/anilist";

/** Backs the episode browser's "load more" — pages arrive on demand rather
 *  than fetching a long-running show's entire run up front. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
	const order = searchParams.get("order") === "desc" ? "desc" : "asc";

	const result = await fetchAnimeEpisodesPage(id, page, order);
	return NextResponse.json(result);
}
