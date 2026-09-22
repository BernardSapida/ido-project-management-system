/**
 * The hexes a set of tokens is CURRENTLY painted as.
 *
 * For the swatches in the control bar, which have to agree with the page or
 * they are worse than nothing: a dot showing one colour beside a card showing
 * another teaches the reader to distrust the control. That is exactly what they
 * did while they read from the preset record - drag the hue off a preset and
 * the page repaints from a palette generated in the browser while the preset
 * record stays where it was.
 */

import { useEffect, useState } from "react";
import { createProbe, readPaintedHex } from "../painted-token";

export function usePaintedTokens(tokens: readonly string[], signal: unknown): Record<string, string> {
	const [hexes, setHexes] = useState<Record<string, string>>({});
	const key = tokens.join("|");

	useEffect(() => {
		// A frame late, for the same reason the report is: the preview hook writes
		// the custom properties in its own effect, and effects run in mount order.
		const frame = requestAnimationFrame(() => {
			const probe = createProbe();
			try {
				const next: Record<string, string> = {};
				for (const token of key.split("|")) {
					const hex = readPaintedHex(probe, token);
					if (hex) next[token] = hex;
				}
				setHexes(next);
			} finally {
				probe.remove();
			}
		});

		return () => cancelAnimationFrame(frame);
	}, [key, signal]);

	return hexes;
}
