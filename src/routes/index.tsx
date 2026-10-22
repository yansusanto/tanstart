import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

const features = [
	{
		title: "TanStack Start",
		text: "Type-safe routing, server functions and SSR.",
	},
	{
		title: "Cloudflare Workers",
		text: "Deploys to the edge with yarn deploy.",
	},
	{
		title: "Swappable design",
		text: "One theme file, set from any DESIGN.md.",
	},
];

function Home() {
	return (
		<main className="mx-auto max-w-4xl px-6 py-24">
			<Badge variant="secondary">Starter</Badge>
			<h1 className="mt-6 text-5xl">Build the next site on a solid base.</h1>
			<p className="mt-4 max-w-xl text-muted-foreground">
				Edit <code>src/routes/index.tsx</code> to get started. Colors, fonts and
				radius come from <code>src/theme.css</code>.
			</p>
			<div className="mt-8 flex gap-3">
				<Button>Get started</Button>
				<Button variant="secondary">Documentation</Button>
				<Button variant="outline">GitHub</Button>
			</div>
			<div className="mt-16 grid gap-4 sm:grid-cols-3">
				{features.map((f) => (
					<Card key={f.title}>
						<CardHeader>
							<CardTitle>{f.title}</CardTitle>
							<CardDescription>{f.text}</CardDescription>
						</CardHeader>
					</Card>
				))}
			</div>
		</main>
	);
}
