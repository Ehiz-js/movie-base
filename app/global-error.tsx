"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown in the root layout itself, which the route-level
 * error boundary sits inside and therefore cannot handle. It replaces the
 * whole document, so it has to render its own <html> and <body>.
 */
export default function GlobalError({
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
		<html lang="en">
			<body
				style={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "1rem",
					fontFamily: "Arial, Helvetica, sans-serif",
					background: "#0a0a0a",
					color: "#ededed",
					textAlign: "center",
					padding: "0 1.5rem",
				}}
			>
				<h1 style={{ fontSize: "2rem", color: "#8b5cf6" }}>
					Something went wrong
				</h1>
				<p style={{ color: "#9ca3af", maxWidth: "28rem" }}>
					Movie Base failed to start up. Reloading usually clears it.
				</p>
				<button
					onClick={reset}
					style={{
						padding: "0.75rem 1.25rem",
						background: "#5b21b6",
						color: "#fff",
						border: "none",
						borderRadius: "0.5rem",
						cursor: "pointer",
						fontWeight: 600,
					}}
				>
					Try again
				</button>
			</body>
		</html>
	);
}
