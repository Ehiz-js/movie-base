"use client";
import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import MovieCard from "./MovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MovieSummary, RecentMovieRow, toMovieSummary } from "@/types/movie";

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

/**
 * Recently viewed, collapsed by default so it never pushes the main rows down
 * the page. Fetches its own data because it is per-user and the page around it
 * is rendered on the server.
 */
export default function RecentMovieList() {
	const { user } = useAuth();
	const userId = user?.id;
	const [recent, setRecent] = useState<MovieSummary[]>([]);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchRecent() {
			if (!userId) {
				if (!cancelled) setRecent([]);
				return;
			}
			const { data, error } = await supabase
				.from("recent_movies")
				.select("*")
				.eq("user_id", userId)
				.order("viewed_at", { ascending: false })
				.limit(12);

			if (cancelled) return;
			if (error) {
				console.error(error);
				return;
			}
			const now = Date.now();
			setRecent(
				((data ?? []) as RecentMovieRow[])
					.filter(
						(row) => now - new Date(row.viewed_at).getTime() <= MS_IN_A_DAY,
					)
					.map(toMovieSummary),
			);
		}

		fetchRecent();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	if (recent.length === 0) return null;

	return (
		<section className="mb-10">
			{/* Padding and width mirror TitleRow so this section lines up with the
			    carousels below it. */}
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				aria-expanded={open}
				className="flex items-center gap-2 mb-3 px-10 sm:px-12 xl:px-20 text-lg sm:text-xl font-semibold cursor-pointer hover:text-(--purple-dark) transition-colors duration-200"
			>
				<span aria-hidden className="h-5 w-1 rounded bg-(--purple-dark)" />
				Recently viewed
				<span className="text-sm font-normal text-gray-500">
					({recent.length})
				</span>
				<FaChevronDown
					className={`size-3 transition-transform duration-200 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>

			{open && (
				<Carousel
					opts={{ align: "start", slidesToScroll: "auto" }}
					className="w-full max-w-[88vw] sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-[85rem] mx-auto"
				>
					<CarouselContent className="-ml-2 md:-ml-4 items-stretch">
						{recent.map((title) => (
							<CarouselItem
								key={`${title.media_type}-${title.id}`}
								className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/6"
							>
								<MovieCard movie={title} />
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="-left-3 md:-left-12 cursor-pointer text-(--purple-dark)" />
					<CarouselNext className="-right-3 md:-right-12 cursor-pointer text-(--purple-dark)" />
				</Carousel>
			)}
		</section>
	);
}
