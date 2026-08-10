import { WatchProviders } from "@/types/movie";

/**
 * Where a title can legally be watched. TMDB sources this from JustWatch,
 * whose terms require the attribution and the link out.
 */
export default function WatchProvidersRow({
	providers,
}: {
	providers: WatchProviders | null;
}) {
	if (!providers) return null;

	const groups: { label: string; items: WatchProviders["flatrate"] }[] = [
		{ label: "Stream", items: providers.flatrate },
		{ label: "Rent", items: providers.rent },
		{ label: "Buy", items: providers.buy },
	].filter((group) => group.items && group.items.length > 0);

	if (groups.length === 0) return null;

	return (
		<div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5">
			<h2 className="flex items-center gap-2 font-semibold">
				<span aria-hidden className="h-5 w-1 rounded bg-(--purple-dark)" />
				Where to watch
			</h2>

			<div className="mt-4 flex flex-col gap-3">
				{groups.map((group) => (
					<div key={group.label} className="flex items-center gap-3">
						<span className="w-14 shrink-0 text-xs uppercase tracking-wide text-gray-400">
							{group.label}
						</span>
						<ul className="flex flex-wrap gap-2">
							{group.items?.map((provider) => (
								<li key={provider.provider_id}>
									<img
										src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
										alt={provider.provider_name}
										title={provider.provider_name}
										className="size-9 rounded-lg ring-1 ring-white/10"
									/>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			{providers.link && (
				<a
					href={providers.link}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-4 inline-block text-xs text-(--purple-light) hover:underline underline-offset-3"
				>
					Availability from JustWatch
				</a>
			)}
		</div>
	);
}
