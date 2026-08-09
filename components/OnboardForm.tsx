"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { GenreComboBox } from "./GenreComboBox";
import { Switch } from "./ui/switch";
import { LanguageSelect } from "./LanguageSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GenreType, LanguageType } from "@/types/movie";

export interface FormType {
	username: string;
	selectedGenreList: GenreType[];
	mature: boolean;
	selectedLanguage: LanguageType | null;
}

const initialData: FormType = {
	username: "",
	selectedGenreList: [],
	mature: false,
	selectedLanguage: null,
};

type FormErrorsType = Partial<Record<keyof FormType, string>> & {
	form?: string;
};

export default function OnboardForm() {
	const router = useRouter();
	const [formData, setFormData] = useState<FormType>(initialData);
	const [error, setError] = useState<FormErrorsType>({});
	const [isLoading, setIsLoading] = useState(false);
	const { user, refreshProfile } = useAuth();

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const { username, selectedGenreList, selectedLanguage, mature } = formData;

		const newErrors: FormErrorsType = {};
		if (!username.trim()) newErrors.username = "Username is required";
		if (selectedGenreList.length === 0)
			newErrors.selectedGenreList = "Select at least one genre";
		if (!selectedLanguage) newErrors.selectedLanguage = "Please select a language";

		setError(newErrors);
		// Return before the spinner goes up, so a validation failure can't leave
		// the form hidden behind it.
		if (Object.keys(newErrors).length > 0) return;

		if (!user?.id) {
			setError({ form: "You must be signed in to complete your profile." });
			return;
		}

		setIsLoading(true);
		const { error: insertError } = await supabase.from("profiles").insert([
			{
				user_id: user.id,
				username: username.trim(),
				selected_genres: selectedGenreList,
				mature,
				selected_language: selectedLanguage?.english_name,
			},
		]);

		if (insertError) {
			setIsLoading(false);
			setError({ form: insertError.message });
			return;
		}

		await refreshProfile(user.id);
		setIsLoading(false);
		router.push("/");
	}

	return (
		<form
			className="flex flex-col min-h-screen items-center justify-center gap-7"
			onSubmit={handleSubmit}
		>
			{isLoading ? (
				<Spinner className="text-purple-600" />
			) : (
				<>
					<div className="w-60 flex flex-col items-center text-(--purple-dark) uppercase font-semibold">
						<h1>Complete your profile</h1>
						<hr className="mt-4 border-t border-(--purple-dark) w-full" />
					</div>
					<div className="flex flex-col items-start gap-2 w-60">
						<label htmlFor="username">Username</label>
						<Input
							value={formData.username}
							onChange={(e) => {
								setFormData({ ...formData, username: e.target.value });
							}}
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
							placeholder="Example Nameson"
							id="username"
							type="text"
							name="username"
						/>
						{error.username && (
							<p className="text-sm font-extralight text-red-600">
								{error.username}
							</p>
						)}
					</div>
					<div className="flex flex-col items-start relative gap-2 w-60">
						<label htmlFor="genres">Select Preferred Genres</label>
						<GenreComboBox setFormData={setFormData} formData={formData} />
						{error.selectedGenreList && (
							<p className="text-sm font-extralight text-red-600">
								{error.selectedGenreList}
							</p>
						)}
					</div>
					<div className="flex flex-col items-start relative gap-2 w-60">
						<label htmlFor="mature">Maturity rating</label>
						<Switch
							id="mature"
							checked={formData.mature}
							onCheckedChange={(checked) => {
								setFormData((prev) => ({ ...prev, mature: checked }));
							}}
							className="bg-gray-400 data-[state=checked]:bg-purple-500 transition-colors"
						/>
					</div>
					<div className="flex flex-col items-start relative gap-2 w-60">
						<label htmlFor="language">Select Language</label>
						<LanguageSelect setFormData={setFormData} />
						{error.selectedLanguage && (
							<p className="text-sm font-extralight text-red-600">
								{error.selectedLanguage}
							</p>
						)}
					</div>
					{error.form && (
						<p className="text-sm font-extralight text-red-600">{error.form}</p>
					)}
					<button
						disabled={isLoading}
						type="submit"
						className="p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200 hover:scale-90 cursor-pointer flex gap-2 items-center w-60 justify-center"
					>
						Submit
					</button>
				</>
			)}
		</form>
	);
}
