import { Separator, Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { AppRichTextContent, readingTimeMinutes } from "../AppRichTextEditor";
import { cn } from "../../lib/cn";
import { AppBlogPostBanner } from "./AppBlogPostBanner";
import { AppBlogPostByline } from "./AppBlogPostByline";
import type { BlogPostView } from "./blog-post.types";

interface AppBlogPostProps {
	className?: string;
	/**
	 * The comment section, passed IN rather than rendered here.
	 *
	 * This is what keeps the component presentational. Comments need a session,
	 * a mutation and - shortly - a choice between signed-in and guest authors;
	 * none of that belongs in a component whose job is an arrangement. A slot
	 * lets that arrive later without this file changing.
	 */
	commentsSlot?: ReactNode;
	"data-cy"?: string;
	isPending?: boolean;
	/** Omit it and no copy-link button renders. The project owns its URLs. */
	onCopyLink?: () => void;
	post: BlogPostView;
}

/**
 * A published post, as a reader sees it.
 *
 * ## It fetches nothing
 *
 * The post arrives as a prop. What is being made reusable is the ARRANGEMENT -
 * banner, title, byline, body, comments - not a route, and the project using
 * this owns the admin list, the edit form, the S3 upload and the author
 * default. A component that loaded its own post would be unusable by the screen
 * that already has one, and untestable in a lab without a server.
 *
 * ## The body is the editor's renderer, not a second one
 *
 * `AppRichTextContent` is the same component the editor previews with, built
 * from the same extension set that wrote the document. That is the whole
 * guarantee: an author cannot be shown one thing and a reader another, because
 * there is only one renderer. A reading view that drew the document itself
 * would be a second implementation of the thing spec 001 exists to keep single -
 * and the first symptom of drift would be a preview that lies.
 *
 * It also VALIDATES before it renders, which matters most here: this is a public
 * page, and `Node.fromJSON` throws on a node type it does not know. One row
 * written by a newer deployment would otherwise blank the article rather than
 * lose a paragraph.
 *
 * ## Reading time is derived, not stored
 *
 * From the body's own word count, so it cannot disagree with the text. A stored
 * figure is one an edit can leave behind.
 */
export function AppBlogPost({
	className,
	commentsSlot,
	"data-cy": dataCy,
	isPending = false,
	onCopyLink,
	post,
}: AppBlogPostProps) {
	if (isPending) return <BlogPostSkeleton className={className} />;

	return (
		<article
			className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6", className)}
			data-cy={dataCy}
		>
			<AppBlogPostBanner
				alt={post.bannerAlt}
				data-cy="blog-post-banner"
				src={post.bannerUrl}
			/>

			<header className="flex flex-col gap-4">
				{/* The `h1` of the page. A post's title is the document's heading, which
				    is also why the editor's body offers H2 downward - two h1s on one
				    page is an outline no screen reader can make sense of. */}
				<h1
					className="font-semibold text-3xl leading-tight sm:text-4xl"
					data-cy="blog-post-title"
				>
					{post.title}
				</h1>

				<AppBlogPostByline
					author={post.author}
					data-cy="blog-post-byline"
					onCopyLink={onCopyLink}
					publishedAt={post.publishedAt}
					readingMinutes={readingTimeMinutes(countWords(post))}
				/>
			</header>

			<Separator />

			<AppRichTextContent
				data-cy="blog-post-body"
				document={post.body}
				emptyText="This post has no content yet."
			/>

			{commentsSlot ? (
				<>
					<Separator />
					<section data-cy="blog-post-comments">{commentsSlot}</section>
				</>
			) : null}
		</article>
	);
}

/**
 * A skeleton in the SHAPE of the post - a banner box, a title bar, a byline
 * row, some paragraph lines.
 *
 * Not a spinner. The skeleton has to match the layout it stands in for, or the
 * page jumps when the real thing lands and the load reads as slower than it was.
 */
function BlogPostSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6", className)}
			data-cy="blog-post-skeleton"
		>
			<Skeleton className="aspect-video w-full rounded-2xl" />
			<Skeleton className="h-9 w-3/4 rounded-lg" />
			<div className="flex items-center gap-3">
				<Skeleton className="size-9 rounded-full" />
				<Skeleton className="h-4 w-40 rounded" />
			</div>
			<Separator />
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-full rounded" />
				<Skeleton className="h-4 w-full rounded" />
				<Skeleton className="h-4 w-2/3 rounded" />
			</div>
		</div>
	);
}

/**
 * Words in the body, for the reading estimate.
 *
 * Walks the document rather than serialising it: a length taken on the JSON
 * would count `{"type":"paragraph"}` as prose and tell the reader a 200-word
 * post is a twenty-minute read.
 */
function countWords(post: BlogPostView): number {
	if (!post.body) return 0;

	const text = collectText(post.body as { content?: unknown[]; text?: string });
	return text.split(/\s+/).filter(Boolean).length;
}

function collectText(node: { content?: unknown[]; text?: string }): string {
	if (typeof node.text === "string") return node.text;
	if (!Array.isArray(node.content)) return "";
	return node.content.map((child) => collectText(child as { content?: unknown[]; text?: string })).join(" ");
}
