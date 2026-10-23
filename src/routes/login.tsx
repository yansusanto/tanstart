import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/panelui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/panelui/card";
import { Input } from "#/components/panelui/input";
import { Label } from "#/components/panelui/label";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";
import { getGoogleEnabled, getSession } from "#/lib/session";

export const Route = createFileRoute("/login")({
	head: () => ({
		meta: [
			{ title: "Sign in" },
			{ name: "description", content: "Sign in or create an account." },
		],
	}),
	beforeLoad: async () => {
		if (await getSession()) throw redirect({ to: "/account" });
	},
	loader: () => getGoogleEnabled(),
	component: Login,
});

/** Google's multicolor "G". The brand colors are fixed by Google's guidelines, so they are the one hardcoded exception. */
function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
			<path
				fill="#4285F4"
				d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
			/>
			<path
				fill="#FBBC05"
				d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4-3.09Z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
			/>
		</svg>
	);
}

function Login() {
	const navigate = useNavigate();
	const googleEnabled = Route.useLoaderData();
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setPending(true);
		const form = new FormData(e.currentTarget);
		const email = String(form.get("email"));
		const password = String(form.get("password"));
		let { error } = await authClient.signIn.email({ email, password });
		// An unknown email creates the account. Better Auth gives the same error for an unknown email and a wrong password.
		if (error?.code === "INVALID_EMAIL_OR_PASSWORD") {
			const signUp = await authClient.signUp.email({
				email,
				password,
				name: email.split("@")[0],
			});
			error = signUp.error?.code?.startsWith("USER_ALREADY_EXISTS")
				? error
				: signUp.error;
		}
		setPending(false);
		if (error) return setError(error.message ?? "Something went wrong.");
		await navigate({ to: "/account" });
	}

	async function onGoogle() {
		setError("");
		const { error } = await authClient.signIn.social({
			provider: "google",
			callbackURL: "/account",
		});
		if (error) setError(error.message ?? "Something went wrong.");
	}

	return (
		<main className="grid min-h-screen lg:grid-cols-2">
			<div className="flex items-center justify-center px-6 py-12">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>Sign in</CardTitle>
						<CardDescription>
							Use your email and password. A new email creates an account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={onSubmit} className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									minLength={8}
									autoComplete="current-password"
									required
								/>
							</div>
							{error && (
								<p role="alert" className="text-sm text-destructive">
									{error}
								</p>
							)}
							<Button type="submit" disabled={pending}>
								Continue
							</Button>
						</form>
						{googleEnabled && (
							<>
								<div className="my-4 flex items-center gap-3">
									<Separator className="flex-1" />
									<span className="text-sm text-muted-foreground">or</span>
									<Separator className="flex-1" />
								</div>
								<Button variant="outline" className="w-full" onClick={onGoogle}>
									<GoogleIcon />
									Continue with Google
								</Button>
							</>
						)}
					</CardContent>
				</Card>
			</div>
			<aside className="hidden bg-primary lg:block" aria-hidden="true" />
		</main>
	);
}
