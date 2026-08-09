"use client";

import { useEffect } from "react";
import Button from "@/components/Button";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<section className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-4xl font-bold text-(--purple-dark) uppercase">
				Something went wrong
			</h1>
			<p className="text-gray-400 max-w-md">
				That page failed to load. It is usually temporary — trying again often
				works.
			</p>
			<div className="mt-4">
				<Button onClick={reset}>Try again</Button>
			</div>
		</section>
	);
}
