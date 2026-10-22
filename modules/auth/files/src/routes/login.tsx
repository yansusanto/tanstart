import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import { getSession } from "#/lib/session";

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
	component: Login,
});

function Login() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setPending(true);
		const form = new FormData(e.currentTarget);
		const email = String(form.get("email"));
		const password = String(form.get("password"));
		const { error } =
			mode === "signup"
				? await authClient.signUp.email({
						email,
						password,
						name: String(form.get("name")),
					})
				: await authClient.signIn.email({ email, password });
		setPending(false);
		if (error) return setError(error.message ?? "Something went wrong.");
		await navigate({ to: "/account" });
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-sm items-center px-6">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>
						{mode === "signin" ? "Sign in" : "Create an account"}
					</CardTitle>
					<CardDescription>
						{mode === "signin"
							? "Use your email and password."
							: "An email and a password of at least 8 characters."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="grid gap-4">
						{mode === "signup" && (
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input id="name" name="name" autoComplete="name" required />
							</div>
						)}
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
								autoComplete={
									mode === "signin" ? "current-password" : "new-password"
								}
								required
							/>
						</div>
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
						<Button type="submit" disabled={pending}>
							{mode === "signin" ? "Sign in" : "Create account"}
						</Button>
					</form>
					<Button
						variant="link"
						className="mt-2 px-0"
						onClick={() => {
							setError("");
							setMode(mode === "signin" ? "signup" : "signin");
						}}
					>
						{mode === "signin"
							? "No account yet? Create one"
							: "Already have an account? Sign in"}
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
