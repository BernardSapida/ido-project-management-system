/**
 * Shortcut notation, written the way this machine's keyboard is labelled.
 *
 * Shared by the toolbar and the bubble menu rather than defined in each: the
 * same Bold button appears in both, and two copies of this would eventually
 * disagree about what a Mac is - at which point one surface teaches the wrong
 * key.
 *
 * Resolved once at module scope. It cannot change while the page is open, and
 * `navigator` is absent during SSR, which is what the `typeof` guard is for
 * rather than a stylistic hedge.
 */
const IS_APPLE = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform ?? "");

export const MOD = IS_APPLE ? "⌘" : "Ctrl";
export const SHIFT = IS_APPLE ? "⇧" : "Shift";
export const ALT = IS_APPLE ? "⌥" : "Alt";
