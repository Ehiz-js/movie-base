import { NextResponse } from "next/server";
import { fetchSeason } from "@/lib/titles";

/** Backs the season switcher, which loads a season only when it is opened. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string; season: string }> },
) {
	const { id, season } = await params;
	const seasonNumber = Number.parseInt(season, 10);

	if (!Number.isFinite(seasonNumber) || seasonNumber < 0) {
		return NextResponse.json({ error: "Invalid season" }, { status: 400 });
	}

	const episodes = await fetchSeason(id, seasonNumber);
	return NextResponse.json(episodes);
}
