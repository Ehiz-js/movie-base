import { NextResponse } from "next/server";
import { fetchAnimeDetail } from "@/lib/anilist";

/**
 * Total episode count only — backs ContinueWatchingRow's finished-show check
 * (does finishing this episode mean the show itself is done, same as
 * app/api/tv/[id]/seasons does for series). Nothing else on the client needs
 * the rest of an anime's detail just for this.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const anime = await fetchAnimeDetail(id);
	if (!anime) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
	return NextResponse.json({ episodes: anime.episodes });
}
