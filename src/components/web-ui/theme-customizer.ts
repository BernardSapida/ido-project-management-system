/**
 * `@bernardsapida/web-ui/theme-customizer` - the interactive palette + theme
 * editor as a component.
 *
 * Its own entry so a project can tree-shake the designer maths and preview
 * board out of a production bundle: mount `<AppThemeCustomizer/>` on a dev-only
 * route and it never reaches the client build. `zustand` is bundled here, not
 * pulled from the consumer.
 */
export * from "./components/AppThemeCustomizer";
