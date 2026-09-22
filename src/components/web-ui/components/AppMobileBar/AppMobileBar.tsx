import { Link } from "@tanstack/react-router";
import { ChevronLeft, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";

interface AppMobileBarProps {
	/** At most two. A third belongs in the page, not in the chrome. */
	actions?: ReactNode;
	/** Where "back" goes, and what it is called. The parent LEVEL, not the previous page. */
	back?: { href: string; label: string };
	className?: string;
	/** Test hook on the bar. `-back`, `-title` and `-menu` derive from it. */
	"data-cy"?: string;
	onOpenMenu: () => void;
	/** The screen's name. Falls back to the wordmark at the top of a section. */
	title?: string;
}

/**
 * The top bar on a phone: where you are, and the way into the secondary things.
 *
 * The top bar splits by surface. Desktop puts search, alerts and the account
 * menu on the right of a wide strip; a phone has room for the screen title and
 * at most two actions, so that is all this carries. Everything else is either
 * in the tab bar at the bottom or behind the one hamburger on the right.
 *
 * Past one level deep the wordmark gives way to a back affordance naming the
 * PARENT - not the previous page. A chevron trail wraps to two lines on a phone
 * and pushes the title below the fold, and "back" has to be predictable from
 * where the user is rather than from how they got there.
 *
 * The title is NOT drawn while the page's own `<h1>` is on screen. Every screen
 * opens with its name in 30px type, so a second copy of it in the bar 40px above
 * was the same word twice, and the one people actually read was the big one. It
 * fades in once that heading has scrolled away, which is the moment the bar
 * becomes the only thing still saying where you are.
 *
 * OPAQUE (`bg-surface`), not glass, for the same reason as the drawer: it is
 * pinned over live page content scrolling under it.
 */
export function AppMobileBar({ actions, back, className, "data-cy": dataCy, onOpenMenu, title }: AppMobileBarProps) {
	const hasScrolledPastHeading = useHasScrolled(HEADING_SCROLLED_AWAY_PX);

	return (
		<div
			className={cn("flex items-center gap-2 border-b border-border bg-surface px-3 py-2", className)}
			data-cy={dataCy}
		>
			{back ? (
				<Link
					className="-ml-1 flex min-h-11 min-w-11 items-center gap-1 rounded-xl pr-2 pl-1 text-sm font-medium text-foreground/70 transition hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
					data-cy={dataCy ? `${dataCy}-back` : undefined}
					to={back.href}
				>
					<ChevronLeft
						aria-hidden="true"
						className="size-5 shrink-0"
					/>
					<span className="max-w-28 truncate">{back.label}</span>
				</Link>
			) : (
				<AppLogo
					data-cy={dataCy ? `${dataCy}-logo` : undefined}
					href="/"
					size="sm"
				/>
			)}

			{/*
			 * The h1's understudy. It is aria-hidden throughout: the heading it
			 * stands in for is a real heading in the document, and announcing the
			 * screen's name twice helps nobody. Opacity rather than mounting, so
			 * the row's widths never change and the hamburger cannot shift under a
			 * thumb already moving towards it.
			 */}
			<p
				aria-hidden="true"
				className={cn(
					"min-w-0 flex-1 truncate text-sm font-semibold transition-opacity duration-200",
					title && hasScrolledPastHeading ? "opacity-100" : "opacity-0",
				)}
				data-cy={dataCy ? `${dataCy}-title` : undefined}
				/* Whether the understudy has taken over, as data. It is an opacity
				   change rather than a mount, so "is it showing" is otherwise only
				   answerable by reading a computed style. */
				data-showing={Boolean(title) && hasScrolledPastHeading}
			>
				{title}
			</p>

			{actions}

			<AppButton
				aria-haspopup="dialog"
				aria-label="Account and settings"
				className="shrink-0"
				data-cy={dataCy ? `${dataCy}-menu` : undefined}
				icon={Menu}
				isIconOnly
				onPress={onOpenMenu}
				variant="ghost"
			/>
		</div>
	);
}

/** Roughly one page heading block: title, subtitle and the gap under it. */
const HEADING_SCROLLED_AWAY_PX = 72;

/**
 * Whether the window has scrolled past `threshold`.
 *
 * A plain listener rather than an IntersectionObserver on the heading: the bar
 * has no handle on the page's `<h1>` (it is rendered by whatever route is
 * mounted), and a scroll position is the honest question anyway - "has the top
 * of this screen gone" rather than "is that specific element visible".
 */
function useHasScrolled(threshold: number): boolean {
	const [hasScrolled, setHasScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setHasScrolled(window.scrollY > threshold);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [threshold]);

	return hasScrolled;
}
