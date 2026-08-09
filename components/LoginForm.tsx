"use client";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface FormType {
	email: string;
	password: string;
}

const initialData: FormType = {
	email: "",
	password: "",
};

export default function LoginForm() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState<FormType>(initialData);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		const { email, password } = formData;

		// Validate before showing the spinner. The original set isLoading first
		// and returned without clearing it, which left the form stuck behind a
		// spinner that never went away.
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setIsLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setIsLoading(false);

		if (error) {
			setError(error.message);
			return;
		}
		router.push("/");
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
						<h1>Log in</h1>
						<hr className="mt-4 border-t border-(--purple-dark) w-full" />
					</div>
					<div className="flex flex-col items-start gap-2 w-60">
						<label htmlFor="email">Email</label>
						<input
							value={formData.email}
							onChange={(e) => {
								setFormData({ ...formData, email: e.target.value });
							}}
							id="email"
							type="email"
							name="email"
							className="border border-(--purple-dark) focus:outline-(--purple-light) rounded-md w-full p-2"
							placeholder="example@email.com"
						/>
					</div>
					<div className="flex flex-col items-start relative gap-2 w-60">
						<label htmlFor="password">Password</label>
						<input
							value={formData.password}
							onChange={(e) => {
								setFormData({ ...formData, password: e.target.value });
							}}
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
						{error && (
							<p className="text-sm font-extralight text-red-600">{error}</p>
						)}
					</div>
					<button
						type="submit"
						className="p-3 bg-(--purple-dark) font-semibold rounded-lg shadow-lg hover:text-(--purple-dark) hover:bg-white transition-all ease-in duration-200 hover:scale-90 cursor-pointer flex gap-2 items-center w-60 justify-center"
					>
						Log in
					</button>
					<p>
						<Link
							href="/auth/forgot-password"
							className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
						>
							Forgot your password?
						</Link>
					</p>
					<p>
						Dont have an account? Sign up{" "}
						<Link
							href="/auth/signup"
							className="hover:underline underline-offset-3 text-(--purple-dark) hover:text-(--purple-light) transition-all duration-200"
						>
							here
						</Link>{" "}
					</p>
				</>
			)}
		</form>
	);
}
