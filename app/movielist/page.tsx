"use client";
import MovieCard from "@/components/MovieCard";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { WatchListMovieType, WatchListRow } from "@/types/movie";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MovieListPage() {
	const [movies, setMovies] = useState<WatchListMovieType[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const { user, session } = useAuth();
	const userId = user?.id;

	useEffect(() => {
		async function fetchWatchlist() {
			if (!userId) {
				setMovies([]);
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			const { data, error } = await supabase
				.from("watchlist")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (error) {
				setError(error.message);
			} else {
				setError("");
				setMovies(
					((data ?? []) as WatchListRow[]).map((row) => ({
						id: row.movie_id,
						media_type: row.media_type ?? "movie",
						title: row.title,
						poster_path: row.poster_path,
						vote_average: row.vote_average,
						id_supabase: row.id_supabase,
					})),
				);
			}
			setIsLoading(false);
		}

		fetchWatchlist();
	}, [userId]);

	async function deleteFromWatchList(idSupabase: string) {
		const previous = movies;
		setMovies((prev) =>
			prev.filter((movie) => movie.id_supabase !== idSupabase),
		);
		const { error } = await supabase
			.from("watchlist")
			.delete()
			.eq("id_supabase", idSupabase);
		if (error) {
			setError(error.message);
			setMovies(previous);
		}
	}

	if (!session) {
		return (
			<section className="mt-24 mb-12">
				<div className="flex w-full flex-col justify-center items-center">
					<h3 className="text-center m-5">
						You must be logged in to view your movie list. Please log in{" "}
						<Link
							href="/auth/login"
							className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
						>
							here
						</Link>
					</h3>
				</div>
			</section>
		);
	}

	return (
		<section className="mt-24 mb-12">
			<div className="flex w-full flex-col justify-center items-center">
				<h3 className="text-center m-5 uppercase">Your Movies</h3>
				{error && <p className="text-red-600 mb-4">{error}</p>}

				{isLoading ? (
					<div className="flex items-center justify-center min-h-100">
						<Spinner className="text-purple-600" />
					</div>
				) : movies.length === 0 ? (
					<p className="text-(--purple-dark) m-5 font-semibold uppercase">
						Please add a movie to your list.
					</p>
				) : (
					<ul className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-350 px-4">
						{movies.map((movie) => (
							<li key={movie.id_supabase}>
								<MovieCard movie={movie} onDelete={deleteFromWatchList} />
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
