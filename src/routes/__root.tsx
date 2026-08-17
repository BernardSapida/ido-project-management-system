import { AppNotFound, AppToaster, AppUIProvider } from "@bernardsapida/web-ui";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { AppFloatingThemeToggle } from "@/components/project";
import type { TRPCRouter } from "@/integrations/trpc/router";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var storage = window.localStorage.getItem('app-ui-storage');
    var mode = 'auto';
    if (storage) {
      var parsed = JSON.parse(storage);
      if (parsed && parsed.state && parsed.state.themeMode) {
        mode = parsed.state.themeMode;
      }
    }
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

import { AppRouteProgress } from "@bernardsapida/web-ui/route-progress";
import { APP_NAME, seo } from "@/config/seo.config";
import { lockedScheme, themeAttributes } from "@/config/theme.config";

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: seo.name,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: AppNotFound,
});

// The query/tRPC providers are mounted by the router's `Wrap` (see router.tsx),
// which sits outside this shell - not here.
function RootDocument({ children }: { children: React.ReactNode }) {
	// A locked project has no light/dark decision left at runtime: the attributes
	// come from themeAttributes() in the markup and the script below is not rendered
	// at all. Markup does not need JavaScript to have run, so the locked scheme is
	// correct even in the frame before hydration.
	const locked = lockedScheme();

	return (
		/* The PALETTE, the font and the two radius scales are build-time constants
		   from theme.config.ts, so they are rendered straight onto <html> - no
		   script, no flash, nothing for the store to rehydrate. Only light/dark
		   needs the script, because only light/dark is a reader's choice that lives
		   in localStorage. */
		<html
			lang="en"
			suppressHydrationWarning
			{...themeAttributes()}
		>
			<head>
				{/* Tells the BROWSER which scheme to paint its own surfaces in - form
				    controls, scrollbars. Without it a locked dark app still gets light
				    scrollbars on a machine set to light. */}
				{locked ? (
					<meta
						content={locked}
						name="color-scheme"
					/>
				) : null}
				{locked ? null : <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />}
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/20">
				<AppUIProvider appName={APP_NAME}>
					<AppToaster />
					<AppRouteProgress />
					{/* Dev builds only - it renders nothing in production. */}
					<AppFloatingThemeToggle />
					{children}
					<TanStackDevtools
						config={{
							// Bottom-left, or the devtools bubble sits on top of the
							// toast region and covers its close button.
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
					<Scripts />
				</AppUIProvider>
			</body>
		</html>
	);
}
