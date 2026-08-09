"use client";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	// Supabase turns the recovery link into a session, which arrives slightly
	// after mount. Until it does we cannot tell a valid link from an expired one.
	const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
		null,
	);

	useEffect(() => {
		let cancelled = false;
		async function checkSession() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!cancelled) setHasRecoverySession(Boolean(session));
		}
		checkSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!cancelled) setHasRecoverySession(Boolean(session));
		});

		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, []);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (password !== confirmPassword) {
			setError("Both passwords must match");
			return;
		}

		setIsLoading(true);
		const { error } = await supabase.auth.updateUser({ password });
		setIsLoading(false);

		if (error) {
			setError(error.message);
			return;
		}
		router.push("/");
	}

	if (hasRecoverySession === null) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner className="text-purple-600" />
			</div>
		);
	}

	if (!hasRecoverySession) {
		return (
			<div className="flex flex-col min-h-screen items-center justify-center gap-4 px-6 text-center">
				<h1 className="uppercase font-semibold text-(--purple-dark)">
					Link expired
				</h1>
				<p className="max-w-md text-gray-400">
					This reset link is no longer valid. Reset links last an hour and can
					only be used once.
				</p>
				<Link
					href="/auth/forgot-password"
					className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
				>
					Request a new one
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
						<h1>New password</h1>
						<hr className="mt-4 border-t border-(--purple-dark) w-full" />
					</div>
					<div className="flex flex-col items-start relative gap-2 w-60">
						<label htmlFor="password">Password</label>
						<input
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							id="password"
							type={showPassword ? "text" : "password"}
							name="password"
							placeholder="********"
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
						/>
						<button
							type="button"
							className="absolute right-2 top-10 text-purple-600 cursor-pointer"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? <EyeIcon /> : <EyeOffIcon />}
						</button>
					</div>
					<div className="flex flex-col items-start gap-2 w-60">
						<label htmlFor="confirmPassword">Confirm password</label>
						<input
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							id="confirmPassword"
							type={showPassword ? "text" : "password"}
							name="confirmPassword"
							placeholder="********"
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
						/>
						{error && (
							<p className="text-sm font-extralight text-red-600">{error}</p>
						)}
					</div>
					<button
						type="submit"
						className="p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200 hover:scale-90 cursor-pointer flex gap-2 items-center w-60 justify-center"
					>
						Save password
					</button>
				</>
			)}
		</form>
	);
}
