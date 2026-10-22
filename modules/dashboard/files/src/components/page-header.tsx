// Every dashboard page starts with this, so titles and spacing stay consistent.
export function PageHeader({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<div className="grid gap-1.5">
			<h1 className="text-2xl leading-tight font-medium">{title}</h1>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
		</div>
	);
}
