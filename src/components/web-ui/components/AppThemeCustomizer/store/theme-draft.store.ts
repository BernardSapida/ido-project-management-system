/**
 * The draft, persisted.
 *
 * Its own storage key, deliberately NOT the app's UI store. Persisted because a
 * reload is how you check a theme honestly - a palette that only exists in React
 * state is one you cannot see survive hydration. What it must never do is escape
 * this page: the customizer previews into localStorage and never rewrites the
 * committed config.
 *
 * A factory rather than a module singleton, because the initial draft is built
 * from the PROJECT's committed config and preset list - which the package
 * receives as props, not imports. `<AppThemeCustomizer/>` calls this once with
 * the kit it built and keeps the returned hook stable for its lifetime.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeDraft, ThemeDraftKit } from "../theme-draft";

interface ThemeDraftState {
	draft: ThemeDraft;
	reset: () => void;
	selectPreset: (name: string) => void;
	setDraft: (next: ThemeDraft) => void;
}

export type ThemeDraftStore = ReturnType<typeof createThemeDraftStore>;

/**
 * @param kit  the project-bound helpers from `createThemeDraftKit`
 * @param storageKey  localStorage key; unique per mounted customizer if more
 *                    than one ever shares a page
 */
export function createThemeDraftStore(kit: ThemeDraftKit, storageKey = "app-theme-draft") {
	const { applyPreset, committedDraft, isKnownPalette } = kit;

	return create<ThemeDraftState>()(
		persist(
			(set) => ({
				draft: committedDraft(),
				reset: () => set({ draft: committedDraft() }),
				selectPreset: (name) => set((state) => ({ draft: applyPreset(state.draft, name) })),
				setDraft: (next) => set({ draft: next }),
			}),
			{
				/*
				 * Merged over the committed default rather than trusted whole. A draft
				 * persisted before a field existed does not have it, and `draft` is
				 * replaced wholesale by zustand's shallow merge - so a missing nested
				 * key would crash the first render.
				 */
				merge: (persisted, current) => {
					const stored = (persisted as { draft?: Partial<ThemeDraft> } | undefined)?.draft;
					const merged = { ...committedDraft(), ...stored };
					// A stored palette name is only as good as the preset list it was saved
					// against. Drop a dangling name, keep the colours being worked on.
					if (!isKnownPalette(merged.palette)) merged.palette = committedDraft().palette;
					return { ...current, draft: merged };
				},
				name: storageKey,
			},
		),
	);
}
