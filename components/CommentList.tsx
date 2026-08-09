"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Comment from "./Comment";
import { CommentType } from "@/types/movie";

export default function CommentList({
	movieId,
	submitCount,
}: {
	movieId: number;
	submitCount: number;
}) {
	const [comments, setComments] = useState<CommentType[]>([]);

	useEffect(() => {
		const fetchComments = async () => {
			const { data, error } = await supabase
				.from("comments")
				.select("*")
				.eq("movie_id", movieId)
				.order("created_at", { ascending: false });

			if (error) {
				console.error(error);
				return;
			}
			setComments((data ?? []) as CommentType[]);
		};

		fetchComments();
	}, [movieId, submitCount]);

	if (comments.length === 0) {
		return (
			<p className="text-gray-400 italic">
				No comments yet. Be the first to post one.
			</p>
		);
	}

	return (
		<div>
			{comments.map((comment) => (
				<Comment
					key={comment.id}
					username={comment.username}
					content={comment.content}
					createdAt={comment.created_at}
				/>
			))}
		</div>
	);
}
