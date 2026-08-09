"use client";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";
import Button from "./Button";

export default function Pagination({
	pageNum,
	hasNext,
	incrementPageNum,
	decrementPageNum,
}: {
	pageNum: number;
	hasNext: boolean;
	incrementPageNum: () => void;
	decrementPageNum: () => void;
}) {
	return (
		<div className="flex items-center gap-2 mt-10">
			{pageNum > 1 && (
				<Button onClick={decrementPageNum}>
					<FaChevronCircleLeft />
				</Button>
			)}
			Page {pageNum}
			{hasNext && (
				<Button onClick={incrementPageNum}>
					<FaChevronCircleRight />
				</Button>
			)}
		</div>
	);
}
