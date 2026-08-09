"use client";
import Link from "next/link";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordForm() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (!email.trim()) {
			setError("Enter the email address for your account");
			return;
		}

		setIsLoading(true);
		const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: `${window.location.origin}/auth/reset-password`,
		});
		setIsLoading(false);

		if (error) {
			setError(error.message);
			return;
		}
		// Shown regardless of whether the address exists, so this page cannot be
		// used to discover which emails have accounts.
		setSent(true);
	}

	if (sent) {
		return (
			<div className="flex flex-col min-h-screen items-center justify-center gap-4 px-6 text-center">
				<h1 className="uppercase font-semibold text-(--purple-dark)">
					Check your email
				</h1>
				<p className="max-w-md text-gray-400">
					If an account exists for {email.trim()}, a link to reset your password
					is on its way. The link expires after an hour.
				</p>
				<Link
					href="/auth/login"
					className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
				>
					Back to log in
				</Link>
			</div>
		);
	}

	return (
		<form
			className="flex flex-col min-h-screen items-center justify-center gap-7"
			onSubmit={handleSubmit}
		>
			{isLoading ? (
				<Spinner className="text-purple-600" />
			) : (
				<>
					<div className="w-60 flex flex-col items-center text-(--purple-dark) uppercase font-semibold">
						<h1>Reset password</h1>
						<hr className="mt-4 border-t border-(--purple-dark) w-full" />
					</div>
					<div className="flex flex-col items-start gap-2 w-60">
						<label htmlFor="email">Email</label>
						<input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							id="email"
							type="email"
							name="email"
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
							placeholder="example@email.com"
						/>
						{error && (
							<p className="text-sm font-extralight text-red-600">{error}</p>
						)}
					</div>
					<button
						type="submit"
						className="p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200 hover:scale-90 cursor-pointer flex gap-2 items-center w-60 justify-center"
					>
						Send reset link
					</button>
					<p>
						Remembered it? Log in{" "}
						<Link
							href="/auth/login"
							className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
						>
							here
						</Link>
					</p>
				</>
			)}
		</form>
	);
}
