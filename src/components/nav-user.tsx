import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar } from "#/components/panelui/avatar";
import { Menu } from "#/components/panelui/menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";

type User = { name: string; email: string; image?: string | null };

export function NavUser({ user }: { user: User }) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();

	const signOut = async () => {
		await authClient.signOut();
		await navigate({ to: "/login" });
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<Menu>
					<Menu.Trigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar
							src={user.image ?? undefined}
							name={user.name}
							shape="square"
							className="size-8 rounded-lg"
						/>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4" />
					</Menu.Trigger>
					<Menu.Content
						className="min-w-56"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<div className="grid px-2 py-1.5 text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{user.email}
							</span>
						</div>
						<Menu.Separator />
						<Menu.Item onClick={signOut}>
							<LogOut />
							Sign out
						</Menu.Item>
					</Menu.Content>
				</Menu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
