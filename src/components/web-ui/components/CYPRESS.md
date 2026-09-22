# `components/custom/` — the labs and their specs

**Part 1** is the work in progress. **Part 2** is the coverage record for every
spec in the suite.

A new session reads Part 1, finds the first row in the checklist that is not
`done`, and writes its spec.

---

# Part 1 — Specs for the twelve rebuilt labs

## What is left

Fifteen components had no spec at all — they had just been promoted out of
`components/pending/`, twelve of them did not accept `data-cy`, and thirteen of
the fourteen labs passed none, so rules 1 and 2 of the definition of done were
never met and rule 3 was unreachable.

**That is fixed. All fifteen labs are built**: every component takes a hook (bar
the three that structurally cannot), every lab leads with an assembly, and every
specimen carries a unique `data-cy`. Verified `tsc --noEmit` clean, Biome clean,
and hydrating in a real browser — a throwaway Cypress pass visited all fourteen
routes and waited for interactivity, then was deleted. That proves the pages
work, not that they are correct.

**What remains is eleven specs**, rows 3-13 below. Nothing else in the library is
being touched.

The auth-page-shell lab was deleted after this pass, so its spec is not owed.
`AppAuthPageShell` itself stays — five real auth routes render it — and it keeps
the `data-cy` / `data-columns` hooks the pass gave it, listed below.

## The standard each lab was built to, and each spec is written against

The table lab set it: it shows the component **in the assembly a real screen puts
it in** — a page header, a filter bar, a search field, pagination, row actions, a
modal — and then walks it through **the states a real screen reaches**: live,
loading, empty, empty-for-each-reason.

A prop matrix answers "what props does it take". An assembly answers "what does
this look like on a screen I am about to build", which is the only question a lab
is ever asked. So every lab now has:

1. **One assembly section up top**: the component wired into its real
   neighbours, with a title, a description, and `usedIn` chips naming the real
   screens it belongs on.
2. **The real states** it reaches there: loading, empty, error, too much data,
   too little.
3. The prop matrix below it, as reference rather than the lead.
4. A unique `data-cy` at every call site.

A spec asserts what the assembly PROMISES. `AppBadge.cy.ts` is the model: it
pins that the count is spoken, that zero unmounts rather than empties, and that
the cap holds — not that a badge renders.

## The checklist

`done` = spec written and green. `built` = lab done, spec still to write.

