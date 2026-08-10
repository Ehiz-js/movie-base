"use client";
import { useState } from "react";
import { MediaType } from "@/types/movie";
import { CommentInput } from "./CommentInput";
import CommentList from "./CommentList";

export default function CommentSection({
	movieId,
	mediaType,
}: {
	movieId: number;
	mediaType: MediaType;
}) {
	// Bumped after every successful insert so CommentList refetches.
	const [submitCount, setSubmitCount] = useState(0);
	return (
		<>
			<div>
				<CommentInput
					movieId={movieId}
					mediaType={mediaType}
					onSubmitted={() => setSubmitCount((count) => count + 1)}
				/>
			</div>
			<div>
				<CommentList
					movieId={movieId}
					mediaType={mediaType}
					submitCount={submitCount}
				/>
			</div>
		</>
	);
}
