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
			{/* Two rows on small screens — the search box needs the full width to be
			    usable — collapsing to one row from lg up. */}
			<div className="flex flex-col lg:flex-row lg:items-center gap-3">
				<div className="flex items-center justify-between gap-4">
					<Link href="/" className="cursor-pointer shrink-0">
						<Image
							src="/assets/logo.png"
							alt="Movie base Logo"
							width={30}
							height={25}
						/>
					</Link>

					{session && (
						<span className="text-(--purple-dark) uppercase font-semibold text-sm truncate max-w-40">
							Hello, {displayName}
						</span>
					)}

					<div className="lg:hidden">
						<Button onClick={session ? signOut : () => router.push("/auth/login")}>
							{session ? "LOG OUT" : "LOG IN"}
						</Button>
					</div>
				</div>

				<div className="w-full lg:max-w-sm lg:ml-auto">
					<Search />
				</div>

				<ul className="flex flex-wrap items-center gap-x-6 gap-y-2 uppercase tracking-widest text-sm">
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

					<li className="hidden lg:block">
						<Button
							onClick={session ? signOut : () => router.push("/auth/login")}
						>
							{session ? "LOG OUT" : "LOG IN"}
						</Button>
					</li>
				</ul>
			</div>
		</nav>
	);
}
