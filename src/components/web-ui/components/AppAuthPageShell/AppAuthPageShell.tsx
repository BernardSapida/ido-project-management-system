import type { ReactNode } from "react";
import { AppBackdrop } from "../AppBackdrop";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";

interface AuthPageShellProps {
	children: ReactNode;
	/** Test hook on the outer grid. It carries `data-columns` too - `one` or
	 *  `two` - because whether the page split is the thing worth asserting, and
	 *  it is a layout decision rather than a class. */
	"data-cy"?: string;
	/** The gradient column shown from `md` up. Omit for a single-column page. */
	sidePanel?: ReactNode;
}

/**
 * The frame for every unauthenticated auth screen.
 *
 * Two columns from `md` up; below that the side panel is dropped and the
 * mark appears above the form instead, since the panel is what carries it on
 * desktop.
 */
export function AppAuthPageShell({ children, "data-cy": dataCy, sidePanel }: AuthPageShellProps) {
	return (
		<div
			className={cn(
				"relative grid min-h-screen overflow-hidden",
				// Only split the page when there is something to put in the other
				// half - `md:grid-cols-2` with no panel left the form marooned in
				// the left column against a blank right one.
				sidePanel ? "md:grid-cols-2" : null,
			)}
			data-columns={sidePanel ? "two" : "one"}
			data-cy={dataCy}
		>
			<AppBackdrop variant="auth" />

			{sidePanel}

			<div className="relative z-10 flex items-center justify-center p-6 md:p-12">
				<div className="w-full max-w-md">
					{sidePanel ? (
						// `mark="lockup"` here for the same reason as everywhere else this
						// comes up: the default asset is a wide icon+wordmark image, and
						// without it AppLogo treats that image as a square icon AND draws
						// its own separate text beside it - the name doubled, once as an
						// unreadable sliver inside the squashed crop, once at full size next
						// to it.
						//
						// `w-fit` is load-bearing, not decoration: AppLogo's own root is
						// `flex items-center gap-2` with no width set, and a BLOCK-level flex
						// container's `width: auto` fills its containing block - it is not a
						// shrink-to-fit box the way `inline-flex` would be. `mx-auto` alone
						// therefore had nothing to centre: the box was already as wide as its
						// parent, so the auto margins had no leftover space to split. `w-fit`
						// gives it back the fit-content width `mx-auto` needs to do anything.
						<AppLogo
							className="mx-auto mb-8 w-fit md:hidden"
							href="/"
							mark="lockup"
						/>
					) : null}
					{children}
				</div>
			</div>
		</div>
	);
}
