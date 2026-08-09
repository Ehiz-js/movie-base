import { MovieType } from "@/types/movie";
import SearchResult from "./SearchResult";
import { Spinner } from "./ui/spinner";
import Link from "next/link";

export default function SearchResultList({
	searchResults,
	isLoading,
	totalResults,
	query,
}: {
	searchResults: MovieType[];
	isLoading: boolean;
	totalResults: number;
	query: string;
}) {
	return (
		<ul
			className="absolute top-full left-0 bg-background rounded-md mt-5 z-50 max-h-100 overflow-y-auto min-w-sm border border-(--purple-light)
  [&::-webkit-scrollbar]:w-1.5 
  [&::-webkit-scrollbar-track]:bg-transparent 
  [&::-webkit-scrollbar-thumb]:bg-(--purple-dark) 
  [&::-webkit-scrollbar-thumb]:rounded-full 
  hover:[&::-webkit-scrollbar-thumb]:bg-purple-500
  /* Firefox scrollbar styles */
  [scrollbar-width:thick] 
  [scrollbar-color:var(--purple-dark)_transparent]"
		>
			{isLoading ? (
				<div className="flex w-full min-h-100 items-center justify-center">
					<Spinner className="text-purple-600" />
				</div>
			) : searchResults.length === 0 ? (
				<div className="flex w-full min-h-20 items-center justify-center p-4">
					<p className="text-sm text-(--purple-dark)">
						No search results for this query
					</p>
				</div>
			) : (
				<>
					{searchResults.map((movie: MovieType) => (
						<li key={movie.id}>
							<SearchResult movie={movie} />
						</li>
					))}
					{/* The dropdown previews five; the rest live on the results page. */}
					{totalResults > searchResults.length && (
						<li>
							<Link
								href={`/search?query=${encodeURIComponent(query)}`}
								className="block p-3 text-center text-sm font-semibold text-(--purple-dark) hover:bg-gray-950 transition-all duration-200"
							>
								See all {totalResults} results
							</Link>
						</li>
					)}
				</>
			)}
		</ul>
	);
}