| # | Lab | Component(s) | Takes `data-cy` | The assembly it was built around | Status |
|:--:|---|---|:--:|---|---|
| 1 | toggle-button | AppToggleButton | **yes** | An editor toolbar: independent marks, exclusive alignments, plain buttons beside them, over a preview paragraph carrying `data-marks` / `data-align`. | **done** — 14 tests |
| 2 | badge | AppBadge | **yes** | A top bar: bell, messages, cart, avatar, all at their real 40px. Counterpart section shows where a badge is the *wrong* tool. | **done** — 15 tests |
| 3 | tabs | AppTabs | **yes** | A settings page — Profile / Notifications / Billing(disabled), each panel a real form section, so the panels disagree about height. Plus **one panel failed, the page did not**: the failure is drawn inside the panel and the sibling tabs keep working. | **built** |
| 4 | tag-group | AppTagGroup | **yes** | A filter strip over the article list it filters. Reaches the two states a bare row cannot: nothing selected (= everything, not nothing) and a combination matching nothing, where the empty result belongs to the list and the filters stay changeable. | **built** |
| 5 | progress-bar | AppProgressBar | **yes** | An upload queue — filename, bar, percentage, cancel — in all four states. Two of them draw no bar at all, which is the decision the section exists to make visible. | **built** |
| 6 | progress-circle | AppProgressCircle | **yes** | A dashboard: ONE ring per tile, which is the only arrangement this component is the right choice for. The 'Ring or bar' comparison is the argument for why. | **built** |
| 7 | theme-toggle | AppThemeToggle, AppFloatingThemeToggle | **yes** | The two places it sits — a top bar and a settings row — sharing one store, where the surrounding copy does completely different work. Plus the dev-only floating one, which the lab *describes* rather than renders: `__root.tsx` already mounts it on this page, and a second would put two elements behind `floating-theme-toggle`. | **built** |
| 8 | ~~query-error~~ | ~~AppQueryError~~ | — | **Removed.** `AppQueryError` was a 3-line `classifyError` → `<AppErrorState variant="section" />` wrapper. Component and lab both deleted; `classifyError` is exported on its own and the call sites run it. The classification switcher moved into the **error-state** lab as "Classifying a raw query error". | **removed** |
| 9 | not-found | AppNotFound | n/a | The real component in a clipped frame, plus a live dead link into the router's own 404. **Takes no props** — it is bound straight to `notFoundComponent`, whose signature rejects an options bag; the lab hooks the frame instead. | **built** |
| 10 | route-progress | AppRouteProgress | n/a | Start/Done/Nudge driving the real NProgress singleton. **Renders null** — `#nprogress` in the body IS the hook, and its absence on a fast navigation is the harder promise. | **built** |
| 11 | skip-to-content | AppSkipToContent | **yes** | A focus-reset button, then Tab. Plus the cost counter: N nav items = N tab presses on every page, versus 1. | **built** |
| 12 | shell | AppShell, AppBackdrop, AppPageHeader | lab only | Three width specimens with the live one marked, over a `data-layout` readout. **`AppShell` itself was not touched** — it is mid-refactor in the working tree (the sidebar collapse work), so the hooks went on the lab's own markup. | **built** |
| 13 | date-range-picker | AppDateRangeFilter, AppDateRangePicker | **yes** | The filter over the report it filters, so the Apply gate has something to not-move. **AppDateRangePicker got a section rather than being retired** — it is the form-bound sibling, for a record a Save button commits, where the filter is for a toolbar with no Save button at all. | **built** |

## What the build pass changed in the components — read before writing a spec

Not just hooks: the API of eight components moved, so a spec written against the
old shape will not compile. Each was a gap the lab itself had already reported
and parked, closed under the standing rule that **an accessible name is required
by the type, never an optional prop a caller can forget**:

| Component | Was | Now |
|---|---|---|
| AppToggleButton | icon-only could ship unnamed; the lab demoed one in red | `aria-label` required on the `isIconOnly` branch |
| AppBadge | the count was never announced; no cap | `label` required and spoken; `max` defaulting to 99 |
| AppTagGroup | `label` optional; an empty group rendered its label over nothing | `label` required + `isLabelHidden`; `emptyText` defaulting to "None" |
| AppProgressBar | `label` optional, falling back to the string "Progress" | `label` required + `isLabelHidden` |
| AppProgressCircle | same fallback | same fix |
| AppThemeToggle | carried a hard-coded `data-cy="theme-toggle"`, and its own lab renders two | `data-cy` is a prop — one hook, one element |
| AppTabs | no hooks | `data-cy`, with `-tab-${key}` and `-panel-${key}` derived per item |
| AppAuthPageShell | no hooks | `data-cy` + `data-columns` (`one` / `two`) |

"Progress" is not a name — it is the word for the category of thing being
unnamed, and "Progress, 67%" tells a screen-reader user nothing they can act on.

Three components could not take a `data-cy` and say so in their doc comments now:
`AppNotFound` (bound to `notFoundComponent`, whose signature rejects extra
props), `AppRouteProgress` (renders `null`; `#nprogress` is the hook) and
`AppShell` (mid-refactor in the working tree — left alone deliberately).

## Conventions the two finished specs set

`AppToggleButton.cy.ts` (14) and `AppBadge.cy.ts` (15) are the models. Four rules
came out of them, and the ten specs still to write follow all four:

