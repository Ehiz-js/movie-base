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
		<section className="mt-24 mb-12 px-4 sm:px-6 xl:px-16">
			<h3 className="text-center m-5 uppercase">
				{trimmed ? `Results for “${trimmed}”` : "Search"}
			</h3>

			{!trimmed ? (
				<p className="text-gray-400 min-h-100 flex items-center justify-center">
					Type a film name in the search box above.
				</p>
			) : results === null ? (
				<p className="text-red-600 min-h-100 flex items-center justify-center">
					Could not run that search. Please try again.
				</p>
			) : results.length === 0 ? (
				<p className="text-(--purple-dark) min-h-100 flex items-center justify-center uppercase font-semibold">
					No search results for this query
				</p>
			) : (
				// Same column breakpoints as the browse grid, so search results and
				// browse pages read as one consistent layout.
				<ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{results.map((movie) => (
						// Films and series share an id space, so the pair is the key.
						<li key={`${movie.media_type}-${movie.id}`}>
							<MovieCard movie={movie} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
