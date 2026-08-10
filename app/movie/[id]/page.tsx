import { permanentRedirect } from "next/navigation";

/**
 * Films used to live at /movie/[id]. Those URLs are public and may have been
 * shared, so they redirect to the media-typed route rather than 404.
 */
export default async function LegacyMoviePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	permanentRedirect(`/title/movie/${id}`);
}
