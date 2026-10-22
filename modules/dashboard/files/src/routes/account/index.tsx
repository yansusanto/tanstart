import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/page-header";
import { Badge } from "#/components/ui/badge";
import { Card, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";

export const Route = createFileRoute("/account/")({ component: Overview });

// Placeholder numbers. Replace with real data from a server function.
const stats = [
	{ label: "Total revenue", value: "$12,480", note: "+8% from last month" },
	{ label: "New customers", value: "128", note: "+12% from last month" },
	{ label: "Active accounts", value: "1,024", note: "+3% from last month" },
	{ label: "Growth rate", value: "4.5%", note: "Steady this quarter" },
];

const recent = [
	{ name: "Olivia Martin", email: "olivia@example.com", status: "Paid", amount: "$250.00" },
	{ name: "Jackson Lee", email: "jackson@example.com", status: "Pending", amount: "$39.00" },
	{ name: "Isabella Nguyen", email: "isabella@example.com", status: "Paid", amount: "$299.00" },
	{ name: "William Kim", email: "will@example.com", status: "Paid", amount: "$99.00" },
];

function Overview() {
	const { user } = Route.useRouteContext();

	return (
		<>
			<PageHeader
				title={`Welcome back, ${user.name.split(" ")[0]}`}
				description="A starting point for your dashboard."
			/>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((s) => (
					<Card key={s.label} className="gap-1 py-5">
						<CardHeader className="gap-1">
							<p className="text-sm text-muted-foreground">{s.label}</p>
							<p className="text-3xl leading-tight font-medium tabular-nums">
								{s.value}
							</p>
							<p className="text-xs text-muted-foreground">{s.note}</p>
						</CardHeader>
					</Card>
				))}
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				<CardHeader className="gap-1 border-b py-5 [.border-b]:pb-5">
					<CardTitle className="text-base font-medium">Recent orders</CardTitle>
					<p className="text-sm text-muted-foreground">Sample data.</p>
				</CardHeader>
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="h-11 pl-6 text-xs font-medium text-muted-foreground">
								Customer
							</TableHead>
							<TableHead className="h-11 text-xs font-medium text-muted-foreground">
								Status
							</TableHead>
							<TableHead className="h-11 pr-6 text-right text-xs font-medium text-muted-foreground">
								Amount
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{recent.map((r) => (
							<TableRow key={r.email}>
								<TableCell className="py-3 pl-6">
									<div className="text-sm font-medium">{r.name}</div>
									<div className="text-xs text-muted-foreground">{r.email}</div>
								</TableCell>
								<TableCell>
									<Badge variant={r.status === "Paid" ? "secondary" : "outline"}>
										{r.status}
									</Badge>
								</TableCell>
								<TableCell className="pr-6 text-right text-sm tabular-nums">
									{r.amount}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</>
	);
}
