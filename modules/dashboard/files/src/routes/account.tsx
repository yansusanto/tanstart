import {
	createFileRoute,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { AppSidebar } from "#/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";
import { getSession } from "#/lib/session";

// Layout for every page under /account. The beforeLoad guard protects all of them.
export const Route = createFileRoute("/account")({
	head: () => ({
		meta: [
			{ title: "Dashboard" },
			{ name: "description", content: "Your account dashboard." },
		],
	}),
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/login" });
		return { user: session.user };
	},
	component: AccountLayout,
});

const titles: Record<string, string> = {
	"/account": "Overview",
	"/account/settings": "Settings",
};

function AccountLayout() {
	const { user } = Route.useRouteContext();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<SidebarProvider>
			<AppSidebar user={user} />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage>{titles[pathname] ?? "Account"}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>
				<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-6 md:p-8">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