- **Assert the accessibility contract, not a mirror of it.** react-aria already
  writes `aria-pressed` with both values, so the toggle spec pins that rather
  than a `data-selected` copy that could drift. Only add a custom attribute where
  the real one *vanishes* instead of turning false — which is exactly why
  `AppButton` has `data-async-pending` and `AppBadge` has `data-overflowing`.
- **Never select on a class.** The badge's hidden label carries
  `data-badge-label` rather than being found by `.sr-only`; the toggle lab's
  preview carries `data-marks` / `data-align` rather than being asserted through
  `font-bold`. A class is a styling decision and renaming one must not turn a
  spec red.
- **Break it and watch it fail.** Both specs had their central claim falsified
  before being called done — removing the `aria-label` pass-through turned the
  toggle's naming sweep red, and blanking the badge's spoken label turned six
  tests red. A green assertion nobody has seen fail proves nothing, and the
  a11y ones are the most likely to be vacuous.
- **Absent, not empty.** Zero unmounts the badge; the spec asserts `not.exist`,
  because an empty element still in the DOM passes a text assertion and fails a
  user.

## One lab per component — settled

Merging `toggle-button` into `button` was considered and rejected. It stays one
lab per component, with two exceptions that earned it: **progress-bar /
progress-circle** stay separate, and **not-found** stays separate from
`error-state` — but **query-error was merged into `error-state` and its
component deleted**. `AppQueryError` only ever ran `classifyError` and rendered
`<AppErrorState variant="section" />`; with `classifyError` exported on its own
there was nothing left for the wrapper to be. That deletion regenerates
`routeTree.gen.ts`.

Both of the things the merge attempt surfaced were settled on row 1:

- **The icon-only name is now a type error to omit** — see above. It is the
  standing rule for every remaining row, not a one-off.
- **The two components mean different things by `variant`, and that is correct.**
  `AppButton`'s seven are semantic: they name what an action does to the user's
  data, and there is at most one primary per view. A toggle does none of those
  things — it flips a mode — so it keeps HeroUI's `default` / `ghost` and now
  says why in its own doc comment. Do not "align" them.

---

# Part 2 — Coverage record

**29 specs · 27 of 40 labs covered.**

> An earlier version of this file said "62 of 62 components covered". It was
> wrong: a recount, grepping every spec for every component name, found fifteen
> with no spec at all. Two now have one; the other thirteen are Part 1.

One spec per LAB, not per component — the lab is the unit with a URL, and the
specs test the labs rather than the app (no sign-in, no database, no mock
server). `form-reference.cy.ts` covers 16 field components in one file.

**Naming:** every spec is `App<Lab>.cy.ts` — `App` + the lab's route segment in
PascalCase, so `/components/users-list` is `AppUsersList.cy.ts`. The prefix
mirrors `components/custom/App*`; the stem is the lab, not the component, which
is why `AppBanner.cy.ts` tests `AppAlert` and `AppNavigation.cy.ts` tests seven
components at once.

**How to write one:** `infrastructure/web/features/testing.md` — the selector
table plus 16 rules that each cost a debugging session. Read it first; a spec
that follows them works on the first run.

```bash
# The dev server must bind IPv4 or every cy.visit 404s - see testing.md rule 13.
pnpm --filter @app/web exec vite dev --port 3000 --strictPort --host 127.0.0.1

pnpm test:web        # headless, whole suite
pnpm cypress open    # interactive
pnpm cypress run --spec "cypress/e2e/components/AppToaster.cy.ts"
```

---

## Done — 29 specs

