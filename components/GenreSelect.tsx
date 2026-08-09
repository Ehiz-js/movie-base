"use client";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { GenreType } from "@/types/movie";

/**
 * Radix Select treats "" as "no value", so clearing the filter needs an
 * explicit sentinel item rather than an empty-valued one.
 */
export const ALL_GENRES = "all";

export default function GenreSelect({
	genreList,
	genreId,
	handleClick,
}: {
	genreList: GenreType[];
	genreId: string;
	handleClick: (genreId: string) => void;
}) {
	return (
		<Select value={genreId || ALL_GENRES} onValueChange={handleClick}>
			<SelectTrigger className="w-full max-w-48 bg-background border-2 border-(--purple-dark) focus:border">
				<SelectValue placeholder="Filter by Genre" />
			</SelectTrigger>
			<SelectContent
				position="popper"
				className="bg-background border border-(--purple-dark)"
			>
				<SelectGroup>
					<SelectLabel className="text-(--purple-dark)">Genre</SelectLabel>
					<SelectItem
						value={ALL_GENRES}
						className="hover:bg-(--purple-dark) transition-all duration-50"
					>
						All genres
					</SelectItem>
					{genreList.map((genre: GenreType) => (
						<SelectItem
							key={genre.id}
							value={genre.id.toString()}
							className="hover:bg-(--purple-dark) transition-all duration-50"
						>
							{genre.name}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
