"use client";
import { MovieType } from "@/types/movie";
import { FaCheckSquare, FaPlusSquare, FaTrash } from "react-icons/fa";
import Button from "./Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

export default function WatchListButton({ movie }: { movie: MovieType }) {
	const { user, session } = useAuth();
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	// null while we do not yet know; the button stays in a neutral state until
	// the lookup resolves rather than claiming the movie is unsaved.
	const [savedRowId, setSavedRowId] = useState<string | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	const userId = user?.id;
	const movieId = movie.id;

	useEffect(() => {
		if (!userId) {
			setSavedRowId(null);
			setIsChecking(false);
			return;
		}

		let cancelled = false;
		async function checkSaved() {
			setIsChecking(true);
			const { data, error } = await supabase
				.from("watchlist")
				.select("id_supabase")
				.eq("user_id", userId)
				.eq("movie_id", movieId)
				.maybeSingle();

			if (cancelled) return;
			if (error) console.error(error);
			setSavedRowId(data?.id_supabase ?? null);
			setIsChecking(false);
		}
		checkSaved();

		return () => {
			cancelled = true;
		};
	}, [userId, movieId]);

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
			const { data, error } = await supabase
				.from("watchlist")
				.insert([
					{
						user_id: user?.id,
						movie_id: movie.id,
						title: movie.title,
						poster_path: movie.poster_path,
						vote_average: movie.vote_average,
					},
				])
				.select("id_supabase")
				.single();

			if (error) {
				setErrorMsg(
					error.message.includes("duplicate key value")
						? "Movie already added to watchlist."
						: error.message,
				);
				return;
			}

			setSavedRowId(data.id_supabase);
			setSuccessMsg("Added to your list.");

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

	async function removeFromWatchList() {
		if (!savedRowId) return;
		setErrorMsg("");
		setSuccessMsg("");
		setIsLoading(true);
		try {
			const { error } = await supabase
				.from("watchlist")
				.delete()
				.eq("id_supabase", savedRowId);

			if (error) {
				setErrorMsg(error.message);
				return;
			}
			setSavedRowId(null);
			setSuccessMsg("Removed from your list.");
		} finally {
			setIsLoading(false);
		}
	}

	const isSaved = savedRowId !== null;

	return (
		<div>
			<Button
				onClick={isSaved ? removeFromWatchList : addToWatchList}
				disabled={isLoading || isChecking}
			>
				{isLoading || isChecking ? (
					<div className="min-w-35 flex justify-center">
						<Spinner className="size-5" />
					</div>
				) : isSaved ? (
					<>
						<FaCheckSquare />
						In your list
						<FaTrash className="ml-2 size-3.5" />
					</>
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
