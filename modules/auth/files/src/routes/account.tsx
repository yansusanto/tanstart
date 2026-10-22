import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { getSession } from "#/lib/session";

// Example of a protected route: copy the beforeLoad guard to any page that needs a signed-in user.
export const Route = createFileRoute("/account")({
	head: () => ({
		meta: [
			{ title: "Account" },
			{ name: "description", content: "Your account." },
		],
	}),
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/login" });
		return { user: session.user };
	},
	component: Account,
});

function Account() {
	const { user } = Route.useRouteContext();
	const navigate = useNavigate();

	return (
		<main className="mx-auto max-w-2xl px-6 py-24">
			<h1 className="text-4xl">Account</h1>
			<p className="mt-4 text-muted-foreground">
				Signed in as {user.name} ({user.email}).
			</p>
			<Button
				className="mt-8"
				variant="outline"
				onClick={async () => {
					await authClient.signOut();
					await navigate({ to: "/login" });
				}}
			>
				Sign out
			</Button>
		</main>
	);
}
