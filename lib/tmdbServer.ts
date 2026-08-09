/**
 * Server-only TMDB access.
 *
 * The API key is deliberately NOT prefixed with NEXT_PUBLIC_ — that prefix
 * inlines the value into the client bundle, which would publish the key to
 * anyone who opens devtools. Only route handlers may import this module.
 */
const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export class TmdbError extends Error {}

type QueryParams = Record<string, string | number | undefined | null>;

export async function tmdbFetch<T>(
	path: string,
	params: QueryParams = {},
): Promise<T> {
	if (!API_KEY) {
		throw new TmdbError("TMDB_API_KEY is not set");
	}

	const url = new URL(`${BASE_URL}${path}`);
	url.searchParams.set("api_key", API_KEY);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== "") {
			url.searchParams.set(key, String(value));
		}
	}

	const res = await fetch(url, { next: { revalidate: 60 } });
	if (!res.ok) {
		throw new TmdbError(`TMDB responded ${res.status} for ${path}`);
	}
	return res.json() as Promise<T>;
}
