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
		<nav className="w-full text-white px-6 xl:px-60 py-6 border-b border-white/20 fixed top-0 z-10 bg-transparent backdrop-blur-md">
			<div className="flex flex-wrap gap-4 justify-between items-center">
				<Link href="/" className="cursor-pointer lg:flex-none">
					<Image
						src="/assets/logo.png"
						alt="Movie base Logo"
						width={30}
						height={25}
					/>
				</Link>
				{session && (
					<span className="text-(--purple-dark) uppercase font-semibold">
						Hello, {displayName}
					</span>
				)}

				<ul className="flex flex-wrap justify-center items-center gap-4 lg:space-x-8 uppercase tracking-widest text-sm">
					<li>
						<Search />
					</li>
					<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
						<Link href="/">Home</Link>
					</li>

					<li className="hover:text-(--purple-dark) transition-all ease-in duration-200">
						<Link href="/movielist">My List</Link>
					</li>

					<li>
						<Button
							onClick={
								session ? signOut : () => router.push("/auth/login")
							}
						>
							{session ? "LOG OUT" : "LOG IN"}
						</Button>
					</li>
				</ul>
			</div>
		</nav>
	);
}
