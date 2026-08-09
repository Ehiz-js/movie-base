import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { MovieType } from "@/types/movie";
import MovieCard from "./MovieCard";

export function SuggestedMovies({ movies }: { movies: MovieType[] }) {
	return (
		<Carousel
			opts={{
				align: "start",
			}}
			className="w-full max-w-48 sm:max-w-xs md:max-w-5xl"
		>
			<CarouselContent>
				{movies.map((movie) => (
					<CarouselItem key={movie.id} className="basis-1/2 lg:basis-1/3">
						<div className="p-1">
							<Card>
								<CardContent className="flex aspect-square items-center justify-center p-6">
									<MovieCard movie={movie} />
								</CardContent>
							</Card>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className="cursor-pointer text-(--purple-dark)" />
			<CarouselNext className="cursor-pointer text-(--purple-dark)" />
		</Carousel>
	);
}
