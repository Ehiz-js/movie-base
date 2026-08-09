"use client";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";
import Button from "./Button";

export default function Pagination({
	pageNum,
	totalPages,
	hasNext,
	incrementPageNum,
	decrementPageNum,
}: {
	pageNum: number;
	totalPages: number;
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
			<span className="tabular-nums">
				Page {pageNum} of {totalPages}
			</span>
			{hasNext && (
				<Button onClick={incrementPageNum}>
					<FaChevronCircleRight />
				</Button>
			)}
		</div>
	);
}
