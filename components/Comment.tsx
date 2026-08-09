export default function Comment({
	username,
	content,
}: {
	username: string;
	content: string;
}) {
	return (
		<div className="mb-10">
			<h4 className="text-(--purple-dark) font-semibold">{username}</h4>
			<hr className="max-w-6xl mb-5 mt-2 text-(--purple-dark)" />
			<p className="text-gray-400 text-xl italic">{content}</p>
		</div>
	);
}
