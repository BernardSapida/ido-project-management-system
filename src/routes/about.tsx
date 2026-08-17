import { Button } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "lucide-react";
import { seo } from "@/config/seo.config";
import { FeatureCard } from "@/features/about/components/FeatureCard";

export const Route = createFileRoute("/about")({
	head: () => ({
		meta: [
			{ title: seo.title("Our Vision") },
			{
				name: "description",
				content: "Learn more about the TanStack Start Monolith Project template and our Design Philosophy.",
			},
		],
		links: [{ rel: "canonical", href: `${seo.url}/about` }],
	}),
	component: About,
});

function About() {
	return (
		<div className="min-h-screen bg-app-base py-32 px-6 flex flex-col items-center relative overflow-hidden">
			{/* Background Glow */}
			<div className="absolute top-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-app-brand/10 blur-[100px] -z-10 animate-pulse" />
			<div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-app-accent/10 blur-[100px] -z-10 animate-pulse delay-700" />

			<div className="w-full max-w-4xl flex flex-col items-center text-center rise-in">
				<div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-app-brand/10 text-app-brand mb-10 shadow-xl shadow-app-brand/20">
					<Layout className="h-8 w-8" />
				</div>

				<h1 className="text-5xl lg:text-7xl font-serif font-black text-text-primary mb-10 tracking-tight leading-[1.1]">
					Crafting a <span className="text-app-brand italic px-2">Better</span> Foundation
				</h1>

				<p className="text-xl lg:text-2xl text-text-secondary font-medium leading-[1.8] max-w-3xl mb-20">
					Born from the pursuit of simplicity and power, this template marries the performance of TanStack Start with
					the luxury of Sea Ink aesthetics.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mb-32">
					<FeatureCard
						description="We believe in minimal friction between code and core features."
						title="Philosophy"
					/>
					<FeatureCard
						description="A design system that feels more like a fine-press journal than a generic app."
						title="Elegance"
					/>
				</div>

				<div className="flex gap-4">
					<Link to="/sign-up">
						<Button
							className="h-16 px-12 rounded-2xl text-xl font-bold font-serif shadow-2xl shadow-app-brand/20"
							size="lg"
							type="button"
							variant="primary"
						>
							Join the Journey
						</Button>
					</Link>
					<Link to="/">
						<Button
							className="h-16 px-12 rounded-2xl text-xl font-bold border-text-primary/10 hover:border-text-primary/20 bg-white/30 backdrop-blur-md"
							size="lg"
							type="button"
							variant="outline"
						>
							Back Home
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
