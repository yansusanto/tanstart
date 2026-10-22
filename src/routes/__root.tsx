import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeHotkey, themeInitScript } from "#/components/theme-hotkey";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import inlineCss from "../styles.css?inline";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
			{
				name: "description",
				content:
					"A TanStack Start starter for Cloudflare Workers with swappable designs, Tailwind and shadcn/ui.",
			},
		],
		// Production inlines the stylesheet so it does not block first paint.
		...(import.meta.env.PROD
			? {
					links: [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
					styles: [{ children: inlineCss }],
				}
			: {
					links: [
						{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
						{ rel: "stylesheet", href: appCss },
					],
				}),
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<HeadContent />
			</head>
			<body>
				{children}
				<ThemeHotkey />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
