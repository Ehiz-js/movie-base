"use client";
import Image from "next/image";
import Link from "next/link";
import Search from "./Search";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
	const router = useRouter();
	const { user, signOut, session, profile } = useAuth();
	const displayName = profile?.username || user?.email?.split("@")[0];

	return (
		<nav className="w-full text-(--foreground) px-4 sm:px-6 xl:px-60 py-4 border-b border-(--foreground)/20 fixed top-0 z-10 bg-background/80 backdrop-blur-md">
			{/* Outer Container: Uses justify-between to push the Left and Right sections to the edges */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
				{/* --- 1. LEFT SECTION (Logo & Mobile Button) --- */}
				<div className="flex items-center justify-between w-full lg:w-auto gap-2 sm:gap-4 shrink-0">
					<Link href="/" className="cursor-pointer shrink-0">
						<Image
							src="/assets/logo.png"
							alt="Movie base Logo"
							width={30}
							height={25}
						/>
					</Link>

					{session && (
						<span className="text-(--purple-dark) uppercase font-semibold text-xs sm:text-sm truncate min-w-0 flex-1 text-center lg:text-left px-2">
							Hello, {displayName}
						</span>
					)}

					<div className="lg:hidden shrink-0">
						<Button
							onClick={session ? signOut : () => router.push("/auth/login")}
						>
							{session ? "LOG OUT" : "LOG IN"}
						</Button>
					</div>
				</div>

				{/* --- 2. CENTER SECTION (Search & Links) --- */}
				{/* flex-1 and justify-center guarantee these items sit directly in the middle of the screen */}
				<div className="flex flex-col lg:flex-row items-center justify-center flex-1 gap-4 lg:gap-8 w-full">
					<ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 uppercase tracking-widest text-sm">
						<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
							<Link href="/">Home</Link>
						</li>

						<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
							<Link href="/movielist">My List</Link>
						</li>

						{session && (
							<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
								<Link href="/onboarding">Profile</Link>
							</li>
						)}
					</ul>
					<Search />
				</div>

				{/* --- 3. RIGHT SECTION (Desktop Button) --- */}
				{/* Extracted from the <ul> so it can sit strictly on the far right */}
				<div className="hidden lg:block shrink-0">
					<Button
						onClick={session ? signOut : () => router.push("/auth/login")}
					>
						{session ? "LOG OUT" : "LOG IN"}
					</Button>
				</div>
			</div>
		</nav>
	);
}
