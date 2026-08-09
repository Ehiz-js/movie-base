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

export default function GenreSelect({
	genreList,
	handleClick,
}: {
	genreList: GenreType[];
	handleClick: (genreId: string) => void;
}) {
	return (
		<Select onValueChange={(value) => handleClick(value)}>
			<SelectTrigger className="w-full max-w-48 bg-background border-2 border-(--purple-dark) focus:border">
				<SelectValue placeholder="Filter by Genre" />
			</SelectTrigger>
			<SelectContent
				position="popper"
				className="bg-background border border-(--purple-dark)"
			>
				<SelectGroup>
					<SelectLabel className="text-(--purple-dark)">Genre</SelectLabel>
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
