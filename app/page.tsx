"use client";
import { useEffect, useMemo, useState } from "react";
import MovieCard from "@/components/MovieCard";
import GenreSelect, { ALL_GENRES } from "@/components/GenreSelect";
import SortSelect from "@/components/SortSelect";
import Pagination from "@/components/Pagination";
import RecentMovieList from "@/components/RecentMovieList";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getSortedMovies } from "@/lib/tmdb";
import {
	GenreType,
	MovieSummary,
	MovieType,
	RecentMovieRow,
	toMovieSummary,
} from "@/types/movie";

const MAX_PAGES = 10;
const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

export default function Home() {
	const { user } = useAuth();
	const userId = user?.id;

	const [movies, setMovies] = useState<MovieType[]>([]);
	const [genreList, setGenreList] = useState<GenreType[]>([]);
	const [recentMovies, setRecentMovies] = useState<MovieSummary[]>([]);

	const [genreId, setGenreId] = useState("");
	const [sortValue, setSortValue] = useState("");
	const [pageNum, setPageNum] = useState(1);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchGenres() {
			try {
				const res = await fetch("/api/movies/genre_list");
				if (!res.ok) return;
				setGenreList(await res.json());
			} catch (err) {
				console.error(err);
			}
		}
		fetchGenres();
	}, []);

	// One fetch drives the grid. Which endpoint it hits depends on whether a
	// genre is selected, so filtering and pagination stay in step instead of
	// overwriting each other.
	useEffect(() => {
		let cancelled = false;

		async function fetchMovies() {
			setIsLoading(true);
			setError("");
			const url = genreId
				? `/api/movies/filtered_movie_list?genreId=${genreId}&page=${pageNum}`
				: `/api/movies/movie_page?page=${pageNum}`;
			try {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`Request failed (${res.status})`);
				const data = await res.json();
				if (!cancelled) setMovies(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error(err);
				if (!cancelled) {
					setMovies([]);
					setError("Could not load movies. Please try again.");
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		fetchMovies();
		return () => {
			cancelled = true;
		};
	}, [genreId, pageNum]);

	useEffect(() => {
		if (!userId) {
			setRecentMovies([]);
			return;
		}
		async function fetchRecent() {
			const { data, error } = await supabase
				.from("recent_movies")
				.select("*")
				.eq("user_id", userId)
				.order("viewed_at", { ascending: false })
				.limit(4);

			if (error) {
				console.error(error);
				return;
			}
			const now = Date.now();
			const recent = ((data ?? []) as RecentMovieRow[])
				.filter((row) => now - new Date(row.viewed_at).getTime() <= MS_IN_A_DAY)
				.map(toMovieSummary);
			setRecentMovies(recent);
		}
		fetchRecent();
	}, [userId]);

	// Sorting is derived rather than written back into `movies`, so switching
	// sort order never destroys the order the API returned.
	const visibleMovies = useMemo(
		() => getSortedMovies(sortValue, movies),
		[sortValue, movies],
	);

	function filterMovies(nextGenreId: string) {
		setGenreId(nextGenreId === ALL_GENRES ? "" : nextGenreId);
		setPageNum(1);
	}

	return (
		<>
			{recentMovies.length > 0 && (
				<RecentMovieList recentMovies={recentMovies} />
			)}
			<section className={`mb-12 ${recentMovies.length > 0 ? "" : "mt-24"}`}>
				<div className="flex w-full flex-col justify-center items-center">
					<div className="flex flex-col md:flex-row items-center w-full justify-around gap-3">
						<h3 className="text-center m-5 uppercase">
							{genreId
								? genreList.find((g) => String(g.id) === genreId)?.name
								: "Popular"}{" "}
							movies
						</h3>
						<div className="flex flex-col sm:flex-row gap-3">
							<GenreSelect
								handleClick={filterMovies}
								genreList={genreList}
								genreId={genreId}
							/>
							<SortSelect handleClick={setSortValue} />
						</div>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center min-h-100">
							<Spinner className="text-purple-600" />
						</div>
					) : error ? (
						<p className="text-red-600 min-h-100 flex items-center">{error}</p>
					) : visibleMovies.length === 0 ? (
						<p className="text-(--purple-dark) min-h-100 flex items-center uppercase font-semibold">
							No movies found.
						</p>
					) : (
						<ul className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-350">
							{visibleMovies.map((movie: MovieType) => (
								<li key={movie.id}>
									<MovieCard movie={movie} />
								</li>
							))}
						</ul>
					)}

					<Pagination
						pageNum={pageNum}
						hasNext={pageNum < MAX_PAGES}
						incrementPageNum={() =>
							setPageNum((prev) => Math.min(prev + 1, MAX_PAGES))
						}
						decrementPageNum={() => setPageNum((prev) => Math.max(prev - 1, 1))}
					/>
				</div>
			</section>
		</>
	);
}
