import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// Every poster, backdrop and still comes from TMDB's image CDN. next/image
		// refuses remote hosts that are not listed here.
		remotePatterns: [
			{
				protocol: "https",
				hostname: "image.tmdb.org",
				pathname: "/t/p/**",
			},
		],
	},
};

export default nextConfig;
