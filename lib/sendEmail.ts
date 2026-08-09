import { MovieSummary } from "@/types/movie";
import nodemailer from "nodemailer";

/**
 * Watchlist confirmation email.
 *
 * Two transports are supported. Resend is preferred: it is a plain HTTPS call
 * to port 443, so it works on networks that block outbound SMTP (many ISPs,
 * mobile hotspots and campus Wi-Fi do). SMTP via nodemailer is kept as a
 * fallback for environments that would rather use their own mail server.
 *
 * Set RESEND_API_KEY to use Resend; otherwise EMAIL_USER / EMAIL_PASS are used
 * over SMTP.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Overridable so the transport can be pointed at a stub in tests.
const RESEND_API_URL =
	process.env.RESEND_API_URL ?? "https://api.resend.com/emails";

// Resend will only deliver from a domain you have verified. Until you verify
// one, its shared onboarding sender works, but only to the address the Resend
// account was registered with.
const EMAIL_FROM =
	process.env.EMAIL_FROM ?? "MovieBase <onboarding@resend.dev>";

// Port 465 (implicit TLS) is blocked on a lot of home and campus networks.
// 587 (STARTTLS) usually survives where 465 does not. `secure` must track the
// port: true for 465, false for 587.
const smtpPort = Number(process.env.EMAIL_PORT ?? 465);

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
	port: smtpPort,
	secure: smtpPort === 465,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
	// Without these a blocked port hangs the request for ~23s before failing.
	connectionTimeout: 10_000,
	greetingTimeout: 10_000,
	socketTimeout: 15_000,
});

/**
 * Movie fields land in an HTML email, so they have to be escaped. Without this
 * a title containing markup would be injected into the message body.
 */
function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function buildWatchlistEmailHtml(movie: MovieSummary) {
	const title = escapeHtml(movie.title ?? "Untitled");
	const rating = Number.isFinite(movie.vote_average)
		? movie.vote_average.toFixed(1)
		: "N/A";
	// Only allow the TMDB poster path shape, so the src can't be pointed elsewhere.
	const posterPath = /^\/[\w.-]+\.(jpg|png|webp)$/i.test(
		movie.poster_path ?? "",
	)
		? movie.poster_path
		: null;
	const imageUrl = posterPath
		? `https://image.tmdb.org/t/p/w500${posterPath}`
		: null;

	return `
	<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
		<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
			<tr>
				<td style="padding: 20px; text-align: center;">
					<h1 style="margin: 0 0 15px 0; font-size: 20px; color: #111;">
						 Movie Added to Watchlist
					</h1>
					${
						imageUrl
							? `<img
						src="${imageUrl}"
						alt="${title}"
						width="200"
						style="border-radius: 8px; display: block; margin: 0 auto;"
					/>`
							: ""
					}
					<h2 style="margin: 15px 0 5px 0; font-size: 18px; color: #222;">
						${title}
					</h2>
					<p style="margin: 0; font-size: 16px; color: #555;">
						 Rating: ${rating}
					</p>
				</td>
			</tr>
		</table>
	</div>
`;
}

async function sendViaResend(to: string, subject: string, html: string) {
	const res = await fetch(RESEND_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
	});

	if (!res.ok) {
		// Resend explains refusals in the body (unverified domain, bad key, …),
		// which is far more useful than the status alone.
		throw new Error(`Resend returned ${res.status}: ${await res.text()}`);
	}
}

async function sendViaSmtp(to: string, subject: string, html: string) {
	await transporter.sendMail({
		from:
			process.env.EMAIL_FROM ??
			`"MovieBase@noreply" <${process.env.EMAIL_USER}>`,
		to,
		subject,
		html,
	});
}

export async function sendWatchlistEmail(to: string, movie: MovieSummary) {
	const subject = "Movie Added to Watchlist";
	const html = buildWatchlistEmailHtml(movie);

	if (RESEND_API_KEY) {
		await sendViaResend(to, subject, html);
		return;
	}
	await sendViaSmtp(to, subject, html);
}
