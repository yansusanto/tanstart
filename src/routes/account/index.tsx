import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "#/components/page-header";
import { Avatar } from "#/components/panelui/avatar";
import { BarPicker } from "#/components/panelui/bar-picker";
import { Frame } from "#/components/panelui/frame";
import { RangeMeter } from "#/components/panelui/range-meter";
import { Stat } from "#/components/panelui/stat";
import { Badge } from "#/components/ui/badge";

export const Route = createFileRoute("/account/")({ component: Overview });

// Placeholder numbers. Replace with real data from a server function.
type Day = { label: string; name: string; value: number };

const revenue: Day[] = [
	{ label: "Mon", name: "Monday", value: 1420 },
	{ label: "Tue", name: "Tuesday", value: 1890 },
	{ label: "Wed", name: "Wednesday", value: 2310 },
	{ label: "Thu", name: "Thursday", value: 1760 },
	{ label: "Fri", name: "Friday", value: 2640 },
	{ label: "Sat", name: "Saturday", value: 1120 },
	{ label: "Sun", name: "Sunday", value: 1340 },
];

const customers: Day[] = [
	{ label: "Mon", name: "Monday", value: 14 },
	{ label: "Tue", name: "Tuesday", value: 22 },
	{ label: "Wed", name: "Wednesday", value: 19 },
	{ label: "Thu", name: "Thursday", value: 27 },
	{ label: "Fri", name: "Friday", value: 21 },
	{ label: "Sat", name: "Saturday", value: 9 },
	{ label: "Sun", name: "Sunday", value: 16 },
];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const count = (n: number) => n.toLocaleString("en-US");

const recent = [
	{
		name: "Olivia Martin",
		email: "olivia@example.com",
		status: "Paid",
		amount: "$250.00",
	},
	{
		name: "Jackson Lee",
		email: "jackson@example.com",
		status: "Pending",
		amount: "$39.00",
	},
	{
		name: "Isabella Nguyen",
		email: "isabella@example.com",
		status: "Paid",
		amount: "$299.00",
	},
	{
		name: "William Kim",
		email: "will@example.com",
		status: "Paid",
		amount: "$99.00",
	},
];

function WeekCard({
	title,
	data,
	format,
	initial,
}: {
	title: string;
	data: Day[];
	format: (n: number) => string;
	initial: number;
}) {
	const [day, setDay] = useState(initial);
	const total = data.reduce((sum, d) => sum + d.value, 0);

	return (
		<Frame variant="band">
			<Frame.Header>
				<Frame.Title>{title}</Frame.Title>
				<Frame.Action>This week · {format(total)}</Frame.Action>
			</Frame.Header>
			<Frame.Panel className="grid gap-6 p-6">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-sm text-muted-foreground">{data[day].name}</p>
						<p className="text-5xl leading-tight font-semibold tabular-nums">
							{format(data[day].value)}
						</p>
					</div>
					<Badge variant="secondary" className="rounded-full px-3 py-1">
						{Math.round((data[day].value / total) * 100)}% of the week
					</Badge>
				</div>
				<BarPicker
					data={data}
					value={day}
					onValueChange={setDay}
					label={`${title} by day`}
					formatValue={format}
				/>
			</Frame.Panel>
		</Frame>
	);
}

const goals = [
	{
		title: "Total revenue",
		unit: "USD",
		value: 12480,
		goal: 15000,
		change: "+8%",
	},
	{ title: "New customers", unit: "", value: 128, goal: 150, change: "+12%" },
	{
		title: "Active accounts",
		unit: "",
		value: 1024,
		goal: 1200,
		change: "+3%",
	},
];

const num = (n: number) => n.toLocaleString("en-US");

function GoalCard({
	title,
	unit,
	value,
	goal,
	change,
}: {
	title: string;
	unit: string;
	value: number;
	goal: number;
	change: string;
}) {
	return (
		<Frame variant="band">
			<Frame.Header>
				<Frame.Title>{title}</Frame.Title>
				<Frame.Action>Monthly goal</Frame.Action>
			</Frame.Header>
			<Frame.Panel className="grid gap-6 p-6">
				<Stat.Content>
					<Stat.Label>This month</Stat.Label>
					<Stat.Value size="lg" className="font-semibold">
						{num(value)}
						{unit && <Stat.Unit>{unit}</Stat.Unit>}
					</Stat.Value>
					<Stat.Badge className="mt-2 w-fit">{change} vs last month</Stat.Badge>
				</Stat.Content>
				<div>
					<RangeMeter
						value={Math.round((value / goal) * 100)}
						formatValue={(v) => `${v}%`}
						label={`${title} progress to goal`}
						valueText={`${num(value)} of ${num(goal)}`}
					/>
					<RangeMeter.Scale start="0" end={num(goal)} />
				</div>
			</Frame.Panel>
		</Frame>
	);
}

function Overview() {
	const { user } = Route.useRouteContext();

	return (
		<>
			<PageHeader
				title={`Welcome back, ${user.name.split(" ")[0]}`}
				description="A starting point for your dashboard."
			/>
			<div className="grid gap-4 lg:grid-cols-3">
				{goals.map((g) => (
					<GoalCard key={g.title} {...g} />
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<WeekCard title="Revenue" data={revenue} format={usd} initial={4} />
				<WeekCard
					title="New customers"
					data={customers}
					format={count}
					initial={3}
				/>
			</div>
			<Frame>
				<Frame.Header>
					<Frame.Title>Recent orders</Frame.Title>
					<Frame.Action>Sample data</Frame.Action>
				</Frame.Header>
				<Frame.Panel>
					{recent.map((r) => (
						<Frame.Row key={r.email}>
							<Frame.Media>
								<Avatar name={r.name} size="sm" />
							</Frame.Media>
							<Frame.Content>
								<Frame.Title>{r.name}</Frame.Title>
								<Frame.Description>{r.email}</Frame.Description>
							</Frame.Content>
							<Frame.Actions>
								<Badge variant={r.status === "Paid" ? "secondary" : "outline"}>
									{r.status}
								</Badge>
								<span className="w-20 text-right text-sm tabular-nums">
									{r.amount}
								</span>
							</Frame.Actions>
						</Frame.Row>
					))}
				</Frame.Panel>
			</Frame>
		</>
	);
}
