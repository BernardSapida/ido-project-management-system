import { createContext, type ReactNode, useContext, useMemo } from "react";

/**
 * The handful of app-level facts a presentational component cannot be handed as a
 * prop without dragging six other components into the argument.
 *
 * `appName` is the case that forced this. Three components put the product's name
 * in their copy - the logo's wordmark, the error states, the not-found page - and
 * seven of the logo's eleven call sites are OTHER components (the header, the
 * sidebar, the mobile bar, the drawer, the site header, the auth shell). Threading
 * a string through all of them is worse code than reading it from one place, which
 * is why this exists and why it stays small.
 *
 * It is NOT a general config bag. Anything a single component can take as a prop
 * takes it as a prop; the bar for adding a key here is that passing it would
 * cascade through components that have no other reason to know about it.
 */
export interface AppUIConfig {
	/** The product's name, as a reader sees it. */
	appName: string;
}

/**
 * A neutral default rather than a thrown error.
 *
 * A component library that crashes when a provider is missing punishes the person
 * rendering one component in isolation - a lab page, a test, a story. "App" is
 * obviously a placeholder, so a missing provider is visible without being fatal.
 */
const DEFAULT_CONFIG: AppUIConfig = { appName: "App" };

const AppUIContext = createContext<AppUIConfig>(DEFAULT_CONFIG);

export function AppUIProvider({ appName, children }: { appName: string; children: ReactNode }) {
	// Memoised on the value, not the object: an inline `{ appName }` would be a new
	// identity every render and re-render every consumer of the context.
	const value = useMemo<AppUIConfig>(() => ({ appName }), [appName]);

	return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI(): AppUIConfig {
	return useContext(AppUIContext);
}
