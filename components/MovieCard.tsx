"use client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MovieSummary } from "@/types/movie";
import Link from "next/link";
import { FaStar, FaTimes } from "react-icons/fa";

/**
 * One card, used by the home rows, the browse grids, recently viewed, the
 * watchlist and the suggested-titles carousel. Clicking it records the view
 * for signed-in users; passing `onDelete` adds the remove button the watchlist
 * page needs.
 */
export default function MovieCard({
	movie,
	onDelete,
}: {
	movie: MovieSummary & { id_supabase?: string; release_date?: string };
	onDelete?: (idSupabase: string) => void;
}) {
	const { user } = useAuth();
	const imageUrl = movie.poster_path
		? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
		: null;
	const year = movie.release_date?.slice(0, 4);
	const rating = Number.isFinite(movie.vote_average)
		? movie.vote_average.toFixed(1)
		: null;

	async function recordRecentView() {
		if (!user) return;
		const { error } = await supabase.from("recent_movies").upsert(
			{
				user_id: user.id,
				movie_id: movie.id,
				media_type: movie.media_type,
				title: movie.title,
				poster_path: movie.poster_path,
				vote_average: movie.vote_average,
				// Set explicitly: on the update half of an upsert a column default
				// does not re-fire, so without this the ordering never changes.
				viewed_at: new Date().toISOString(),
			},
			{ onConflict: "user_id,media_type,movie_id" },
		);
		if (error) console.error("Could not record recent view:", error.message);
	}

	return (
		<div className="group relative">
			<Link
				href={`/title/${movie.media_type}/${movie.id}`}
				onClick={recordRecentView}
				className="block overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-(--purple-light) hover:-translate-y-1 transition-all duration-200"
			>
				{/* Fixed ratio keeps every card the same height whatever TMDB returns,
				    including titles with no poster at all. */}
				<div className="relative aspect-2/3 w-full overflow-hidden bg-black/40">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={movie.title}
							loading="lazy"
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="grid h-full w-full place-items-center p-3 text-center text-xs text-gray-400">
							{movie.title}
						</div>
					)}

					<span className="absolute top-2 left-2 rounded-md bg-(--purple-dark) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
						{movie.media_type === "tv" ? "TV" : "Movie"}
					</span>

					{rating && (
						<span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-white">
							<FaStar className="text-(--purple-light) size-2.5" />
							{rating}
						</span>
					)}

					{/* Keeps the title legible when a poster is bright at the bottom. */}
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
				</div>

				<div className="p-2.5">
					<h3 className="truncate text-sm font-semibold" title={movie.title}>
						{movie.title}
					</h3>
					{year && <p className="mt-0.5 text-xs text-gray-400">{year}</p>}
				</div>
			</Link>

			{movie.id_supabase && onDelete && (
				<button
					type="button"
					aria-label={`Remove ${movie.title} from your watchlist`}
					// Bottom-right, because the rating badge occupies the top-right.
					className="absolute bottom-14 right-2 z-10 grid size-7 place-items-center rounded-full bg-black/75 text-red-500 hover:bg-red-600 hover:text-white cursor-pointer transition-colors duration-200"
					onClick={() => onDelete(movie.id_supabase!)}
				>
					<FaTimes className="size-3.5" />
				</button>
			)}
		</div>
	);
}
