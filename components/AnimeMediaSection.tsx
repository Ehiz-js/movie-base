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
}: {
	anilistId: number;
	title: string;
	posterUrl: string | null;
	trailerEmbedUrl?: string;
	initialEpisodes: AnimeEpisode[];
	initialHasNextPage: boolean;
	totalEpisodes: number | null;
}) {
	const [activeEpisode, setActiveEpisode] = useState(
		initialEpisodes[0]?.number ?? 1,
	);

	return (
		<div className="flex flex-col gap-6">
			<AnimePlayer
				anilistId={anilistId}
				episodeNumber={activeEpisode}
				posterUrl={posterUrl}
				title={title}
				trailerEmbedUrl={trailerEmbedUrl}
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
