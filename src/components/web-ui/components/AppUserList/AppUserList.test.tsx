import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppUserList, type UserListItem } from "./AppUserList";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. Clicking
 * a row and watching `onSelectUser` fire is the lab's job; what is pinned here is
 * the structure a spec depends on and cannot see move.
 *
 * - `data-state` names loading / empty / ready, so one `data-cy` addresses the
 *   surface across all three.
 * - A row carries `data-user-key`, `data-presence` and `data-pressable`. With an
 *   `onSelectUser` the row is a real `<button>` (Enter and Space unwired) and
 *   gains a chevron; without it, a plain `<li>` that says `data-pressable="false"`.
 * - Presence shows in words, not colour alone: "Online", or "Last seen 3h ago"
 *   for anyone not online who has a `lastSeen`.
 * - Padding is on the ROW (`px-4 py-4`), not the surface, so the highlight reaches
 *   the clipped card edge.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

const USERS: UserListItem[] = [
	{ email: "maya@example.com", key: "u1", name: "Maya Chen", presence: "online", role: "Product Designer" },
	{
		email: "alex@example.com",
		key: "u2",
		lastSeen: "3h ago",
		name: "Alex Rivera",
		presence: "away",
		role: "Dispatch Lead",
	},
];

describe("AppUserList", () => {
	describe("the three states", () => {
		it("loading: data-state=loading and an aria-busy skeleton named for the list", () => {
			const html = markup(<AppUserList isLoading label="Team members" users={[]} />);
			expect(html).toContain('data-state="loading"');
			expect(html).toContain('aria-busy="true"');
			expect(html).toContain("Team members, loading");
		});

		it("empty: data-state=empty and the reason-based empty state with a derived data-cy", () => {
			const html = markup(
				<AppUserList
					data-cy="roster"
					empty={{ reason: "no-results", query: "zzz" }}
					label="Team members"
					users={[]}
				/>,
			);
			expect(html).toContain('data-state="empty"');
			expect(html).toContain('data-cy="roster-empty"');
		});

		it("ready: data-state=ready and a <ul> named by label", () => {
			const html = markup(<AppUserList label="Team members" users={USERS} />);
			expect(html).toContain('data-state="ready"');
			expect(html).toContain('aria-label="Team members"');
		});
	});

	describe("the row", () => {
		it("carries key, presence and pressable=false when there is no onSelectUser", () => {
			const html = markup(<AppUserList label="Team" users={USERS} />);
			expect(html).toContain('data-user-key="u1"');
			expect(html).toContain('data-presence="online"');
			expect(html).toContain('data-pressable="false"');
			expect(html).not.toContain("<button");
		});

		it("becomes a real button with pressable=true when onSelectUser is passed", () => {
			const html = markup(<AppUserList label="Team" onSelectUser={() => undefined} users={USERS} />);
			expect(html).toContain('data-pressable="true"');
			expect(html).toContain('<button class="flex w-full cursor-pointer');
			expect(html).toContain('type="button"');
		});

		it("pads the row 16px on every side", () => {
			const html = markup(<AppUserList label="Team" users={USERS} />);
			expect(html).toMatch(/class="[^"]*\bpx-4 py-4\b/);
		});
	});

	describe("presence in words", () => {
		it("says Online for an online user and Last seen … for anyone away with a time", () => {
			const html = markup(<AppUserList label="Team" users={USERS} />);
			expect(html).toContain("Online");
			expect(html).toContain("Last seen 3h ago");
		});

		it("falls back to the bare label when someone offline has no lastSeen", () => {
			const html = markup(
				<AppUserList
					label="Team"
					users={[{ email: "e@x.com", key: "u9", name: "Sam", presence: "offline", role: "Ops" }]}
				/>,
			);
			expect(html).toContain("Offline");
		});
	});

	describe("email", () => {
		it("is always shown - it is what separates two people with the same name", () => {
			const html = markup(<AppUserList label="Team" users={USERS} />);
			expect(html).toContain("maya@example.com");
			expect(html).toContain("alex@example.com");
		});
	});
});
