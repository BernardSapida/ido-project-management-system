---
name: feature-implementation
description: Use this skill for any end-to-end feature implementation — CRUD, new pages, new data domains, or any request that involves backend + UI + routing together. Trigger on: "implement X feature", "build X", "add X functionality", "create CRUD for X", or any feature request that spans DB, API, and UI. Always run the full flow in order — never jump to code without completing Phase 0 and 1 first.
---

# Feature Implementation Flow

This skill orchestrates all other skills in the correct order. It covers the full lifecycle: clarify → plan → backend → UI → routes → quality → tests. Never skip phases. Never write code before the plan is approved.

---

## Phase 0 — Clarify (Always First)

Before touching any code or files, ask focused questions to eliminate blocking ambiguities.

**Rules:**
- Ask a maximum of 3 questions — only the most blocking ones
- Do not ask about things reasonably inferable from context
- Do not proceed to Phase 1 until answers are received

**What to clarify:**
- **Scope** — Create only, or full CRUD (create / read / update / delete / list)?
- **Auth & roles** — Who can access this? Any role-based restrictions?
- **Data shape** — What fields does the entity have? Any relations to existing models?
- **UI intent** — New page or modal/drawer on an existing page? Any specific layout?
- **Existing patterns** — Is there a similar feature already in the codebase to match?

---

## Phase 1 — Architecture Plan (Review Gate)

Read `agent-resources/skills/monolith-structure/SKILL.md` fully before planning.

Output a complete implementation plan and **wait for user approval before writing any code**.

**Plan must include:**

```
BACKEND
- prisma/models/[feature].prisma       ← new Prisma model fields
- src/features/[feature]/validations/  ← Zod schemas (create, update)
- src/integrations/trpc/routers/[feature].router.ts ← procedures (list, getById, create, update, delete)
- src/integrations/trpc/router.ts      ← register new router

UI
- src/features/[feature]/components/   ← feature-scoped components
- src/components/ui/ or form/          ← any new shared components needed

ROUTES
- src/routes/[feature]/index.tsx       ← list page
- src/routes/[feature]/$id.tsx         ← detail/edit page (if applicable)

SHARED
- src/features/[feature]/types/        ← TypeScript types
- src/features/[feature]/hooks/        ← query + mutation hooks
```

**Rules:**
- One component per file — no co-located components in route files
- Route files are thin shells — they compose feature components only
- Never use tRPC for auth checks — those go in `beforeLoad` only
- Never use `createServerFn` for data fetching — tRPC only

Do not write a single line of code until the user approves this plan.

---

## Phase 2 — Backend Implementation

Read before starting:
- `agent-resources/skills/tanstack-start/references/execution-model.md`
- `agent-resources/skills/tanstack-start/references/databases.md`

### Step 2a — Prisma Schema
- Add model to `prisma/models/[feature].prisma`
- Follow existing model naming conventions (PascalCase model, camelCase fields)
- Run `npm run db:migrate` after schema is finalized
- Verify migration succeeded before moving on

### Step 2b — Zod Validation Schemas
- Create schemas in `src/features/[feature]/validations/`
- One schema file per operation: `create-[feature].schema.ts`, `update-[feature].schema.ts`
- Derive TypeScript types with `z.infer<typeof schema>`
- Never expose Zod default error strings — write human error messages

### Step 2c — tRPC Router
- Create `src/integrations/trpc/routers/[feature].router.ts`
- Standard procedures: `list`, `getById`, `create`, `update`, `delete`
- Use `protectedProcedure` for any auth-gated operation
- Register in `src/integrations/trpc/router.ts`

### Step 2d — Query & Mutation Hooks
- Create `src/features/[feature]/hooks/use-[role]-[feature]-queries.ts`
- Create `src/features/[feature]/hooks/use-[role]-[feature]-mutations.ts`
- Use `useTRPC` from `@/integrations/trpc/react`
- Mutations must call `queryClient.invalidateQueries` on success

---

## Phase 3 — UI Implementation

Follow `agent-resources/skills/ui-ux-creation/SKILL.md` for all UI work. That skill is the sub-orchestrator for this phase — do not skip its steps.

### Step 3a — HeroUI Component Docs
Before writing any new HeroUI component, fetch its docs:
```bash
node .claude/skills/heroui-react/scripts/get_component_docs.mjs ComponentName
```
Never invent HeroUI usage from memory — always read the docs first.

### Step 3b — Forms
If any component includes a create or edit form, read and follow:
`agent-resources/skills/rhf-heroui-form/SKILL.md`

Key rules (never skip these):
- Use `Controller` for all HeroUI inputs — never `register`
- `mode: "onBlur"`, `reValidateMode: "onChange"`
- Wrap all submit logic in `handleSubmit(fn)` — never bypass it
- Use `App*` wrappers from `@/components/form/` — never raw HeroUI inputs in forms
- `isInvalid={!!fieldState.error}` + `errorMessage={fieldState.error?.message}` — never custom error `<p>` tags

### Step 3c — Data Fetching in Components
Use the localized tristate pattern — never let a fetch error break the whole page:

```tsx
{isError ? (
  <QueryError
    message={error instanceof Error ? error.message : undefined}
    onRetry={() => refetch()}
  />
) : isLoading ? (
  <FeatureNameSkeleton />
) : (
  <ActualComponent data={data} />
)}
```

Order: `isError` → `isLoading` → data. Always.

