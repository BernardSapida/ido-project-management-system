import type { SiteFooterGroup, SiteHeaderAction, SiteNavItem } from "@bernardsapida/web-ui";
import { AppButton, AppCard, AppChip, AppSiteFooter, AppSiteHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Building2,
	ClipboardCheck,
	ClipboardList,
	FileText,
	Gauge,
	HelpCircle,
	Mail,
	MapPin,
	Phone,
	Star,
	Target,
	Workflow,
} from "lucide-react";
import { seo } from "@/config/seo.config";

/**
 * The public face of the Infrastructure Development Office.
 *
 * The layout is the architect's, carried over from IRMS: a brand utility band,
 * a sticky bar, a split hero over a building render, then the office told in
 * five sections - about, objectives, the ISO forms, the two procedures, and the
 * satisfaction survey that closes every request.
 *
 * Everything above the markup is DATA. Copy, form codes and menu entries change
 * there without anybody opening the JSX, which is what keeps a page whose whole
 * content answers to an ISO document register maintainable.
 */

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const CONTACT_EMAIL = "tupc_ido@gsfe.tupcavite.edu.ph";
const CAMPUS = "TUP Cavite Campus";
const OFFICE = "Infrastructure Development Office";
const UNIVERSITY = "Technological University of the Philippines";

/**
 * Drop the real renders into `/public/images/` under these names and they
 * replace the brand-gradient placeholders automatically - see the README there.
 */
const HERO_IMAGE = "/images/ido-hero.jpg";

const GALLERY = [
	{ label: "Administration Building", src: "/images/ido-building-1.jpg" },
	{ label: "Academic Complex", src: "/images/ido-building-2.jpg" },
	{ label: "Campus Gateway", src: "/images/ido-building-3.jpg" },
];

const OBJECTIVES = [
	{
		desc: "Provide an integrated online engineering management system built on a modern data-management web platform.",
		icon: Building2,
		title: "Integrated Online System",
	},
	{
		desc: "Give stakeholders a simple interface to reach the office for engineering requests across all enrolled ISO forms.",
		icon: Target,
		title: "Easy Stakeholder Access",
	},
	{
		desc: "Streamline the monitoring and tracking of every engineering request from submission to release.",
		icon: Gauge,
		title: "Monitoring & Tracking",
	},
	{
		desc: "Incorporate a Customer Satisfaction Survey so the office continuously improves documents and management quality.",
		icon: Star,
		title: "Feedback & Quality",
	},
];

const FORMS = [
	{
		anchor: "form-ido-01",
		code: "TUPC-F-OCD-IDO-01",
		desc: "Request the design of a new building or facility from the Infrastructure Development Office.",
		title: "Building Design Request Form",
	},
	{
		anchor: "form-ido-02",
		code: "TUPC-F-OCD-IDO-02",
		desc: "Request revisions or amendments to an existing approved building design.",
		title: "Design Revision Form",
	},
	{
		anchor: "form-ido-05",
		code: "TUPC-F-OCD-IDO-05",
		desc: "Track the official release and turnover of engineering documents and drawings.",
		title: "Document Release Logsheet",
	},
	{
		anchor: "form-qmr-09",
		code: "TUPC-F-OQA-QMR-09",
		desc: "Rate the quality of service and documents delivered by the office.",
		title: "Customer Satisfaction Measurement",
	},
];

const PROCEDURES = [
	{
		desc: "From initial request and site assessment through design, review, and final approval of new infrastructure.",
		anchor: "procedure-01",
		icon: Workflow,
		step: "Procedure 01",
		title: "Building Design & Development Procedure",
	},
	{
		desc: "The controlled workflow for evaluating, approving, and documenting changes to an existing design.",
		anchor: "procedure-02",
		icon: ClipboardCheck,
		step: "Procedure 02",
		title: "Design Revision Procedure",
	},
];

// ---------------------------------------------------------------------------
// The bar, and the band that closes the page
// ---------------------------------------------------------------------------

