import { cn } from "../../lib/cn";

interface AppBlogPostBannerProps {
	/**
	 * What the picture shows. Required, and the empty string is the explicit
	 * "decorative" signal - the same rule the editor's image dialog enforces, so
	 * a post cannot acquire an unlabelled image by arriving through a different
	 * door.
	 */
	alt: string;
	className?: string;
	"data-cy"?: string;
	/** Null renders NOTHING. See below - that is the design, not a gap. */
	src: string | null;
}

/**
 * The image across the top of a post.
 *
 * ## The aspect ratio is the layout's decision, not the file's
 *
 * A fixed 16:9 box with the image cropped to fill it. An unconstrained image
 * takes its height from whatever the author uploaded, and one portrait
 * photograph pushes the title two screens down - so the post opens on a picture
 * with no indication of what it is. Cropping means every post in an index looks
 * like the same kind of thing.
 *
 * ## No banner renders no banner
 *
 * Not a grey placeholder. A post without one should open on its title, and a
 * placeholder is an apology in the position where the title belongs - it says
 * "something is missing here" about a post where nothing is.
 */
export function AppBlogPostBanner({ alt, className, "data-cy": dataCy, src }: AppBlogPostBannerProps) {
	if (!src) return null;

	return (
		<div
			className={cn("overflow-hidden rounded-2xl border border-border bg-muted-surface", className)}
			data-cy={dataCy}
		>
			<img
				alt={alt}
				className="aspect-video w-full object-cover"
				/*
				 * `eager` and high fetch priority: this is the largest element above the
				 * fold and it is what the page's loading is judged on. Lazy-loading the
				 * one image a reader is already looking at delays the only thing they
				 * are waiting for.
				 */
				decoding="async"
				fetchPriority="high"
				loading="eager"
				src={src}
			/>
		</div>
	);
}
