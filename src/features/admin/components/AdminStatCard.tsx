import { Card } from "@heroui/react";

interface AdminStatCardProps {
	icon: React.ReactNode;
	title: string;
	value: string | number;
	isWarning?: boolean;
}

export function AdminStatCard({ icon, title, value, isWarning }: AdminStatCardProps) {
	return (
		<Card className="p-8 flex flex-row items-center gap-6 border-none shadow-none group hover:bg-app-brand/[0.02] transition-colors">
			<Card.Content className="flex flex-row items-center gap-6 p-0 w-full">
				<div
					className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
						isWarning ? "bg-amber-100 text-amber-700" : "bg-app-brand/10 text-app-brand"
					}`}
				>
					{icon}
				</div>
				<div className="text-left">
					<p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{title}</p>
					<h4 className="text-3xl font-serif font-bold text-text-primary mt-1">{value}</h4>
				</div>
			</Card.Content>
		</Card>
	);
}
