import { MovieType } from "@/types/movie";
import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function SearchResult({ movie }: { movie: MovieType }) {
	const { title, poster_path, id, vote_average, media_type } = movie;
	// Anime posters already arrive as full AniList CDN URLs; everything else is a
	// bare TMDB path that still needs its base prefixed on.
	const posterUrl = poster_path.startsWith("http")
		? poster_path
		: `https://image.tmdb.org/t/p/w185${poster_path}`;
	const href =
		media_type === "anime" ? `/anime/${id}` : `/title/${media_type}/${id}`;
	return (
		<Link
			href={href}
			className="flex items-center w-full p-2 hover:bg-purple-950 transition-colors duration-200"
		>
			<div className="flex items-center ">
				{poster_path ? (
					<Image
						src={posterUrl}
						alt={title}
						width={60}
						height={90}
						className="rounded-lg object-cover shrink-0"
					/>
				) : (
					<div className="grid h-[90px] w-[60px] shrink-0 place-items-center rounded-lg bg-white/5 text-[10px] text-gray-500">
						No art
					</div>
				)}
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
