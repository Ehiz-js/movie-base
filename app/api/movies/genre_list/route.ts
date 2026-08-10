import { NextResponse } from "next/server";
import { VISIBLE_GENRES } from "@/lib/genres";

/**
 * Genres are served from the local equivalence map rather than TMDB: the two
 * TMDB lists disagree, and each visible genre maps onto ids for both sides.
 */
export async function GET() {
	return NextResponse.json(VISIBLE_GENRES);
}
