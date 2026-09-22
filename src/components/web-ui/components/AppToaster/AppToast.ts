import { toast as heroToast } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { createElement } from "react";

/**
 * A title, a description and an icon - all three, every time.
 *
 * The type is the enforcement. A bare `toast.success("Saved")` renders a title
 * floating next to a generic variant glyph, which is the shape the toast body
 * looks worst in and the shape a user learns nothing from: the title says what
 * happened, the description says what it means for them, and the icon is what
 * makes it recognisable before either is read.
 *
 * Import this rather than `toast` from @heroui/react, which is lint-banned
 * everywhere except this file. Every shape the app can queue - including the
 * loading and promise toasts that used to be the exception - goes through here
 * and takes all three, so there is no call site left where two of them are
 * optional. Queue control (`clear`, `pauseAll`, …) is re-exported below so that
 * ban costs nothing.
 */
export interface AppToastOptions {
	/**
	 * Rendered as the pill button. Omit it and the toast is informational only.
	 *
	 * Pressing it closes the toast - see `toHeroOptions`. The handler still owns
	 * the confirmation: closing says the press was received, and only the call
	 * site knows whether the work behind it succeeded.
	 */
	action?: {
		label: string;
		onPress: () => void;
	};
	/** What the title means for this user, or what to do next. One sentence. */
	description: string;
	/** Any lucide icon. Prefer the one for the thing, not the one for the status. */
	icon: LucideIcon;
}

/** The same three, as a value - what a promise's phases resolve to. */
export interface AppToastMessage {
	description: string;
	icon: LucideIcon;
	title: string;
}

/** A phase that only knows what to say once the promise has settled. */
type AppToastPhase<T> = AppToastMessage | ((value: T) => AppToastMessage);

export interface AppToastPromiseOptions<T> {
	error: AppToastPhase<unknown>;
	loading: AppToastMessage;
	success: AppToastPhase<T>;
}

/**
 * The server's own message when it gave one, and a usable sentence when it did
 * not. `error.message` is optional and the description is not, so every failure
 * path needs this - `undefined` is not a sentence, and "An error occurred" is
 * barely one.
 */
