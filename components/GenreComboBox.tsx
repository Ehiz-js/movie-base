"use client";

import * as React from "react";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { FormType } from "./OnboardForm";
import { GenreType } from "@/types/movie";


export function GenreComboBox({
	formData,
	setFormData,
}: {
	formData: FormType;
	setFormData: React.Dispatch<React.SetStateAction<FormType>>;
}) {
	const [genreList, setGenreList] = React.useState<GenreType[]>([]);
	const anchor = useComboboxAnchor();

	React.useEffect(() => {
		async function fetchGenreList() {
			const res = await fetch("/api/movies/genre_list");
			if (!res.ok) return;
			setGenreList(await res.json());
		}
		fetchGenreList();
	}, []);

	return (
		<Combobox
			multiple
			autoHighlight
			items={genreList.map((g) => g.name)}
			value={formData.selectedGenreList.map((g) => g.name)}
			onValueChange={(value: string[]) => {
				const selectedObjects = genreList.filter((g) => value.includes(g.name));
				setFormData((prev) => ({
					...prev,
					selectedGenreList: selectedObjects,
				}));
			}}
		>
			<ComboboxChips
				ref={anchor}
				className="w-full max-w-xs border border-(--purple-dark) focus:outline-(--purple-light) rounded-md p-2"
			>
				<ComboboxValue>
					{(values) => (
						<>
							{values.map((value: string, index: number) => (
								<ComboboxChip
									key={`${value}-${index}`}
									className="bg-background border border-(--purple-dark)"
								>
									{value}
								</ComboboxChip>
							))}
							<ComboboxChipsInput />
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent
				anchor={anchor}
				className="bg-background border border-(--purple-dark)"
			>
				<ComboboxEmpty>No items found.</ComboboxEmpty>
				<ComboboxList>
					{genreList.map((item) => (
						<ComboboxItem
							key={item.id}
							value={item.name}
							className="hover:bg-(--purple-dark) transition-all duration-50"
						>
							{item.name}
						</ComboboxItem>
					))}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