| Lab | Spec | Tests | Components |
|---|---|:--:|---|
| form-reference | `form/form-reference.cy.ts` | 57 | 16 field components |
| form-reference | `form/submit.cy.ts` | 4 | full submit + success modal |
| navigation | `components/AppNavigation.cy.ts` | 43 | AppSidebar, AppNavList, AppTabBar, AppMobileBar, AppMobileDrawer, AppSidebarUserCard, AppLogo |
| list | `components/AppList.cy.ts` | 30 | AppList, AppAvatar |
| tracking | `components/AppTracking.cy.ts` | 25 | AppTracking |
| timeline | `components/AppTimeline.cy.ts` | 24 | AppTimeline |
| stepper | `components/AppStepper.cy.ts` | 22 | AppStepper |
| banner | `components/AppBanner.cy.ts` | 21 | AppAlert |
| users-list | `components/AppUsersList.cy.ts` | 21 | AppUserList |
| tooltip | `components/AppTooltip.cy.ts` | 19 | AppTooltip, AppRichTooltip |
| table | `components/AppTable.cy.ts` | 18 | AppTable, AppDataTable, AppPagination, AppColumnPicker, AppEmptyState |
| error-state | `components/AppErrorState.cy.ts` | 18 | AppErrorState |
| dialog | `components/AppDialog.cy.ts` | 17 | AppDialog |
| toaster | `components/AppToaster.cy.ts` | 17 | AppToaster |
| dropdown | `components/AppDropdown.cy.ts` | 16 | AppDropdown |
| card | `components/AppCard.cy.ts` | 17 | AppCard, AppGradientIconTile |
| accordion | `components/AppAccordion.cy.ts` | 15 | AppAccordion |
| breadcrumbs | `components/AppBreadcrumbs.cy.ts` | 15 | AppBreadcrumbs |
| comments | `components/AppCommentSection.cy.ts` | 13 | AppCommentSection |
| profile-banner | `components/AppProfileBanner.cy.ts` | 12 | AppProfileBanner |
| search-bar | `components/AppSearchBar.cy.ts` | 11 | AppSearchBar |
| drawer | `components/AppDrawer.cy.ts` | 11 | AppDrawer |
| modal | `components/AppModal.cy.ts` | 10 | AppModal |
| design-reference | `components/AppDesignReference.cy.ts` | 10 | AppTokenSwatchGrid |
| button | `components/AppButton.cy.ts` | 9 | AppAsyncButton |
| star-rating | `components/AppStarRating.cy.ts` | 9 | AppStarRating, AppRatingSummary |
| chip | `components/AppChip.cy.ts` | 4 | AppChip |
| **badge** | `components/AppBadge.cy.ts` | **15** | AppBadge — row 2 of the 15 |
| **toggle-button** | `components/AppToggleButton.cy.ts` | **14** | AppToggleButton — row 1 of the 15 |

The `describe` titles are not yet uniform — some read `AppAccordion`, some
`accordion lab`. That is a rewrite of the reporter output rather than a rename,
so it is left for whoever next opens each file.

## Components with no lab of their own

These render inside another lab, so they are covered by that lab's spec.

| Component | Where it lives | Covered by |
|---|---|---|
| AppFilterBar, AppSearchField | inside AppDataTable | `AppTable.cy.ts` |
| AppTableHighlight | inside AppTable | `AppTable.cy.ts` |
| AppGradientIconTile | every lab's tiles | `AppCard.cy.ts`, `AppDesignReference.cy.ts` |
| AppGlassCard | every lab's card | indirectly, everywhere |
| AppPageHeader | every lab's header | indirectly, everywhere |
| AppBackdrop | the labs shell | indirectly, everywhere |

---

## What the specs found

Worth knowing before reading them; each is written up at the point it bites.

- **The logo was pointing at a path that does not exist — now fixed.**
  `AppLogo`, the card lab and the search-bar lab all requested
  `/assets/logo.png`, and there is no `apps/web/public/assets/` directory at
  all. The real file is `public/images/logo.png`. Every one of them now points
  there, the card lab's 1/1 specimen uses `/logo192.png` in place of a partner
  mark that was never in the repo, and `AppCard.cy.ts` gained an assertion that
  the two images actually decode (`naturalWidth > 0`) — without it, the media
  suite passes with the whole directory deleted, which is exactly how this went
  unnoticed. The deliberate `does-not-exist.png` specimens stay as they are.
