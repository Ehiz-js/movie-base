import { MovieSummary } from "@/types/movie";
import MovieCard from "./MovieCard";

export default function RecentMovieList({
	recentMovies,
}: {
	recentMovies: MovieSummary[];
}) {
	return (
		<section className="mt-24">
			<div className="flex w-full flex-col justify-center items-center">
				<h3 className="text-center m-5 uppercase">Recently viewed movies</h3>

				<ul className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-350 px-4 mx-auto">
					{recentMovies.map((movie) => (
						<li key={movie.id}>
							<MovieCard movie={movie} />
						</li>
					))}
				</ul>
				<hr className="w-6xl mb-5 mt-2 text-(--purple-dark)" />
			</div>
		</section>
	);
}
