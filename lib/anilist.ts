import { AnimeDetail, AnimeEpisode, AnimeSummary, AnimeSeasonLink } from "@/types/anime";

/**
 * AniList's GraphQL API — no key/registration needed for public data (only
 * required for user-specific mutations, which this app never does). Chosen
 * over both Jikan (unofficial, occasionally flaky) and the official MAL API
 * (no per-episode data, and `num_episodes` is simply 0 while a show is
 * airing) because AniList tracks `nextAiringEpisode`, which tells you the
 * next episode number airing — subtracting 1 gives an always-accurate count
 * of what has actually aired, no guessing required for ongoing shows like
 * One Piece. It also exposes `relations` (sequel/prequel links), which is
 * what backs the season switcher below — MAL/AniList both give every season
 * of a show its own id rather than one umbrella entry.
 */
const ANILIST_URL = "https://graphql.anilist.co";

type RawMedia = {
	id: number;
	title: { romaji: string | null; english: string | null };
	coverImage: { large: string | null; medium: string | null };
	averageScore: number | null;
	genres: string[];
	episodes: number | null;
	status: string;
	nextAiringEpisode: { episode: number } | null;
	startDate: { year: number | null };
	format: string;
	description?: string | null;
	trailer?: { id: string; site: string } | null;
	bannerImage?: string | null;
	relations?: {
		edges: {
			relationType: string;
			node: {
				id: number;
				title: { romaji: string | null; english: string | null };
				format: string;
			};
		}[];
	};
};

const SUMMARY_FIELDS = `
	id
	title { romaji english }
	coverImage { large medium }
	averageScore
	genres
	episodes
	status
	nextAiringEpisode { episode }
	startDate { year }
	format
`;

async function anilistFetch<T>(
	query: string,
	variables: Record<string, unknown>,
	revalidate = 60 * 60,
): Promise<T> {
	const res = await fetch(ANILIST_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
		next: { revalidate },
	});
	if (!res.ok) {
		throw new Error(`AniList responded ${res.status}`);
	}
	const json = await res.json();
	if (json.errors) {
		throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
	}
	return json.data as T;
}

/** An ongoing show's `episodes` is null — the next episode to air minus one
 *  is the real count of what has actually aired so far. */
function episodeCount(media: RawMedia): number {
	if (media.episodes) return media.episodes;
	if (media.nextAiringEpisode) return Math.max(media.nextAiringEpisode.episode - 1, 0);
	return 0;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]+>/g, "");
}

function normalizeAnime(media: RawMedia): AnimeSummary {
	const year = media.startDate?.year ?? null;

	return {
		id: media.id,
		media_type: "anime",
		title: media.title.english || media.title.romaji || "Untitled",
		poster_path: media.coverImage?.large ?? media.coverImage?.medium ?? "",
		vote_average: media.averageScore ? media.averageScore / 10 : 0,
		score: media.averageScore ? media.averageScore / 10 : null,
		episodes: episodeCount(media) || null,
		// Piggybacks on MovieCard's existing `release_date?.slice(0, 4)` year
		// display rather than teaching it a second date field.
		release_date: year ? `${year}-01-01` : undefined,
	};
}

/** Backs the anime half of site-wide search. */
export async function searchAnime(query: string): Promise<AnimeSummary[]> {
	try {
		const data = await anilistFetch<{ Page: { media: RawMedia[] } }>(
			`query($q: String, $perPage: Int) {
				Page(page: 1, perPage: $perPage) {
					media(type: ANIME, search: $q) { ${SUMMARY_FIELDS} }
				}
			}`,
			{ q: query, perPage: 10 },
			60 * 10,
		);
		return (data.Page.media ?? []).map(normalizeAnime);
	} catch (error) {
		console.error("anime search failed", error);
		return [];
	}
}

/** Backs the Popular Anime row and its browse grid. */
export async function fetchPopularAnime(page = "1"): Promise<AnimeSummary[]> {
	try {
		const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
		const data = await anilistFetch<{ Page: { media: RawMedia[] } }>(
			`query($page: Int, $perPage: Int) {
				Page(page: $page, perPage: $perPage) {
					media(type: ANIME, sort: POPULARITY_DESC) { ${SUMMARY_FIELDS} }
				}
			}`,
			{ page: pageNum, perPage: 24 },
		);
		return (data.Page.media ?? []).map(normalizeAnime);
	} catch (error) {
		console.error("AniList popularity query failed", error);
		return [];
	}
}

