import { useEffect, useState } from "react";

export default function useDebounce(value: string, buffer: number) {
	const [debounceValue, setDebounceValue] = useState(value);

	useEffect(() => {
		const delay = setTimeout(() => {
			setDebounceValue(value);
		}, buffer);
		return () => {
			clearTimeout(delay);
		};
	}, [value, buffer]);
	return debounceValue;
}