export function reason(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * One timer per severity. An error read at the same speed as a "saved"
 * confirmation is an error nobody read, so errors hold until dismissed - which
 * is only safe because AppToaster keeps the close button visible - and warnings
 * get long enough to act on. Success and info take HeroUI's 4s.
 */
const WARNING_TIMEOUT_MS = 7000;
const ERROR_HOLDS_UNTIL_DISMISSED = 0;
const LOADING_HOLDS_UNTIL_CLOSED = 0;

/**
 * THE ACTION CLOSES ITS OWN TOAST, before the handler runs.
 *
 * A toast action is a one-shot. The moment "Undo" is pressed, "Removed
 * report.csv - it is no longer attached to this form" is no longer true, and
 * leaving it on screen asks the user to dismiss a sentence about something they
 * have just reversed - or worse, to press Undo again. Closing first also frees
 * the queue slot, so the confirmation the handler queues takes this toast's
 * place instead of stacking under it.
 *
 * It belongs here rather than at the call sites: `onPress` cannot reach the key
 * of the toast it is being queued into, so no call site can do this for itself.
 * Both of the labs that had an action were already reaching for
 * `AppToast.clear()` to fake it, which took the rest of the queue with it.
 */
function toHeroOptions(options: AppToastOptions, dismiss: () => void) {
	const action = options.action;

	return {
		description: options.description,
		indicator: createElement(options.icon),
		...(action
			? {
					actionProps: {
						children: action.label,
						onPress: () => {
							dismiss();
							action.onPress();
						},
					},
				}
			: null),
	};
}

type HeroToastOptions = NonNullable<Parameters<typeof heroToast.warning>[1]>;

/**
 * Queue one toast and hand back its key.
 *
 * The key is what `dismiss` closes, and it does not exist until the toast has
 * been queued - hence the mutable binding the closure reads at press time
 * rather than at queue time.
 *
 * Only `loading` passes the key on to its caller. The others stay `void`
 * deliberately: `onPress={() => AppToast.success(…)}` is the shape most call
 * sites are written in, and a handler typed `() => void | Promise<void>`
 * rejects a returned string - so publishing the key would cost every one of
 * them a brace pair to buy something none of them asked for.
 */
function queue(
	emit: (title: string, options: HeroToastOptions) => string,
	title: string,
	options: AppToastOptions,
	overrides?: HeroToastOptions,
): string {
	let key = "";

	key = emit(title, {
		...toHeroOptions(options, () => heroToast.close(key)),
		...overrides,
	});

	return key;
}

function resolvePhase<T>(phase: AppToastPhase<T>, value: T): AppToastMessage {
	return typeof phase === "function" ? phase(value) : phase;
}

/** No severity - the slate rail. For "it happened" with nothing at stake. */
function neutral(title: string, options: AppToastOptions) {
	queue(heroToast, title, options);
}

function success(title: string, options: AppToastOptions) {
	queue(heroToast.success, title, options);
}

function error(title: string, options: AppToastOptions) {
	queue(heroToast.danger, title, options, { timeout: ERROR_HOLDS_UNTIL_DISMISSED });
}

function info(title: string, options: AppToastOptions) {
	queue(heroToast.info, title, options);
}

function warning(title: string, options: AppToastOptions) {
	queue(heroToast.warning, title, options, { timeout: WARNING_TIMEOUT_MS });
}

/**
 * A toast that holds until you close it with the returned key. It takes an icon
 * like every other toast: AppToaster spins a ring around it rather than swapping
 * it for a bare spinner, so the icon still says *what* is in flight.
 *
 * Prefer `promise` - it closes the toast for you on both paths. Reach for this
 * only when the work is not a single promise (a stream, a poll, a socket).
 */
function loading(title: string, options: Omit<AppToastOptions, "action">): string {
	return queue(heroToast, title, options, { isLoading: true, timeout: LOADING_HOLDS_UNTIL_CLOSED });
}

/**
 * Loading → success or error, on one queue slot.
 *
 * HeroUI's own `toast.promise` takes a bare string per phase and has no room for
 * a description or an icon, which is exactly the shape this module exists to
 * prevent - so this drives the queue directly instead. The promise is returned
 * unchanged and still rejects, so the caller's own error handling is unaffected.
 */
function promise<T>(input: Promise<T> | (() => Promise<T>), options: AppToastPromiseOptions<T>): Promise<T> {
	const { description, icon, title } = options.loading;
	const key = loading(title, { description, icon });

	// A thunk that throws synchronously never reaches `.then`, and the loading
	// toast holds until closed - so without this it would sit there forever.
	let settled: Promise<T>;
	try {
		settled = typeof input === "function" ? input() : input;
	} catch (cause) {
		heroToast.close(key);
		const phase = resolvePhase(options.error, cause);
		error(phase.title, { description: phase.description, icon: phase.icon });
		return Promise.reject(cause);
	}

	return settled.then(
		(value) => {
			heroToast.close(key);
			const phase = resolvePhase(options.success, value);
			success(phase.title, { description: phase.description, icon: phase.icon });
			return value;
		},
		(cause: unknown) => {
			heroToast.close(key);
			const phase = resolvePhase(options.error, cause);
			error(phase.title, { description: phase.description, icon: phase.icon });
			throw cause;
		},
	);
}

/**
 * Queue control, re-exported so `@heroui/react`'s `toast` never has to be
 * imported for it. These move toasts that already exist; they cannot create one
 * without a description, so they carry no risk.
 */
const clear = () => heroToast.clear();
const close = (key: string) => heroToast.close(key);
const pauseAll = () => heroToast.pauseAll();
const resumeAll = () => heroToast.resumeAll();

export const AppToast = {
	clear,
	close,
	error,
	info,
	loading,
	neutral,
	pauseAll,
	promise,
	resumeAll,
	success,
	warning,
};
