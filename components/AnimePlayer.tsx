"use client";
import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import { FaClosedCaptioning, FaMicrophone, FaPlay } from "react-icons/fa6";

type Source = "watch" | "trailer";
type Audio = "sub" | "dub";

const ANIXO_ORIGIN = "https://anixo.buzz";

/**
 * AniXo's anime embed is keyed by an AniList id and episode number directly —
 * no TMDB id or season translation involved, which is the whole point of
 * sourcing anime from AniList end to end. The other embeds this app uses
 * (VidLink, VidSrc, SuperEmbed) key off TMDB ids, which anime from AniList
 * never has.
 *
 * Their embed-sdk.js is required for the iframe to unlock at all — it just
 * answers a postMessage handshake confirming the iframe isn't sandboxed, no
 * DOM access or tracking beyond that (read the source before adding this).
 */
export default function AnimePlayer({
	anilistId,
	episodeNumber,
	posterUrl,
	title,
	trailerEmbedUrl,
}: {
	anilistId: number;
	episodeNumber: number;
	posterUrl: string | null;
	title: string;
	trailerEmbedUrl?: string;
}) {
	const [playing, setPlaying] = useState(false);
	const [source, setSource] = useState<Source>("watch");
	const [audio, setAudio] = useState<Audio>("sub");

	const active: Source = source === "trailer" && !trailerEmbedUrl ? "watch" : source;
	const watchUrl = `${ANIXO_ORIGIN}/embed/ani/${anilistId}/${episodeNumber}/${audio}?color=%235b21b6`;

	return (
		<div className="flex flex-col gap-3">
			<Script src="https://anixo.buzz/embed-sdk.js" strategy="afterInteractive" />

			<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-2xl">
				{playing ? (
					active === "trailer" && trailerEmbedUrl ? (
						<iframe
							key="trailer"
							src={trailerEmbedUrl}
							title={`${title} trailer`}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="h-full w-full"
						/>
					) : (
						<iframe
							// Audio track is part of the key too, so switching sub/dub
							// starts the embed fresh rather than reusing a stalled frame.
							key={`watch-${audio}-${episodeNumber}`}
							src={watchUrl}
							title={`${title} video player`}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="h-full w-full"
						/>
					)
				) : (
					<>
						{posterUrl ? (
							<Image
								src={posterUrl}
								alt=""
								fill
								className="object-cover object-top opacity-70 blur-sm scale-110"
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
					</>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-3">
				{trailerEmbedUrl && (
					<div
						role="group"
						aria-label="Video source"
						className="flex gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/10"
					>
						{(
							[
								["watch", "Episode"],
								["trailer", "Trailer"],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
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

				{active === "watch" && (
					<div
						role="group"
						aria-label="Audio"
						className="flex gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/10"
					>
						{(
							[
								["sub", "Sub", FaClosedCaptioning],
								["dub", "Dub", FaMicrophone],
							] as const
						).map(([value, label, Icon]) => (
							<button
								key={value}
								type="button"
								onClick={() => setAudio(value)}
								aria-pressed={audio === value}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer transition-colors duration-200 ${
									audio === value
										? "bg-(--purple-dark) text-white"
										: "text-gray-300 hover:bg-white/10"
								}`}
							>
								<Icon className="size-3" />
								{label}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
