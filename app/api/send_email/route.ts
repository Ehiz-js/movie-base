import { NextResponse } from "next/server";
import { sendWatchlistEmail } from "@/lib/sendEmail";
import { getUserFromRequest } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
	try {
		const { movie } = await req.json();

		if (!movie || typeof movie !== "object") {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		// The recipient comes from the verified session, never from the request
		// body — otherwise this route is an open relay that will mail anyone.
		const user = await getUserFromRequest(req);
		if (!user?.email) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		// Keyed on the verified user, so the limit cannot be sidestepped by
		// changing IP or clearing cookies.
		const { allowed, retryAfterSeconds } = rateLimit(`send_email:${user.id}`, {
			limit: 10,
			windowMs: 60 * 60 * 1000,
		});
		if (!allowed) {
			return NextResponse.json(
				{ error: "Too many emails. Please try again later." },
				{ status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
			);
		}

		await sendWatchlistEmail(user.email, {
			id: Number(movie.id),
			media_type: movie.media_type === "tv" ? "tv" : "movie",
			title: String(movie.title ?? ""),
			poster_path: String(movie.poster_path ?? ""),
			vote_average: Number(movie.vote_average),
		});

		return NextResponse.json({
			success: true,
			message: "Movie added successfully",
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 },
		);
	}
}
