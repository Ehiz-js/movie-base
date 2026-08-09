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
import { SORT_OPTIONS } from "@/lib/tmdb";

export default function SortSelect({
	handleClick,
	sortValue,
}: {
	handleClick: (sortValue: string) => void;
	sortValue: string;
}) {
	return (
		<Select value={sortValue || "Popularity"} onValueChange={handleClick}>
			<SelectTrigger className="w-full max-w-48 bg-background border-2 border-(--purple-dark) focus:border">
				<SelectValue placeholder="Sort Movies" />
			</SelectTrigger>
			<SelectContent
				position="popper"
				className="bg-background border border-(--purple-dark)"
			>
				<SelectGroup>
					<SelectLabel className="text-(--purple-dark)">Sort by</SelectLabel>
					{SORT_OPTIONS.map((sort) => (
						<SelectItem
							key={sort}
							value={sort}
							className="hover:bg-(--purple-dark) transition-all duration-50"
						>
							{sort}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
