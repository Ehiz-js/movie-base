"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Search from "./Search";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
	const router = useRouter();
	const { user, signOut, session, profile } = useAuth();
	const displayName = profile?.username || user?.email?.split("@")[0];
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<nav className="w-full text-(--foreground) px-4 sm:px-6 xl:px-60 py-3 sm:py-4 border-b border-(--foreground)/20 fixed top-0 z-10 bg-background/80 backdrop-blur-md">
			{/* Outer Container: Uses justify-between to push the Left and Right sections to the edges */}
			<div className="flex lg:items-center justify-between gap-4 w-full">
				{/* --- 1. LEFT SECTION (Logo & mobile "Hello") --- */}
				<div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
					<Link href="/" className="cursor-pointer shrink-0">
						<Image
							src="/assets/logo.png"
							alt="Movie base Logo"
							width={30}
							height={25}
						/>
					</Link>

					{session && (
						<span className="text-(--purple-dark) uppercase font-semibold text-xs sm:text-sm truncate min-w-0">
							Hello, {displayName}
						</span>
					)}
				</div>

				{/* --- 2. CENTER SECTION (Search & Links) --- */}
				{/* Desktop only: this collapses behind the mobile menu below lg. */}
				<div className="hidden lg:flex items-center justify-center flex-1 gap-8">
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

				{/* --- 3. RIGHT SECTION (Desktop button, mobile menu toggle) --- */}
				<div className="flex items-center gap-2 shrink-0">
					<div className="hidden lg:block">
						<Button
							onClick={session ? signOut : () => router.push("/auth/login")}
						>
							{session ? "LOG OUT" : "LOG IN"}
						</Button>
					</div>

					<button
						type="button"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
						className="lg:hidden grid size-9 place-items-center rounded-md text-(--purple-dark) cursor-pointer"
					>
						{menuOpen ? (
							<FaTimes className="size-5" />
						) : (
							<FaBars className="size-5" />
						)}
					</button>
				</div>
			</div>

			{/* --- MOBILE MENU (Links, Search, Login) --- */}
			{/* Below lg only; the desktop center/right sections above cover this there. */}
			{menuOpen && (
				<div className="lg:hidden mt-4 flex flex-col items-center gap-4">
					<ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 uppercase tracking-widest text-sm">
						<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
							<Link href="/" onClick={() => setMenuOpen(false)}>
								Home
							</Link>
						</li>

						<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
							<Link href="/movielist" onClick={() => setMenuOpen(false)}>
								My List
							</Link>
						</li>

						{session && (
							<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
								<Link href="/onboarding" onClick={() => setMenuOpen(false)}>
									Profile
								</Link>
							</li>
						)}
					</ul>
					<Search />
					<Button
						onClick={() => {
							setMenuOpen(false);
							if (session) signOut();
							else router.push("/auth/login");
						}}
					>
						{session ? "LOG OUT" : "LOG IN"}
					</Button>
				</div>
			)}
		</nav>
	);
}
