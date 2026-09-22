/**
 * `classNames` - the one way a caller restyles a part of a component it cannot
 * reach.
 *
 * These components are prop-driven rather than composed: `AppCard` takes
 * `title`, `description` and `meta` as props, not as children, because that is
 * what makes a row of cards scan as a row instead of as five unrelated boxes.
 * The cost is that a caller has no handle on the parts. `className` reaches the
 * root and nothing else, so "make the title narrower here" had no answer short
 * of a descendant selector written from outside - which is a call site depending
 * on markup this package is free to change.
 *
 * A slot map is that handle, and it is the SECOND of three tiers. Reach for them
 * in order:
 *
 *   1. PROPS - `variant`, `tone`, `size`, `titleRole`. The axes the component has
 *      already decided. Cheap, safe, and reviewed once for everybody.
 *   2. `classNames` - width, spacing, colour, alignment on a named part.
 *   3. NODE SLOTS - a `ReactNode` prop that replaces a part outright.
 *
 * A caller who wants a different element ORDER is at tier 3 or wants a different
 * component. No arrangement of class names produces one, and a slot map that
 * tried would be a layout engine with a stylesheet's API.
 *
 * ## The rules that make this a standard rather than eleven conventions
 *
 * **Slot names are PUBLIC API.** Renaming or removing one is a major for this
 * package under the rule in the root CLAUDE.md, and every child project re-does
 * its call sites. Pick from the vocabulary in
 * `markdowns/Web/Slot API Checklist.md` before inventing a name; a part that
 * fits one of those names must use it.
 *
 * **Flat, one level deep.** When a component wraps another, expose
 * `chartTooltip`, never `classNames={{ chart: { tooltip } }}`. A nested map is a
 * second API with its own merge order, and the two compose badly.
 *
 * **Not every part gets a slot.** A part whose classes ARE the decision the
 * component exists to hold does not get one - `AppCard`'s padding, `AppAvatar`'s
 * circle, the description clamp, focus rings, 44px touch targets. That is not an
 * oversight to be fixed later; the lab's Anatomy table says so out loud.
 *
 * **Values are tokens, not literals.** `bg-brand-surface`, `text-muted` - never
 * `bg-[#7C3AED]` or `text-red-500`. A slot handed a raw colour silently opts
 * that call site out of the theme customizer, the eight palettes and dark mode.
 *
 * **`data-app-slot` goes on every element the component renders ITSELF.** It
 * costs one attribute and buys three things: a caller can reach a part from
 * outside through CSS without the component having to expose one, a lab can
 * enumerate the anatomy, and a test selects on it rather than on a class that is
 * about to change. A slot that forwards to another `App*` component's
 * `className` does NOT get one - that element already has its own identity, and
 * stamping a second name on it would make `[data-app-slot="icon"]` match a thing
 * whose own component calls it something else.
 *
 * **`data-app-slot`, NOT `data-slot`, and that is not a style preference.**
 * HeroUI v3 already stamps `data-slot` on every part it renders - `card`,
 * `card-title`, `card-header`, `card-description`, `card-footer`, `button` - and
 * it sets it AFTER spreading incoming props, so a `data-slot` passed to
 * `Card.Title` is silently dropped. It was, on the first version of this file,
 * and nothing failed: the attribute simply was not in the HTML. The prefix is
 * the same answer the `App*` component names already give to the same problem,
 * for the same stated reason - it is what makes ours identifiable in a tree full
 * of HeroUI primitives. Both attributes now sit on the same element, saying
 * different true things: theirs names the primitive, ours names the role it
 * plays in this component.
 */

import type { ClassValue } from "clsx";
import { cn } from "./cn";

/**
 * A component's slot map. Every slot optional, every value a class string.
 *
 * A string rather than a `ClassValue`: the caller's own `cn()` or template
 * literal collapses to one before it arrives, and accepting arrays here would
 * mean the type could not be serialised, diffed or stored in a config - which
 * some call sites do with these.
 */
export type SlotClasses<Slot extends string> = Partial<Record<Slot, string>>;

/**
 * The two class props every slotted component takes.
 *
 * `className` is kept ALONGSIDE `classNames` rather than replaced by it. It is
 * on ~80 components and hundreds of call sites, `cn("w-full", className)` is
 * already the documented merge, and a caller restyling only the root should not
 * have to learn a map to do it. It is an alias for `classNames.base`, and it
 * wins, because it is the more specific thing to have written.
 */
export interface SlottedProps<Slot extends string> {
	className?: string;
	classNames?: SlotClasses<Slot>;
}

/** The root slot, which every component has and which `className` also targets. */
const BASE_SLOT = "base";

/**
 * Bind a component's caller overrides once, then read each slot where it is used.
 *
 * ```tsx
 * export function AppThing({ className, classNames, title }: AppThingProps) {
 *   const slot = createSlots<AppThingSlot>(classNames, className);
 *
 *   return (
 *     <div className={slot("base", "flex gap-3")} data-slot="base">
 *       <h3 className={slot("title", "text-base font-semibold")} data-slot="title">{title}</h3>
 *     </div>
 *   );
 * }
 * ```
 *
 * Merge order is defaults → `classNames[slot]` → `className` (base only), and
 * `cn` is tailwind-merge - so a default of `text-base` and an override of
 * `text-2xl` leave ONE size class rather than two fighting ones whose winner is
 * decided by stylesheet order.
 *
 * Not a hook, and deliberately not named like one: it holds no state and calls
 * nothing, so it is usable inside a `map`, a nested render function or a
 * component that has already returned early.
 */
export function createSlots<Slot extends string>(classNames?: SlotClasses<Slot>, className?: string) {
	return (slot: Slot, ...defaults: ClassValue[]): string =>
		cn(...defaults, classNames?.[slot], slot === BASE_SLOT ? className : undefined);
}
