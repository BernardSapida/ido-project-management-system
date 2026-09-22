/**
 * Which theme is PAINTED right now - not which mode the store holds.
 *
 * The store's `themeMode` can be "auto", which is not a theme and cannot be
 * used to pick a set of colours. What is on screen is whatever __root.tsx or
 * the store last stamped on `<html>`, so that is what this reads, and it
 * watches for the attribute changing rather than re-deriving from the
 * preference - the toggle writes the attribute, and a system-level scheme
 * change writes it too.
 *
 * Starts on "light" during SSR and the first client render, matching the
 * document before the pre-paint script has been accounted for. The effect
 * corrects it immediately; anything colour-critical must not render on the
 * first frame's value alone.
 */

import { useEffect, useState } from "react";

export type ResolvedTheme = "dark" | "light";

function readTheme(): ResolvedTheme {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useResolvedTheme(): ResolvedTheme {
	const [theme, setTheme] = useState<ResolvedTheme>("light");

	useEffect(() => {
		setTheme(readTheme());

		const observer = new MutationObserver(() => setTheme(readTheme()));
		observer.observe(document.documentElement, { attributeFilter: ["class"] });

		return () => observer.disconnect();
	}, []);

	return theme;
}
