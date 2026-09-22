/**
 * The package's own primitives, for its components to import.
 *
 * They cannot import "@bernardsapida/web-ui" - that is the published entry and
 * would be a self-reference - and per-symbol relative paths would need rewriting
 * by hand every time something moved. One internal barrel, one relative path.
 */
export * from "./hooks/use-debounce";
export * from "./hooks/use-hold-to-confirm";
export * from "./hooks/use-is-scrolled";
export * from "./hooks/use-media-query";
export * from "./hooks/use-press-feedback";
export * from "./hooks/use-ticking-clock";
export * from "./lib/app-ui";
export * from "./lib/cn";
export * from "./lib/format-bytes";
export * from "./lib/mark-matches";
export * from "./lib/nav";
export * from "./lib/oklch";
export * from "./lib/relative-time";
export * from "./lib/slots";
