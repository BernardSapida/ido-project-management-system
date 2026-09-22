import { useDebounce } from "../../internal";
import { Kbd, SearchField } from "@heroui/react";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

interface AppSearchFieldProps {
	value: string;
	onValueChange: (value: string) => void;
	debounceMs?: number;
	placeholder?: string;
	isDisabled?: boolean;
	className?: string;
	"data-cy"?: string;
	/** The caller's handle on the input, for focusing it from a keyboard shortcut. */
	inputRef?: RefObject<HTMLInputElement | null>;
	/**
	 * Accessible name. Defaults to the placeholder, which is normally the better
	 * copy anyway - callers write "Search customers by name, phone or service level"
	 * there. Pass this only when the placeholder is too generic to name the field.
	 */
	label?: string;
	/**
	 * The key that focuses this field from elsewhere on the page - "/", "⌘K". It
	 * is drawn as a `kbd` inside the empty field and disappears the moment there
	 * is a value, because from then on the clear button owns that corner.
	 *
	 * Only pass it if the caller actually binds the key. A hint for a shortcut
	 * that does nothing is worse than no hint: the user presses it, a slash lands
	 * in whatever they were typing, and they stop trusting the rest of the chrome.
	 */
	shortcutHint?: string;
}

export function AppSearchField({
	value,
	onValueChange,
	debounceMs = 300,
	placeholder = "Search...",
	isDisabled,
	className,
	"data-cy": dataCy,
	inputRef,
	label,
	shortcutHint,
}: AppSearchFieldProps) {
	const [internalValue, setInternalValue] = useState(value);
	const debouncedValue = useDebounce(internalValue, debounceMs);

	/*
	 * The last value the caller has been told about - NOT "have I rendered
	 * before".
	 *
	 * A `useRef(true)` first-render flag looks like it does the same job and does
	 * not: a ref belongs to the fiber, and React re-runs a subtree's effects
	 * without remounting it whenever it reconnects one it had hidden. The flag is
	 * already false by then, so the effect below fires `onValueChange` with a
	 * value nobody typed.
	 *
	 * That is not cosmetic where the callback navigates. TanStack Router hides the
	 * outgoing route to start a navigation, so a page that puts its search term in
	 * the URL got a spurious `onValueChange` mid-flight, navigated back to itself,
	 * and replaced the navigation the user had just started - a button that did
	 * nothing, with nothing in the console but a `from:` warning.
	 *
	 * Comparing values instead of counting renders is correct however many times
	 * the effect runs.
	 */
	const lastEmitted = useRef(value);

	useEffect(() => {
		if (debouncedValue === lastEmitted.current) return;
		lastEmitted.current = debouncedValue;
		onValueChange(debouncedValue);
	}, [debouncedValue]);

	useEffect(() => {
		if (value !== internalValue) setInternalValue(value);
		// A value pushed in from outside is already known to the caller - it came
		// from them. Recording it here stops the debounce echoing it straight back.
		lastEmitted.current = value;
	}, [value]);

	const handleClear = () => {
		setInternalValue("");
		// Told now rather than in 300ms - clearing is a decision, not typing. The
		// record keeps the debounce from repeating it once it catches up.
		lastEmitted.current = "";
		onValueChange("");
	};

	/*
	 * This field is deliberately label-less on screen - the magnifier and the
	 * placeholder carry it - so it needs an `aria-label` or React Aria warns, and
	 * re-warns on every render because the warning is emitted during render rather
	 * than on mount. A placeholder is not an accessible name: it vanishes the
	 * moment the user types, taking the field's identity with it.
	 */
	const accessibleName = label ?? placeholder.replace(/(\.{3}|…)$/, "");

	return (
		<SearchField
			aria-label={accessibleName}
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			onChange={setInternalValue}
			onClear={handleClear}
			value={internalValue}
		>
			<SearchField.Group>
				<SearchField.SearchIcon />
				<SearchField.Input
					/*
					 * `min-w-0` is load-bearing, not tidying.
					 *
					 * The theme makes this input `flex-1` inside a group that is
					 * `overflow-hidden`, but leaves it at the flex default
					 * `min-width: auto` - so it will not shrink below an <input>'s
					 * intrinsic width (~215px at this font). In a narrow container the
					 * three children stop fitting (28px icon + 215px input + 28px clear
					 * = 271px in a 226px group) and the clear button is pushed past the
					 * right edge, where the group clips it. Measured in the labs sidebar:
					 * the button was at x=285 in a group ending at x=267, painted at
					 * opacity 1 and invisible.
					 *
					 * Wide callers never saw it, which is why it looked like the field
					 * simply had no clear button rather than a broken one.
					 */
					className="min-w-0"
					placeholder={placeholder}
					ref={inputRef}
				/>
				{shortcutHint && !internalValue ? (
					// The same Kbd the dropdown draws its shortcuts with, so a key looks
					// like a key everywhere in the app rather than like whatever the
					// nearest component decided.
					//
					// aria-hidden: the field is already named, and a screen reader user
					// reaching this field has arrived by a path that does not need the
					// mouse-free shortcut spelled out mid-label.
					<Kbd
						aria-hidden="true"
						className="pointer-events-none me-1 hidden shrink-0 sm:flex"
						variant="light"
					>
						<Kbd.Content>{shortcutHint}</Kbd.Content>
					</Kbd>
				) : null}
				{/*
				 * ALWAYS mounted, never conditional. The theme sizes the input off this
				 * button's PRESENCE, not its visibility:
				 *
				 *   .search-field__group:has([slot="clear"]) .search-field__input
				 *     { padding-inline-end: 8px; border-start-end-radius: 0 }
				 *
				 * so rendering it only when there is a value makes that `:has()` flip on
				 * every clear and the field re-lays-out underneath the cursor. HeroUI
				 * hides it with `[data-empty="true"] { opacity: 0; pointer-events: none }`
				 * for exactly this reason - the geometry has to stand still. Tried the
				 * conditional version; this is what it broke.
				 *
				 * `aria-label` because `CloseButton` hardcodes "Close", which beats the
				 * "Clear search" React Aria supplies through context. It closes nothing -
				 * it empties a field.
				 */}
				<SearchField.ClearButton aria-label="Clear search" />
			</SearchField.Group>
		</SearchField>
	);
}
