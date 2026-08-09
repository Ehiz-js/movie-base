import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * A stateless Supabase client for route handlers. Unlike the browser client in
 * `lib/supabase.ts` it never persists or refreshes a session, so it can safely
 * be shared across requests.
 */
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
	auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Verifies the `Authorization: Bearer <access_token>` header against Supabase
 * and returns the authenticated user, or null if the token is missing/invalid.
 */
export async function getUserFromRequest(req: Request) {
	const header = req.headers.get("authorization");
	const token = header?.replace(/^Bearer\s+/i, "");
	if (!token) return null;

	const { data, error } = await supabaseServer.auth.getUser(token);
	if (error) return null;
	return data.user;
}
