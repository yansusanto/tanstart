import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "#/components/page-header";
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

export const Route = createFileRoute("/account/settings")({
	component: Settings,
});

function Settings() {
	const { user } = Route.useRouteContext();
	const router = useRouter();
	const [message, setMessage] = useState("");
	const [pending, setPending] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setMessage("");
		setPending(true);
		const name = String(new FormData(e.currentTarget).get("name"));
		const { error } = await authClient.updateUser({ name });
		setPending(false);
		if (error) return setMessage(error.message ?? "Could not save.");
		setMessage("Saved.");
		await router.invalidate();
	}

	return (
		<>
			<PageHeader
				title="Settings"
				description="Manage how you appear in the dashboard."
			/>
			<Card className="max-w-xl">
				<CardHeader>
					<CardTitle className="text-base font-medium">Profile</CardTitle>
					<CardDescription>Your name is shown in the sidebar and greeting.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="grid gap-5">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input id="name" name="name" defaultValue={user.name} required />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" value={user.email} disabled readOnly />
						</div>
						<div className="flex items-center gap-3">
							<Button type="submit" disabled={pending}>
								Save changes
							</Button>
							{message && (
								<p role="status" className="text-sm text-muted-foreground">
									{message}
								</p>
							)}
						</div>
					</form>
				</CardContent>
			</Card>
		</>
	);
}
