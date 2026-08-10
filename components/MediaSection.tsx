"use client";
import { useCallback, useState } from "react";
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

	// The browser reports from an effect, so this has to keep the same identity
	// between renders — a fresh function each time would re-run that effect and
	// refetch the season in a loop. Setters are stable, so there are no deps.
	const handleEpisodeChange = useCallback((season: number, episode: number) => {
		setActiveSeason(season);
		setActiveEpisode(episode);
	}, []);

	return (
		<div className="lg:col-span-2 flex flex-col gap-6">
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
					// The browser fires this to update the player
					onEpisodeChange={handleEpisodeChange}
				/>
			)}
		</div>
	);
}
