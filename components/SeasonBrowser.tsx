"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaRegClock, FaStar } from "react-icons/fa";
import { Spinner } from "./ui/spinner";
import { EpisodeType, SeasonSummary } from "@/types/movie";

/**
 * Season pills over a grid of episode numbers, with the chosen episode shown
 * in full below. Seasons load on demand — a long-running series would
 * otherwise mean dozens of requests for episodes nobody has asked to see.
 *
 * Looking through seasons never disturbs the player: only picking an episode
 * does that, so you can check how long S03 runs while S01E05 keeps going. That
 * means the grid has two different things to show — what you are browsing and
 * what is actually playing — so the playing episode carries a dot, and a
 * season you are only passing through starts with nothing selected at all.
 */
export default function SeasonBrowser({
	tvId,
	seasons,
	initialSeason,
	initialEpisodes,
	playingSeason,
	playingEpisode,
	onEpisodeChange,
}: {
	tvId: number;
	seasons: SeasonSummary[];
	initialSeason: number;
	initialEpisodes: EpisodeType[];
	playingSeason: number;
	playingEpisode: number;
	onEpisodeChange: (season: number, episode: number) => void;
}) {
	const [seasonNumber, setSeasonNumber] = useState(initialSeason);
	const [episodes, setEpisodes] = useState<EpisodeType[]>(initialEpisodes);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// The first season arrives with the page, so skip refetching it.
		if (seasonNumber === initialSeason) {
			setEpisodes(initialEpisodes);
			return;
		}

		let cancelled = false;
		async function loadSeason() {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/tv/${tvId}/season/${seasonNumber}`);
				if (!res.ok) throw new Error(`Request failed (${res.status})`);
				const data: EpisodeType[] = await res.json();
				if (cancelled) return;
				setEpisodes(data);
			} catch (error) {
				console.error(error);
				if (!cancelled) setEpisodes([]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		loadSeason();

		return () => {
			cancelled = true;
		};
	}, [tvId, seasonNumber, initialSeason, initialEpisodes]);

	// Only the season being played has a marked episode. Anywhere else the grid
	// is purely something to look through, so nothing is highlighted until you
	// pick — and picking is what moves the player.
	const playing =
		seasonNumber === playingSeason
			? episodes.find((episode) => episode.episode_number === playingEpisode)
			: undefined;

	return (
		<div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5">
			<div className="flex flex-wrap gap-2">
				{seasons.map((season) => {
					const active = season.season_number === seasonNumber;
					return (
						<button
							key={season.id}
							type="button"
							onClick={() => setSeasonNumber(season.season_number)}
							aria-pressed={active}
							className={`rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer transition-colors duration-200 ${
								active
									? "bg-(--purple-dark) text-white"
									: "bg-white/5 text-gray-300 hover:bg-white/10"
							}`}
						>
							S{String(season.season_number).padStart(2, "0")}
						</button>
					);
				})}
			</div>

			<div className="mt-4 min-h-14">
				{isLoading ? (
					<div className="flex h-14 items-center justify-center">
						<Spinner className="size-6 text-purple-600" />
					</div>
				) : episodes.length === 0 ? (
					<p className="py-4 text-sm text-gray-400">
						No episodes listed for this season.
					</p>
				) : (
					<div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
						{episodes.map((episode) => {
							const active = episode.id === playing?.id;
							return (
								<button
									key={episode.id}
									type="button"
									// Picking an episode is the only thing that moves the
									// player — switching seasons deliberately does not.
									onClick={() =>
										onEpisodeChange(seasonNumber, episode.episode_number)
									}
									aria-pressed={active}
									aria-current={active ? "true" : undefined}
									title={active ? `${episode.name} — now playing` : episode.name}
									className={`relative grid h-10 place-items-center rounded-md text-sm font-semibold tabular-nums cursor-pointer transition-colors duration-200 ${
										active
											? "bg-(--purple-dark) text-white"
											: "bg-white/5 text-gray-300 hover:bg-white/10"
									}`}
								>
									{String(episode.episode_number).padStart(2, "0")}
									{active && (
										<>
											{/* Sits under the number rather than replacing the
											    fill, so "playing" reads the same on the season
											    you are watching as on one you have wandered
											    back to. */}
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
			</div>

			{playing && !isLoading && (
				<article className="mt-5 flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-5">
					{playing.still_path ? (
						<Image
							src={`https://image.tmdb.org/t/p/w300${playing.still_path}`}
							alt=""
							width={224}
							height={126}
							className="w-full sm:w-56 h-auto shrink-0 rounded-lg object-cover"
						/>
					) : (
						<div className="grid h-32 w-full sm:w-56 shrink-0 place-items-center rounded-lg bg-black/40 text-xs text-gray-500">
							No preview
						</div>
					)}

					<div className="min-w-0">
						<h3 className="font-semibold">
							<span className="text-(--purple-light)">
								E{String(playing.episode_number).padStart(2, "0")}
							</span>{" "}
							{playing.name}
						</h3>

						<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
							{playing.air_date && <span>{playing.air_date}</span>}
							{playing.runtime ? (
								<span className="flex items-center gap-1">
									<FaRegClock className="size-3" />
									{playing.runtime} min
								</span>
							) : null}
							{playing.vote_average ? (
								<span className="flex items-center gap-1">
									<FaStar className="size-3 text-(--purple-light)" />
									{playing.vote_average.toFixed(1)}
								</span>
							) : null}
						</div>

						{playing.overview && (
							<p className="mt-2 text-sm text-gray-300 line-clamp-4">
								{playing.overview}
							</p>
						)}
					</div>
				</article>
			)}

			{/* Browsing a season other than the one playing. Say what is still
			    running, so a half-explored grid never looks like nothing is on. */}
			{!playing && !isLoading && episodes.length > 0 && (
				<p className="mt-5 border-t border-white/10 pt-5 text-sm text-gray-400">
					Pick an episode to play it — S
					{String(playingSeason).padStart(2, "0")}E
					{String(playingEpisode).padStart(2, "0")} is still playing.
				</p>
			)}
		</div>
	);
}
