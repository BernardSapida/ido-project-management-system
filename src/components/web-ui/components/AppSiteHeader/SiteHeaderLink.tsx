import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { SiteNavLink } from "./site-header.types";

interface SiteHeaderLinkProps {
	children: ReactNode;
	className?: string;
	isActive?: boolean;
	link: SiteNavLink;
	onNavigate?: (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One anchor, wherever it appears - the bar, a panel, the mobile sheet.
 *
 * It exists to settle two things once. An EXTERNAL link is a real `<a>` with
 * `target`, `rel="noreferrer"` and a glyph, plus the words "opens in a new tab"
 * for anyone who cannot see the glyph; an internal one is a TanStack `Link`, so
 * it prefetches and never reloads the app. Getting that wrong in one direction
 * loses the SPA, and in the other opens a tab that cannot be reached back from.
 *
 * And `aria-current="page"` rides with the styling, so the current page is
 * never lit by colour alone.
 *
 * ## `activeOptions.exact` is not a preference
 *
 * A TanStack `Link` decides for ITSELF whether it is active, and it appends
 * `aria-current="page"` and `data-status="active"` last, over anything the
 * caller passed - so the router, not `activeHref`, has the final say on what the
 * bar lights. Its default is a PREFIX match, which is the app nav's rule and the
 * opposite of this header's: on `/components/app-site-header` it lit the
 * "Components" item as well as the real current one, and no prop the header
 * passed could turn it off. `exact` puts the router on the same rule the
 * component documents, so the two agree instead of fighting.
 */
export function SiteHeaderLink({ children, className, isActive, link, onNavigate }: SiteHeaderLinkProps) {
	if (link.isExternal) {
		return (
			<a
				className={className}
				href={link.href}
				onClick={(event) => onNavigate?.(link, event)}
				rel="noreferrer"
				target="_blank"
			>
				{children}
				<ArrowUpRight
					aria-hidden="true"
					className="size-3.5 shrink-0 opacity-60"
				/>
				<span className="sr-only">(opens in a new tab)</span>
			</a>
		);
	}

	return (
		<Link
			// `includeHash` only where the item HAS one. Without it a hash item is
			// lit by the page alone - "Features" reading as the current page from the
			// moment you land on the page it is a section of, before you have gone
			// anywhere. With it, the item lights when you are actually at the section.
			activeOptions={{ exact: true, includeHash: Boolean(link.hash) }}
			aria-current={isActive ? "page" : undefined}
			className={cn(className)}
			hash={link.hash}
			onClick={(event) => onNavigate?.(link, event)}
			to={link.href}
		>
			{children}
		</Link>
	);
}
