/**
 * The draft, persisted.
 *
 * Its own storage key, deliberately NOT `app-ui-storage`. The pre-paint script
 * in __root.tsx parses that key on every request to resolve light/dark before
 * first paint; adding a developer toy to it would put this page's state on the
 * critical path of every page load in the app, and a malformed draft would take
 * the theme down with it.
 *
 * Persisted at all because a reload is how you check a theme honestly - a
 * palette that only exists in React state is one you cannot see survive
 * hydration. What it must never do is escape this page: the customizer previews
 * into localStorage and never rewrites the committed config, because a preview
 * silently becoming the project default is how an unnoticed change ships.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaletteName } from "@/config/theme/presets";
import { applyPreset, committedDraft, isKnownPalette, type ThemeDraft } from "../theme-draft";

interface ThemeDraftState {
	draft: ThemeDraft;
	reset: () => void;
	selectPreset: (name: PaletteName) => void;
	setDraft: (next: ThemeDraft) => void;
}

export const useThemeDraftStore = create<ThemeDraftState>()(
	persist(
		(set) => ({
			draft: committedDraft(),
			reset: () => set({ draft: committedDraft() }),
			selectPreset: (name) => set((state) => ({ draft: applyPreset(state.draft, name) })),
			setDraft: (next) => set({ draft: next }),
		}),
		{
			/*
			 * Merged over the committed default rather than trusted whole.
			 *
			 * A draft persisted before a field existed does not have it, and zustand's
			 * default merge is a shallow spread of the STORED object over the initial
			 * state - which leaves the new key present but only because the initial
			 * state supplied it. That works for a top-level key and not for one
			 * nested inside `draft`, which is replaced wholesale. `surface` was the
			 * first such field: without this, a developer who had used this page
			 * before the control shipped got `draft.surface === undefined` and a
			 * crash on the first render, from data they could not see to clear.
			 */
			merge: (persisted, current) => {
				const stored = (persisted as { draft?: Partial<ThemeDraft> } | undefined)?.draft;
				const merged = { ...committedDraft(), ...stored };

				/*
				 * A stored palette NAME is only as good as the preset list it was saved
				 * against, and that list is a thing people edit - renaming or removing
				 * one leaves every existing draft pointing at nothing. Dropping the
				 * whole stored draft would be worse than the bug; dropping just the
				 * dangling name keeps the colours somebody was working on.
				 */
				if (!isKnownPalette(merged.palette)) merged.palette = committedDraft().palette;

				return { ...current, draft: merged };
			},
			name: "app-theme-draft",
		},
	),
);