/**
 * Every destination here is a SECTION of this page, and the fragment rides in
 * `href` rather than in the `hash` prop the type offers.
 *
 * That is a WORKAROUND, not a preference. `AppSiteHeader` and `AppSiteFooter`
 * key every link they render by `link.href` alone - the bar's panels, the mobile
 * sheet and the footer columns all do it - so two entries pointing at the same
 * route with different hashes are two children under one React key, which is a
 * console warning today and undefined ordering tomorrow. A landing page whose
 * whole navigation is sections of itself trips that on the first menu. Putting
 * the fragment in the path keeps the keys distinct and the router still resolves
 * it, at the cost of the `includeHash` active-state matching the prop would have
 * given us. The package should key on href + hash; when it does, these become
 * `hash` again.
 *
 * The two menus mirror the office's own document register - somebody looking for
 * "the revision form" is looking for a form, not for a section of a home page,
 * which is why each form and each procedure is its own anchor further down.
 * `description` carries the ISO control number, which is how these are actually
 * referred to on paper.
 */
const SITE_NAV: SiteNavItem[] = [
	{
		groups: [
			{
				links: [
					{ href: "/#home", icon: Building2, label: "Overview" },
					{ href: "/#about", icon: FileText, label: "About the Office" },
					{ href: "/#objectives", icon: Target, label: "Objectives" },
				],
			},
		],
		label: "Home",
	},
	{
		groups: [
			{
				links: [
					{
						description: "TUPC-F-OCD-IDO-01",
						href: "/#form-ido-01",
						icon: FileText,
						label: "Building Design Request Form",
					},
					{
						description: "TUPC-F-OCD-IDO-02",
						href: "/#form-ido-02",
						icon: ClipboardList,
						label: "Design Revision Form",
					},
					{
						description: "TUPC-F-OCD-IDO-05",
						href: "/#form-ido-05",
						icon: ClipboardCheck,
						label: "Document Release Logsheet",
					},
					{
						description: "TUPC-F-OQA-QMR-09",
						href: "/#csm",
						icon: Star,
						label: "Customer Satisfaction Measurement",
					},
				],
			},
		],
		label: "Forms",
	},
	{
		groups: [
			{
				links: [
					{ href: "/#procedure-01", icon: Workflow, label: "Building Design & Development" },
					{ href: "/#procedure-02", icon: ClipboardCheck, label: "Design Revision" },
				],
			},
		],
		label: "Procedure",
	},
	{ href: "/#csm", icon: Star, label: "CSM" },
	{ href: "/#help", icon: HelpCircle, label: "Help" },
];

/** Sign in, then the one thing the page exists to drive. */
const SITE_ACTIONS: SiteHeaderAction[] = [
	{ label: "Sign in", to: "/sign-in", variant: "ghost" },
	{ label: "Submit a request", to: "/sign-up", variant: "primary" },
];

const FOOTER_GROUPS: SiteFooterGroup[] = [
	{
		heading: "The Office",
		links: [
			{ href: "/#about", label: "About the Office" },
			{ href: "/#objectives", label: "Objectives" },
			{ href: "/#help", label: "Help & Contact" },
		],
	},
	{
		heading: "Forms",
		links: [
			{ href: "/#form-ido-01", label: "Building Design Request" },
			{ href: "/#form-ido-02", label: "Design Revision" },
			{ href: "/#form-ido-05", label: "Document Release Logsheet" },
			{ href: "/#csm", label: "Customer Satisfaction" },
		],
	},
	{
		heading: "Procedure",
		links: [
			{ href: "/#procedure-01", label: "Design & Development" },
			{ href: "/#procedure-02", label: "Design Revision" },
		],
	},
];

