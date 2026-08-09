import { MovieType } from "@/types/movie";
import SearchResult from "./SearchResult";
import { Spinner } from "./ui/spinner";

export default function SearchResultList({
	searchResults,
	isLoading,
}: {
	searchResults: MovieType[];
	isLoading: boolean;
}) {
	return (
		<ul className="absolute top-full left-0 bg-background rounded-md mt-5 z-50 max-h-100 overflow-y-auto min-w-sm border border-(--purple-light)">
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
				searchResults.map((movie: MovieType) => (
					<li key={movie.id}>
						<SearchResult movie={movie} />
					</li>
				))
			)}
		</ul>
	);
}
