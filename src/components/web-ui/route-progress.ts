/**
 * `@bernardsapida/web-ui/route-progress` - AppRouteProgress and nothing else.
 *
 * Split out for the same reason as rich-text: `nprogress` is an optional peer,
 * so it must not be reachable from the main barrel.
 */
export * from "./components/AppRouteProgress";