### Step 3d — List Views
- Use `DataTableCard` from `@/components/composite/` if a table is needed
- Empty state: show a descriptive empty state, not just nothing
- Loading state: feature-specific skeleton, not a generic spinner

---

## Phase 4 — Routes & Navigation

Read before starting:
- `agent-resources/skills/tanstack-start/references/routing.md`
- `agent-resources/skills/tanstack-start/references/code-execution-patterns.md`

### Step 4a — Route Files
- Route files live in `src/routes/[feature]/`
- Route files are **thin shells** — import and compose feature components only
- Add `staticData: { breadcrumb: "Label" }` to every route definition for breadcrumbs
- Use `useSuspenseQuery` in loaders to prefetch data

### Step 4b — Auth Guards
- Protected routes call `assertAuthenticatedFn` or `assertAuthenticatedRoleFn` in `beforeLoad`
- Import from `@/features/auth/functions` — never inline auth logic in a route
- Never check auth inside a component

### Step 4c — Navigation
- Add new routes to `src/config/navigation.config.ts` if they should appear in menus

---

## Phase 5 — Code Quality

Read and apply `agent-resources/skills/clean-code/SKILL.md` to every file written in Phases 2–4.

**Self-review checklist before running lint:**

| Check | Rule |
|-------|------|
| Naming | Files kebab-case, components PascalCase, hooks useCamelCase |
| Imports | Always `@/` aliases, never `../../`, grouped external → internal → types |
| TypeScript | No `any`, no `!`, derive types from Zod/HeroUI source |
| State | Local → Zustand → TanStack Query — never over-escalate |
| Anti-patterns | No `process.env`, no `console.log`, no `onClick` on HeroUI, no raw inputs in forms |
| Comments | None unless WHY is non-obvious |

Then run:
```bash
npm run check
```

Fix every Biome error before moving to Phase 6. Do not defer linting errors.

---

## Phase 6 — E2E Tests

Read and follow `agent-resources/skills/e2e/SKILL.md` in full. Tests use Cypress, hit the real database — no mocking.

### Step 6a — Add `data-cy` attributes to the UI

Before writing any spec, go back through all interactive elements added in Phases 3–4 and add `data-cy` attributes:

| Element type | Example |
|---|---|
| Buttons | `data-cy="create-todo-btn"`, `data-cy="submit-btn"`, `data-cy="delete-btn"` |
| Form inputs | `data-cy="title-input"`, `data-cy="status-select"` |
| Tables / lists | `data-cy="todo-table"`, `data-cy="todo-list"` |
| Row actions | `data-cy="edit-todo-btn"`, `data-cy="delete-todo-btn"` |
| Dialogs / modals | `data-cy="confirm-delete-modal"` |

Naming convention: `[action or content]-[element type]`, all kebab-case.

After adding them, list all `data-cy` values to the user so they know what's available.

### Step 6b — Write the Spec

Follow the e2e skill spec structure. Required scenarios for every CRUD feature:

| Scenario | `describe` / `it` label |
|----------|------|
| List loads | "list — renders items" |
| Create happy path | "create — submits form and item appears in list" |
| Create validation | "create — shows errors on empty submit" |
| Edit happy path | "edit — updates item and reflects change" |
| Delete | "delete — removes item from list" |
| Auth guard | separate `describe` block, no `cy.login()` |
| Empty state | "list — shows empty state when no items" |

### Step 6c — Run and Verify

```bash
# Terminal 1
npm run dev

# Terminal 2
npx cypress run --spec "cypress/e2e/[feature]/[file].cy.ts"
```

All tests must pass. On failure: read the error, fix selector/assertion/wait — never skip or disable a test.

---

## Flow Summary

```
Phase 0: Clarify (max 3 questions) ──► wait for answers
     │
     ▼
Phase 1: Architecture plan ──► WAIT FOR USER APPROVAL ──► no code before this
     │
     ▼
Phase 2: Backend
  ├── 2a: Prisma schema + migrate
  ├── 2b: Zod schemas
  ├── 2c: tRPC router
  └── 2d: Query/mutation hooks
     │
     ▼
Phase 3: UI (orchestrated by ui-ux-creation skill)
  ├── 3a: Fetch HeroUI docs for new components
  ├── 3b: Forms via rhf-heroui-form skill
  ├── 3c: Data fetching tristate pattern
  └── 3d: List views + empty states
     │
     ▼
Phase 4: Routes & Navigation
  ├── 4a: Thin route files
  ├── 4b: Auth guards in beforeLoad
  └── 4c: Navigation config
     │
     ▼
Phase 5: Code quality ──► npm run check ──► fix all errors
     │
     ▼
Phase 6: E2E tests (e2e skill)
  ├── 6a: Add data-cy attributes to all interactive elements → list them for user
  ├── 6b: Write Cypress spec (all CRUD scenarios + auth guard)
  └── 6c: npm run dev + cypress run ──► all pass ──► DONE
```

---

## Hard Rules (Never Break)

- Never write code before Phase 1 plan is approved
- Never use tRPC for auth checks — `beforeLoad` only
- Never use `createServerFn` for data fetching — tRPC only
- Never use raw HeroUI inputs in forms — `App*` wrappers only
- Never use `process.env` — `env` from `@/env` only
- Never leave `console.log` in committed code
- Never declare two components in the same file
- `npm run check` must pass before Phase 6
