import { Alert, CloseButton } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

type AlertStatus = "default" | "accent" | "success" | "warning" | "danger";

interface AppAlertAction {
	label: string;
	onPress: () => void;
}

/**
 * `icon`, `title` and `description` are all required, and that is the point of
 * this wrapper existing over HeroUI's Alert - which makes all three optional.
 * A banner with no title is a wall of prose the eye slides off; one with no
 * description is a headline with no instruction; one with no icon states its
 * severity in colour alone, which is nothing at all to a colour-blind reader.
 * If there is genuinely only one sentence to say, it goes in `title` and the
 * `description` says what to do about it.
 */
interface AppAlertProps {
	/** The thing the banner is asking for. Wears the status gradient. */
	action?: AppAlertAction;
	className?: string;
	/** Test hook on the banner. Its buttons derive `-action`, `-secondary`, `-close`. */
	"data-cy"?: string;
	description: ReactNode;
	/** Accessible name for the close button. */
	dismissLabel?: string;
	/** The glyph inside the gradient tile. */
	icon: LucideIcon;
	onClose?: () => void;
	/** The way out - dismiss for now, read more. Never a second primary. */
	secondaryAction?: AppAlertAction;
	status?: AlertStatus;
	title: string;
}

/**
 * The in-page banner: a gradient status tile, a title, a description, and up to
 * two actions under them.
 *
 * Use this for a condition that persists on the page - a degraded service, an
 * unverified account, a reminder about a booking already held. Anything
 * transient is a toast instead (see AppToast); anything that must be answered
 * before the user can continue is a modal.
 *
 * A banner shares the screen with whatever the user actually came to do, for as
 * long as the condition lasts, so the surface itself stays quiet: a 4%->9% wash
 * of the status hue and a hairline edge. Full strength is spent on the two
 * elements that can hold it without shouting - the icon tile, at
 * AppGradientIconTile's recipe in the status hue, and the primary action, which
 * wears the status as a solid fill. See the `.banner` block in styles.css;
 * nothing here branches on status, every colour arrives through the `.alert--*`
 * class HeroUI already emits.
 *
 * Status is signalled by the tile's colour *and* its glyph, never colour alone
 * - the wash behind the text is deliberately too pale to be relied on, and no
 * tint at all is legible to a colour-blind user.
 *
 * A banner that only appears once something has gone wrong has to announce
 * itself, so the root carries a live region: `alert` for danger, which
 * interrupts the screen reader, and the polite `status` for the rest, which
 * waits for a pause. HeroUI's Alert renders a bare div, so this is the only
 * place that role gets set.
 */
export function AppAlert({
	action,
	className,
	"data-cy": dataCy,
	description,
	dismissLabel = "Dismiss",
	icon: Icon,
	onClose,
	secondaryAction,
	status = "default",
	title,
}: AppAlertProps) {
	const isUrgent = status === "danger";

	return (
		<Alert
			aria-live={isUrgent ? "assertive" : "polite"}
			className={cn("banner", className)}
			data-cy={dataCy}
			/* The severity as data. HeroUI already puts it in `alert--danger` and
			   friends, but a spec asserting on that is asserting on styling. */
			data-status={status}
			role={isUrgent ? "alert" : "status"}
			status={status}
		>
			<Alert.Indicator>
				<Icon />
			</Alert.Indicator>

			<Alert.Content className="min-w-0 flex-1">
				<Alert.Title className="font-semibold">{title}</Alert.Title>
				<Alert.Description className="leading-relaxed">{description}</Alert.Description>

				{/*
				 * Actions sit under the text rather than out at the end of the row:
				 * a banner's description is the reason for the button, and on a
				 * phone an end-aligned button is either squeezed or wrapped anyway.
				 * They wrap as a pair, so a long label costs a line, not the layout.
				 */}
				{(action || secondaryAction) && (
					<div className="mt-3 flex flex-wrap items-center gap-2">
						{/* THE BANNER'S OWN STATUS, not the brand: a danger banner's action
						    is a destructive one, and painting it brand made the button that
						    most needed a second look the friendliest thing in the strip.

						    The fill is the semantic pair rather than `--banner-rail`, which
						    is a distinction the `.banner .banner-action` block in styles.css
						    explains at length and is worth not undoing - a rail is solved
						    for a glyph at 3:1 and puts a label under the AA floor. Nothing
						    here branches on status; the class reads the token the
						    `.alert--*` class already set. */}
						{action && (
							<AppButton
								className="banner-action h-8 rounded-full px-4 text-sm font-semibold shadow-none hover:opacity-90"
								data-cy={dataCy ? `${dataCy}-action` : undefined}
								onPress={action.onPress}
								size="sm"
							>
								{action.label}
							</AppButton>
						)}
						{secondaryAction && (
							<AppButton
								className="h-8 rounded-full px-3 text-sm font-medium"
								data-cy={dataCy ? `${dataCy}-secondary` : undefined}
								onPress={secondaryAction.onPress}
								size="sm"
								variant="ghost"
							>
								{secondaryAction.label}
							</AppButton>
						)}
					</div>
				)}
			</Alert.Content>

			{onClose && (
				<CloseButton
					aria-label={dismissLabel}
					className="shrink-0"
					data-cy={dataCy ? `${dataCy}-close` : undefined}
					onPress={onClose}
				/>
			)}
		</Alert>
	);
}
