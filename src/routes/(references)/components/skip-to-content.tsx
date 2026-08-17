import { AppButton, AppGlassCard, AppPageHeader, MAIN_CONTENT_ID } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Skip-to-content lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * It went a long time without a lab, which is the whole problem with it: it is
 * invisible until focused, so it is the one component that can silently stop
 * working and nobody notices for a year.
 *
 * The check is entirely keyboard, and there is no mouse version of it:
 *
 * 1. Click the "Start here" button below, then press Tab ONCE. The link has to
 *    appear, top-left, on top of everything.
 * 2. Press Enter. Focus must land on the page's `<main>`, not merely scroll to
 *    it - a skip link that moves the viewport and leaves focus behind sends the
 *    next Tab back into the nav it just escaped.
 * 3. Press Tab again from there. The next stop must be inside the content.
 *
 * The link under test is the SHELL's, not one this page mounts. The labs shell
 * is a real `AppLayout` now, so it draws the link and owns the `<main>` the link
 * points at - which makes this the first lab that can demonstrate the component
 * in its actual job instead of against a stand-in. A second copy mounted here
 * would be a duplicate tab stop pointing at the shell's target anyway.
 */
export const Route = createFileRoute("/(references)/components/skip-to-content")({
	head: () => ({
		meta: [{ title: seo.title("Skip to content lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Skip to content" },
	component: SkipToContentLabPage,
});

function SkipToContentLabPage() {
	return (
		<div className="space-y-6">
			{/*
			 * Nothing mounted here. The component under test is the one the labs
			 * shell draws - see the note at the top of the file - and it is already
			 * the first focusable thing on this page, which is the whole behaviour a
			 * second copy would be unable to have.
			 */}
			<AppPageHeader
				subtitle="The first focusable thing on every signed-in page, and the only component here you cannot see."
				title="Skip to content lab"
			/>
			<TrySection />
			<CostSection />
			<TargetSection />
			<StylingSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function TrySection() {
	const startRef = useRef<HTMLDivElement>(null);

	return (
		<LabSection
			description="Put focus at the very top of the document, then Tab once. Browsers start the tab sequence from the last-clicked element, so pressing Tab from wherever you happen to be will not reach it - use the button, which blurs itself and resets focus to the document."
			title="Try it"
			usedIn={["Every signed-in page, as the first focusable element"]}
		>
			<div ref={startRef}>
				<AppButton
					data-cy="reset-focus"
					onPress={() => {
						// Reset the tab sequence to the top of the document. Without this,
						// Tab continues from whatever was last clicked - which is why this
						// component so often "doesn't work" when someone tries it.
						if (typeof document !== "undefined") {
							(document.activeElement as HTMLElement | null)?.blur();
							document.body.focus();
						}
					}}
					size="sm"
				>
					Start here, then press Tab
				</AppButton>
			</div>
			<p className="text-sm text-muted">
				The link appears top-left with a ring and a solid surface behind it. It has to be readable over whatever it
				lands on - it is `sr-only` until focus, so it never gets a chance to be designed around its background.
			</p>
		</LabSection>
	);
}

/** The number that justifies the component. */
function CostSection() {
	const [count, setCount] = useState(12);

	return (
		<LabSection
			description="A sidebar with a dozen items is a dozen tab stops in front of the content, on every screen, on every navigation, for anyone using a keyboard. That is the cost this one keypress removes - and it is a cost that grows every time someone adds a nav item."
			title="What it costs not to have"
			usedIn={["The argument for the component, as a number that grows"]}
		>
			<div className="flex flex-wrap items-center gap-3">
				<AppButton
					data-cy="fewer-nav"
					isDisabled={count <= 1}
					onPress={() => setCount((n) => Math.max(1, n - 1))}
					size="sm"
					variant="secondary"
				>
					Fewer nav items
				</AppButton>
				<AppButton
					data-cy="more-nav"
					onPress={() => setCount((n) => n + 1)}
					size="sm"
					variant="secondary"
				>
					More nav items
				</AppButton>
			</div>
			<p className="text-sm">
				<span
					className="font-medium"
					data-cy="nav-count"
				>
					{count}
				</span>{" "}
				nav items = <span className="font-medium text-danger">{count} tab presses</span> to reach the content, every
				single page — versus <span className="font-medium text-success">1</span> with the skip link.
			</p>
			<div className="flex flex-wrap gap-1">
				{Array.from({ length: count }, (_, index) => (
					<span
						className="rounded-md bg-muted-surface px-2 py-1 text-xs text-muted"
						key={index}
					>
						Nav {index + 1}
					</span>
				))}
			</div>
		</LabSection>
	);
}

function TargetSection() {
	return (
		<LabSection
			description="The link points at MAIN_CONTENT_ID, exported from the same module as the component. The frame puts that id on <main> along with tabIndex={-1} - the id alone only scrolls; the negative tabindex is what lets focus actually land there."
			title="The target"
			usedIn={["AppMain, which carries the id and tabIndex={-1}", "AppLayout, which renders AppMain once per page"]}
		>
			{/*
			 * No stand-in. This page IS inside the target - the labs shell's
			 * `<main>` wraps everything below the shell's nav - so a demo box
			 * carrying the same id would be a duplicate of the thing it was standing
			 * in for, and the link would go to whichever the browser found first.
			 */}
			<div className="rounded-2xl border border-dashed border-border p-6">
				<p className="text-sm font-medium">
					You are already in it: <code className="font-mono">#{MAIN_CONTENT_ID}</code>
				</p>
				<p className="mt-1 text-sm text-muted">
					Follow the skip link and this page&apos;s <code className="font-mono">&lt;main&gt;</code> takes focus - the
					region that starts just below the nav and holds everything you can read. Tab once more and you land on the
					first control inside it, which is the button at the top of this page rather than anything back in the nav.
				</p>
			</div>
			<p className="text-sm text-muted">
				The id is a shared constant rather than the string &quot;main-content&quot; typed in two places, which is the
				only thing stopping the link and its target from drifting apart silently. There is exactly one per page:{" "}
				<code className="font-mono">AppMain</code> carries it, and <code className="font-mono">AppLayout</code> renders{" "}
				<code className="font-mono">AppMain</code> once - which is why a frame mounted as a lab specimen has to be given
				an id of its own.
			</p>
		</LabSection>
	);
}

function StylingSection() {
	return (
		<LabSection
			description="`sr-only` until focus, then a real, opaque, elevated chip. Every part of that is load-bearing."
			title="Why it looks the way it does"
			usedIn={["Why sr-only, why opaque, why elevated - all load-bearing"]}
		>
			<ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
				<li>
					<span className="font-medium text-foreground">`sr-only`, not `hidden`.</span> A `display: none` link is not
					focusable at all, so the component would do nothing while looking correct in the DOM.
				</li>
				<li>
					<span className="font-medium text-foreground">Opaque `bg-surface`.</span> It lands over whatever the top of
					the page happens to be; a translucent chip over a gradient header is unreadable exactly once, for the one user
					who needs it.
				</li>
				<li>
					<span className="font-medium text-foreground">`focus:z-100`.</span> Above sticky headers and above the nav.
					Appearing behind the header is the same as not appearing.
				</li>
				<li>
					<span className="font-medium text-foreground">A visible ring.</span> It is reached by keyboard only, so focus
					styling is not decoration here - it is the entire feedback the user gets.
				</li>
			</ul>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
