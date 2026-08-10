import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import MovieCard from "./MovieCard";
import { MovieType } from "@/types/movie";

/**
 * One row of the home page: a heading, a link to the full grid, and a
 * carousel of titles. Uses the same carousel as the suggested-movies row so
 * every slider on the site behaves identically.
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
	if (titles.length === 0) return null;

	return (
		<section className="mb-10">
			<div className="flex items-center justify-between gap-4 mb-3 px-10 sm:px-12 xl:px-20">
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

			<Carousel
				opts={{ align: "start", slidesToScroll: "auto" }}
				className="w-full max-w-[88vw] sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-[85rem] mx-auto"
			>
				<CarouselContent className="-ml-2 md:-ml-4 items-stretch">
					{titles.map((title) => (
						<CarouselItem
							key={`${title.media_type}-${title.id}`}
							className="pl-2 md:pl-4  basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/6"
						>
							<MovieCard movie={title} />
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="-left-3 md:-left-12 cursor-pointer text-(--purple-dark)" />
				<CarouselNext className="-right-3 md:-right-12 cursor-pointer text-(--purple-dark)" />
			</Carousel>
		</section>
	);
}
