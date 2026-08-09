"use client";
import { FaRegCommentDots } from "react-icons/fa";
import Button from "./Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

export default function CommentInputButton({
	movieId,
	comment,
	onSubmitted,
}: {
	movieId: number;
	comment: string;
	onSubmitted: () => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const { user, profile } = useAuth();
	const name = profile?.username || user?.email?.split("@")[0];

	async function handleSubmit() {
		setErrorMsg("");
		setSuccessMsg("");

		if (!comment.trim()) {
			setErrorMsg("Please write something first.");
			return;
		}

		setIsLoading(true);
		const { error } = await supabase.from("comments").insert([
			{
				movie_id: movieId,
				user_id: user?.id,
				username: name,
				content: comment.trim(),
			},
		]);
		setIsLoading(false);

		// The original reported success even when the insert failed, because the
		// error branch fell through to the success message.
		if (error) {
			setErrorMsg(error.message);
			return;
		}
		setSuccessMsg("Comment Added Successfully!");
		onSubmitted();
	}

	return (
		<div>
			<Button onClick={handleSubmit} disabled={isLoading}>
				{isLoading ? (
					<div className="min-w-35 flex justify-center">
						<Spinner className="size-5" />
					</div>
				) : (
					<>
						Add Comment
						<FaRegCommentDots />
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
