"use client";
import { useRef } from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import MovieCard from "./MovieCard";
import { MovieType } from "@/types/movie";

/**
 * One horizontally scrolling row. Scrolling is native — it keeps touch and
 * trackpad behaviour correct on every device — with buttons layered on top for
 * mouse users, who have nothing to swipe with.
 */
export default function TitleRow({
	heading,
	moreHref,
	titles,
}: {
	heading: string;
	moreHref: string;
	titles: MovieType[];
}) {
	const scroller = useRef<HTMLUListElement>(null);

	function scroll(direction: 1 | -1) {
		const el = scroller.current;
		if (!el) return;
		// Page by most of the visible width, leaving a sliver for continuity.
		el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
	}

	if (titles.length === 0) return null;

	return (
		<section className="group/row mb-10">
			<div className="flex items-center justify-between gap-4 mb-3 px-4 sm:px-6 xl:px-16">
				<h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
					<span aria-hidden className="h-5 w-1 rounded bg-(--purple-dark)" />
					{heading}
				</h2>
				<Link
					href={moreHref}
					className="flex items-center gap-1 text-xs sm:text-sm rounded-full border border-(--purple-dark) px-3 py-1 text-(--purple-dark) hover:bg-(--purple-dark) hover:text-white transition-colors duration-200 shrink-0"
				>
					More <FaChevronRight className="size-2.5" />
				</Link>
			</div>

			<div className="relative">
				<ul
					ref={scroller}
					className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 sm:px-6 xl:px-16 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{titles.map((title) => (
						<li
							key={`${title.media_type}-${title.id}`}
							className="snap-start shrink-0 w-32 sm:w-40 md:w-44 lg:w-48"
						>
							<MovieCard movie={title} />
						</li>
					))}
				</ul>

				{/* Pointer-only: touch devices scroll the row directly. */}
				<button
					type="button"
					aria-label={`Scroll ${heading} left`}
					onClick={() => scroll(-1)}
					className="hidden md:grid place-items-center absolute left-2 top-1/3 size-9 rounded-full bg-black/70 text-white opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer"
				>
					<FaChevronLeft />
				</button>
				<button
					type="button"
					aria-label={`Scroll ${heading} right`}
					onClick={() => scroll(1)}
					className="hidden md:grid place-items-center absolute right-2 top-1/3 size-9 rounded-full bg-black/70 text-white opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer"
				>
					<FaChevronRight />
				</button>
			</div>
		</section>
	);
}
