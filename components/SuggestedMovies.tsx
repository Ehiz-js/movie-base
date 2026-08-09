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
			// 1. Used a viewport width (vw) for mobile to leave room for arrows, and mx-auto to center it
			className="w-full max-w-[75vw] sm:max-w-md md:max-w-3xl lg:max-w-5xl mx-auto"
		>
			<CarouselContent className="-ml-2 md:-ml-4">
				{movies.map((movie) => (
					// 2. Responsive basis: 1 card on mobile, 2 on small screens, 3 on tablet, 4 on desktop
					<CarouselItem
						key={movie.id}
						className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
					>
						<div className="p-1 h-full">
							<Card className="h-full">
								{/* 3. Removed aspect-square and huge p-6 which squashes vertical movie posters */}
								<CardContent className="flex items-center justify-center p-2 h-full">
									<MovieCard movie={movie} />
								</CardContent>
							</Card>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			{/* 4. Optional: Add hidden md:flex if you want to hide these arrows entirely on mobile (users can still swipe!) */}
			<CarouselPrevious className="-left-6 md:-left-12 cursor-pointer text-(--purple-dark)" />
			<CarouselNext className="-right-6 md:-right-12 cursor-pointer text-(--purple-dark)" />
		</Carousel>
	);
}
