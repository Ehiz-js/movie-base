import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import HeroCarousel from "@/components/HeroCarousel";
import RecentMovieList from "@/components/RecentMovieList";
import TitleRow from "@/components/TitleRow";
import { HOME_GENRES, genreSlug } from "@/lib/genres";
import { fetchGenreTitles, fetchPopular } from "@/lib/titles";
import { fetchPopularAnime } from "@/lib/anilist";

// TMDB data is cached by tmdbFetch's revalidate, so the rows below cost one
// upstream request each per minute rather than one per visitor.
export default async function Home() {
	// Every row is fetched in parallel; a row that fails comes back empty and
	// renders nothing rather than taking the page down.
	const [popularMovies, popularSeries, popularAnime, ...genreRows] =
		await Promise.all([
			fetchPopular("movie"),
			fetchPopular("tv"),
			fetchPopularAnime(),
			...HOME_GENRES.map((genre) => fetchGenreTitles(genre)),
		]);

	return (
		<>
			{/* Films only, as the hero is about headline titles. The negative
			    margin cancels the mobile clearance the layout adds for the fixed
			    navbar, so the backdrop runs to the top of the page behind it. */}
			<div className="mt-0 lg:mt-20">
				<HeroCarousel titles={popularMovies.slice(0, 5)} />
			</div>

			<div className="mt-10">
				<ContinueWatchingRow />
				<RecentMovieList />

				<TitleRow
					heading="Popular Series"
					moreHref="/browse/popular-series"
					titles={popularSeries}
				/>
				<TitleRow
					heading="Popular Movies"
					moreHref="/browse/popular-movies"
					titles={popularMovies}
				/>
				<TitleRow
					heading="Popular Anime"
					moreHref="/browse/popular-anime"
					titles={popularAnime}
				/>

				{HOME_GENRES.map((genre, index) => (
					<TitleRow
						key={genre}
						heading={genre}
						moreHref={`/browse/${genreSlug(genre)}`}
						titles={genreRows[index] ?? []}
					/>
				))}
			</div>
		</>
	);
}
