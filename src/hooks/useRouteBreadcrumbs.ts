import type { BreadcrumbItem } from "@bernardsapida/web-ui";
import { useMatches } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

// Augment TanStack Router's StaticDataRouteOption so routes can declare breadcrumb and layout metadata
declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		breadcrumb?: string;
		breadcrumbIcon?: LucideIcon;
		hideSidebar?: boolean;
	}
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
