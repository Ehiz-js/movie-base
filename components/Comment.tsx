const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 365 * 24 * 60 * 60 * 1000],
	["month", 30 * 24 * 60 * 60 * 1000],
	["week", 7 * 24 * 60 * 60 * 1000],
	["day", 24 * 60 * 60 * 1000],
	["hour", 60 * 60 * 1000],
	["minute", 60 * 1000],
];

/**
 * "3 hours ago". Rendered only after the comment list has fetched on the
 * client, so this cannot produce a hydration mismatch.
 */
function formatPostedAt(createdAt: string) {
	const timestamp = new Date(createdAt).getTime();
	if (Number.isNaN(timestamp)) return "";

	const elapsed = Date.now() - timestamp;
	if (elapsed < 60 * 1000) return "just now";

	const formatter = new Intl.RelativeTimeFormat(undefined, {
		numeric: "auto",
	});
	for (const [unit, ms] of UNITS) {
		if (elapsed >= ms) {
			return formatter.format(-Math.floor(elapsed / ms), unit);
		}
	}
	return "just now";
}

export default function Comment({
	username,
	content,
	createdAt,
	onDelete,
	isDeleting,
}: {
	username: string;
	content: string;
	createdAt?: string;
	onDelete?: () => void;
	isDeleting?: boolean;
}) {
	return (
		<div className="mb-10">
			<div className="flex flex-wrap items-baseline gap-x-3">
				<h4 className="text-(--purple-dark) font-semibold">{username}</h4>
				{createdAt && (
					<time
						dateTime={createdAt}
						title={new Date(createdAt).toLocaleString()}
						className="text-sm text-gray-500"
					>
						{formatPostedAt(createdAt)}
					</time>
				)}
				{onDelete && (
					<button
						type="button"
						onClick={onDelete}
						disabled={isDeleting}
						className="text-sm text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
					>
						{isDeleting ? "Deleting…" : "Delete"}
					</button>
				)}
			</div>
			<hr className="max-w-6xl mb-5 mt-2 text-(--purple-dark)" />
			<p className="text-gray-400 text-xl italic">{content}</p>
		</div>
	);
}
