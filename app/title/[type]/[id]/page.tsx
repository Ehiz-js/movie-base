import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import { SuggestedMovies } from "@/components/SuggestedMovies";
import WatchListButton from "@/components/WatchListButton";
import { fetchSuggested, fetchTitle } from "@/lib/titles";
import { MediaType, MovieType } from "@/types/movie";

function parseMediaType(value: string): MediaType | null {
	return value === "movie" || value === "tv" ? value : null;
}

/**
 * Next dedupes identical fetches within a render, so calling getMovie here as
 * well as in the page does not cost a second TMDB request.
 */
export async function generateMetadata({
	params,
}: {
	params: Promise<{ type: string; id: string }>;
}): Promise<Metadata> {
	const { type, id } = await params;
	const mediaType = parseMediaType(type);
	if (!mediaType) return { title: "Not found" };

	const movie = await fetchTitle(mediaType, id);
	if (!movie) return { title: "Not found" };

	const year = movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : "";
	const description =
		movie.overview?.slice(0, 200) ?? `Details and reviews for ${movie.title}.`;

	return {
		title: `${movie.title}${year}`,
		description,
		openGraph: {
			title: `${movie.title}${year}`,
			description,
			type: "video.movie",
			images: movie.poster_path
				? [`https://image.tmdb.org/t/p/w780${movie.poster_path}`]
				: undefined,
		},
	};
}

export default async function TitlePage({
	params,
}: {
	params: Promise<{ type: string; id: string }>;
}) {
	const { type, id } = await params;
	const mediaType = parseMediaType(type);
	if (!mediaType) notFound();

	// This runs on the server, so it calls TMDB directly rather than fetching
	// the app's own /api routes over HTTP.
	const movie = await fetchTitle(mediaType, id);
	if (!movie) notFound();

	const suggestedMovieList = await fetchSuggested(movie);

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
				<CommentSection movieId={movie.id} mediaType={movie.media_type} />
			</section>
		</>
	);
}
