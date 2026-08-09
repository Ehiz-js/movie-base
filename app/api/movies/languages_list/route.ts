import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbServer";
import { LanguageType } from "@/types/movie";

export async function GET() {
	try {
		const data = await tmdbFetch<LanguageType[]>("/configuration/languages");
		return NextResponse.json(data);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to GET languages list" },
			{ status: 500 },
		);
	}
}
