import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { MovieType } from "@/types/movie";
import MovieCard from "./MovieCard";

/**
 * Mirrors TitleRow's carousel so suggestions sit on the same grid as every
 * other row. MovieCard draws its own panel, so it is placed directly in the
 * slide — wrapping it in a shadcn Card nested one card inside another and
 * forced heights the poster's fixed ratio could not fill.
 */
export function SuggestedMovies({ movies }: { movies: MovieType[] }) {
	if (movies.length === 0) return null;

	return (
		<Carousel
			opts={{ align: "start", slidesToScroll: "auto" }}
			className="w-full max-w-[78vw] sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-[85rem] mx-auto"
		>
			<CarouselContent className="-ml-2 md:-ml-4 items-stretch">
				{movies.map((movie) => (
					<CarouselItem
						// Films and series can share an id, so the pair is the key.
						key={`${movie.media_type}-${movie.id}`}
						className="pl-2 md:pl-4 h-auto basis-1/2 sm:basis-1/4 md:basis-1/4 lg:basis-1/6"
					>
						<MovieCard movie={movie} />
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className="-left-6 md:-left-12 cursor-pointer text-(--purple-dark)" />
			<CarouselNext className="-right-6 md:-right-12 cursor-pointer text-(--purple-dark)" />
		</Carousel>
	);
}
