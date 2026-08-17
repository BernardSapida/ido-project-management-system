import type { BreadcrumbItem, MainWidth } from "@bernardsapida/web-ui";
import { useMatches } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

// Augment TanStack Router's StaticDataRouteOption so routes can declare breadcrumb and layout metadata
declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		breadcrumb?: string;
		breadcrumbIcon?: LucideIcon;
		hideSidebar?: boolean;
		mainWidth?: MainWidth;
	}
}

/**
 * The content measure the DEEPEST matched route asks for, defaulting to
 * `"default"`.
 *
 * Deepest wins because the leaf is the page: `/requests` may want `wide` while
 * `/requests/$id` wants `prose`, and the parent layout must not decide for it.
 * Same mechanism as the breadcrumb above - the route declares it in
 * `staticData`, and the frame reads it.
 */
export function useRouteMainWidth(): MainWidth {
	const matches = useMatches();

	const declared = matches.filter((match) => match.staticData?.mainWidth);

	return declared.at(-1)?.staticData.mainWidth ?? "default";
}

export function useRouteBreadcrumbs(): BreadcrumbItem[] {
	const matches = useMatches();

	return matches
		.filter((match) => match.staticData?.breadcrumb)
		.map((match) => ({
			key: match.id,
			label: match.staticData.breadcrumb as string,
			href: match.pathname,
			icon: match.staticData.breadcrumbIcon,
		}));
}
