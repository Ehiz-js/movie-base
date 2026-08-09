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
import { FormType } from "./OnboardForm";
import { LanguageType } from "@/types/movie";
import { useEffect, useState } from "react";


export function LanguageSelect({
	setFormData,
}: {
	setFormData: React.Dispatch<React.SetStateAction<FormType>>;
}) {
	const [languageList, setLanguageList] = useState<LanguageType[]>([]);

	useEffect(() => {
		async function fetchLanguageList() {
			const res = await fetch("/api/movies/languages_list");
			if (!res.ok) return;
			const languages: LanguageType[] = await res.json();
			const uniqueLanguages = languages.filter(
				(lang, index, self) =>
					index === self.findIndex((l) => l.english_name === lang.english_name),
			);
			setLanguageList(uniqueLanguages);
		}
		fetchLanguageList();
	}, []);

	return (
		<Select
			onValueChange={(selectedName: string) => {
				const selectedLanguage = languageList.find(
					(lang) => lang.english_name === selectedName,
				);
				if (!selectedLanguage) return;
				setFormData((prev) => ({ ...prev, selectedLanguage }));
			}}
		>
			<SelectTrigger className="w-full max-w-48 bg-background border-2 border-(--purple-dark) focus:border">
				<SelectValue placeholder="Select a language" />
			</SelectTrigger>
			<SelectContent
				position="popper"
				className="bg-background border border-(--purple-dark)"
			>
				<SelectGroup>
					<SelectLabel className="text-(--purple-dark)">Languages</SelectLabel>

					{languageList.map((language, index) => (
						<SelectItem
							key={index}
							value={language.english_name}
							className="hover:bg-(--purple-dark) transition-all duration-50"
						>
							{language.english_name || `Language ${index}`}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
