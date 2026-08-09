"use client";
import { useState } from "react";
import { CommentInput } from "./CommentInput";
import CommentList from "./CommentList";

export default function CommentSection({ movieId }: { movieId: number }) {
	// Bumped after every successful insert so CommentList refetches.
	const [submitCount, setSubmitCount] = useState(0);
	return (
		<>
			<div>
				<CommentInput
					movieId={movieId}
					onSubmitted={() => setSubmitCount((count) => count + 1)}
				/>
			</div>
			<div>
				<CommentList movieId={movieId} submitCount={submitCount} />
			</div>
		</>
	);
}
