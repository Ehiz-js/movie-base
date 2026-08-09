import { MovieType } from "@/types/movie";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function SearchResult({ movie }: { movie: MovieType }) {
	const { title, poster_path, id, vote_average } = movie;
	const posterUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;
	return (
		<Link href={`/movie/${id}`}>
			<div className="flex items-center hover:bg-gray-950 transition-all duration-200">
				<img src={posterUrl} alt={title} className="rounded-lg" />
				<div className="flex flex-col justify-center w-full ml-2">
					<h2 className="p-2 cursor-pointer">{title}</h2>
					<div className="flex items-center gap-1 pb-2">
						<FaStar className="text-(--purple-dark) mt-1" />
						<span className="mt-2 font-semibold">
							{vote_average.toFixed(1)}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
