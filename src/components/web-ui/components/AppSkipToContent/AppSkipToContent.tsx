/** The id the skip link targets. The shell puts it on <main>. */
export const MAIN_CONTENT_ID = "main-content";

/**
 * The first focusable thing on every signed-in page.
 *
 * A sidebar with a dozen items is a dozen tab stops in front of the content, on
 * every single screen, for anyone navigating by keyboard. This is one keypress
 * past all of them. It is invisible until focused, which is why it is easy to
 * forget it is missing.
 */
export function AppSkipToContent({ "data-cy": dataCy }: { "data-cy"?: string }) {
	return (
		<a
			className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-soft focus:ring-2 focus:ring-focus focus:outline-none"
			data-cy={dataCy}
			href={`#${MAIN_CONTENT_ID}`}
		>
			Skip to content
		</a>
	);
}
