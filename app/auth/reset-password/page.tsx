import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "New password" };

export default function ResetPasswordPage() {
	return (
		<section className="mt-24 mb-12">
			<ResetPasswordForm />
		</section>
	);
}
