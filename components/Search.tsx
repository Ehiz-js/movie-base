"use client";
import { FaSearch } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import useDebounce from "@/hooks/useDebounce";
import SearchResultList from "./SearchResultList";
import { MovieType } from "@/types/movie";

export default function Search() {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<MovieType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(true);
	const searchListRef = useRef<HTMLDivElement>(null);
	const debounceQuery = useDebounce(searchQuery, 500);

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
			<div className="flex flex-row items-center bg-white p-2 rounded-md m-auto">
				<input
					type="text"
					placeholder="Find a Movie..."
					aria-label="Search movies"
					className="text-(--purple-dark) font-bold outline-none"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<FaSearch style={{ color: "#5b21b6" }} />
			</div>
			{open && debounceQuery && (
				<div>
					<SearchResultList
						searchResults={searchResults.slice(0, 5)}
						isLoading={isLoading}
					/>
				</div>
			)}
		</div>
	);
}
