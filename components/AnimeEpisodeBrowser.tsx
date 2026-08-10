"use client";
import { useState } from "react";
import { FaArrowDownWideShort, FaArrowUpWideShort, FaStar } from "react-icons/fa6";
import { Spinner } from "./ui/spinner";
import { AnimeEpisode } from "@/types/anime";

/** Below this, "load more" a couple of times is no real burden — the reverse
 *  toggle only earns its place once a show is long enough (One Piece,
 *  Naruto...) that reaching the tail otherwise means clicking it repeatedly. */
const REVERSE_TOGGLE_THRESHOLD = 100;

/**
 * Flat episode grid with "load more" pagination — anime has no seasons on
 * AniList's side, just one continuous, sometimes very long, episode list
 * (One Piece is 1000+), so pages arrive only as they're asked for.
 *
 * Long shows also get a newest-first toggle: someone caught up near the
 * latest episode shouldn't have to click "load more" a dozen times and
 * scroll to the bottom just to find it.
 */
export default function AnimeEpisodeBrowser({
	anilistId,
	initialEpisodes,
	initialHasNextPage,
	totalEpisodes,
	playingEpisode,
	onEpisodeChange,
}: {
	anilistId: number;
	initialEpisodes: AnimeEpisode[];
	initialHasNextPage: boolean;
	totalEpisodes: number | null;
	playingEpisode: number;
	onEpisodeChange: (episode: number) => void;
}) {
	const [episodes, setEpisodes] = useState(initialEpisodes);
	const [page, setPage] = useState(1);
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
	const [isLoading, setIsLoading] = useState(false);

	async function loadPage(nextPage: number, nextOrder: "asc" | "desc", replace: boolean) {
		setIsLoading(true);
		try {
			const res = await fetch(
				`/api/anime/${anilistId}/episodes?page=${nextPage}&order=${nextOrder}`,
			);
			if (!res.ok) throw new Error(`Request failed (${res.status})`);
			const data: { episodes: AnimeEpisode[]; hasNextPage: boolean } =
				await res.json();
			setEpisodes((current) => (replace ? data.episodes : [...current, ...data.episodes]));
			setHasNextPage(data.hasNextPage);
			setPage(nextPage);
			setOrder(nextOrder);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	function toggleOrder() {
		if (order === "asc") {
			loadPage(1, "desc", true);
		} else {
			// Back to the state the page already shipped with — no request needed.
			setEpisodes(initialEpisodes);
			setHasNextPage(initialHasNextPage);
			setPage(1);
			setOrder("asc");
		}
	}

	const playing = episodes.find((episode) => episode.number === playingEpisode);

	return (
		<div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<h3 className="text-sm font-semibold text-gray-300">Episodes</h3>

				{totalEpisodes && totalEpisodes > REVERSE_TOGGLE_THRESHOLD && (
					<button
						type="button"
						onClick={toggleOrder}
						disabled={isLoading}
						className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 ring-1 ring-white/10 hover:bg-white/10 cursor-pointer transition-colors duration-200 disabled:opacity-60"
					>
						{order === "asc" ? (
							<>
								<FaArrowDownWideShort className="size-3" />
								Newest first
							</>
						) : (
							<>
								<FaArrowUpWideShort className="size-3" />
								Oldest first
							</>
						)}
					</button>
				)}
			</div>

			{episodes.length === 0 ? (
				<p className="py-4 text-sm text-gray-400">No episodes listed yet.</p>
			) : (
				<div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
					{episodes.map((episode) => {
						const active = episode.number === playingEpisode;
						return (
							<button
								key={episode.number}
								type="button"
								onClick={() => onEpisodeChange(episode.number)}
								aria-pressed={active}
								aria-current={active ? "true" : undefined}
								title={active ? `${episode.title} — now playing` : episode.title}
								className={`relative grid h-10 place-items-center rounded-md text-sm font-semibold tabular-nums cursor-pointer transition-colors duration-200 ${
									active
										? "bg-(--purple-dark) text-white"
										: "bg-white/5 text-gray-300 hover:bg-white/10"
								}`}
							>
								{String(episode.number).padStart(2, "0")}
								{active && (
									<>
										<span
											aria-hidden
											className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white"
										/>
										<span className="sr-only"> (now playing)</span>
									</>
								)}
							</button>
						);
					})}
				</div>
			)}

			{hasNextPage && (
				<button
					type="button"
					onClick={() => loadPage(page + 1, order, false)}
					disabled={isLoading}
					className="mt-4 flex items-center gap-2 text-sm font-semibold text-(--purple-light) hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-60"
				>
					{isLoading && <Spinner className="size-4" />}
					{order === "asc" ? "Load more episodes" : "Load earlier episodes"}
				</button>
			)}

			{playing && (
				<article className="mt-5 border-t border-white/10 pt-5">
					<h3 className="font-semibold">
						<span className="text-(--purple-light)">
							E{String(playing.number).padStart(2, "0")}
						</span>{" "}
						{playing.title}
					</h3>

					<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
						{playing.aired && <span>{new Date(playing.aired).toLocaleDateString()}</span>}
						{playing.score ? (
							<span className="flex items-center gap-1">
								<FaStar className="size-3 text-(--purple-light)" />
								{playing.score.toFixed(1)}
							</span>
						) : null}
						{playing.filler && <span className="text-yellow-500">Filler</span>}
					</div>
				</article>
			)}
		</div>
	);
}
