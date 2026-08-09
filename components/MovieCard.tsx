"use client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MovieSummary } from "@/types/movie";
import Link from "next/link";
import { FaStar, FaTimes } from "react-icons/fa";

/**
 * One card, used by the home grid, the recently-viewed strip, the watchlist
 * page and the suggested-movies carousel. Clicking it records the view for
 * signed-in users; passing `onDelete` adds the remove button the watchlist
 * page needs.
 */
export default function MovieCard({
	movie,
	onDelete,
}: {
	movie: MovieSummary & { id_supabase?: string };
	onDelete?: (idSupabase: string) => void;
}) {
	const { user } = useAuth();
	const imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

	async function recordRecentView() {
		if (!user) return;
		const { error } = await supabase.from("recent_movies").upsert(
			{
				user_id: user.id,
				movie_id: movie.id,
				title: movie.title,
				poster_path: movie.poster_path,
				vote_average: movie.vote_average,
				// Set explicitly: on the update half of an upsert a column default
				// does not re-fire, so without this the ordering never changes.
				viewed_at: new Date().toISOString(),
			},
			{ onConflict: "user_id,movie_id" },
		);
		if (error) console.error("Could not record recent view:", error.message);
	}

	return (
		<div className="relative">
			<Link href={`/movie/${movie.id}`} onClick={recordRecentView}>
				<div className="cursor-pointer hover:scale-95 transition-transform duration-200 w-full max-w-62.5 mx-auto">
					<img src={imageUrl} alt={movie.title} className="rounded-lg" />
					<div className="flex justify-between items-center gap-4 mb-1">
						<h2 className="mt-2 font-semibold">{movie.title}</h2>
						<div className="flex items-center gap-2">
							<FaStar className="text-(--purple-dark) mt-1" />
							<span className="mt-2 font-semibold">
								{movie.vote_average.toFixed(1)}
							</span>
						</div>
					</div>
				</div>
			</Link>
			{movie.id_supabase && onDelete && (
				<button
					type="button"
					aria-label={`Remove ${movie.title} from your watchlist`}
					className="absolute top-2 right-2 z-10"
					onClick={() => onDelete(movie.id_supabase!)}
				>
					<FaTimes className="text-red-600 size-8 cursor-pointer hover:text-red-300 hover:scale-150 transition-all duration-100" />
				</button>
			)}
		</div>
	);
}
