import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaStar } from "react-icons/fa";
import CommentSection from "@/components/CommentSection";
import WatchListButton from "@/components/WatchListButton";
import AnimeMediaSection from "@/components/AnimeMediaSection";
import { fetchAnimeDetail, fetchAnimeEpisodesPage } from "@/lib/anilist";
import { MovieType } from "@/types/movie";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const anime = await fetchAnimeDetail(id);
	if (!anime) return { title: "Not found" };

	const year = anime.release_date ? ` (${anime.release_date.slice(0, 4)})` : "";
	const description =
		anime.synopsis?.slice(0, 200) ?? `Details for ${anime.title}.`;

	return {
		title: `${anime.title}${year}`,
		description,
		openGraph: {
			title: `${anime.title}${year}`,
			description,
			type: "video.tv_show",
			images: anime.poster_path ? [anime.poster_path] : undefined,
		},
	};
}

export default async function AnimePage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ episode?: string; t?: string }>;
}) {
	const { id } = await params;
	const { episode, t } = await searchParams;
	// Set by Continue Watching links, so resuming actually resumes instead of
	// always restarting at episode 1 (which would also overwrite the saved
	// progress the next time the player reports in).
	const parsedEpisode = episode ? Number.parseInt(episode, 10) : NaN;
	const initialEpisode = Number.isFinite(parsedEpisode) ? parsedEpisode : undefined;
	// Seconds into that episode to seek to once the player's ready.
	const parsedTime = t ? Number.parseFloat(t) : NaN;
	const initialTime = Number.isFinite(parsedTime) ? parsedTime : undefined;

	// One request for the title itself, one for its first page of episodes —
	// both come straight from AniList, so the episode numbers the player gets
	// are already accurate, no TMDB translation involved.
	const [anime, firstPage] = await Promise.all([
		fetchAnimeDetail(id),
		fetchAnimeEpisodesPage(id, 1),
	]);
	if (!anime) notFound();

	const releaseYear = anime.release_date ? anime.release_date.slice(0, 4) : "N/A";
	const rating = Number.isFinite(anime.vote_average)
		? anime.vote_average.toFixed(1)
		: "N/A";

	// WatchListButton/CommentSection only need this MovieSummary-shaped slice —
	// they don't care that the data underneath came from AniList rather than
	// TMDB.
	const watchlistMovie: MovieType = {
		id: anime.id,
		media_type: "anime",
		title: anime.title,
		poster_path: anime.poster_path,
		vote_average: anime.vote_average,
	};

	return (
		<>
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 h-[70vh] overflow-hidden">
					{anime.bannerImage ? (
						<Image
							src={anime.bannerImage}
							alt=""
							fill
							priority
							className="object-cover"
						/>
					) : (
						// Not every title has a banner image — the poster itself,
						// blurred and scaled up, stands in when one is missing.
						anime.poster_path && (
							<Image
								src={anime.poster_path}
								alt=""
								fill
								priority
								className="object-cover object-top scale-110 opacity-60 blur-md"
							/>
						)
					)}
					<div className="absolute inset-0 bg-linear-to-t from-(--background) via-(--background)/80 to-black/50" />
				</div>

				<div className="relative z-1 max-w-6xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40">
					<div className="flex flex-col md:flex-row gap-6 md:gap-8">
						{anime.poster_path ? (
							<div className="relative w-40 sm:w-52 md:w-64 aspect-2/3 shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
								<Image
									src={anime.poster_path}
									alt={anime.title}
									fill
									sizes="(max-width: 640px) 160px, (max-width: 768px) 208px, 256px"
									priority
									className="object-cover"
								/>
							</div>
						) : null}

						<div className="flex flex-col gap-4 min-w-0">
							<div>
								<span className="inline-block rounded-md bg-(--purple-dark) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
									Anime
								</span>
								<h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-balance">
									{anime.title}
								</h1>
								<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300">
									<span className="flex items-center gap-1 font-semibold">
										<FaStar className="text-(--purple-light)" />
										{rating}
									</span>
									<span>{releaseYear}</span>
									{anime.episodes ? (
										<span>
											{anime.episodes} episode{anime.episodes > 1 ? "s" : ""}
										</span>
									) : null}
								</p>
								{anime.genres.length > 0 && (
									<ul className="mt-3 flex flex-wrap gap-2">
										{anime.genres.map((genre) => (
											<li
												key={genre}
												className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-200"
											>
												{genre}
											</li>
										))}
									</ul>
								)}

								{/* AniList gives every season/part of a show its own id rather
								    than one umbrella entry — this is what lets you get from
								    e.g. "Attack on Titan" to "Attack on Titan Season 2". */}
								{anime.seasons.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2">
										{anime.seasons.map((season) => (
											<Link
												key={season.id}
												href={`/anime/${season.id}`}
												className="rounded-full border border-(--purple-dark) px-3 py-1 text-xs font-semibold text-(--purple-light) hover:bg-(--purple-dark) hover:text-white transition-colors duration-200"
											>
												{season.relation === "PREQUEL" ? "← " : ""}
												{season.title}
												{season.relation === "SEQUEL" ? " →" : ""}
											</Link>
										))}
									</div>
								)}
							</div>

							{anime.synopsis && (
								<p className="max-w-2xl text-gray-300 line-clamp-6">
									{anime.synopsis}
								</p>
							)}

							<WatchListButton movie={watchlistMovie} />
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-1 max-w-6xl mx-auto px-4 sm:px-6 mt-10">
				<AnimeMediaSection
					anilistId={anime.id}
					title={anime.title}
					posterUrl={anime.poster_path || null}
					trailerEmbedUrl={anime.trailerEmbedUrl}
					initialEpisodes={firstPage.episodes}
					initialHasNextPage={firstPage.hasNextPage}
					totalEpisodes={anime.episodes}
					initialEpisode={initialEpisode}
					initialTime={initialTime}
				/>
			</section>

			<section className="flex flex-col max-w-6xl mx-auto px-6 p-5 mt-5 gap-10">
				<CommentSection movieId={anime.id} mediaType="anime" />
			</section>
		</>
	);
}
