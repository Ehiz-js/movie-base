"use client";
import Image from "next/image";
import { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { MovieType, VideoType } from "@/types/movie";

/**
 * The backdrop stands in for the player until it is clicked. YouTube's embed
 * pulls a lot of script, so loading it only on demand keeps it off the
 * critical path for the many visitors who never press play.
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
	const [playing, setPlaying] = useState(false);
	const id = movie.id;
	const backdrop = backdropPath
		? `https://image.tmdb.org/t/p/w1280${backdropPath}`
		: null;
	const customParams =
		"primaryColor=5b21b6&secondaryColor=0a0a0a&icons=default&iconColor=ffffff&title=true&poster=true&autoplay=true&player=jw";
	const embedUrl =
		mediaType === "tv"
			? `https://vidlink.pro/tv/${id}/${seasonNumber}/${episodeNumber}?nextbutton=true&${customParams}`
			: `https://vidlink.pro/movie/${id}?${customParams}`;

	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
			{playing ? (
				<iframe
					src={embedUrl}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="h-full w-full"
				/>
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
						aria-label={`Play ${title}`}
						className="group absolute inset-0 grid place-items-center cursor-pointer"
					>
						<span className="grid size-16 sm:size-20 place-items-center rounded-full bg-white/90 text-black shadow-2xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-(--purple-dark) group-hover:text-white">
							<FaPlay className="ml-1 size-6" />
						</span>
					</button>
				</>
			)}
		</div>
	);
}