/** One anime by its AniList id. */
export async function fetchAnimeDetail(
	id: string | number,
): Promise<AnimeDetail | null> {
	try {
		const data = await anilistFetch<{ Media: RawMedia }>(
			`query($id: Int) {
				Media(id: $id, type: ANIME) {
					${SUMMARY_FIELDS}
					description
					trailer { id site }
					bannerImage
					relations {
						edges {
							relationType(version: 2)
							node { id title { romaji english } format }
						}
					}
				}
			}`,
			{ id: Number(id) },
			60 * 60 * 6,
		);
		const media = data.Media;
		if (!media) return null;

		// Only the direct chain, not side stories/spin-offs/movies — those are
		// a different watch, not "the next part of this one". AniList's
		// relation data is community-maintained and occasionally mislabels an
		// unrelated one-off (e.g. a crossover short tagged PREQUEL on a totally
		// unconnected show) — a real season is always the same format as this
		// one (TV to TV), which those mislabeled entries usually aren't.
		const seasons: AnimeSeasonLink[] = (media.relations?.edges ?? [])
			.filter(
				(edge) =>
					(edge.relationType === "PREQUEL" || edge.relationType === "SEQUEL") &&
					edge.node.format === media.format,
			)
			.map((edge) => ({
				id: edge.node.id,
				title: edge.node.title.english || edge.node.title.romaji || "Untitled",
				relation: edge.relationType as "PREQUEL" | "SEQUEL",
			}));

		return {
			...normalizeAnime(media),
			synopsis: media.description ? stripHtml(media.description) : undefined,
			genres: media.genres ?? [],
			status: media.status ?? "",
			trailerEmbedUrl:
				media.trailer?.site === "youtube"
					? `https://www.youtube-nocookie.com/embed/${media.trailer.id}`
					: undefined,
			seasons,
			bannerImage: media.bannerImage ?? null,
		};
	} catch (error) {
		console.error(error);
		return null;
	}
}

const EPISODES_PER_PAGE = 100;

/**
 * A page of episode numbers. AniList has no per-episode data (titles, air
 * dates) either, so — same as the official-MAL version this replaced — this
 * slices a 1..total range. The difference is `total` itself is now always
 * accurate, ongoing shows included, via nextAiringEpisode.
 *
 * `order: "desc"` pages backward from the newest episode instead of forward
 * from episode 1 — for a 1000+ episode show like One Piece, someone caught up
 * near the end shouldn't have to click "load more" a dozen times to get
 * there. Page numbering still counts up from 1 either way; only which end it
 * starts from changes.
 */
export async function fetchAnimeEpisodesPage(
	id: string | number,
	page = 1,
	order: "asc" | "desc" = "asc",
): Promise<{ episodes: AnimeEpisode[]; hasNextPage: boolean }> {
	try {
		const data = await anilistFetch<{ Media: RawMedia }>(
			`query($id: Int) {
				Media(id: $id, type: ANIME) {
					episodes
					status
					nextAiringEpisode { episode }
				}
			}`,
			{ id: Number(id) },
			// Airing shows gain an episode roughly weekly; an hour-old count is
			// close enough and much cheaper than checking every request.
			60 * 60,
		);
		const total = episodeCount(data.Media);
		if (total === 0) return { episodes: [], hasNextPage: false };

		let start: number;
		let end: number;
		let hasNextPage: boolean;
		if (order === "asc") {
			start = (page - 1) * EPISODES_PER_PAGE + 1;
			if (start > total) return { episodes: [], hasNextPage: false };
			end = Math.min(start + EPISODES_PER_PAGE - 1, total);
			hasNextPage = end < total;
		} else {
			end = total - (page - 1) * EPISODES_PER_PAGE;
			if (end < 1) return { episodes: [], hasNextPage: false };
			start = Math.max(end - EPISODES_PER_PAGE + 1, 1);
			hasNextPage = start > 1;
		}

		const episodes: AnimeEpisode[] = [];
		for (let number = start; number <= end; number++) {
			episodes.push({
				number,
				title: `Episode ${number}`,
				aired: null,
				score: null,
				filler: false,
			});
		}
		if (order === "desc") episodes.reverse();

		return { episodes, hasNextPage };
	} catch (error) {
		console.error(error);
		return { episodes: [], hasNextPage: false };
	}
}
