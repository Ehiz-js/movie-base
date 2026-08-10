import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
	// Grab the authentication header from the request
	const basicAuth = req.headers.get("authorization");

	const username = process.env.SITE_USERNAME;
	const password = process.env.SITE_PASSWORD;

	if (basicAuth) {
		// The browser sends the auth encoded in base64, so we decode it
		const authValue = basicAuth.split(" ")[1];
		const [providedUser, providedPwd] = atob(authValue).split(":");

		// If they match, let them into the site!
		if (providedUser === username && providedPwd === password) {
			return NextResponse.next();
		}
	}

	// If there's no auth, or the password is wrong, block them
	// This triggers the native browser login popup
	return new NextResponse("Auth required", {
		status: 401,
		headers: {
			"WWW-Authenticate": 'Basic realm="Secure Area"',
		},
	});
}

// This tells Next.js to run this password check on EVERY page,
// but skips images/fonts so the site doesn't break.
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
