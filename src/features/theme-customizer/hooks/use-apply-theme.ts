/**
 * Run the generator through the dev-only endpoint, and report what it said.
 *
 * Shared by the two places a theme can be committed from - the Apply button in
 * the palette popover and the Save panel beside the report - because they are
 * one operation reached from two places, not two operations. The first version
 * of the save panel built its command twice "so the two could not drift", and
 * they drifted inside one function; two components would not have stood a
 * chance.
 *
 * The endpoint is `vite-plugin-apply-theme.ts`, which exists in the dev server
 * only. `unavailable` is therefore a meaningful state rather than a network
 * blip: it means this page is running from a production build, where committing
 * a theme is not a thing that can happen.
 */

import { AppToast } from "@bernardsapida/web-ui";
import { Check, TriangleAlert } from "lucide-react";
import { useState } from "react";

export type ApplyState = "applied" | "error" | "idle" | "running";

interface ApplyResponse {
	error?: string;
	ok: boolean;
	output: string;
}

export function useApplyTheme() {
	const [state, setState] = useState<ApplyState>("idle");
	const [detail, setDetail] = useState("");

	/** Returns whether it succeeded, so a caller can react without reading state. */
	const apply = async (flags: Record<string, string> | null): Promise<boolean> => {
		if (!flags) return false;

		setState("running");
		setDetail("");

		try {
			const response = await fetch("/__apply-theme", {
				body: JSON.stringify(flags),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const result = (await response.json()) as ApplyResponse;

			if (!result.ok) {
				setState("error");
				// The generator's own words. It knows which pairing failed and this
				// hook does not, so paraphrasing could only lose information.
				const failure = result.output || result.error || "The generator refused this palette.";
				setDetail(failure);
				AppToast.error("The palette was not written", {
					/*
					 * The LAST line of the generator's output, not the first. It prints a
					 * table of every palette it measured and then the verdict, so the head
					 * of that is "netflix light below-bar(...)" - true, unrelated to this
					 * failure, and the wrong thing to read in a toast. The full text stays
					 * in the panel for anybody who wants the table.
					 */
					description: failure.trim().split("\n").at(-1) ?? failure,
					icon: TriangleAlert,
				});
				return false;
			}

			setState("applied");
			setDetail(result.output);
			/*
			 * Fired even though the page is about to full-reload, and the order is
			 * what makes it work: the reload is pushed over the HMR socket by the
			 * plugin and lands a beat later, so the toast is seen. It matters most in
			 * the case where nothing visibly changes - re-applying the palette that
			 * is already committed - where a silent reload is indistinguishable from
			 * a button that did nothing.
			 */
			AppToast.success("Palette applied", {
				description: "theme.config.ts is written and every open tab is reloading.",
				icon: Check,
			});
			return true;
		} catch {
			setState("error");
			const offline = "No dev server to apply through. This works when the app is running via `pnpm start:web`.";
			setDetail(offline);
			AppToast.error("Nothing to save through", { description: offline, icon: TriangleAlert });
			return false;
		}
	};

	return { apply, detail, state };
}
