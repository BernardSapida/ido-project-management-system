import { useAppUI } from "../../internal";
import { Link } from "@tanstack/react-router";
import { cn } from "../../lib/cn";

/* Exported so the components that HOLD a logo - the sidebar, the drawer - can
   take the same values as props and pass them through, rather than each one
   inventing its own vocabulary for "this brand is a wide image, not an icon". */
export type LogoSize = "lg" | "md" | "sm";
type LogoTone = "gradient" | "onGradient";
export type LogoMark = "lockup" | "square";

const MARK: Record<LogoSize, string> = {
	lg: "h-12 w-12",
	md: "h-10 w-10",
	sm: "h-8 w-8",
};

/**
 * A lockup is sized by HEIGHT, with the width left to the image.
 *
 * `MARK` is square at every size, which is correct for an icon and wrong for
 * every logo that already contains its own name: `object-contain` fits a 256×76
 * lockup into a 40×40 box by painting it at 40×12, so a brand supplied as a
 * horizontal image arrives as an unreadable postage stamp with the component's
 * own wordmark spelling the name out beside it. That is not a sizing preference,
 * it is the difference between the image being legible and not.
 *
 * The heights run one step under `MARK`'s, because a lockup at the same height
 * reads considerably bigger - it is carrying three or four times the width. And
 * `max-w-full` matters as much as the height: the header's brand cell is
 * `min-w-0 overflow-hidden`, so on a phone the lockup has to be allowed to
 * shrink rather than push the actions off the bar.
 */
const LOCKUP: Record<LogoSize, string> = {
	lg: "h-10 w-auto max-w-full",
	md: "h-8 w-auto max-w-full",
	sm: "h-7 w-auto max-w-full",
};

const WORDMARK: Record<LogoSize, string> = {
	lg: "text-2xl",
	md: "text-xl",
	sm: "text-lg",
};

interface AppLogoProps {
	className?: string;
	"data-cy"?: string;
	/** Omit to render as a plain block rather than a link. */
	href?: string;
	/**
	 * What the image IS, which decides how it is sized.
	 *
	 * `square` is an icon - a fixed square box, with the product's name rendered
	 * beside it as text. `lockup` is an image that already contains the name, so
	 * it is sized by height with the width left to its aspect ratio, and the text
	 * wordmark is suppressed: rendering both spells the name twice.
	 *
	 * That suppression is why this is a separate prop from `wordmark` rather than
	 * a third value on it. `wordmark={false}` means "there is no room for the
	 * name" - the collapsed sidebar rail - and it keeps the SQUARE mark, which the
	 * 72px rail depends on. `lockup` means "the name is already in the image", and
	 * the two combine: a lockup can still be laid out at any size.
	 */
	mark?: LogoMark;
	roleLabel?: string;
	size?: LogoSize;
	/**
	 * The image. Defaults to the conventional path every project from this
	 * template ships.
	 *
	 * It exists for the DARK-BAR case and effectively only for that. A component
	 * can re-colour text it renders, and can do nothing at all about the pixels in
	 * a PNG - so a brand whose lockup is dark ink on transparent needs a second,
	 * light asset before it can sit on `AppSiteHeader`'s brand tone, and there is
	 * no styling answer to substitute for it. Anything else that varies per call
	 * site belongs in a prop; this one is here because the alternative is an
	 * invisible logo.
	 */
	src?: string;
	/** `onGradient` switches the wordmark to white for use on top of the hero gradient. */
	tone?: LogoTone;
	/**
	 * Off leaves the mark alone, for the collapsed sidebar rail - 72px of width
	 * either truncates the word or forces the rail wider than its own targets.
	 * The accessible name moves onto the link so the mark is never nameless.
	 *
	 * Ignored when `mark="lockup"`, which suppresses the text wordmark anyway.
	 */
	wordmark?: boolean;
}

export function AppLogo({
	className,
	"data-cy": dataCy,
	href,
	mark = "square",
	roleLabel,
	size = "md",
	src = "/images/logo.png",
	tone = "gradient",
	wordmark = true,
}: AppLogoProps) {
	const { appName } = useAppUI();
	const onGradient = tone === "onGradient";
	/* The lockup IS the name, so the text beside it would be the second copy. */
	const isLockup = mark === "lockup";
	const showWordmark = wordmark && !isLockup;

	const content = (
		<>
			<img
				alt=""
				aria-hidden="true"
				/* `shrink-0` only on the square mark. A lockup is the widest thing in
				   the brand cell and the one element that CAN give way there, so pinning
				   it would put it through the actions on a phone instead. */
				className={cn("object-contain", isLockup ? LOCKUP[size] : cn("shrink-0", MARK[size]))}
				src={src}
			/>
			{showWordmark ? null : <span className="sr-only">{`${appName} home`}</span>}
			{/* min-w-0 + truncate, because the sidebar header now shares its row with
			    the collapse toggle: a long app name would otherwise push the button
			    off the 260px column rather than clipping its own last letter. */}
			<div className={cn("min-w-0 leading-none", showWordmark ? "" : "hidden")}>
				<div className={cn("truncate font-bold", WORDMARK[size], onGradient ? null : "text-gradient")}>{appName}</div>
				{roleLabel ? (
					<div
						/* Full opacity on a brand surface, differentiated by size, case and
						   tracking instead. An opacity modifier costs more than it looks:
						   /70 and /80 over the brand fill measured 4.53:1 and 5.41:1 - AA,
						   but off the AAA bar every other pairing on that surface holds. */
						className={cn("mt-0.5 text-[10px] uppercase tracking-wider", onGradient ? null : "text-muted-foreground")}
					>
						{roleLabel}
					</div>
				) : null}
			</div>
		</>
	);

	if (href) {
		return (
			<Link
				className={cn("flex items-center gap-2", className)}
				data-cy={dataCy}
				data-mark={mark}
				/* The EFFECTIVE value, not the prop. A lockup suppresses the wordmark,
				   and a hook reading `data-wordmark="true"` off one would be told the
				   opposite of what is on the screen. */
				data-wordmark={showWordmark}
				to={href}
			>
				{content}
			</Link>
		);
	}

	return (
		<div
			className={cn("flex items-center gap-2", className)}
			data-cy={dataCy}
			data-mark={mark}
			data-wordmark={showWordmark}
		>
			{content}
		</div>
	);
}
