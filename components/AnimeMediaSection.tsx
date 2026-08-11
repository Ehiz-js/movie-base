"use client";
import { useState } from "react";
import AnimePlayer from "./AnimePlayer";
import AnimeEpisodeBrowser from "./AnimeEpisodeBrowser";
import { AnimeEpisode } from "@/types/anime";

export default function AnimeMediaSection({
	anilistId,
	title,
	posterUrl,
	trailerEmbedUrl,
	initialEpisodes,
	initialHasNextPage,
	totalEpisodes,
	initialEpisode,
	initialTime,
}: {
	anilistId: number;
	title: string;
	posterUrl: string | null;
	trailerEmbedUrl?: string;
	initialEpisodes: AnimeEpisode[];
	initialHasNextPage: boolean;
	totalEpisodes: number | null;
	/** Resume point from a Continue Watching link (`?episode=`), when set —
	 *  otherwise the first episode the page shipped with. */
	initialEpisode?: number;
	/** Seconds into `initialEpisode` to resume at (`?t=`). Only ever applies
	 *  to that landing episode — switching episodes manually afterward plays
	 *  from the start like normal. */
	initialTime?: number;
}) {
	const resumeEpisode = initialEpisode;
	const [activeEpisode, setActiveEpisode] = useState(
		initialEpisode ?? initialEpisodes[0]?.number ?? 1,
	);

	return (
		<div className="flex flex-col gap-6">
			<AnimePlayer
				anilistId={anilistId}
				episodeNumber={activeEpisode}
				posterUrl={posterUrl}
				title={title}
				trailerEmbedUrl={trailerEmbedUrl}
				resumeAt={activeEpisode === resumeEpisode ? initialTime : undefined}
			/>

			{initialEpisodes.length > 0 && (
				<AnimeEpisodeBrowser
					anilistId={anilistId}
					initialEpisodes={initialEpisodes}
					initialHasNextPage={initialHasNextPage}
					totalEpisodes={totalEpisodes}
					playingEpisode={activeEpisode}
					onEpisodeChange={setActiveEpisode}
				/>
			)}
		</div>
	);
}
