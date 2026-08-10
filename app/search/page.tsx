import type { Metadata } from "next";
import MovieCard from "@/components/MovieCard";
import { searchTitles } from "@/lib/titles";
import { MovieType } from "@/types/movie";

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ query?: string }>;
}): Promise<Metadata> {
	const { query } = await searchParams;
	return {
		title: query ? `Search: ${query}` : "Search",
	};
}

async function searchMovies(query: string): Promise<MovieType[] | null> {
	try {
		return await searchTitles(query);
	} catch {
		return null;
	}
}

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<{ query?: string }>;
}) {
	const { query } = await searchParams;
	const trimmed = query?.trim() ?? "";
	// Runs on the server, so the full result set is rendered directly rather
	// than refetched in the browser.
	const results = trimmed ? await searchMovies(trimmed) : [];

	return (
		<section className="mt-24 mb-12">
			<div className="flex w-full flex-col justify-center items-center">
				<h3 className="text-center m-5 uppercase">
					{trimmed ? `Results for “${trimmed}”` : "Search"}
				</h3>

				{!trimmed ? (
					<p className="text-gray-400 min-h-100 flex items-center">
						Type a film name in the search box above.
					</p>
				) : results === null ? (
					<p className="text-red-600 min-h-100 flex items-center">
						Could not run that search. Please try again.
					</p>
				) : results.length === 0 ? (
					<p className="text-(--purple-dark) min-h-100 flex items-center uppercase font-semibold">
						No search results for this query
					</p>
				) : (
					<ul className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-350">
						{results.map((movie) => (
							// Films and series share an id space, so the pair is the key.
							<li key={`${movie.media_type}-${movie.id}`}>
								<MovieCard movie={movie} />
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
