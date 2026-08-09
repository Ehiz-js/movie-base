import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
	return (
		<section className="mt-24 mb-12">
			<ForgotPasswordForm />
		</section>
	);
}
