"use client";
import Image from "next/image";
import { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { VideoType } from "@/types/movie";

/**
 * The backdrop stands in for the player until it is clicked. YouTube's embed
 * pulls a lot of script, so loading it only on demand keeps it off the
 * critical path for the many visitors who never press play.
 */
export default function TrailerPlayer({
	trailer,
	backdropPath,
	title,
}: {
	trailer: VideoType | null;
	backdropPath?: string;
	title: string;
}) {
	const [playing, setPlaying] = useState(false);

	const backdrop = backdropPath
		? `https://image.tmdb.org/t/p/w1280${backdropPath}`
		: null;

	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
			{playing && trailer ? (
				<iframe
					src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
					title={`${title} trailer`}
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

					{trailer ? (
						<button
							type="button"
							onClick={() => setPlaying(true)}
							aria-label={`Play ${title} trailer`}
							className="group absolute inset-0 grid place-items-center cursor-pointer"
						>
							<span className="grid size-16 sm:size-20 place-items-center rounded-full bg-white/90 text-black shadow-2xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-(--purple-dark) group-hover:text-white">
								<FaPlay className="ml-1 size-6" />
							</span>
						</button>
					) : (
						<div className="absolute inset-0 grid place-items-center">
							<p className="text-sm text-gray-400">No trailer available</p>
						</div>
					)}

					{trailer && (
						<p className="absolute bottom-4 left-4 right-4 truncate text-sm font-medium text-white/90">
							{trailer.name}
						</p>
					)}
				</>
			)}
		</div>
	);
}
