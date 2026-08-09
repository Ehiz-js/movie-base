import { ReactNode } from "react";

export default function Button({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			onClick={onClick}
			className={`p-3 ${disabled ? "bg-(--purple-dark) cursor-not-allowed" : "bg-(--purple-dark) hover:text-(--purple-dark) hover:bg-white hover:scale-90 cursor-pointer transition-all ease-in duration-200"}  font-semibold rounded-lg shadow-lg flex gap-2 items-center`}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