- **`AppAvatar` reimplemented `AppBadge`, worse — now settled.** Its `badge`
  prop used to open its own `Badge.Anchor` around a raw HeroUI `Badge`, so it
  missed the `size="sm"` override (HeroUI's 28px default lands on a 40px avatar,
  the exact defect `AppBadge`'s doc comment exists to describe) and had no
  accessible name at all. It now delegates to `AppBadge`, which is why
  `badge.label` is required. `AppAvatar` has its own lab as of the avatar slice
  and takes `data-cy`; the spec is still to write, so the badge, the fallback
  and the stack remain covered only through `AppList.cy.ts` and
  `AppUsersList.cy.ts`.
- **A two-line list row is 69px and a one-line row is 64px.** The list lab's
  copy says every row keeps the same height with or without a second line;
  measured, it does not. The component's own promise - a minimum that holds
  either way - is the true one, and that is what `AppList.cy.ts` pins. Either the
  copy or the `min-h` wants changing; the spec does not decide which.
- **`AppSidebar` had no `onNavigate`**, so a specimen link in the navigation
  lab really did navigate the reader away from the page, despite the lab's copy
  saying otherwise. It now forwards one, and the app leaves it unset.

## Labs that grew a control

Per the rule below: where a lab could not reach a state its spec needed, the
lab got the toggle rather than the spec getting a workaround.

| Lab | Added | Reaches |
|---|---|---|
| navigation | Destinations: Real / Crowded | the five-slot tab ceiling, the More sheet, a section expanding its children — the template ships one destination per role, which can show none of them |
| navigation | Identity: Ordinary / Long | the user card's truncation, and that a long address cannot widen the sidebar |
| stepper | `currentStep = 9, out of range` | the clamp |
| button | a counted async button + "presses got through" | the double-submit guard, which is otherwise invisible: a button that fires twice looks exactly like one that fires once |

---

## Definition of done, per lab

1. Every component it renders accepts `data-cy` on its outermost element.
2. The lab passes a `data-cy` at every call site — two instances never share one.
3. The spec asserts what the component's doc comment PROMISES, not that it
   renders.
4. Happy path and worst path both covered — for an input, a rejected value that
   reports itself and keeps what was typed; for a display component, empty,
   overflowing and out-of-range data.
5. It passes in a full `pnpm test:web` run, not only on its own.

If a lab cannot reach a state the spec needs, **the lab is the gap, not the
spec**. Add the toggle to the lab — that is what labs are for, and every later
spec gets it free.

--------------------

Updated — CYPRESS.md, 359 → 289 lines.

You were right that I left it behind. The worst of it was an actively false claim, not just a stale one: a table contrasting "the tabs lab" as a prop matrix (Basic · Controlled · Disabled keys · …) against the table lab. That stopped being true the moment I rebuilt tabs around a settings page — the doc was arguing against a lab that no longer exists.

Removed as done: the strikethrough roll-call of the 15 component names; "Why they had no spec" (a diagnosis of a fixed problem); the "flow changed part-way through" progress note; and the two per-row write-ups for toggle-button and badge.

Kept, but converted from progress reports into rules — the knowledge in those write-ups is what the remaining specs have to follow, so deleting it outright would have cost more than it saved. It's now one section, Conventions the two finished specs set: assert the accessibility contract rather than a mirror of it; never select on a class; break it and watch it fail before calling it done; absent, not empty.

Corrected: Part 2's blockquote still said "15 components have no spec at all" — it's thirteen now. And the checklist's rows 1–2 said "Done — see below" pointing at sections I'd just merged away; they now carry their assembly and test count inline.

Promoted: the component-API table is now headed read before writing a spec, because eight components changed shape — label went required on AppTagGroup, AppProgressBar and AppProgressCircle, AppThemeToggle's hard-coded data-cy became a prop — and a spec written against the old shape won't compile.

Part 1 now says one thing: twelve specs left, rows 3–14, here's the standard they're written against. Ready to start on them when you are.