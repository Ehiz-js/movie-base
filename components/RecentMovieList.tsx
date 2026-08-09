"use client";
import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import MovieCard from "./MovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MovieSummary, RecentMovieRow, toMovieSummary } from "@/types/movie";

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

/**
 * Recently viewed, collapsed by default so it never pushes the main rows down
 * the page. Fetches its own data because it is per-user and the page around it
 * is rendered on the server.
 */
export default function RecentMovieList() {
	const { user } = useAuth();
	const userId = user?.id;
	const [recent, setRecent] = useState<MovieSummary[]>([]);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchRecent() {
			if (!userId) {
				if (!cancelled) setRecent([]);
				return;
			}
			const { data, error } = await supabase
				.from("recent_movies")
				.select("*")
				.eq("user_id", userId)
				.order("viewed_at", { ascending: false })
				.limit(12);

			if (cancelled) return;
			if (error) {
				console.error(error);
				return;
			}
			const now = Date.now();
			setRecent(
				((data ?? []) as RecentMovieRow[])
					.filter(
						(row) => now - new Date(row.viewed_at).getTime() <= MS_IN_A_DAY,
					)
					.map(toMovieSummary),
			);
		}

		fetchRecent();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	if (recent.length === 0) return null;

	return (
		<section className="mb-10 px-4 sm:px-6 xl:px-16">
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				aria-expanded={open}
				className="flex items-center gap-2 text-lg sm:text-xl font-semibold cursor-pointer hover:text-(--purple-dark) transition-colors duration-200"
			>
				<span aria-hidden className="h-5 w-1 rounded bg-(--purple-dark)" />
				Recently viewed
				<span className="text-sm font-normal text-gray-500">
					({recent.length})
				</span>
				<FaChevronDown
					className={`size-3 transition-transform duration-200 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>

			{open && (
				<ul className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
					{recent.map((title) => (
						<li key={`${title.media_type}-${title.id}`}>
							<MovieCard movie={title} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
