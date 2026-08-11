import { supabase } from "@/lib/supabase";
import { MediaType } from "@/types/movie";

/**
 * Continue Watching, backed by Supabase instead of localStorage. The old
 * localStorage approach had two problems: it was per-browser rather than
 * per-account (didn't respect login at all, and one browser shared by two
 * people mixed up their progress), and VidLink's own cross-origin memory
 * would silently resync a "cleared" localStorage right back. A signed-in-only,
 * server-backed row sidesteps both.
 *
 * Callers throttle their own writes (see PROGRESS_SAVE_INTERVAL_MS) — this
 * module just does the upsert/select, it doesn't rate-limit anything itself.
 */

export const PROGRESS_SAVE_INTERVAL_MS = 10_000;

const MIN_FRACTION = 0.02; // Barely started — likely an accidental click.
// Effectively finished — credits are rolling. For a movie that means done,
// nothing left to resume. For tv/anime it only means *this episode* is done —
// the row is kept and bumped to the next episode instead (see
// ContinueWatchingRow.tsx), rather than disappearing the moment you finish
// whatever you were on.
export const MAX_FRACTION = 0.95;

export interface WatchProgressEntry {
	movie_id: number;
	media_type: MediaType;
	title: string;
	poster_path: string;
	/** tv only. */
	season?: number | null;
	/** tv and anime. */
	episode?: number | null;
	watched: number;
	duration: number;
}

/** One row per (user, media_type, movie_id) — upserted, never appended. */
export async function saveWatchProgress(userId: string, entry: WatchProgressEntry) {
	const { error } = await supabase.from("watch_progress").upsert(
		{
			user_id: userId,
			movie_id: entry.movie_id,
			media_type: entry.media_type,
			title: entry.title,
			poster_path: entry.poster_path,
			season: entry.season ?? null,
			episode: entry.episode ?? null,
			watched: entry.watched,
			duration: entry.duration,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id,media_type,movie_id" },
	);
	if (error) console.error("Could not save watch progress:", error.message);
}

export interface ContinueWatchingRecord {
	movie_id: number;
	media_type: MediaType;
	title: string;
	poster_path: string;
	season: number | null;
	episode: number | null;
	watched: number;
	duration: number;
}

/** Everything worth offering a "resume" link for, newest first. */
export async function fetchContinueWatching(
	userId: string,
): Promise<ContinueWatchingRecord[]> {
	const { data, error } = await supabase
		.from("watch_progress")
		.select("movie_id, media_type, title, poster_path, season, episode, watched, duration")
		.eq("user_id", userId)
		.order("updated_at", { ascending: false })
		.limit(12);

	if (error) {
		console.error("Could not load continue watching:", error.message);
		return [];
	}

	return ((data ?? []) as ContinueWatchingRecord[]).filter((row) => {
		if (!row.duration) return false;
		const fraction = row.watched / row.duration;
		if (fraction <= MIN_FRACTION) return false;
		// Movies: nothing left to resume once basically finished, so drop it.
		// tv/anime keep going even past this fraction — see MAX_FRACTION above.
		if (row.media_type === "movie" && fraction >= MAX_FRACTION) return false;
		return true;
	});
}
