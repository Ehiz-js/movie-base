"use client";
import { MovieType } from "@/types/movie";
import { FaPlusSquare } from "react-icons/fa";
import Button from "./Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

export default function WatchListButton({ movie }: { movie: MovieType }) {
	const { user, session } = useAuth();
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Saves the movie, then sends the confirmation email. The save is what the
	 * user asked for, so a failing mailer must not turn a successful save into
	 * an error.
	 */
	async function addToWatchList() {
		setErrorMsg("");
		setSuccessMsg("");

		if (!session) {
			setErrorMsg("You must be signed in to add movies.");
			return;
		}

		setIsLoading(true);
		try {
			const { error } = await supabase.from("watchlist").insert([
				{
					user_id: user?.id,
					movie_id: movie.id,
					title: movie.title,
					poster_path: movie.poster_path,
					vote_average: movie.vote_average,
				},
			]);

			if (error) {
				setErrorMsg(
					error.message.includes("duplicate key value")
						? "Movie already added to watchlist."
						: error.message,
				);
				return;
			}

			setSuccessMsg("Movie added successfully!");

			try {
				const res = await fetch("/api/send_email", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.access_token}`,
					},
					body: JSON.stringify({ movie }),
				});
				if (!res.ok) {
					console.warn("Watchlist email failed", await res.text());
				}
			} catch (err) {
				console.warn("Watchlist email failed", err);
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<Button onClick={addToWatchList} disabled={isLoading}>
				{isLoading ? (
					<div className="min-w-35 flex justify-center">
						<Spinner className="size-5" />
					</div>
				) : (
					<>
						<FaPlusSquare />
						Add to WatchList
					</>
				)}
			</Button>
			{errorMsg && (
				<p className="text-sm font-light text-red-600 mt-3">{errorMsg}</p>
			)}
			{successMsg && (
				<p className="text-sm font-light text-green-600 mt-3">{successMsg}</p>
			)}
		</div>
	);
}
