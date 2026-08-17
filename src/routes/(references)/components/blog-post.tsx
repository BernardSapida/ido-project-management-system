import { AppAlert, AppButton, AppCommentSection, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import type { BlogPostView, RichTextDocument } from "@bernardsapida/web-ui/rich-text";
import { AppBlogPost } from "@bernardsapida/web-ui/rich-text";
import { createFileRoute } from "@tanstack/react-router";
import { ImageUp } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Blog post lab - the first entry in the Reusables group.
 *
 * Every other lab shows one component's states. This one shows a whole SCREEN
 * assembled from components that already have labs of their own, which is what
 * the group exists to hold: the arrangement is the thing being reviewed, not any
 * single part of it.
 *
 * Three things to check by hand:
 *
 * 1. Compare the body against /components/text-editor in Preview. They are the
 *    same renderer at the same measure, so any difference is a defect.
 * 2. Choose a banner from your machine. It is cropped to 16:9 whatever shape the
 *    file is - a portrait photograph must not push the title off screen.
 * 3. Hover the date. The visible form is absolute and the tooltip is relative,
 *    which is the opposite of what most sites do and is deliberate.
 */
export const Route = createFileRoute("/(references)/components/blog-post")({
	head: () => ({
		meta: [{ title: seo.title("Blog post lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Blog post" },
	component: BlogPostLabPage,
});

/** The body, in the editor's own format - so the two labs can be compared. */
const SAMPLE_BODY: RichTextDocument = {
	content: [
		{
			content: [
				{ text: "A post is a ", type: "text" },
				{ marks: [{ type: "bold" }], text: "document", type: "text" },
				{
					text: " plus the things around it. The body below came out of the text editor unchanged - same JSON, same renderer - so what an author previewed is what a reader gets.",
					type: "text",
				},
			],
			type: "paragraph",
		},
		{
			attrs: { level: 2 },
			content: [{ text: "What the reading view owns", type: "text" }],
			type: "heading",
		},
		{
			content: [
				{
					content: [
						{
							content: [
								{
									text: "The banner, cropped to one shape whatever was uploaded.",
									type: "text",
								},
							],
							type: "paragraph",
						},
					],
					type: "listItem",
				},
				{
					content: [
						{
							content: [
								{
									text: "The byline - who, when, and how long it takes to read.",
									type: "text",
								},
							],
							type: "paragraph",
						},
					],
					type: "listItem",
				},
				{
					content: [
						{
							content: [
								{
									text: "The body, and the comments underneath it.",
									type: "text",
								},
							],
							type: "paragraph",
						},
					],
					type: "listItem",
				},
			],
			type: "bulletList",
		},
		{
			content: [
				{
					content: [
						{
							text: "Everything else - the list, the edit form, the upload, the author default - belongs to the project using this.",
							type: "text",
						},
					],
					type: "paragraph",
				},
			],
			type: "blockquote",
		},
	],
	type: "doc",
};

const SAMPLE_POST: BlogPostView = {
	author: { name: "Maria Santos" },
	bannerAlt: "A queue of people outside a warehouse at dawn",
	bannerUrl: "https://picsum.photos/seed/blogpost/1200/675",
	body: SAMPLE_BODY,
	publishedAt: new Date("2026-08-08T09:00:00Z"),
	title: "What a reusable reading view actually owns",
	url: "https://example.com/blog/reusable-reading-view",
};

const SAMPLE_COMMENTS = [
	{
		author: { handle: "ana", id: "u2", name: "Ana Reyes" },
		body: "The absolute date with the relative tooltip is the right way round. I have never once wanted 'a year ago' from a changelog.",
		createdAt: new Date("2026-08-08T11:20:00Z"),
		id: "c1",
	},
	{
		author: { handle: "ben", id: "u3", name: "Ben Cruz" },
		body: "Cropping the banner is the bit everyone skips, and then one portrait photo ruins the index page.",
		createdAt: new Date("2026-08-08T12:05:00Z"),
		id: "c2",
	},
];

function BlogPostLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The whole reading view, assembled from components that each have a lab of their own."
				title="Blog post lab"
			/>
			<AssemblySection />
			<MeasureSection />
			<PartsSection />
			<StatesSection />
			<ScopeSection />
		</div>
	);
}

/**
 * The two widths a post has, and the fact that they are set in two places.
 *
 * This section exists because getting it wrong is silent: `max-w-none` on the
 * article alone widens the banner, the title and the byline and leaves the prose
 * inset inside them, which looks like a layout bug rather than a decision.
 */
function MeasureSection() {
	return (
		<LabSection
			description="A post has an OUTER width - the article - and an inner MEASURE for its prose. The outer one is the className you pass; the measure is a CSS custom property, because it is applied to a descendant your className never reaches. Change one without the other and the body sits inset inside a full-width header."
			title="Width, and the reading measure"
			usedIn={["a full-bleed article", "a post in a narrow column"]}
		>
			<div className="space-y-6">
				<div className="space-y-2">
					<p className="text-sm font-medium">The default - `max-w-3xl` outside, 68ch of prose inside</p>
					<div className="rounded-xl border border-border p-4">
						<AppBlogPost post={SAMPLE_POST} />
					</div>
				</div>

				<div className="space-y-2">
					<p className="text-sm font-medium">className="max-w-none [--rich-text-measure:none]"</p>
					<div className="rounded-xl border border-border p-4">
						<AppBlogPost
							className="max-w-none [--rich-text-measure:none]"
							post={SAMPLE_POST}
						/>
					</div>
					<p className="text-sm text-muted">
						Both halves cleared, so the prose runs the full container with the byline. Worth reading a paragraph of it
						before shipping it: this is the arrangement the 68ch default exists to prevent, and past roughly 75
						characters the eye starts losing its way back to the start of the next line. A photo essay can carry it; a
						thousand words of text cannot.
					</p>
				</div>

				<p className="text-sm text-muted">
					The property inherits, so it can be set anywhere above the post - including once on a layout - and it takes
					any length: <code className="text-xs">[--rich-text-measure:80ch]</code> widens the column without abandoning a
					measure, which is usually the better answer when a post feels cramped.
				</p>
			</div>
		</LabSection>
	);
}

/** The post itself, with a banner you can replace from your own machine. */
function AssemblySection() {
	const [bannerUrl, setBannerUrl] = useState<string | null>(SAMPLE_POST.bannerUrl);
	const [isLocalBanner, setIsLocalBanner] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	/*
	 * Object URLs are revoked when they are replaced or when the lab unmounts.
	 * Left alone they hold the whole file in memory for as long as the tab is
	 * open, which on a page whose point is trying several images adds up fast.
	 */
	useEffect(() => {
		return () => {
			if (isLocalBanner && bannerUrl) URL.revokeObjectURL(bannerUrl);
		};
	}, [bannerUrl, isLocalBanner]);

	return (
		<LabSection
			description="The arrangement, top to bottom. The body is the same document the text editor lab produces, rendered by the same component its Preview uses - open both and they must be identical."
			title="The assembled post"
			usedIn={["a published article", "the view route of an admin blog"]}
		>
			<Row>
				<input
					accept="image/*"
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (!file) return;
						if (isLocalBanner && bannerUrl) URL.revokeObjectURL(bannerUrl);
						setBannerUrl(URL.createObjectURL(file));
						setIsLocalBanner(true);
					}}
					ref={fileRef}
					type="file"
				/>
				<AppButton
					data-cy="choose-banner"
					icon={ImageUp}
					onPress={() => fileRef.current?.click()}
					variant="secondary"
				>
					Choose a banner
				</AppButton>
				<AppButton
					data-cy="remove-banner"
					onPress={() => {
						if (isLocalBanner && bannerUrl) URL.revokeObjectURL(bannerUrl);
						setBannerUrl(null);
						setIsLocalBanner(false);
					}}
					variant="tertiary"
				>
					No banner
				</AppButton>
			</Row>

			{isLocalBanner ? (
				<AppAlert
					description="This preview is an object URL - display only. It would not survive a reload and would fail the http/https rule the document schema enforces, which is exactly why a real banner is uploaded to Cloudinary from the edit form."
					icon={ImageUp}
					status="warning"
					title="Local preview, not a stored image"
				/>
			) : null}

			<AppBlogPost
				commentsSlot={
					<AppCommentSection
						comments={SAMPLE_COMMENTS}
						currentUser={{ handle: "you", id: "u1", name: "You" }}
						heading="Comments"
						headingLevel={2}
						onSubmit={async () => {
							/* Display only in this lab - writable comments are spec 003. */
						}}
						threadId="blog-post-lab"
					/>
				}
				data-cy="blog-post-assembly"
				onCopyLink={() => navigator.clipboard.writeText(SAMPLE_POST.url ?? "")}
				post={{ ...SAMPLE_POST, bannerUrl }}
			/>
		</LabSection>
	);
}

/** Which component owns which part - the answer to "where do I change this?". */
function PartsSection() {
	return (
		<LabSection
			description="Nothing above is new markup. Each part is a component with its own lab, which is what the Reusables group is for: assemblies, not inventions."
			title="What it is made of"
			usedIn={["deciding where a change belongs"]}
		>
			<ul className="space-y-2 text-sm">
				<Part name="AppBlogPostBanner">16:9, cropped to fill, and absent entirely when there is no image.</Part>
				<Part name="AppBlogPostByline">
					Author, absolute date with the relative form as a tooltip, reading time, copy link.
				</Part>
				<Part name="AppRichTextContent">
					The body. The same renderer the editor previews with, and it validates the document before rendering so one
					bad row cannot blank the page.
				</Part>
				<Part name="AppCommentSection">
					Passed in as a slot, so this stays presentational and spec 003 can make it writable without touching it.
				</Part>
			</ul>
		</LabSection>
	);
}

/** Loading, draft, and a post nobody has commented on yet. */
function StatesSection() {
	return (
		<LabSection
			description="The states a real post reaches. The skeleton is the shape of the article rather than a spinner, so nothing jumps when the post lands."
			title="Loading, draft, and no comments"
			usedIn={["a post being fetched", "an unpublished draft in a preview"]}
		>
			<div className="rounded-xl border border-border p-4">
				<AppBlogPost
					isPending
					post={SAMPLE_POST}
				/>
			</div>

			<div className="rounded-xl border border-border p-4">
				<AppBlogPost
					data-cy="blog-post-draft-state"
					post={{
						...SAMPLE_POST,
						bannerUrl: null,
						publishedAt: null,
						title: "An unpublished draft, with no banner and nothing to share",
					}}
				/>
			</div>
		</LabSection>
	);
}

/** The list of things this deliberately does not do. */
function ScopeSection() {
	return (
		<LabSection
			description="A reusable is only reusable if its edges are stated. These are the parts the consuming project owns, and none of them is a gap in this component."
			title="What this does not do"
			usedIn={["planning the work around it"]}
		>
			<ul className="space-y-2 text-sm text-muted">
				<li>It does not fetch. The post arrives as a prop, from whatever the project already loaded.</li>
				<li>
					It does not author. The admin list, the edit form, the Cloudinary upload and the author default are yours.
				</li>
				<li>It does not route. Copy-link is a callback, because the project decides what a post's URL is.</li>
				<li>
					It does not accept comments. Displayed here; writable, and configurable between signed-in and guest authors,
					is spec 003.
				</li>
			</ul>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Part({ children, name }: { children: ReactNode; name: string }) {
	return (
		<li>
			<code className="text-xs">{name}</code> - {children}
		</li>
	);
}

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
