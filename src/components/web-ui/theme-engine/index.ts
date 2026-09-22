/**
 * `@bernardsapida/web-ui/theme-engine` - the brand-agnostic palette maths.
 *
 * Everything a project's `scripts/generate-palettes.ts` and the packaged
 * `<AppThemeCustomizer/>` need to turn a preset into a stylesheet: the oklch
 * arithmetic, the ramp solver, the CSS emitter, the designer-palette resolver
 * and its contrast measurement, the semantic-hue collision check, the fixed
 * option sets, and the seven built-in presets.
 *
 * No React, no project data. `theme.config.ts`, a project's own brand palettes,
 * and the generated `palettes.css` / `palettes.generated.ts` stay in the
 * project.
 */

export * from "../oklch";
export * from "./palette.build";
export * from "./palette.emit";
export * from "./designer-palette";
export * from "./pairings";
export * from "./purposes";
export * from "./options";
export * from "./presets";
export * from "./theme-config";