/**
 * The brand overlay every image panel wears, so a render that has not been
 * supplied yet degrades to an intentional plate rather than to a broken image.
 *
 * The stops are palette TOKENS, not the literal maroon this design arrived
 * with. `--brand-800` and `--brand-surface-foreground` are the two darkest ends
 * of the ramp and neither is re-lit between themes, so the white copy on the
 * panel holds its contrast in light and dark alike - which a hard-coded `rgba()`
 * pair cannot promise once the palette moves.
 */
function imagePanelStyle(src: string): React.CSSProperties {
	return {
		backgroundImage: [
			"linear-gradient(135deg,",
			"color-mix(in oklab, var(--brand-800) 88%, transparent) 0%,",
			"color-mix(in oklab, var(--brand-surface-foreground) 80%, transparent) 100%),",
			`url("${src}")`,
		].join(" "),
		backgroundPosition: "center",
		backgroundSize: "cover",
	};
}

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: seo.title("Home") },
			{
				content: `${OFFICE} of the ${UNIVERSITY} - online engineering request, tracking and document management.`,
				name: "description",
			},
			{ content: seo.title("Home"), property: "og:title" },
			{ content: seo.description, property: "og:description" },
			{ content: `${seo.url}${seo.ogImage}`, property: "og:image" },
			{ content: seo.url, property: "og:url" },
			{ content: seo.twitter.card, name: "twitter:card" },
			{ content: seo.title("Home"), name: "twitter:title" },
			{ content: seo.description, name: "twitter:description" },
		],
		links: [{ href: seo.url, rel: "canonical" }],
	}),
	component: HomePage,
});

/** Eyebrow, heading and lead - the three lines that open every section below. */
function SectionHeading({ desc, eyebrow, title }: { desc?: string; eyebrow: string; title: string }) {
	return (
		<div className="mx-auto mb-14 text-center">
			<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-app-brand">{eyebrow}</p>
			<h2 className="font-serif text-3xl font-bold leading-tight text-text-primary md:text-4xl">{title}</h2>
			{desc ? <p className="mt-4 text-base leading-relaxed text-text-secondary">{desc}</p> : null}
		</div>
	);
}

