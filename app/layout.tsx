import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Movie Base",
		// Page titles render as "Fight Club (1999) · Movie Base".
		template: "%s · Movie Base",
	},
	description: "Browse, search and track movies powered by TMDB.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider>
					<Navbar />
					{/* The navbar is fixed, and stacks to three rows on small screens.
					    Pages offset themselves for its desktop height, so this adds the
					    extra clearance the taller mobile layout needs. */}
					<main className="pt-20 lg:pt-0">{children}</main>
					<Footer />
				</AuthProvider>
			</body>
		</html>
	);
}
