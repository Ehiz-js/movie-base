"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardForm() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const { user, session, refreshProfile } = useAuth();
	const userId = user?.id;

	// The profile is editable, not write-once, so an existing one is loaded
	// back into the form rather than presented as blank.
	useEffect(() => {
		let cancelled = false;
		async function loadProfile() {
			if (!userId) {
				if (!cancelled) setIsLoadingProfile(false);
				return;
			}
			const { data, error } = await supabase
				.from("profiles")
				.select("username")
				.eq("user_id", userId)
				.maybeSingle();

			if (cancelled) return;
			if (error) console.error(error);
			if (data?.username) setUsername(data.username);
			setIsLoadingProfile(false);
		}
		loadProfile();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		// Validate before the spinner goes up, so a validation failure cannot
		// leave the form hidden behind it.
		if (!username.trim()) {
			setError("Username is required");
			return;
		}

		if (!user?.id) {
			setError("You must be signed in to save your profile.");
			return;
		}

		setIsLoading(true);
		// Upsert, not insert: profiles.user_id is unique, so re-submitting the
		// form to change a username would otherwise fail on the constraint.
		const { error: saveError } = await supabase.from("profiles").upsert(
			{ user_id: user.id, username: username.trim() },
			{ onConflict: "user_id" },
		);

		if (saveError) {
			setIsLoading(false);
			setError(saveError.message);
			return;
		}

		await refreshProfile(user.id);
		setIsLoading(false);
		router.push("/");
	}

	if (!session) {
		return (
			<div className="flex flex-col min-h-screen items-center justify-center gap-4 px-6 text-center">
				<h1 className="uppercase font-semibold text-(--purple-dark)">Profile</h1>
				<p>
					Please log in{" "}
					<Link
						href="/auth/login"
						className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
					>
						here
					</Link>{" "}
					to set up your profile.
				</p>
			</div>
		);
	}

	if (isLoadingProfile) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner className="text-purple-600" />
			</div>
		);
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
						<h1>Your profile</h1>
						<hr className="mt-4 border-t border-(--purple-dark) w-full" />
					</div>
					<div className="flex flex-col items-start gap-2 w-60">
						<label htmlFor="username">Username</label>
						<Input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
							placeholder="Example Nameson"
							id="username"
							type="text"
							name="username"
						/>
						<p className="text-sm text-gray-500">
							This is the name shown on your comments.
						</p>
						{error && (
							<p className="text-sm font-extralight text-red-600">{error}</p>
						)}
					</div>
					<button
						disabled={isLoading}
						type="submit"
						className="p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200 hover:scale-90 cursor-pointer flex gap-2 items-center w-60 justify-center"
					>
						Save
					</button>
				</>
			)}
		</form>
	);
}
