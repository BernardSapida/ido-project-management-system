/**
 * Paint the draft onto the live document, and put it back on the way out.
 *
 * The customizer previews by mutating `<html>` rather than by rendering a
 * sandboxed copy of the app, because the thing being previewed IS the token
 * layer: a scoped preview would have to duplicate every `:root` declaration to
 * a wrapper and would then be testing the duplicate. Mutating the real document
 * means the preview goes through exactly the cascade the app does, including
 * HeroUI's own components, which never look at anything but the document root.
 *
 * The price is that leaving the page has to undo it, exactly, or a developer
 * carries a preview into the rest of the app and starts filing bugs about it.
 * The cleanup below restores what was there rather than what it assumes was
 * there - the attributes are set from theme.config.ts, but nothing says a
 * future slice will not add another writer.
 */

import { useEffect } from "react";
import { RADIUS_OPTIONS } from "@/config/theme/options";
import { draftOverrides, type ThemeDraft } from "../theme-draft";
import { useResolvedTheme } from "./use-resolved-theme";

export function useThemePreview(draft: ThemeDraft) {
	const theme = useResolvedTheme();

	useEffect(() => {
		const root = document.documentElement;
		const restore = {
			card: root.getAttribute("data-card"),
			font: root.getAttribute("data-font"),
			palette: root.getAttribute("data-palette"),
			style: root.getAttribute("style"),
			surface: root.getAttribute("data-surface"),
		};

		root.setAttribute("data-palette", draft.palette);
		root.setAttribute("data-font", draft.font);
		// The attribute, not an inline override - on a preset the raised ladder is
		// a generated block like any other, so previewing it through the stylesheet
		// keeps the report measuring what the app would actually ship.
		if (draft.surface === "flat") root.removeAttribute("data-surface");
		else root.setAttribute("data-surface", draft.surface);
		// Same shape, same reason: the default carries no attribute, so previewing
		// `glass` leaves the document exactly as an un-opted-in project would have
		// it rather than writing an attribute that means "the default".
		if (draft.card === "glass") root.removeAttribute("data-card");
		else root.setAttribute("data-card", draft.card);
		root.style.setProperty("--radius", RADIUS_OPTIONS[draft.uiRadius].value);
		root.style.setProperty("--field-radius", RADIUS_OPTIONS[draft.formRadius].value);

		// Only when the draft has left its preset. On a preset this is empty, and
		// the page is then painting from the generated stylesheet - which is the
		// point: what the report measures is what the app would ship.
		const overrides = draftOverrides(draft, theme);
		for (const [token, value] of Object.entries(overrides)) {
			root.style.setProperty(token, value);
		}

		return () => {
			for (const token of Object.keys(overrides)) root.style.removeProperty(token);
			root.style.removeProperty("--radius");
			root.style.removeProperty("--field-radius");

			// Restoring the whole attribute rather than removing the two properties
			// individually: `style` may have carried something before this ran, and
			// removeProperty on a shorthand we did not write is how a preview leaves
			// a hole behind it.
			if (restore.style === null) root.removeAttribute("style");
			else root.setAttribute("style", restore.style);

			if (restore.palette === null) root.removeAttribute("data-palette");
			else root.setAttribute("data-palette", restore.palette);

			if (restore.font === null) root.removeAttribute("data-font");
			else root.setAttribute("data-font", restore.font);

			if (restore.surface === null) root.removeAttribute("data-surface");
			else root.setAttribute("data-surface", restore.surface);

			if (restore.card === null) root.removeAttribute("data-card");
			else root.setAttribute("data-card", restore.card);
		};
	}, [draft, theme]);

	return theme;
}
