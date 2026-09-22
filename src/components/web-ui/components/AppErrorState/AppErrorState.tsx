import { useAppUI } from "../../internal";
import type { LucideIcon } from "lucide-react";
import {
	FileQuestion,
	Gauge,
	History,
	Hourglass,
	KeyRound,
	ServerCrash,
	ShieldAlert,
	TriangleAlert,
	Unplug,
	WifiOff,
	Wrench,
} from "lucide-react";
import { createContext, type ReactNode, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";
import { IS_DEV_BUILD } from "../../lib/is-dev-build";

/**
 * Every way a page or a component can fail in front of a user.
 *
 * These are not interchangeable and the component will not let a caller treat
 * them as such: each one has different copy, a different glyph, a different way
 * out, and - crucially - a different person who can fix it. Telling someone the
 * server is broken when their wifi is off sends them to the wrong fix, and
 * telling them "access denied" when their session merely expired sends them to
 * an administrator who has nothing to grant.
 *
 * Deliberately NOT here: field validation. That belongs beside the field that
 * failed, on the control itself (`isInvalid` / `errorMessage`), because an error
 * state that replaces the form loses everything the user typed. If you are
 * reaching for this to report a bad input, you want the form instead.
 */
export type ErrorKind =
	| "conflict"
	| "forbidden"
	| "maintenance"
	| "network"
	| "not-found"
	| "offline"
	| "rate-limited"
	| "server"
	| "timeout"
	| "unauthenticated"
	| "unknown";

type ErrorTone = "accent" | "danger" | "warning";

/**
 * The built-in way out, used when the caller supplies no action of its own.
 * There is no "none" - a dead end is the one thing this component may never
 * render.
 */
type Recovery = "back" | "reload" | "retry";

interface ErrorPreset {
	/** Fallback machine code. A caller with a narrower one should pass it. */
	code: string;
	icon: LucideIcon;
	/** What to do about it. Never "try again later" standing on its own. */
	next: string;
	recovery: Recovery;
	/**
	 * The HTTP status behind this kind, drawn as the page variant's mark.
	 * Three kinds have none - the request never reached a server that could
	 * answer with one - and those get the mark on its own instead.
	 */
	status?: number;
	title: string;
	tone: ErrorTone;
	/** What happened, in the user's terms, including who it happened to. */
	what: string;
}

/**
 * The copy lives here rather than at the call sites, which is what stops forty
 * screens inventing forty ways to say "403".
 *
 * It is deliberately GENERAL. A user-facing error that spells out which service
 * fell over, which record is missing or which role is required tells an attacker
 * how the system is put together and tells the user nothing they can act on. So
 * each entry says only what kind of thing happened and what to do next; the
 * specific detail belongs in the logs (see the commented `console.error` in the
 * component below), not on the screen.
 *
 * `code`, `icon`, `status`, `tone` and `recovery` are kept per-kind because they
 * drive behaviour and the visual, not because they leak anything.
 *
 * These presets never run through the vague-copy guard - it only inspects the
 * `detail` / `next` / `title` a CALLER passes - so a general "please try again"
 * here is fine, while the same string typed at a call site is still rejected.
 */
const presetsFor = (appName: string): Record<ErrorKind, ErrorPreset> => ({
	conflict: {
		code: "CONFLICT",
		icon: History,
		next: "Reload the page and make your change again. If it keeps happening, contact support.",
		recovery: "reload",
		status: 409,
		title: "This was changed somewhere else",
		tone: "warning",
		what: "We couldn't save that because it changed since you opened it. Nothing was saved.",
	},
	forbidden: {
		code: "FORBIDDEN",
		icon: ShieldAlert,
		next: "Go back and try something else. If you think you should have access, contact support.",
		recovery: "back",
		status: 403,
		title: "You can't open this",
		tone: "danger",
		what: "Your account doesn't have access to this. Nothing was changed.",
	},
	maintenance: {
		code: "MAINTENANCE",
		icon: Wrench,
		next: "Please check back shortly. Reloading once it's back brings you straight here.",
		recovery: "reload",
		status: 503,
		title: `${appName} is briefly unavailable`,
		tone: "accent",
		what: "This part of the app is offline for a short while. Your data is untouched.",
	},
	network: {
		code: "NETWORK_UNREACHABLE",
		icon: Unplug,
		next: "Please try again in a moment. If it keeps happening, contact support.",
		recovery: "retry",
		title: "We couldn't reach the server",
		tone: "warning",
		what: "The request didn't get through. Your data is unchanged.",
	},
	"not-found": {
		code: "NOT_FOUND",
		icon: FileQuestion,
		next: "Check the address, or go back to the page you came from.",
		recovery: "back",
		status: 404,
		title: "We couldn't find that page",
		tone: "accent",
		what: "That address doesn't match anything here. It may have moved, or the link is out of date.",
	},
	offline: {
		code: "OFFLINE",
		icon: WifiOff,
		next: "Reconnect to wifi or mobile data. The button below wakes up the moment you're back.",
		recovery: "retry",
		title: "You appear to be offline",
		tone: "warning",
		what: "Your device has no internet connection, so this request never left it. Nothing was lost.",
	},
	"rate-limited": {
		code: "RATE_LIMITED",
		icon: Gauge,
		next: "Wait about a minute, then try once more.",
		recovery: "retry",
		status: 429,
		title: "Too many requests",
		tone: "warning",
		what: "You've made too many requests in a short time. There's nothing wrong with your account.",
	},
	server: {
		code: "SERVER_ERROR",
		icon: ServerCrash,
		next: "Please try again in a moment. If it keeps happening, contact support.",
		recovery: "retry",
		status: 500,
		title: "Something went wrong on our side",
		tone: "danger",
		what: "We hit a problem handling this request. Nothing you did caused it.",
	},
	timeout: {
		code: "TIMEOUT",
		icon: Hourglass,
		next: "Reload the page before trying again, so you don't submit the same thing twice.",
		recovery: "reload",
		status: 408,
		title: "That took too long",
		tone: "warning",
		what: "The server didn't answer in time, so we can't tell you whether it went through.",
	},
	unauthenticated: {
		code: "UNAUTHENTICATED",
		icon: KeyRound,
		next: "Sign in again and you'll be brought straight back here.",
		recovery: "back",
		status: 401,
		title: "You're signed out",
		tone: "accent",
		what: "This page needs a signed-in account, and your session has ended.",
	},
	unknown: {
		code: "UNHANDLED",
		icon: TriangleAlert,
		next: "Please reload the page. If it keeps happening, contact support.",
		recovery: "reload",
		title: "Something went wrong",
		tone: "danger",
		what: "We ran into an unexpected problem. Please try again.",
	},
});

export interface ErrorStateAction {
	label: string;
	onPress: () => void;
}

export interface ErrorReference {
	/**
	 * Stable machine code. Defaults to the kind's own, but a caller that knows
	 * more should say so - `ORDER_NOT_FOUND` is findable in the codebase and
	 * in the logs; `NOT_FOUND` on its own is forty screens wide.
	 */
	code?: string;
	/** The api's request or trace id, when the failed response carried one. */
	requestId?: string;
}

export interface AppErrorStateProps {
	/** Replaces the built-in recovery. Whatever it does, it must lead somewhere. */
	action?: ErrorStateAction;
	className?: string;
	"data-cy"?: string;
	/**
	 * One sentence naming the SPECIFIC thing that failed - which record, which
	 * permission, which endpoint. This is the difference between an error a user
	 * can act on and one they can only forward. Vague values are rejected in
	 * development; see `findVagueCopy`.
	 */
	detail?: string;
	/** Where this sits in the page's outline. Defaults to 1 for a page, 2 for a section. */
	headingLevel?: 1 | 2 | 3;
	kind: ErrorKind;
	/** Overrides the preset's "what to do now". Same specificity rule as `detail`. */
	next?: string;
	/** Wired to the built-in retry. Without it, retry falls back to a reload. */
	onRetry?: () => void;
	reference?: ErrorReference;
	secondaryAction?: ErrorStateAction;
	/** Overrides the preset's headline. Same specificity rule as `detail`. */
	title?: string;
	/**
	 * Two DESIGNS, not two sizes.
	 *
	 * `section` is a tinted strip standing in for one region while the rest of
	 * the page still works - which is nearly always the honest choice, because
	 * one failed query is not a broken app. It is horizontal, small, and reads as
	 * an annotation on the hole it is filling.
	 *
	 * `page` is for a route that could not load at all. It has the whole viewport
	 * and nothing left to annotate, so it is centred, vertical, paints no surface
	 * of its own, and leads with the status mark rather than with a status tile.
	 */
	variant?: "page" | "section";
}

/**
 * The surface shown when a page or a component hits something it cannot render
 * through: not found, not authorized, offline, timed out, rate limited, a
 * conflict, a 500, or a failure with no name yet.
 *
 * Three things are true of every one of them, and the component - not the
 * caller - is what makes them true:
 *
 * 1. **Identifiable to the app, general to the user.** The copy comes from the
 *    kind, so a 404 never renders as a 500 - but what the user reads is
 *    deliberately non-specific. Naming the failing service or the missing record
 *    on screen helps an attacker and not the user; that detail goes to the logs.
 * 2. **Trackable - currently held back.** A reference block (code, request id,
 *    time, "Copy details") is built but not rendered: see `SHOW_REFERENCE_BLOCK`
 *    below. Flip it to `true` once there is support tooling that consumes the id.
 * 3. **Solvable.** Every kind carries a way out, and there is no `recovery:
 *    "none"`. An error state with nothing to press is a dead end at the exact
 *    moment the user is already stuck.
 *
 * There is deliberately NO `message` prop. A single free-text string is how
 * "Something went wrong" ends up on screen: it collapses what happened, why, and
 * what to do into one sentence that answers none of them. The three parts are
 * separate props with separate jobs, and the vague-copy guard below reports the
 * sentence in development rather than shipping it.
 */
export function AppErrorState({
	action,
	className,
	"data-cy": dataCy,
	detail,
	headingLevel,
	kind,
	next,
	onRetry,
	reference,
	secondaryAction,
	title,
	variant = "section",
}: AppErrorStateProps) {
	const isOffline = useIsOffline();
	/*
	 * A dead wifi produces exactly the symptoms of an unreachable server, and the
	 * two have opposite fixes. The browser already knows which it is, so a caller
	 * that guessed "network" gets corrected rather than sending the user to
	 * check on a server that is fine.
	 */
	const resolvedKind = isOffline && (kind === "network" || kind === "timeout") ? "offline" : kind;
	// Built from the app's name rather than read from a module constant: nine of
	// these strings say it out loud, and a package cannot know it. Memoised on the
	// name, so the table is rebuilt only if the name itself changes - which is
	// never, in practice, but a fresh Record on every render would be a new object
	// identity for every consumer below.
	const { appName } = useAppUI();
	const preset = useMemo(() => presetsFor(appName), [appName])[resolvedKind];

	const isPage = variant === "page";
	const headingId = useId();
	const level = headingLevel ?? (isPage ? 1 : 2);
	const code = reference?.code ?? preset.code;

	const rootRef = useRef<HTMLElement>(null);
	/*
	 * A page-level error replaces everything that was on screen, so keyboard and
	 * screen-reader users are otherwise left with focus on a control that no
	 * longer exists. Moving focus here is also what announces it, which is why
	 * the page variant does not additionally carry role="alert" - the two
	 * together read the whole thing twice.
	 *
	 * The section variant does the opposite: it announces politely and leaves
	 * focus alone, because stealing it from a form the user is still filling in
	 * to report that a sidebar widget failed is worse than the failure.
	 */
	useEffect(() => {
		if (isPage) rootRef.current?.focus();
	}, [isPage]);

	const recovery = buildRecovery(preset.recovery, onRetry);
	const primary = action ?? recovery.action;
	const isPrimaryDead = isOffline && primary === recovery.action && recovery.needsNetwork;

	const vague = useIsCopyGuardOn() ? findVagueCopy({ detail, next, title }) : [];

	const copy = {
		headingId,
		level,
		next: next ?? preset.next,
		title: title ?? preset.title,
		what: detail ?? preset.what,
	};

	/*
	 * The SPECIFIC failure - which service, which record, which endpoint - is
	 * diagnostic data, not user copy. Naming it on screen helps an attacker map
	 * the system and helps the user not at all, so what the user reads (above) is
	 * deliberately general and the detail goes to the logs instead. Uncomment and
	 * point at a real logger to wire that up:
	 *
	 * console.error("[AppErrorState]", {
	 * 	kind: resolvedKind,
	 * 	code,
	 * 	requestId: reference?.requestId,
	 * 	detail,
	 * 	next,
	 * 	title,
	 * 	page: typeof window === "undefined" ? undefined : window.location.pathname,
	 * });
	 */

	const actions = { isPrimaryDead, primary, secondary: secondaryAction };

	/*
	 * The reference block (machine code, request id, timestamp, "Copy details")
	 * is held back for now. A visible trace id is one more token an attacker can
	 * correlate across responses, and until there is support tooling that
	 * actually consumes it, it is noise to the user. Flip this to `true` - and
	 * nothing else - to bring it back on every error state at once.
	 */
	const SHOW_REFERENCE_BLOCK = false;
	const referenceBlock = SHOW_REFERENCE_BLOCK ? (
		<ErrorReferenceBlock
			code={code}
			detail={copy.what}
			isCentred={isPage}
			kind={resolvedKind}
			requestId={reference?.requestId}
		/>
	) : null;

	return (
		<section
			aria-labelledby={headingId}
			className={cn(
				"error-state outline-none",
				isPage
					? "flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center"
					: "error-state--panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:gap-4",
				className,
			)}
			data-cy={dataCy}
			/* The KIND as data. It already decides the glyph, the copy and the
			   status number, but none of those is a stable thing to assert on -
			   copy is meant to be rewritten. Eleven kinds that must never collapse
			   into each other need one hook that says which is which. */
			data-kind={kind}
			data-tone={preset.tone}
			data-variant={variant}
			ref={rootRef}
			role={isPage ? undefined : "alert"}
			tabIndex={isPage ? -1 : undefined}
		>
			{isPage ? (
				<PageBody
					actions={actions}
					copy={copy}
					glyph={preset.icon}
					reference={referenceBlock}
					status={preset.status}
					vague={vague}
				/>
			) : (
				<PanelBody
					actions={actions}
					copy={copy}
					glyph={preset.icon}
					reference={referenceBlock}
					vague={vague}
				/>
			)}
		</section>
	);
}

/* -------------------------------------------------------------------------- */

interface BodyCopy {
	headingId: string;
	level: 1 | 2 | 3;
	next: string;
	title: string;
	what: string;
}

interface BodyActions {
	isPrimaryDead: boolean;
	primary: ErrorStateAction;
	secondary?: ErrorStateAction;
}

interface BodyProps {
	actions: BodyActions;
	copy: BodyCopy;
	glyph: LucideIcon;
	reference: ReactNode;
	vague: string[];
}

/**
 * The panel: a status tile, then the text, then the way out, laid along a row.
 *
 * It is small on purpose. Something on this page still works, and the user came
 * for that; this is a note about the part that did not arrive, not an
 * announcement about the app.
 */
function PanelBody({ actions, copy, glyph: Glyph, reference, vague }: BodyProps) {
	return (
		<>
			<div
				aria-hidden="true"
				className="error-state__tile grid size-11 shrink-0 place-items-center rounded-2xl"
			>
				<Glyph className="size-5" />
			</div>

			<div className="min-w-0 flex-1 space-y-2">
				<Heading
					className="text-base font-semibold"
					id={copy.headingId}
					level={copy.level}
				>
					{copy.title}
				</Heading>
				<BodyText copy={copy} />
				<ErrorActions
					actions={actions}
					size="sm"
				/>
				{reference}
				{vague.length > 0 && <VagueCopyWarning problems={vague} />}
			</div>
		</>
	);
}

/**
 * The page: the status mark, then the headline, then the text, then the way out,
 * stacked down the middle of the viewport.
 *
 * The mark leads because there is nothing else on screen for the eye to land on
 * first, and because at this size the panel's 44px tile would be a speck. It is
 * decoration - `aria-hidden`, with the heading carrying the meaning - so a
 * reader who cannot see it loses nothing but the moment of personality.
 */
function PageBody({ actions, copy, glyph, reference, status, vague }: BodyProps & { status?: number }) {
	return (
		<>
			<ErrorMark
				glyph={glyph}
				status={status}
			/>

			<Heading
				className="mt-8 text-3xl font-bold tracking-tight text-balance sm:mt-10 sm:text-4xl"
				id={copy.headingId}
				level={copy.level}
			>
				{copy.title}
			</Heading>

			<div className="mt-4 max-w-prose">
				<BodyText
					copy={copy}
					isLarge
				/>
			</div>

			<div className="mt-8">
				<ErrorActions
					actions={actions}
					isCentred
					size="md"
				/>
			</div>

			{/* Held well away from the buttons and dimmed: it is the last thing on
			    the page for the person who has already tried both of them. */}
			<div className="mt-12 w-full max-w-lg">{reference}</div>

			{vague.length > 0 && (
				<div className="mt-6 w-full max-w-lg">
					<VagueCopyWarning problems={vague} />
				</div>
			)}
		</>
	);
}

/**
 * Two paragraphs, never one. The first says what happened and to whom; the
 * second says what to do. Merging them is how the second half quietly
 * disappears, and the second half is the only part of an error that is any use
 * to the person reading it.
 */
function BodyText({ copy, isLarge }: { copy: BodyCopy; isLarge?: boolean }) {
	return (
		<div className={cn("space-y-2 leading-relaxed", isLarge ? "text-base sm:text-lg" : "text-sm")}>
			<p className="text-muted">{copy.what}</p>
			<p className="font-medium text-foreground/80">{copy.next}</p>
		</div>
	);
}

function ErrorActions({ actions, isCentred, size }: { actions: BodyActions; isCentred?: boolean; size: "md" | "sm" }) {
	const isMedium = size === "md";

	return (
		<div className={cn("flex flex-wrap items-center gap-2 pt-1", isCentred && "justify-center")}>
			{/* THE TONE'S COLOUR, not the brand: a danger error offers a danger
			    button, a warning error a warning one. A user who has just been told
			    something broke should not have their eye pulled to a cheerful brand
			    pill - the way out should read as part of the same message.

			    It does NOT paint `var(--error-rail)`, and that was a real WCAG
			    failure rather than a preference: the rails are solved to carry a
			    GLYPH at 3:1, so a 14px semibold LABEL on one measured 3.25:1 on
			    accent, 3.96:1 on danger and 2.29:1 on warning - all below the 4.5:1
			    AA floor. `.error-state__action` in ui.css paints the tone's SEMANTIC
			    PAIR instead (`--danger` / `--danger-foreground`, etc.) - the same
			    per-theme pairs the solid chips use, solved as a pair at 4.5:1+. */}
			<AppButton
				className={cn(
					"error-state__action rounded-full font-semibold shadow-none hover:opacity-90",
					isMedium ? "h-11 px-7 text-sm" : "h-9 px-5 text-sm",
				)}
				isDisabled={actions.isPrimaryDead}
				onPress={actions.primary.onPress}
				size="sm"
			>
				{actions.primary.label}
			</AppButton>
			{actions.secondary && (
				<AppButton
					className={cn("rounded-full font-medium", isMedium ? "h-11 px-6 text-sm" : "h-9 px-4 text-sm")}
					onPress={actions.secondary.onPress}
					size="sm"
					variant="ghost"
				>
					{actions.secondary.label}
				</AppButton>
			)}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The page variant's mark: the status number with every 0 drawn as the app's
 * own glyph.
 *
 * THIS IS THE ONE PLACE A PROJECT PUTS ITS PERSONALITY. A 404 is exactly where
 * an app can afford it, because nothing is broken and nobody has lost anything;
 * swapping `MarkGlyph` below for a shape that means something in your product
 * is the intended customisation, and the default hexagon is a placeholder standing
 * in until you do. On a 500 the same shape reads soberly, which is the other
 * half of why this works: the tone does the changing, the mark does not have to.
 *
 * Three kinds have no status number - offline, network, unknown - because the
 * request never reached a server that could answer with one. They get the glyph
 * alone at mark size with their own icon inside it, which is why the glyph is
 * the constant here and the digits are the variable: the design has to survive
 * having no number to show.
 */
function ErrorMark({ glyph: Glyph, status }: { glyph: LucideIcon; status?: number }) {
	if (status === undefined) {
		return (
			<div
				aria-hidden="true"
				className="relative w-[clamp(6rem,26vw,9rem)]"
			>
				<MarkGlyph className="error-state__mark-glyph w-full" />
				{/* Dead centre, because the hexagon's mass is symmetrical about both
				    axes. A shape with its weight off-centre needs this nudged to
				    match - that is the number to change if you swap the path. */}
				<Glyph
					className="absolute top-1/2 left-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 text-white"
					strokeWidth={2.25}
				/>
			</div>
		);
	}

	/*
	 * The digits of a status code are positional and repeat - 500 has two zeroes
	 * - so position is genuinely the identity here, and the key carries it
	 * explicitly rather than leaning on the array index.
	 */
	const glyphs = String(status)
		.split("")
		.map((character, index) => ({ character, key: `${index}-${character}` }));

	return (
		<p
			aria-hidden="true"
			className="error-state__mark inline-flex items-center gap-[0.02em]"
		>
			{glyphs.map(({ character, key }) =>
				character === "0" ? (
					<MarkGlyph
						className="error-state__mark-glyph h-[0.86em] w-[0.6em] translate-y-[0.02em]"
						key={key}
					/>
				) : (
					<span key={key}>{character}</span>
				),
			)}
		</p>
	);
}

/**
 * The brand mark, filled with the tone's own gradient endpoints.
 *
 * An elongated hexagon by default: geometric enough to carry no meaning of its
 * own, symmetrical on both axes so a glyph sits dead centre in it, and taller
 * than it is wide so it stands in for a `0` without the digits either side
 * having to shuffle.
 *
 * REPLACE THE `<path>` with your product's own mark - that is the intended
 * customisation. Keep the `viewBox`, the `aria-hidden` and the gradient wiring,
 * and nothing else in this file needs to know. If the replacement's mass is not
 * centred, adjust the glyph's `top-1/2` in ErrorMark to match.
 *
 * The gradient is declared here rather than reused from `--error-rail`, because
 * that token is a `linear-gradient()` - a CSS image, which an SVG `<stop>`
 * cannot take. The two `stop-color`s come from the same `--rail-*-from/to` pair
 * the rail is built out of, so they cannot drift apart.
 */
function MarkGlyph({ className }: { className?: string }) {
	/*
	 * `useId` emits punctuation - `:r1:` on React 18, guillemets on 19 - and this
	 * value goes into a `url(#…)` FuncIRI, which is parsed as a CSS value. Strip
	 * it to word characters: still unique per instance, still identical across
	 * SSR and hydration, and safe in a reference.
	 */
	const gradientId = `error-mark-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			viewBox="0 0 24 30"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<linearGradient
					gradientUnits="objectBoundingBox"
					id={gradientId}
					x1="0"
					x2="1"
					y1="0"
					y2="1"
				>
					<stop
						className="error-state__mark-fill"
						offset="0%"
					/>
					<stop
						className="error-state__mark-fill-end"
						offset="100%"
					/>
				</linearGradient>
			</defs>
			<path
				d="M12 0.8 22.4 7.4 22.4 22.6 12 29.2 1.6 22.6 1.6 7.4Z"
				fill={`url(#${gradientId})`}
			/>
			{/* The wet highlight. Without it the shape reads as a balloon or a pin;
			    this is the one detail that makes it a liquid. */}
			<ellipse
				cx="8.4"
				cy="20.6"
				fill="white"
				opacity="0.28"
				rx="2.1"
				ry="3"
				transform="rotate(-24 8.4 20.6)"
			/>
		</svg>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The built-in exit for a kind, plus whether pressing it can possibly work
 * while the device is offline - a "Try again" that cannot reach anything is a
 * button that teaches the user the app is broken.
 */
function buildRecovery(recovery: Recovery, onRetry?: () => void) {
	if (recovery === "retry") {
		return {
			action: {
				label: "Try again",
				onPress: () => (onRetry ? onRetry() : window.location.reload()),
			},
			needsNetwork: true,
		};
	}
	if (recovery === "reload") {
		return {
			action: { label: "Reload the page", onPress: () => window.location.reload() },
			needsNetwork: true,
		};
	}
	return {
		action: { label: "Go back", onPress: () => window.history.back() },
		needsNetwork: false,
	};
}

/* -------------------------------------------------------------------------- */

interface ErrorReferenceBlockProps {
	code: string;
	detail: string;
	isCentred: boolean;
	kind: ErrorKind;
	requestId?: string;
}

/**
 * The trackable half: what a user reads out over the phone, screenshots, or
 * pastes into a ticket.
 *
 * The code renders on the server and on the client alike, because it is the one
 * field that is knowable before mount. The time and the page are filled in by
 * an effect instead of at render: `new Date()` and `window.location` differ
 * between the SSR pass and hydration, and a mismatch on an error page is a
 * hydration warning fired inside whatever already went wrong.
 */
function ErrorReferenceBlock({ code, detail, isCentred, kind, requestId }: ErrorReferenceBlockProps) {
	const { appName } = useAppUI();
	const [context, setContext] = useState<{ at: string; page: string } | null>(null);
	const [hasCopied, setHasCopied] = useState(false);
	const copyTimer = useRef<ReturnType<typeof setTimeout>>(null);

	useEffect(() => {
		setContext({ at: new Date().toISOString(), page: window.location.pathname });
	}, []);

	useEffect(() => () => clearTimeout(copyTimer.current ?? undefined), []);

	async function copyDetails() {
		const report = [
			`${appName} error report`,
			`Code: ${code}`,
			requestId ? `Reference: ${requestId}` : null,
			`Kind: ${kind}`,
			context ? `Time: ${context.at}` : null,
			context ? `Page: ${context.page}` : null,
			`What: ${detail}`,
		]
			.filter(Boolean)
			.join("\n");

		try {
			await navigator.clipboard.writeText(report);
			setHasCopied(true);
			copyTimer.current = setTimeout(() => setHasCopied(false), 2000);
		} catch {
			/*
			 * Clipboard access is denied outright in some embedded webviews. The
			 * whole reference is on screen as selectable text for exactly this
			 * reason, so the failure costs a convenience, not the information.
			 */
		}
	}

	return (
		<div
			className={cn(
				"mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-separator-tertiary/50 pt-3 text-xs text-muted",
				isCentred && "justify-center",
			)}
		>
			<dl className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<ReferenceItem
					label="Code"
					value={code}
				/>
				{requestId && (
					<ReferenceItem
						label="Reference"
						value={requestId}
					/>
				)}
				{context && (
					<ReferenceItem
						label="Time"
						value={context.at}
					/>
				)}
			</dl>
			<AppButton
				className="h-7 rounded-full px-3 text-xs font-medium"
				onPress={() => void copyDetails()}
				size="sm"
				variant="ghost"
			>
				{hasCopied ? "Copied" : "Copy details"}
			</AppButton>
			{/* The button's own label changes, which a screen reader on a pressed
			    button does not reliably re-read. This does. */}
			<span
				aria-live="polite"
				className="sr-only"
			>
				{hasCopied ? "Error details copied to the clipboard." : ""}
			</span>
		</div>
	);
}

function ReferenceItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<dt className="sr-only">{label}</dt>
			<span aria-hidden="true">{label}</span>
			<dd className="font-mono text-foreground/70 select-all">{value}</dd>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function Heading({
	children,
	className,
	id,
	level,
}: {
	children: ReactNode;
	className?: string;
	id: string;
	level: 1 | 2 | 3;
}) {
	const Tag = `h${level}` as const;
	return (
		<Tag
			className={className}
			id={id}
		>
			{children}
		</Tag>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Whether the copy guard runs, for the one caller that has to say so rather
 * than let the build decide. `null` - the value everywhere in the product,
 * because nothing else provides it - means "ask the build", which is the only
 * correct answer outside a lab.
 */
const CopyGuardContext = createContext<boolean | null>(null);

/**
 * Forces the dev-only copy guard on or off for everything inside it.
 *
 * This exists for `/components/error-state` and nothing else should mount it.
 * The guard is the *only* difference between how this component behaves in a
 * development build and a production one, so a lab that cannot switch it can
 * only demonstrate the half a developer already sees - and the half it cannot
 * reach is the half that ships to users. A real screen that wants the guard off
 * does not want this; it wants copy that names what failed.
 */
export const ErrorCopyGuardProvider = CopyGuardContext.Provider;

/** The override when a lab supplied one, the build's own flag otherwise. */
function useIsCopyGuardOn(): boolean {
	return useContext(CopyGuardContext) ?? IS_DEV_BUILD;
}

/**
 * The sentences this component exists to keep off the screen. Every one of them
 * describes the app's feelings rather than the user's situation: none says what
 * failed, none says whose fault it was, and none says what to press next.
 */
const VAGUE_PHRASES = [
	"an error occurred",
	"error occurred",
	"invalid request",
	"oops",
	"please try again later",
	"something went wrong",
	"something's wrong",
	"there was a problem",
	"try again later",
	"unable to complete",
	"unexpected error",
	"unknown error",
	"whoops",
];

/** Below this, a string cannot be naming anything specific. "Failed." is 7. */
const MIN_SPECIFIC_LENGTH = 12;

/**
 * Development-only copy review, run on every render of every error state.
 *
 * The rule this enforces is the whole reason the component was specified: an
 * error a user cannot identify, track or solve is worse than no error at all,
 * because it costs them the time to read it and gives them nothing back. A code
 * review cannot enforce it on forty call sites; a render-time check can.
 */
function findVagueCopy(copy: { detail?: string; next?: string; title?: string }): string[] {
	const problems: string[] = [];

	for (const [prop, value] of Object.entries(copy)) {
		if (!value) continue;
		const lowered = value.toLowerCase();

		const phrase = VAGUE_PHRASES.find((candidate) => lowered.includes(candidate));
		if (phrase) {
			problems.push(`\`${prop}\` contains "${phrase}" - name what failed and what to do instead.`);
		}
		if (value.trim().length < MIN_SPECIFIC_LENGTH) {
			problems.push(`\`${prop}\` is too short to identify anything: "${value}".`);
		}
	}

	return problems;
}

/**
 * Shown in place of throwing.
 *
 * Throwing would be the stronger enforcement right up until this component is
 * used as a route's error boundary, where it would fail inside the boundary
 * that was rendering it and take the app to a white screen - the one failure
 * mode an error component must never cause. A strip nobody can miss, in the
 * component's own layout, in dev only, gets the same message across without
 * cascading.
 */
function VagueCopyWarning({ problems }: { problems: string[] }) {
	return (
		// A slot rather than a data-cy: only one of these exists per error state, so
		// the parent's hook already disambiguates instances - the same reasoning as
		// [data-slot="field-error"]. It also gives a spec something to assert on
		// that is NOT the guard's copy, which is a dev-only string nobody should be
		// pinned to.
		<div
			className="mt-3 w-full rounded-xl border border-dashed border-danger/60 bg-danger/5 p-3 text-left text-xs text-danger"
			data-slot="vague-copy-warning"
		>
			<p className="font-semibold">AppErrorState: this copy is not specific enough (dev only)</p>
			<ul className="mt-1 list-disc space-y-0.5 pl-4">
				{problems.map((problem) => (
					<li key={problem}>{problem}</li>
				))}
			</ul>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Starts as `false` on both the server and the first client render - there is no
 * `navigator` during SSR, and guessing "online" is the guess that hydrates
 * cleanly. The listeners are what make the offline correction and the disabled
 * retry live rather than a snapshot taken when the error happened.
 */
function useIsOffline(): boolean {
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		function sync() {
			setIsOffline(!navigator.onLine);
		}

		sync();
		window.addEventListener("offline", sync);
		window.addEventListener("online", sync);
		return () => {
			window.removeEventListener("offline", sync);
			window.removeEventListener("online", sync);
		};
	}, []);

	return isOffline;
}
