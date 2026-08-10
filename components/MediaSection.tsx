"use client";
import { useState } from "react";
import TrailerPlayer from "./TrailerPlayer";
import SeasonBrowser from "./SeasonBrowser";
import {
	MovieType,
	SeasonSummary,
	EpisodeType,
	VideoType,
} from "@/types/movie";

export default function MediaSection({
	movie,
	trailer,
	backdropPath,
	title,
	seasons,
	firstSeason,
	firstSeasonEpisodes,
	mediaType,
}: {
	movie: MovieType;
	trailer: VideoType | null;
	backdropPath?: string;
	title: string;
	seasons: SeasonSummary[];
	firstSeason?: number;
	firstSeasonEpisodes: EpisodeType[];
	mediaType: "movie" | "tv";
}) {
	// Track the active season and episode locally on the client
	const [activeSeason, setActiveSeason] = useState(firstSeason ?? 1);
	// Seeded from the episode the browser actually highlights. A season does not
	// always open on episode 1 — TMDB numbers some runs from a later episode —
	// so hardcoding 1 would point the player somewhere the grid is not.
	const [activeEpisode, setActiveEpisode] = useState(
		firstSeasonEpisodes[0]?.episode_number ?? 1,
	);

	return (
		<div className="flex flex-col gap-6">
			<TrailerPlayer
				trailer={trailer}
				backdropPath={backdropPath}
				title={title}
				movie={movie}
				mediaType={mediaType}
				seasonNumber={activeSeason}
				episodeNumber={activeEpisode}
			/>

			{mediaType === "tv" && seasons.length > 0 && (
				<SeasonBrowser
					tvId={movie.id}
					seasons={seasons}
					initialSeason={firstSeason ?? 1}
					initialEpisodes={firstSeasonEpisodes}
					// Handed back down so the browser can mark what is playing while
					// you look through other seasons.
					playingSeason={activeSeason}
					playingEpisode={activeEpisode}
					// The browser fires this to update the player
					onEpisodeChange={(season, episode) => {
						setActiveSeason(season);
						setActiveEpisode(episode);
					}}
				/>
			)}
		</div>
	);
}
