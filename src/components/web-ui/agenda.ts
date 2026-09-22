/**
 * `@bernardsapida/web-ui/agenda` - AppAgenda and its Day/Week/Month views, side
 * panel, entry form and recurrence helpers.
 *
 * Its own entry so `rrule` stays an OPTIONAL peer dependency: a child that never
 * renders the scheduler never installs it. Mirrors the `rich-text` and
 * `route-progress` split.
 */
export * from "./components/AppAgenda";
