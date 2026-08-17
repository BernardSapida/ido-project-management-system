import { Card } from "@heroui/react";

interface FeatureCardProps {
	title: string;
	description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
	return (
		<Card className="p-10 lg:p-12 text-left border-none shadow-none group transition-all hover:bg-white cursor-default">
			<Card.Content className="p-0">
				<h3 className="text-2xl font-serif font-bold text-text-primary mb-4 flex items-center gap-3">
					<span className="h-2 w-2 rounded-full bg-app-brand shadow-[0_0_10px_rgba(79,184,178,0.5)]" />
					{title}
				</h3>
				<p className="text-lg text-text-secondary leading-relaxed">{description}</p>
			</Card.Content>
		</Card>
	);
}
