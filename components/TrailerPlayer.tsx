"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaServer } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { MovieType, VideoType } from "@/types/movie";
import { PROGRESS_SAVE_INTERVAL_MS, saveWatchProgress } from "@/lib/watchProgress";

type Source = "watch" | "trailer";

// 1. Define your backup servers
const SERVERS = [
	{ name: "VidLink (Fast)", id: "vidlink" },
	{ name: "VidSrc 1", id: "vidsrc_me" },
	{ name: "VidSrc 2", id: "vidsrc_to" },
	{ name: "SuperEmbed", id: "super" },
];

/**
 * The backdrop stands in for the player until it is clicked. Embeds pull a lot
 * of script, so loading one only on demand keeps it off the critical path for
 * the many visitors who never press play.
 *
 * Two sources share the frame. The toggle below it arms one while the player
 * is idle and swaps between them once something is running, so a visitor can
 * check the trailer without having to reload the page to get back.
 */
export default function TrailerPlayer({
	trailer,
	backdropPath,
	title,
	movie,
	mediaType = "movie",
	seasonNumber = 1,
	episodeNumber = 1,
}: {
	trailer: VideoType | null;
	backdropPath?: string;
	title: string;
	movie: MovieType;
	mediaType?: "movie" | "tv";
	seasonNumber?: number;
	episodeNumber?: number;
}) {
	const { user } = useAuth();
	const [playing, setPlaying] = useState(false);
	const [source, setSource] = useState<Source>("watch");

	// 2. State to track which server the user selected
	const [activeServerIdx, setActiveServerIdx] = useState(0);
	// Seeded with the mount time, not 0 — otherwise the very first MEDIA_DATA
	// tick always passes the throttle (Date.now() - 0 is trivially past 10s)
	// and saves whatever near-zero position happens to be current at that
	// instant, before any real progress has had a chance to accumulate.
	const lastSavedAtRef = useRef(Date.now());

	// VidLink broadcasts its whole watch-progress object (every title it has
	// ever seen, not just this one) whenever it changes. Only this title's own
	// entry is pulled out and saved — Continue Watching is Supabase-backed
	// (lib/watchProgress.ts), so there's nothing signed-out visitors can save.
	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== "https://vidlink.pro") return;
			if (event.data?.type !== "MEDIA_DATA" || !user) return;
			if (Date.now() - lastSavedAtRef.current < PROGRESS_SAVE_INTERVAL_MS) return;

			const all = event.data.data as Record<
				string,
				{
					id: number | string;
					type: string;
					// Top-level: frozen at whatever the show's very first-ever
					// watched episode looked like — never updates again. Real,
					// per-episode, continuously-updating data lives one level
					// down, keyed "s{season}e{episode}" — confirmed against a
					// live payload dump where the top-level fields stayed
					// identical across three snapshots taken seconds apart while
					// the nested s7e17 entry was clearly live.
					progress?: { watched: number; duration: number };
					show_progress?: Record<
						string,
						{ progress?: { watched: number; duration: number } }
					>;
				}
			>;
			const match = Object.values(all).find(
				(entry) => String(entry.id) === String(movie.id) && entry.type === mediaType,
			);
			if (!match) return;

			let watched: number;
			let duration: number;
			if (mediaType === "tv") {
				const episodeEntry = match.show_progress?.[`s${seasonNumber}e${episodeNumber}`];
				if (!episodeEntry?.progress?.duration) return;
				watched = episodeEntry.progress.watched;
				duration = episodeEntry.progress.duration;
			} else {
				if (!match.progress?.duration) return;
				watched = match.progress.watched;
				duration = match.progress.duration;
			}

			lastSavedAtRef.current = Date.now();
			saveWatchProgress(user.id, {
				movie_id: movie.id,
				media_type: mediaType,
				title: movie.title,
				poster_path: movie.poster_path,
				// Known from our own state already — no need to trust VidLink's
				// own last_season_watched/last_episode_watched, which lagged
				// behind the actual current episode in the same payload dump.
				season: mediaType === "tv" ? seasonNumber : null,
				episode: mediaType === "tv" ? episodeNumber : null,
				watched,
				duration,
			});
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [user, movie.id, movie.title, movie.poster_path, mediaType, seasonNumber, episodeNumber]);

	const id = movie.id;
	const backdrop = backdropPath
		? `https://image.tmdb.org/t/p/w1280${backdropPath}`
		: null;

	// 3. A function to dynamically generate the URL based on the active server
	const getEmbedUrl = () => {
		const server = SERVERS[activeServerIdx].id;
		const customParams =
			"primaryColor=5b21b6&secondaryColor=0a0a0a&icons=default&iconColor=ffffff&title=true&poster=true&player=jw&";

		if (mediaType === "tv") {
			if (server === "vidlink")
				return `https://vidlink.pro/tv/${id}/${seasonNumber}/${episodeNumber}?${customParams}`;
			if (server === "vidsrc_me")
				return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${seasonNumber}&episode=${episodeNumber}`;
			if (server === "vidsrc_to")
				return `https://vidsrc.to/embed/tv/${id}/${seasonNumber}/${episodeNumber}`;
			if (server === "super")
				return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`;
		} else {
			if (server === "vidlink")
				return `https://vidlink.pro/movie/${id}?${customParams}`;
			if (server === "vidsrc_me")
				return `https://vidsrc.me/embed/movie?tmdb=${id}`;
			if (server === "vidsrc_to") return `https://vidsrc.to/embed/movie/${id}`;
			if (server === "super")
				return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
		}
	};

	// Falling back to the other source keeps the frame from going blank if a
	// title has no trailer at all.
	const active: Source = source === "trailer" && !trailer ? "watch" : source;

	return (
		<div className="flex flex-col gap-3">
			{/* --- VIDEO PLAYER CONTAINER --- */}
			<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-2xl">
				{playing ? (
					active === "trailer" && trailer ? (
						<iframe
							// Keyed so switching source remounts the frame instead of
							// leaving the previous embed's player running underneath.
							key="trailer"
							src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
							title={`${title} trailer`}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="h-full w-full"
						/>
					) : (
						<iframe
							// The server is part of the key too, so picking a different
							// one starts it fresh rather than reusing a frame that has
							// already failed.
							key={`watch-${activeServerIdx}-${seasonNumber}-${episodeNumber}`}
							src={getEmbedUrl()}
							title={`${title} video player`}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="h-full w-full"
						/>
					)
				) : (
					<>
						{backdrop ? (
							<Image
								src={backdrop}
								alt=""
								fill
								className="object-cover opacity-70"
							/>
						) : (
							<div className="h-full w-full bg-linear-to-br from-(--purple-dark)/40 to-black" />
						)}
						<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

						<button
							type="button"
							onClick={() => setPlaying(true)}
							aria-label={
								active === "trailer" ? `Play ${title} trailer` : `Play ${title}`
							}
							className="group absolute inset-0 grid place-items-center cursor-pointer"
						>
							<span className="grid size-16 sm:size-20 place-items-center rounded-full bg-white/90 text-black shadow-2xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-(--purple-dark) group-hover:text-white">
								<FaPlay className="ml-1 size-6" />
							</span>
						</button>

						{active === "trailer" && trailer && (
							<p className="pointer-events-none absolute bottom-4 left-4 right-4 truncate text-sm font-medium text-white/90">
								{trailer.name}
							</p>
						)}
					</>
				)}
			</div>

			{/* Only worth showing when there is something to switch to. */}
			{trailer && (
				<div
					role="group"
					aria-label="Video source"
					className="flex gap-1 self-start rounded-lg bg-white/5 p-1 ring-1 ring-white/10"
				>
					{(
						[
							["watch", mediaType === "tv" ? "Episode" : "Movie"],
							["trailer", "Trailer"],
						] as const
					).map(([value, label]) => (
						<button
							key={value}
							type="button"
							// `playing` is left alone, so switching while something is
							// running swaps the frame rather than dropping the viewer
							// back to the backdrop.
							onClick={() => setSource(value)}
							aria-pressed={active === value}
							className={`rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer transition-colors duration-200 ${
								active === value
									? "bg-(--purple-dark) text-white"
									: "text-gray-300 hover:bg-white/10"
							}`}
						>
							{label}
						</button>
					))}
				</div>
			)}

			{/* --- SERVER SWITCHER CONTROLS --- */}
			{/* Only show this if the user has clicked play! */}
			{/* Hidden while the trailer is up, since it has nothing to do with it. */}
			{playing && active === "watch" && (
				<div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg bg-white/5 ring-1 ring-white/10 w-full">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-400 shrink-0">
						<FaServer className="text-(--purple-light)" />
						<span>If video fails, change server:</span>
					</div>

					<div className="flex flex-wrap items-center gap-2 w-full">
						{SERVERS.map((server, index) => {
							const isActive = activeServerIdx === index;
							return (
								<button
									key={server.id}
									onClick={() => setActiveServerIdx(index)}
									className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
										isActive
											? "bg-(--purple-dark) text-white shadow-md"
											: "bg-black/40 text-gray-400 hover:text-white hover:bg-black/60"
									}`}
								>
									{server.name}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
