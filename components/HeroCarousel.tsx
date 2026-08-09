"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { MovieType } from "@/types/movie";

const ROTATE_MS = 7000;

/**
 * Top films, one at a time, on their own backdrop. Rotates on a timer that
 * pauses on hover and stops entirely for anyone who has asked for reduced
 * motion.
 */
export default function HeroCarousel({ titles }: { titles: MovieType[] }) {
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);

	useEffect(() => {
		if (paused || titles.length < 2) return;
		if (
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			return;
		}
		const timer = setInterval(
			() => setIndex((current) => (current + 1) % titles.length),
			ROTATE_MS,
		);
		return () => clearInterval(timer);
	}, [paused, titles.length]);

	if (titles.length === 0) return null;

	const active = titles[Math.min(index, titles.length - 1)];
	const year = active.release_date?.slice(0, 4);

	return (
		<section
			className="relative h-[62vh] min-h-90 w-full overflow-hidden"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
		>
			{titles.map((title, i) => (
				<img
					key={`${title.media_type}-${title.id}`}
					src={`https://image.tmdb.org/t/p/original${title.backdrop_path}`}
					alt=""
					aria-hidden={i !== index}
					className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
						i === index ? "opacity-100" : "opacity-0"
					}`}
				/>
			))}

			{/* Two gradients: one for text legibility, one to blend into the page. */}
			<div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-(--background) to-transparent" />

			<div className="relative z-1 flex h-full flex-col justify-end gap-3 px-4 sm:px-6 xl:px-16 pb-16 max-w-3xl">
				<span className="uppercase tracking-widest text-xs text-(--purple-light)">
					{active.media_type === "tv" ? "Series" : "Movie"}
				</span>
				<h1 className="text-3xl sm:text-5xl font-bold text-white text-balance">
					{active.title}
				</h1>
				<div className="flex items-center gap-3 text-sm text-gray-200">
					<span className="flex items-center gap-1">
						<FaStar className="text-(--purple-light)" />
						{active.vote_average.toFixed(1)}
					</span>
					{year && <span>{year}</span>}
				</div>
				{active.overview && (
					<p className="hidden sm:block text-gray-300 line-clamp-3">
						{active.overview}
					</p>
				)}
				<div>
					<Link
						href={`/title/${active.media_type}/${active.id}`}
						className="inline-block mt-2 p-3 px-5 bg-(--purple-dark) text-white font-semibold rounded-lg shadow-lg hover:bg-white hover:text-(--purple-dark) transition-colors duration-200"
					>
						View details
					</Link>
				</div>
			</div>

			<div className="absolute bottom-6 right-4 sm:right-6 xl:right-16 z-1 flex gap-2">
				{titles.map((title, i) => (
					<button
						key={`dot-${title.media_type}-${title.id}`}
						type="button"
						aria-label={`Show ${title.title}`}
						aria-current={i === index}
						onClick={() => setIndex(i)}
						className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
							i === index
								? "w-6 bg-(--purple-light)"
								: "w-3 bg-white/50 hover:bg-white/80"
						}`}
					/>
				))}
			</div>
		</section>
	);
}
