import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaStar } from "react-icons/fa";
import CommentSection from "@/components/CommentSection";
import { SuggestedMovies } from "@/components/SuggestedMovies";
import WatchListButton from "@/components/WatchListButton";
import { fetchSeason, fetchSuggested, fetchTitleDetail } from "@/lib/titles";
import SeasonBrowser from "@/components/SeasonBrowser";
import TrailerPlayer from "@/components/TrailerPlayer";
import WatchProvidersRow from "@/components/WatchProvidersRow";
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

	const detail = await fetchTitleDetail(mediaType, id);
	if (!detail) return { title: "Not found" };
	const movie = detail.title;

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
	// the app's own /api routes over HTTP. One request brings back the title,
	// its trailer and its availability.
	const detail = await fetchTitleDetail(mediaType, id);
	if (!detail) notFound();

	const { title: movie, trailer, providers } = detail;
	const seasons = movie.seasons ?? [];
	const firstSeason = seasons[0]?.season_number;

	const [suggestedMovieList, firstSeasonEpisodes] = await Promise.all([
		fetchSuggested(movie),
		// Only the opening season ships with the page; the rest load on demand.
		mediaType === "tv" && firstSeason !== undefined
			? fetchSeason(movie.id, firstSeason)
			: Promise.resolve([]),
	]);

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
			<section className="relative">
				<div className="absolute inset-0 h-[70vh]">
					<img
						src={backdropUrl}
						alt=""
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-(--background) via-(--background)/80 to-black/50" />
				</div>

				<div className="relative z-1 max-w-6xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40">
					<div className="flex flex-col md:flex-row gap-6 md:gap-8">
						{poster_path ? (
							<img
								src={posterUrl}
								alt={title}
								className="w-40 sm:w-52 md:w-64 shrink-0 rounded-xl shadow-2xl ring-1 ring-white/10"
							/>
						) : null}

						<div className="flex flex-col gap-4 min-w-0">
							<div>
								<span className="inline-block rounded-md bg-(--purple-dark) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
									{mediaType === "tv" ? "Series" : "Movie"}
								</span>
								<h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-balance">
									{title}
								</h1>
								<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300">
									<span className="flex items-center gap-1 font-semibold">
										<FaStar className="text-(--purple-light)" />
										{rating}
									</span>
									<span>{releaseYear}</span>
									{original_language && (
										<span className="uppercase">{original_language}</span>
									)}
									{seasons.length > 0 && (
										<span>
											{seasons.length} season{seasons.length > 1 ? "s" : ""}
										</span>
									)}
								</p>
								{movie.genres && movie.genres.length > 0 && (
									<ul className="mt-3 flex flex-wrap gap-2">
										{movie.genres.map((genre) => (
											<li
												key={genre.id}
												className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-200"
											>
												{genre.name}
											</li>
										))}
									</ul>
								)}
							</div>

							{overview && (
								<p className="max-w-2xl text-gray-300">{overview}</p>
							)}

							<WatchListButton movie={movie} />
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-1 max-w-6xl mx-auto px-4 sm:px-6 mt-10 grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 flex flex-col gap-6">
					<TrailerPlayer
						trailer={trailer}
						backdropPath={backdrop_path}
						title={title}
					/>

					{mediaType === "tv" && seasons.length > 0 && (
						<SeasonBrowser
							tvId={movie.id}
							seasons={seasons}
							initialSeason={firstSeason ?? 1}
							initialEpisodes={firstSeasonEpisodes}
						/>
					)}
				</div>

				<div className="lg:col-span-1">
					<WatchProvidersRow providers={providers} />
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
