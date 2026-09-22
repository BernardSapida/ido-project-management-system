import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "../../lib/cn";
import type { SiteFooterLink as SiteFooterLinkModel } from "./site-footer.types";

interface SiteFooterLinkProps {
	className?: string;
	link: SiteFooterLinkModel;
	onNavigate?: (link: SiteFooterLinkModel, event: MouseEvent<HTMLAnchorElement>) => void;
	/**
	 * Off for a link whose glyph would be noise - the legal row, where three
	 * items in a row of four are external and the arrows read as a pattern rather
	 * than as information. The sr-only text stays either way: it is the part a
	 * screen reader user cannot do without, and it costs nothing on screen.
	 */
	showExternalGlyph?: boolean;
}

/**
 * One footer anchor, settling the same two things `SiteHeaderLink` settles.
 *
 * An EXTERNAL link is a real `<a>` with `target`, `rel="noreferrer"` and the
 * words "opens in a new tab"; an internal one is a TanStack `Link`, so it
 * prefetches and never reloads the app. This is the drift the landing page's
 * hand-rolled footer had - every link in it was a bare `<a href>` to another
 * origin with no `rel` at all, which is both a tabnabbing surface and, for the
 * internal ones, a full page reload out of the SPA.
 *
 * It is a separate component from the header's rather than a shared one because
 * the two take different models: a header item REQUIRES an icon (its mobile
 * sheet renders a list, and one row without a glyph reads as broken), and a
 * footer column is text. Widening `SiteNavLink` to make the icon optional would
 * make the sheet's requirement unenforceable to save this file.
 */
export function SiteFooterLink({ className, link, onNavigate, showExternalGlyph = true }: SiteFooterLinkProps) {
	if (link.isExternal) {
		return (
			<a
				className={cn("inline-flex items-center gap-1", className)}
				href={link.href}
				onClick={(event) => onNavigate?.(link, event)}
				rel="noreferrer"
				target="_blank"
			>
				{link.label}
				{showExternalGlyph ? (
					<ArrowUpRight
						aria-hidden="true"
						className="size-3.5 shrink-0 opacity-60"
					/>
				) : null}
				<span className="sr-only">(opens in a new tab)</span>
			</a>
		);
	}

	return (
		<Link
			/*
			 * `exact`, and `includeHash` only where the item HAS one.
			 *
			 * A TanStack `Link` decides for ITSELF whether it is active and appends
			 * `aria-current="page"` last, over anything the caller passed - so this is
			 * the only lever on it. The default is a PREFIX match, which in a footer
			 * means the "Components" link announces itself as the current page from
			 * every page under `/components`, and a hash item like "Features" - a
			 * SECTION of the home page - announces itself the moment you land on the
			 * home page, beside the logo link doing the same. Two current pages at
			 * once is worse than none.
			 *
			 * Nothing here is STYLED for the active state; the footer deliberately
			 * lights nothing. This is only about the attribute telling the truth.
			 */
			activeOptions={{ exact: true, includeHash: Boolean(link.hash) }}
			className={className}
			hash={link.hash}
			onClick={(event) => onNavigate?.(link, event)}
			to={link.href}
		>
			{link.label}
		</Link>
	);
}
