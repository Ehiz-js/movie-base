import { MovieType } from "@/types/movie";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function SearchResult({ movie }: { movie: MovieType }) {
	const { title, poster_path, id, vote_average, media_type } = movie;
	const posterUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;
	return (
		<Link
			href={`/title/${media_type}/${id}`}
			className="flex items-center w-full p-2 hover:bg-purple-950 transition-colors duration-200"
		>
			<div className="flex items-center ">
				<img
					src={posterUrl}
					alt={title}
					className="rounded-lg w-[60px] h-auto object-cover flex-shrink-0"
				/>
				<div className="flex flex-col justify-center w-full ml-3">
					<h2 className="font-medium text-sm md:text-base">{title}</h2>
					<div className="flex items-center gap-1 mt-1">
						<FaStar className="text-(--purple-dark) " />
						<span className="text-sm font-semibold">
							{vote_average.toFixed(1)}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
