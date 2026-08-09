"use client";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import CommentInputButton from "./CommentInputButton";
import { useAuth } from "@/contexts/AuthContext";

export function CommentInput({
	movieId,
	onSubmitted,
}: {
	movieId: number;
	onSubmitted: () => void;
}) {
	const [comment, setComment] = useState("");
	const { session } = useAuth();
	return (
		<Field className="max-w-6xl">
			{session ? (
				<>
					<FieldLabel
						htmlFor="textarea-message"
						className="text-(--purple-dark) font-semibold text-xl"
					>
						Comment Section
					</FieldLabel>
					<FieldDescription>Enter your comment below.</FieldDescription>
					<Textarea
						id="textarea-message"
						placeholder="Type your message here."
						className="border border-(--purple-dark) focus:outline-(--purple-dark)"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
					/>
					<div>
						<CommentInputButton
							movieId={movieId}
							comment={comment}
							onSubmitted={() => {
								setComment("");
								onSubmitted();
							}}
						/>
					</div>
				</>
			) : (
				<p className="text-gray-400 text-xl italic">
					Please Login to post a comment
				</p>
			)}
		</Field>
	);
}
