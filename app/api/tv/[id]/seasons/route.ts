import { NextResponse } from "next/server";
import { fetchTitle } from "@/lib/titles";

/**
 * Season numbers and episode counts only — backs ContinueWatchingRow's
 * season-rollover check (does finishing episode N mean the season's done,
 * and if so does a next season exist to roll into). Nothing else on the
 * client needs the rest of a show's detail just for this.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const title = await fetchTitle("tv", id);
	if (!title) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const seasons = (title.seasons ?? []).map((season) => ({
		season_number: season.season_number,
		episode_count: season.episode_count,
	}));
	return NextResponse.json({ seasons });
}
