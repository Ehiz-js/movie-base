"use client";
import { FaSearch } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import SearchResultList from "./SearchResultList";
import { MovieType } from "@/types/movie";

export default function Search() {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<MovieType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(true);
	const searchListRef = useRef<HTMLDivElement>(null);
	const debounceQuery = useDebounce(searchQuery, 500);
	const router = useRouter();

	// Enter goes to the full results page; the dropdown only ever previews the
	// first few matches.
	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const query = searchQuery.trim();
		if (!query) return;
		setOpen(false);
		router.push(`/search?query=${encodeURIComponent(query)}`);
	}

	useEffect(() => {
		let cancelled = false;

		const fetchSearch = async () => {
			if (!debounceQuery) {
				setSearchResults([]);
				return;
			}
			setIsLoading(true);
			try {
				const res = await fetch(
					`/api/movies/search?query=${encodeURIComponent(debounceQuery)}`,
				);
				if (!res.ok) throw new Error(`Request failed (${res.status})`);
				const movies = await res.json();
				if (!cancelled) {
					setSearchResults(Array.isArray(movies) ? movies : []);
				}
			} catch (err) {
				console.error(err);
				if (!cancelled) setSearchResults([]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		fetchSearch();
		return () => {
			cancelled = true;
		};
	}, [debounceQuery]);

	useEffect(() => {
		function handleOuterClick(event: MouseEvent) {
			if (
				searchListRef.current &&
				!searchListRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			} else {
				setOpen(true);
			}
		}
		document.addEventListener("mousedown", handleOuterClick);

		return () => {
			document.removeEventListener("mousedown", handleOuterClick);
		};
	}, []);

	return (
		<div className="relative" ref={searchListRef}>
			<form
				onSubmit={handleSubmit}
				className="flex flex-row items-center gap-2 bg-white p-2 rounded-md w-fit"
			>
				<input
					type="text"
					placeholder="Find a Movie..."
					aria-label="Search movies"
					className="text-(--purple-dark) font-bold outline-none"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<button
					type="submit"
					aria-label="Search"
					className="cursor-pointer"
				>
					<FaSearch style={{ color: "#5b21b6" }} />
				</button>
			</form>
			{open && debounceQuery && (
				<div>
					<SearchResultList
						searchResults={searchResults.slice(0, 5)}
						isLoading={isLoading}
						totalResults={searchResults.length}
						query={debounceQuery}
					/>
				</div>
			)}
		</div>
	);
}
