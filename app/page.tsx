import HeroCarousel from "@/components/HeroCarousel";
import RecentMovieList from "@/components/RecentMovieList";
import TitleRow from "@/components/TitleRow";
import { HOME_GENRES, genreSlug } from "@/lib/genres";
import { fetchGenreTitles, fetchPopular } from "@/lib/titles";

// TMDB data is cached by tmdbFetch's revalidate, so the rows below cost one
// upstream request each per minute rather than one per visitor.
export default async function Home() {
	// Every row is fetched in parallel; a row that fails comes back empty and
	// renders nothing rather than taking the page down.
	const [popularMovies, popularSeries, ...genreRows] = await Promise.all([
		fetchPopular("movie"),
		fetchPopular("tv"),
		...HOME_GENRES.map((genre) => fetchGenreTitles(genre)),
	]);

	return (
		<>
			{/* Films only, as the hero is about headline titles. The negative
			    margin cancels the mobile clearance the layout adds for the fixed
			    navbar, so the backdrop runs to the top of the page behind it. */}
			<div className="-mt-20 lg:mt-0">
				<HeroCarousel titles={popularMovies.slice(0, 5)} />
			</div>

			<div className="mt-10">
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
