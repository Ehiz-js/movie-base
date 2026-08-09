import { notFound } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import { SuggestedMovies } from "@/components/SuggestedMovies";
import WatchListButton from "@/components/WatchListButton";
import { tmdbFetch } from "@/lib/tmdbServer";
import { MovieType } from "@/types/movie";

async function getMovie(id: string): Promise<MovieType | null> {
	try {
		return await tmdbFetch<MovieType>(`/movie/${encodeURIComponent(id)}`);
	} catch (error) {
		console.error(error);
		return null;
	}
}

async function getSuggested(movie: MovieType): Promise<MovieType[]> {
	const genreIds = movie.genres?.map((genre) => genre.id).join(",");
	if (!genreIds) return [];
	try {
		const data = await tmdbFetch<{ results: MovieType[] }>("/discover/movie", {
			with_genres: genreIds,
		});
		return data.results.filter((suggestion) => suggestion.id !== movie.id);
	} catch (error) {
		console.error(error);
		return [];
	}
}

export default async function MoviePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	// This runs on the server, so it calls TMDB directly rather than fetching
	// the app's own /api routes over HTTP.
	const movie = await getMovie(id);
	if (!movie) notFound();

	const suggestedMovieList = await getSuggested(movie);

	const {
		backdrop_path,
		original_language,
		overview,
		poster_path,
		release_date,
		title,
		vote_average,
	} = movie;
	const posterUrl = `https://image.tmdb.org/t/p/w500${poster_path}`;
	const backdropUrl = `https://image.tmdb.org/t/p/original${backdrop_path}`;
	const releaseYear = release_date ? release_date.slice(0, 4) : "N/A";
	const rating = Number.isFinite(vote_average)
		? vote_average.toFixed(1)
		: "N/A";

	return (
		<>
			<section>
				<div className="absolute inset-0">
					<img
						src={backdropUrl}
						alt={title}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/60" />
				</div>

				<div className="relative z-1 max-w-6xl mx-auto px-6 pt-40">
					<div className="flex flex-col md:flex-row gap-8">
						<img
							src={posterUrl}
							alt={title}
							className="w-84 rounded-lg shadow-2xl"
						/>

						<div className="flex flex-col justify-between pb-12">
							<div>
								<h1 className="text-5xl font-bold mb-4">{title}</h1>
								<p className="uppercase">
									{rating} | {original_language} | {releaseYear}
								</p>
							</div>
							<div>
								<WatchListButton movie={movie} />
								<p className="mt-6 max-w-md text-gray-300">{overview}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{suggestedMovieList.length > 0 && (
				<section className="flex flex-col items-center p-auto mt-25">
					<h2 className="uppercase font-semibold text-2xl text-(--purple-dark)">
						Suggested Movies
					</h2>
					<hr className="w-6xl mt-2 text-(--purple-dark)" />
					<SuggestedMovies movies={suggestedMovieList} />
				</section>
			)}

			<section className="flex flex-col max-w-6xl mx-auto px-6 p-5 mt-5 gap-10">
				<CommentSection movieId={movie.id} />
			</section>
		</>
	);
}
