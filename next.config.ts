import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		/**
		 * TMDB already serves every poster at preset widths (w92 … w780) from its
		 * own CDN, so each usage just asks for the size that fits its slot. Running
		 * those through Vercel's optimizer would re-encode images that are already
		 * sized and cached, and burn a metered quota to do it.
		 *
		 * next/image is still used everywhere: declaring dimensions is what stops
		 * posters shifting the layout as they load, and that works regardless.
		 * Flip this to false to turn optimization back on — remotePatterns below
		 * is already set up for it.
		 */
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "image.tmdb.org",
				pathname: "/t/p/**",
			},
			{
				protocol: "https",
				hostname: "s4.anilist.co",
				pathname: "/file/anilistcdn/**",
			},
		],
	},
};

export default nextConfig;
