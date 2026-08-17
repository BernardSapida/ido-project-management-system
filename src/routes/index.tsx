import type { SiteHeaderAction, SiteNavItem } from "@bernardsapida/web-ui";
import { AppButton, AppCard, AppChip, AppSiteHeader } from "@bernardsapida/web-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Database, Github, Layout, Shield, Zap } from "lucide-react";
import { APP_NAME, seo } from "@/config/seo.config";

/**
 * The public bar's destinations.
 *
 * `Features` is a section of THIS page, so it travels as a router hash rather
 * than a bare `#features` anchor: the same item then works from any other page
 * the header ends up on, and it does not light itself merely because you are on
 * the page it lives in.
 */
const SITE_NAV: SiteNavItem[] = [
	{ hash: "features", href: "/", icon: Zap, label: "Features" },
	{ href: "https://github.com", icon: Github, isExternal: true, label: "GitHub" },
	{ href: "https://docs.heroui.com", icon: BookOpen, isExternal: true, label: "Docs" },
];

/** Log in, then the one thing the page exists to drive. */
const SITE_ACTIONS: SiteHeaderAction[] = [
	{ label: "Log in", to: "/sign-in", variant: "ghost" },
	{ label: "Get started", to: "/sign-up", variant: "primary" },
];

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: seo.title("Home") },
			{ name: "description", content: seo.description },
			{ property: "og:title", content: seo.title("Home") },
			{ property: "og:description", content: seo.description },
			{ property: "og:image", content: `${seo.url}${seo.ogImage}` },
			{ property: "og:url", content: seo.url },
			{ name: "twitter:card", content: seo.twitter.card },
			{ name: "twitter:title", content: seo.title("Home") },
			{ name: "twitter:description", content: seo.description },
		],
		links: [{ rel: "canonical", href: seo.url }],
	}),
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen flex flex-col bg-app-base text-text-primary">
			{/*
			 * `AppSiteHeader`, not a bar of its own. This page hand-rolled the same
			 * shape for a long time and it had drifted from the component in every
			 * way that matters: the brand was a `<div>` with `cursor-pointer` rather
			 * than a link home, the destinations were `hidden md:flex` with no sheet
			 * to move into - so a phone had a header with no nav in it at all - and
			 * nothing carried `aria-current`. The floating variant IS this bar: fixed
			 * island, `max-w-6xl`, rounded, and the shadow deepening on scroll.
			 *
			 * No `activeHref`: every item here is either an anchor in this page or a
			 * link off the site, so there is no destination for the bar to light. The
			 * anchor lights itself through the router once the hash matches.
			 */}
			<AppSiteHeader
				actions={SITE_ACTIONS}
				data-cy="landing-header"
				items={SITE_NAV}
				variant="floating"
			/>

			<main className="flex-1">
				{/* Hero Section */}
				<section className="relative pt-48 pb-32 overflow-hidden">
					<div className="container-page relative z-10 flex flex-col items-center text-center">
						<div className="rise-in [animation-delay:100ms]">
							<AppChip
								className="mb-8 h-8 border-app-brand/20 bg-app-brand/10 px-4 py-1 font-bold text-app-brand"
								icon={Zap}
								label="VERSION 1.0 NOW LIVE"
							/>
						</div>

						<h1 className="rise-in text-5xl md:text-7xl lg:text-8xl mb-8 leading-[1.05] tracking-tighter max-w-5xl font-serif">
							Build <span className="text-app-brand inline-block transform -rotate-1 italic">Premium</span> Fullstack
							Apps Faster.
						</h1>

						<p className="rise-in [animation-delay:200ms] text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mb-12">
							The unified monolith template for TanStack Start, HeroUI, and Better Auth. Stop wasting time on
							boilerplate and start building your actual product.
						</p>

						<div className="rise-in [animation-delay:300ms] flex flex-col sm:flex-row items-center justify-center gap-4 px-4 w-full">
							<Link
								className="w-full sm:w-auto"
								to="/sign-up"
							>
								<AppButton
									className="gradient-brand w-full sm:w-64 h-16 shadow-2xl shadow-app-brand/30 text-xl font-bold group rounded-2xl"
									size="lg"
								>
									Start Building Now
									<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
								</AppButton>
							</Link>
							<a
								className="w-full sm:w-auto"
								href="https://github.com"
								rel="noreferrer"
								target="_blank"
							>
								<AppButton
									className="w-full sm:w-48 h-16 border-text-primary/10 hover:border-text-primary/20 hover:bg-white text-text-primary font-bold text-lg rounded-2xl"
									size="lg"
									variant="outline"
								>
									<Github className="mr-2 h-5 w-5" />
									GitHub
								</AppButton>
							</a>
						</div>

						{/* Social Proof / Tech Stack Bar */}
						<div className="rise-in [animation-delay:400ms] mt-24 pt-12 border-t border-text-primary/5 w-full">
							<p className="text-xs uppercase tracking-[0.2em] font-bold text-text-secondary/50 mb-10">
								THE MODERN MONOLITH STACK
							</p>
							<div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
								<div className="flex items-center gap-2 group cursor-default">
									<Layout className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">TanStack Start</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Shield className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">Better Auth</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Zap className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">HeroUI v3</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Database className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">Prisma</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Code2 className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">tRPC</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section
					className="py-24 bg-app-base/40 backdrop-blur-[24px]"
					id="features"
				>
					<div className="container-page">
						<div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
							<div className="max-w-xl">
								<h2 className="text-4xl md:text-5xl font-serif text-text-primary mb-6 leading-tight max-w-lg">
									Everything you need, nothing you don't.
								</h2>
								<div className="h-1 w-20 bg-app-brand opacity-20 mb-8 rounded-full" />
								<p className="text-text-secondary/80 text-lg leading-relaxed font-medium">
									We've selected the best tools in the ecosystem so you don't have to spend weeks configuring them.
								</p>
							</div>
							<Link to="/sign-up">
								<AppButton
									className="font-bold group text-app-brand/80 hover:text-app-brand transition-colors"
									variant="ghost"
								>
									See full technical spec{" "}
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</AppButton>
							</Link>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{[
								{
									title: "Unified Monolith",
									desc: "Single codebase, single deployment. Perfect for startups and solo founders who want the simplicity of a monolith with the power of modern tools.",
									icon: Layout,
								},
								{
									title: "Type-Safe Contracts",
									desc: "Zero boilerplate tRPC integration ensures your frontend and backend stay in perfect sync. Catch errors in dev, not in prod.",
									icon: Zap,
								},
								{
									title: "Authentication Ready",
									desc: "Better Auth pre-configured with everything: Email/Password, Sessions, and Role-Based Access Control out of the box.",
									icon: Shield,
								},
								{
									title: "UI for Agents",
									desc: "Optimized for both humans and AI coders. Consistent patterns and clean component structures make development a breeze.",
									icon: Code2,
								},
								{
									title: "Database Included",
									desc: "Prisma with PostgreSQL support. Models are structured for horizontal growth while maintaining relational integrity.",
									icon: Database,
								},
								{
									title: "Premium Design",
									desc: "Powered by HeroUI v3 + Tailwind v4. Beautiful, accessible components that look like you spent months on them.",
									icon: CheckCircle2,
								},
							].map((f) => (
								<AppCard
									description={f.desc}
									// Marketing copy: each card IS its own argument and there is
									// nothing to click through to, so a two-line preview would cut
									// every one of them off mid-sentence.
									descriptionLines={4}
									headingLevel={3}
									icon={f.icon}
									key={f.title}
									title={f.title}
								/>
							))}
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-32">
					<div className="container-page">
						{/* `brand-surface`, not `bg-app-brand` and not `gradient-brand`.

						    `bg-app-brand` is --brand-primary, the accent as INK, and it inverts
						    per theme - so this card went pale in dark while its text stayed
						    white, at 2.38:1 across the palettes against a 4.5:1 floor.

						    `gradient-brand` fixes that but is the CONTROL fill: saturated so a
						    button reads as pressable, which is what pins its ink near-black at
						    7.2:1 with no headroom left. A card is not pressable and does not
						    need to pay for that, so it takes the surface pair instead - a tint
						    under a real brand navy, 10.2:1. Both set their own foreground, so
						    nothing inside needs a text colour. */}
						<div className="brand-surface rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-app-brand/40">
							{/* Pattern Overlay */}
							<div
								className="absolute inset-0 opacity-10 pointer-events-none"
								style={{
									backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
									backgroundSize: "32px 32px",
								}}
							></div>

							<div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
								<h2 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">
									Ready to ship your next big idea?
								</h2>
								{/* Full opacity, differentiating on size and weight - the rule the
								    labs banner states for exactly this case. A /80 or /60 tint of the
								    foreground is a second, unmeasured colour on a brand surface. */}
								<p className="text-xl mb-12 leading-relaxed">
									Join founders and developers building faster with the modern monolith template. Zero setup, infinite
									potential.
								</p>
								<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
									<Link
										className="w-full sm:w-auto"
										to="/sign-up"
									>
										<AppButton
											className="bg-surface text-foreground font-bold h-16 px-10 text-xl shadow-xl w-full sm:w-auto rounded-2xl font-sans"
											size="lg"
										>
											Get Started for Free
										</AppButton>
									</Link>
									<Link
										className="w-full sm:w-auto"
										to="/sign-in"
									>
										<AppButton
											className="border-current/30 font-bold h-16 px-10 text-xl hover:bg-current/10 w-full sm:w-auto rounded-2xl font-sans"
											size="lg"
											variant="outline"
										>
											View Template Source
										</AppButton>
									</Link>
								</div>
								<p className="mt-8 text-sm font-medium">MIT Licensed. Open Source. Forever.</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="pt-24 pb-12 border-t border-text-primary/5 bg-white/20">
				<div className="container-page">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
						<div className="col-span-1 md:col-span-2">
							<div className="flex items-center gap-3 mb-6">
								<img
									alt=""
									aria-hidden="true"
									className="h-8 w-8 shrink-0 object-contain"
									src="/images/logo.png"
								/>
								<span className="font-serif text-2xl font-bold">{APP_NAME}</span>
							</div>
							<p className="text-text-secondary max-w-sm leading-relaxed mb-8 font-sans">
								The most productive way to build fullstack applications with the best tools in the ecosystem. Designed
								for humans and agents alike.
							</p>
							<div className="flex gap-4">
								<AppButton
									aria-label="GitHub repository"
									className="rounded-xl border-text-primary/10"
									icon={Github}
									isIconOnly
									variant="ghost"
								/>
								<AppButton
									aria-label="Performance"
									className="rounded-xl border-text-primary/10"
									icon={Zap}
									isIconOnly
									variant="ghost"
								/>
								<AppButton
									aria-label="Security"
									className="rounded-xl border-text-primary/10"
									icon={Shield}
									isIconOnly
									variant="ghost"
								/>
							</div>
						</div>

						<div>
							<h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-text-secondary font-sans">
								Product
							</h4>
							<ul className="flex flex-col gap-4 text-text-secondary font-sans">
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Features
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Integrations
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Pricing
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Changelog
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-text-secondary font-sans">
								Resources
							</h4>
							<ul className="flex flex-col gap-4 text-text-secondary font-sans">
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Guides
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										GitHub
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										API Reference
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-text-primary/5">
						<p className="text-sm text-text-secondary transition-colors font-sans">
							© 2026 Bernard Sapida. Built with {APP_NAME}.
						</p>
						<div className="flex gap-8 text-xs font-bold text-text-secondary/60 uppercase tracking-wider font-sans">
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Privacy Policy
							</a>
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Terms of Service
							</a>
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Cookie Policy
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
