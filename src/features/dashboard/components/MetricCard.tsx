import { Card, Chip } from "@heroui/react";
import type { ReactNode } from "react";

interface MetricCardProps {
	title: string;
	value: string;
	icon: ReactNode;
	trend?: string;
	trendUp?: boolean;
}

export function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
	return (
		<Card className="p-8 flex flex-row items-center gap-6 border-none shadow-none group hover:bg-app-brand/[0.02] transition-colors cursor-default">
			<Card.Content className="flex flex-row items-center gap-6 p-0 w-full">
				<div className="h-14 w-14 rounded-2xl bg-app-brand/10 text-app-brand flex items-center justify-center transition-transform group-hover:scale-110">
					{icon}
				</div>
				<div className="text-left flex-1 min-w-0">
					<p className="text-xs font-black text-text-secondary uppercase tracking-[0.15em] mb-1">{title}</p>
					<div className="flex items-baseline gap-3">
						<h4 className="text-3xl font-serif font-bold text-text-primary tracking-tight">{value}</h4>
						{trend && (
							<Chip
								color={trendUp ? "success" : "warning"}
								size="sm"
								variant="soft"
							>
								{trendUp ? "↑" : "↓"} {trend}
							</Chip>
						)}
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}
