import type { RichTextDocument } from "../AppRichTextEditor";

/**
 * A post, as a reader needs it.
 *
 * This is deliberately NOT the database row. It carries what the reading view
 * renders and nothing else - no author id, no status enum, no updatedAt - so
 * the component cannot quietly grow a dependency on a schema it does not own,
 * and so a project whose posts table looks different can still map onto it.
 *
 * The consuming project builds one of these from whatever it loaded. That
 * mapping is the seam that keeps this component reusable.
 */
export interface BlogPostView {
	author: BlogPostAuthor;
	/** Alt text for the banner. Empty string is the explicit decorative signal. */
	bannerAlt: string;
	/** Null when there is no banner - which renders nothing, not a placeholder. */
	bannerUrl: string | null;
	/** The editor's document. Never HTML, and never a string. */
	body: RichTextDocument | null;
	/**
	 * Null means DRAFT.
	 *
	 * Not "fall back to createdAt" - that prints a date no reader has ever been
	 * able to see the post on, which is worse than saying it is unpublished.
	 */
	publishedAt: Date | null;
	title: string;
	/** The canonical URL, for the copy-link button. The project owns its routes. */
	url?: string;
}

export interface BlogPostAuthor {
	avatarUrl?: string;
	name: string;
}
