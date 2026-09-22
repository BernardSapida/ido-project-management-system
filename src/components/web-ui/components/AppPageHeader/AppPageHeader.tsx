import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PageHeaderProps {
	/** Right-aligned slot; wraps below the title on small screens. */
	action?: ReactNode;
	className?: string;
	subtitle?: string;
	title: string;
}

/**
 * The page title block every screen opens with.
 *
 * Use this rather than restating the heading classes per page - it is what
 * keeps the type scale consistent across every role area, and the one place to
 * change it.
 */
export function AppPageHeader({ action, className, subtitle, title }: PageHeaderProps) {
	return (
		<div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
			<div>
				<h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
				{subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
