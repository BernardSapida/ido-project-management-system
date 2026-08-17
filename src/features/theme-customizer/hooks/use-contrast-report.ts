/**
 * Measure the pairings off the LIVE document.
 *
 * The one thing this must not do is compute from the draft. A report generated
 * from the same numbers that produced the palette agrees with itself by
 * construction, and would keep agreeing after the stylesheet stopped matching
 * the generator. So the tokens are read back out of the painted document
 * through a probe - see painted-token.ts for how, and for the gamut hole that
 * closes.
 */

import { useCallback, useEffect, useState } from "react";
import { type MeasuredPairing, measurePairings } from "@/config/theme/pairings";
import { createProbe, readPaintedToken } from "../painted-token";

/**
 * `signal` is anything that should force a re-read - the draft, the theme. The
 * measurement is not derived from it, only re-run when it changes.
 */
export function useContrastReport(signal: unknown): MeasuredPairing[] {
	const [rows, setRows] = useState<MeasuredPairing[]>([]);

	const measure = useCallback(() => {
		const probe = createProbe();
		try {
			setRows(measurePairings((token) => readPaintedToken(probe, token)));
		} finally {
			probe.remove();
		}
	}, []);

	useEffect(() => {
		// A frame late, on purpose. The preview hook writes its custom properties
		// in its own effect, and effects run in mount order - measuring in this one
		// would read the document as it was before the draft landed on it, so the
		// report would trail the preview by one interaction.
		const frame = requestAnimationFrame(measure);
		return () => cancelAnimationFrame(frame);
	}, [measure, signal]);

	return rows;
}
