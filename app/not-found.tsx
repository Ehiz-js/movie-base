import Link from "next/link";

export default function NotFound() {
	return (
		<section className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-6xl font-bold text-(--purple-dark)">404</h1>
			<h2 className="text-2xl uppercase tracking-widest">Page not found</h2>
			<p className="text-gray-400 max-w-md">
				We couldn&apos;t find that movie or page. It may have been removed, or
				the link might be wrong.
			</p>
			<Link
				href="/"
				className="mt-4 p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200"
			>
				Back to home
			</Link>
		</section>
	);
}
