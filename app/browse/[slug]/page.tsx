import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { findGenreBySlug } from "@/lib/genres";
import { fetchGenreTitles, fetchPopular } from "@/lib/titles";
import { MovieType } from "@/types/movie";

const MAX_PAGES = 10;

/** Resolves a slug to a heading and the fetch that backs it. */
function resolveSlug(slug: string) {
	if (slug === "popular-movies") {
		return {
			heading: "Popular Movies",
			load: (page: string) => fetchPopular("movie", page),
		};
	}
	if (slug === "popular-series") {
		return {
			heading: "Popular Series",
			load: (page: string) => fetchPopular("tv", page),
		};
	}
	const genre = findGenreBySlug(slug);
	if (genre) {
		return {
			heading: genre.name,
			load: (page: string) => fetchGenreTitles(genre.name, page),
		};
	}
	return null;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const resolved = resolveSlug(slug);
	return { title: resolved?.heading ?? "Browse" };
}

export default async function BrowsePage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ page?: string }>;
}) {
	const { slug } = await params;
	const { page } = await searchParams;

	const resolved = resolveSlug(slug);
	if (!resolved) notFound();

	const pageNum = Math.min(
		Math.max(Number.parseInt(page ?? "1", 10) || 1, 1),
		MAX_PAGES,
	);
	const titles: MovieType[] = await resolved.load(String(pageNum));

	return (
		<section className="mt-24 mb-12 px-4 sm:px-6 xl:px-16">
			<h1 className="flex items-center gap-2 text-2xl font-semibold mb-6">
				<span aria-hidden className="h-6 w-1 rounded bg-(--purple-dark)" />
				{resolved.heading}
			</h1>

			{titles.length === 0 ? (
				<p className="text-(--purple-dark) uppercase font-semibold py-20">
					Nothing to show here yet.
				</p>
			) : (
				<ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{titles.map((title) => (
						<li key={`${title.media_type}-${title.id}`}>
							<MovieCard movie={title} />
						</li>
					))}
				</ul>
			)}

			{/* Links rather than buttons, so pages are shareable and work without JS. */}
			<nav className="flex items-center justify-center gap-4 mt-10">
				{pageNum > 1 && (
					<Link
						href={`/browse/${slug}?page=${pageNum - 1}`}
						className="p-3 px-4 bg-(--purple-dark) text-white font-semibold rounded-lg hover:bg-white hover:text-(--purple-dark) transition-colors duration-200"
					>
						Previous
					</Link>
				)}
				<span className="tabular-nums">
					Page {pageNum} of {MAX_PAGES}
				</span>
				{pageNum < MAX_PAGES && (
					<Link
						href={`/browse/${slug}?page=${pageNum + 1}`}
						className="p-3 px-4 bg-(--purple-dark) text-white font-semibold rounded-lg hover:bg-white hover:text-(--purple-dark) transition-colors duration-200"
					>
						Next
					</Link>
				)}
			</nav>
		</section>
	);
}

/** Pre-render the fixed rows; genre pages are generated on demand. */
export function generateStaticParams() {
	return [{ slug: "popular-movies" }, { slug: "popular-series" }];
}
