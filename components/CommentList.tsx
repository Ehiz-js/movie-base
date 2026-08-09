"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Comment from "./Comment";
import { CommentType } from "@/types/movie";
import { useAuth } from "@/contexts/AuthContext";

export default function CommentList({
	movieId,
	submitCount,
}: {
	movieId: number;
	submitCount: number;
}) {
	const { user } = useAuth();
	const [comments, setComments] = useState<CommentType[]>([]);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		const fetchComments = async () => {
			const { data, error } = await supabase
				.from("comments")
				.select("*")
				.eq("movie_id", movieId)
				.order("created_at", { ascending: false });

			if (cancelled) return;
			if (error) {
				console.error(error);
				return;
			}
			setComments((data ?? []) as CommentType[]);
		};

		fetchComments();
		return () => {
			cancelled = true;
		};
	}, [movieId, submitCount]);

	async function deleteComment(id: string) {
		setError("");
		setDeletingId(id);
		const previous = comments;
		setComments((current) => current.filter((comment) => comment.id !== id));

		const { error } = await supabase.from("comments").delete().eq("id", id);

		setDeletingId(null);
		if (error) {
			// Put it back rather than leaving the list disagreeing with the server.
			setComments(previous);
			setError("Could not delete that comment. Please try again.");
		}
	}

	if (comments.length === 0) {
		return (
			<p className="text-gray-400 italic">
				No comments yet. Be the first to post one.
			</p>
		);
	}

	return (
		<div>
			{error && <p className="text-sm text-red-600 mb-4">{error}</p>}
			{comments.map((comment) => (
				<Comment
					key={comment.id}
					username={comment.username}
					content={comment.content}
					createdAt={comment.created_at}
					// Only the author's own comments get the control; the matching RLS
					// policy is what actually enforces it.
					onDelete={
						user?.id === comment.user_id
							? () => deleteComment(comment.id)
							: undefined
					}
					isDeleting={deletingId === comment.id}
				/>
			))}
		</div>
	);
}