function HomePage() {
	return (
		<div className="flex min-h-screen flex-col bg-app-base text-text-primary">
			{/*
			 * The utility band: where the office is and how to reach it, above
			 * everything else because it answers the question most first-time visitors
			 * arrive with.
			 *
			 * `brand-surface-inverse`, not `bg-app-brand` under a white text class.
			 * `--brand-primary` is the accent as INK and inverts between themes, so a
			 * band pinned to it goes pale in dark while the copy on it stays white. The
			 * inverted pair is the one already solved for a dark ground, and it sets
			 * its own foreground.
			 */}
			<div className="brand-surface-inverse hidden md:block">
				<div className="container-page flex h-9 items-center justify-between text-xs">
					<span className="flex items-center gap-2 font-medium">
						<MapPin className="h-3.5 w-3.5" />
						{CAMPUS} · {OFFICE}
					</span>
					<a
						className="flex items-center gap-2 font-medium hover:underline"
						href={`mailto:${CONTACT_EMAIL}`}
					>
						<Mail className="h-3.5 w-3.5" />
						{CONTACT_EMAIL}
					</a>
				</div>
			</div>

			{/*
			 * `AppSiteHeader` in its flush variant, not a bar of its own. Flush is
			 * STICKY and in the flow, which is what lets the utility band above scroll
			 * away while the bar stays - the floating island would sit over both. The
			 * dropdowns, the mobile sheet and `aria-current` come with it; the
			 * hand-rolled version this design shipped with had hover-only menus and no
			 * sheet, so a phone got a header with no navigation in it at all.
			 *
			 * No `activeHref`: every destination is a section of this page, and the
			 * ROUTER lights those from the hash. A pathname alone would light all seven
			 * of them at once.
			 */}
			<AppSiteHeader
				actions={SITE_ACTIONS}
				data-cy="landing-header"
				homeHref="/"
				items={SITE_NAV}
				variant="flush"
			/>

			<main className="flex-1">
				{/* Hero */}
				<section
					className="relative scroll-mt-24 overflow-hidden py-16 md:py-24"
					id="home"
				>
					<div className="container-page grid items-center gap-12 lg:grid-cols-2">
						<div className="rise-in max-w-xl">
							<AppChip
								className="mb-6"
								icon={ClipboardCheck}
								label="ISO-aligned engineering requests"
								tone="accent"
							/>
							<h1 className="mb-6 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-text-primary md:text-6xl">
								Engineering requests, <span className="italic text-app-brand">simplified</span> for the whole
								university.
							</h1>
							<p className="mb-9 text-lg leading-relaxed text-text-secondary">
								The {OFFICE} provides an integrated online platform for stakeholders to submit, track and manage
								building design and engineering requests — from first form to final release.
							</p>
							<div className="flex flex-col gap-3 sm:flex-row">
								{/*
								 * `to`, not a Link wrapped around a button. Wrapping nests one
								 * interactive element inside another: two tab stops for one
								 * target, and a name a screen reader reads twice.
								 */}
								<AppButton
									className="h-14 px-8 text-lg font-semibold"
									icon={ArrowRight}
									iconPosition="end"
									size="lg"
									to="/sign-up"
									variant="primary"
								>
									Submit a request
								</AppButton>
								<AppButton
									className="h-14 px-8 text-lg font-semibold"
									size="lg"
									to="/#procedure"
									variant="outline"
								>
									View procedures
								</AppButton>
							</div>

							<div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
								{[
									{ label: "ISO Forms", value: "4" },
									{ label: "Online Tracking", value: "100%" },
									{ label: "Unified Platform", value: "1" },
								].map((stat) => (
									<div key={stat.label}>
										<p className="font-serif text-3xl font-bold text-app-brand">{stat.value}</p>
										<p className="text-sm font-medium text-text-secondary">{stat.label}</p>
									</div>
								))}
							</div>
						</div>

						<div className="rise-in [animation-delay:150ms]">
							<div
								className="relative flex aspect-4/3 items-end overflow-hidden rounded-3xl shadow-2xl shadow-app-brand/20"
								style={imagePanelStyle(HERO_IMAGE)}
							>
								<div className="p-8 text-white">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">TUP · IDO</p>
									<p className="mt-1 font-serif text-2xl font-bold">Administration Building</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* About */}
				<section
					className="scroll-mt-24 border-y border-text-primary/10 bg-app-brand/3 py-20"
					id="about"
				>
					<div className="container-page grid items-center gap-12 md:grid-cols-2">
						<div>
							<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-app-brand">About the Office</p>
							<h2 className="mb-6 font-serif text-3xl font-bold leading-tight text-text-primary md:text-4xl">
								A single front door for every infrastructure request on campus.
							</h2>
							<p className="mb-4 text-base leading-relaxed text-text-secondary">
								The {OFFICE} (IDO) manages the design, review and documentation of the university's building and
								engineering projects. Traditionally handled through paper forms and in-person visits, these requests are
								now consolidated into one accessible web platform.
							</p>
							<p className="text-base leading-relaxed text-text-secondary">
								Stakeholders can reach the office anytime, submit the correct ISO form, and follow their request as it
								moves through each stage of review.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							{[
								{ icon: FileText, label: "Standardized ISO Forms" },
								{ icon: Workflow, label: "Guided Procedures" },
								{ icon: ClipboardList, label: "Document Logsheets" },
								{ icon: ClipboardCheck, label: "Reviewed & Approved" },
							].map((item) => (
								<AppCard
									headingLevel={3}
									icon={item.icon}
									key={item.label}
									title={item.label}
								/>
							))}
						</div>
					</div>
				</section>

				{/* Objectives */}
				<section
					className="scroll-mt-24 py-20"
					id="objectives"
				>
					<div className="container-page">
						<SectionHeading
							desc="What the online Infrastructure Development Office platform sets out to achieve."
							eyebrow="Specific Objectives"
							title="Built around four clear goals"
						/>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{OBJECTIVES.map((obj) => (
								<AppCard
									description={obj.desc}
									// Each card IS its own argument and there is nothing to click
									// through to, so the two-line default would cut every one of
									// them off mid-sentence.
									descriptionLines={4}
									headingLevel={3}
									icon={obj.icon}
									key={obj.title}
									title={obj.title}
								/>
							))}
						</div>
					</div>
				</section>

				{/* Forms */}
				<section
					className="scroll-mt-24 border-y border-text-primary/10 bg-app-brand/3 py-20"
					id="forms"
				>
					<div className="container-page">
						<SectionHeading
							desc="The controlled ISO forms handled by the office. Sign in to fill out and submit any of them online."
							eyebrow="Forms"
							title="Every request starts with the right form"
						/>
						<div className="grid gap-6 md:grid-cols-2">
							{FORMS.map((form) => (
								/* Each form is its own anchor, because the menu above lists the
								   register by name: "the revision form" should land on that card
								   rather than on the top of a section holding four of them. */
								<div
									className="scroll-mt-28"
									id={form.anchor}
									key={form.code}
								>
									<AppCard
										description={form.desc}
										descriptionLines={3}
										headingLevel={3}
										icon={FileText}
										// The control number is a DISCRETE fact about the form,
										// which is what the meta row is for. In the description it
										// would be buried in the sentence a reader skims past.
										meta={[{ label: form.code }]}
										title={form.title}
									/>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Procedure */}
				<section
					className="scroll-mt-24 py-20"
					id="procedure"
				>
					<div className="container-page">
						<SectionHeading
							desc="Clear, ISO-aligned workflows so everyone knows exactly what happens after a request is submitted."
							eyebrow="Procedure"
							title="Two well-defined workflows"
						/>
						<div className="grid gap-6 md:grid-cols-2">
							{PROCEDURES.map((proc) => (
								<div
									className="scroll-mt-28"
									id={proc.anchor}
									key={proc.step}
								>
									<AppCard
										description={proc.desc}
										descriptionLines={3}
										headingLevel={3}
										icon={proc.icon}
										meta={[{ label: proc.step }]}
										title={proc.title}
									/>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Gallery */}
				<section className="pb-20">
					<div className="container-page">
						<div className="grid gap-4 sm:grid-cols-3">
							{GALLERY.map((img) => (
								<div
									className="relative flex aspect-4/3 items-end overflow-hidden rounded-2xl shadow-lg shadow-app-brand/10"
									key={img.label}
									style={imagePanelStyle(img.src)}
								>
									<p className="p-5 font-semibold text-white">{img.label}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* CSM */}
				<section
					className="scroll-mt-24 py-20"
					id="csm"
				>
					<div className="container-page">
						{/*
						 * `brand-surface`, not `bg-app-brand` and not `gradient-brand`. The
						 * accent-as-ink inverts per theme and takes this plate pale in dark
						 * while the copy on it stays white; the gradient is the CONTROL fill,
						 * saturated so a button reads as pressable, which leaves the real
						 * button on top of it nothing to be. The surface pair is the tint,
						 * and it sets its own foreground - nothing inside needs a colour.
						 */}
						<div className="brand-surface relative overflow-hidden rounded-[2.5rem] p-10 md:p-16">
							<div
								className="pointer-events-none absolute inset-0 opacity-10"
								style={{
									backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
									backgroundSize: "28px 28px",
								}}
							/>
							<div className="relative grid items-center gap-10 md:grid-cols-2">
								<div>
									<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]">Customer Satisfaction Measurement</p>
									<h2 className="mb-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
										Your feedback improves the office.
									</h2>
									{/*
									 * Full opacity, differentiating on size and weight. A /80 tint
									 * of the foreground is a second, unmeasured colour on a brand
									 * surface - the pair was solved for this ink, not for a wash
									 * of it.
									 */}
									<p className="text-base leading-relaxed">
										After every completed request, share how we did through the Customer Satisfaction Measurement Form
										(TUPC-F-OQA-QMR-09). Your responses directly shape the quality of documents and service.
									</p>
								</div>
								<div className="flex flex-col items-start gap-4 md:items-end">
									{/* Decorative, and it says so: the rating CONTROL is the form
									    behind the button, not this row. */}
									<div
										aria-hidden="true"
										className="flex gap-1"
									>
										{[0, 1, 2, 3, 4].map((i) => (
											<Star
												className="h-8 w-8 fill-current"
												key={i}
											/>
										))}
									</div>
									<AppButton
										className="h-14 bg-surface px-8 text-lg font-semibold text-foreground"
										icon={ArrowRight}
										iconPosition="end"
										size="lg"
										to="/sign-in"
									>
										Give feedback
									</AppButton>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Help & contact */}
				<section
					className="scroll-mt-24 border-t border-text-primary/10 bg-app-brand/3 py-20"
					id="help"
				>
					<div className="container-page grid gap-12 md:grid-cols-2">
						<div>
							<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-app-brand">Help & Contact</p>
							<h2 className="mb-6 font-serif text-3xl font-bold leading-tight text-text-primary md:text-4xl">
								Need assistance with a request?
							</h2>
							<p className="mb-8 text-base leading-relaxed text-text-secondary">
								Reach the {OFFICE} directly. We are happy to guide you to the correct form and walk you through the
								procedure.
							</p>
							<div className="flex flex-col gap-4">
								<a
									className="flex items-center gap-3 text-text-primary transition-colors hover:text-app-brand"
									href={`mailto:${CONTACT_EMAIL}`}
								>
									<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-brand/10 text-app-brand">
										<Mail className="h-5 w-5" />
									</span>
									<span className="font-semibold">{CONTACT_EMAIL}</span>
								</a>
								<div className="flex items-center gap-3 text-text-primary">
									<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-brand/10 text-app-brand">
										<MapPin className="h-5 w-5" />
									</span>
									<span className="font-semibold">{CAMPUS}</span>
								</div>
								<div className="flex items-center gap-3 text-text-primary">
									<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-brand/10 text-app-brand">
										<Phone className="h-5 w-5" />
									</span>
									<span className="font-semibold text-text-secondary">Available on request</span>
								</div>
							</div>
						</div>

						<AppCard
							headingLevel={3}
							icon={HelpCircle}
							title="Getting started is simple"
						>
							<ol className="flex flex-col gap-4">
								{[
									"Create an account or sign in to the platform.",
									"Choose the ISO form that matches your request.",
									"Submit and track your request through each review stage.",
								].map((text, i) => (
									<li
										className="flex gap-3"
										key={text}
									>
										<span className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
											{i + 1}
										</span>
										<span className="text-text-secondary">{text}</span>
									</li>
								))}
							</ol>
							<AppButton
								fullWidth
								size="lg"
								to="/sign-up"
								variant="primary"
							>
								Create an account
							</AppButton>
						</AppCard>
					</div>
				</section>
			</main>

			{/*
			 * `AppSiteFooter`, the signed-out counterpart to the bar above - the same
			 * logo object, the same tones, the same external-link rule. `muted` marks
			 * the end of the document without claiming to be a statement, which is
			 * right under a page that already has a brand band at the top and a brand
			 * plate in the middle.
			 */}
			<AppSiteFooter
				copyrightNote={`${UNIVERSITY}. All rights reserved.`}
				data-cy="landing-footer"
				groups={FOOTER_GROUPS}
				homeHref="/"
				owner={OFFICE}
				tagline={`An integrated online engineering management system for the ${OFFICE} of the ${UNIVERSITY}.`}
				tone="surface"
			/>
		</div>
	);
}
