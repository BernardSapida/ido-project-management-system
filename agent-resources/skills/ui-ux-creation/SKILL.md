---
name: ui-ux-creation
description: Use this skill whenever creating, editing, or designing any UI page, screen, layout, or component. Trigger on any mention of: page, screen, component, layout, dashboard, form UI, design, build a UI, create a page, add a component, redesign, or any feature request that implies visual output. Always run this full flow before writing any component code — do not jump straight to implementation.
---

# UI/UX Creation Flow

This skill governs how to approach any UI task from start to finish — from clarification through planning, design reference reads, and implementation. It orchestrates other skills (like `rhf-heroui-form`) as needed.

---

## Step 1 — Analyze & Clarify

Before writing any code, analyze the requirements fully. If anything is ambiguous, ask focused clarifying questions before proceeding.

**Rules:**
- Ask a maximum of 3 questions — prioritize the most blocking ambiguities
- Do not ask about things that can be reasonably inferred from context
- Each question should address one specific ambiguity

**Common things to clarify:**
- Who sees this? (user role, permission level, context)
- What data is being displayed or collected? (shape, source, mutability)
- What is the interaction intent? (read-only view, editable form, navigable list, etc.)
- Are there existing components or patterns this should match?

If requirements are clear and unambiguous, skip directly to Step 2.

---

## Step 2 — Plan: List Files to Create/Update

Before coding, output a structured implementation plan. Present it to the user and proceed unless they object.

**Plan must include:**
- **Pages** — route-level components to create or modify (with file paths)
- **Components** — reusable pieces to create or modify (with file paths)
- **Shared types or hooks** — any new types, interfaces, or hooks needed

**File structure rules:**
- One component per file — never declare two named components in a single file
- Prefer reusable, composable components over one-off inline JSX
- Component files live in `src/components/`, page files in `src/pages/` or `src/routes/` per project convention
- Use descriptive, intention-revealing file names (e.g., `UserProfileCard.tsx`, not `Card2.tsx`)

**Example plan output:**
```
Files to create:
- src/pages/UserProfilePage.tsx       ← route-level page shell
- src/components/UserProfileCard.tsx  ← displays user info
- src/components/UserAvatarUpload.tsx ← handles avatar input (uses rhf-heroui-form)

Files to update:
- src/routes/index.tsx                ← add new route

Shared:
- src/types/user.ts                   ← UserProfile type (if not already defined)
```

---

## Step 3 — Read Design References

Always read the relevant design reference files **before writing any component code**. Do not rely on memory or invented patterns.

**Always read (every UI task):**
- `@.agents/references/webdesign/layout-composition.md`
- `@.agents/references/webdesign/spacing.md`
- `@.agents/references/webdesign/typography.md`
- `@.agents/references/webdesign/responsive.md`
- `@.agents/references/webdesign/accessibility.md`

**Read when applicable:**
- `@.agents/references/webdesign/ux-patterns.md` — when building interactive patterns (modals, tables, filters, dropdowns, navigation, empty states, loading states)
- `@.agents/references/webdesign/animation.md` — only when motion, transitions, or micro-interactions are explicitly needed

---

## Step 4 — Implement

Follow the plan from Step 2. Apply all rules from the references read in Step 3.

**Implementation rules:**
- Never invent layout, spacing, or typography patterns not covered by the design references
- Do not co-locate unrelated components in the same file
- Components must be reusable by default — avoid hardcoding content that could be a prop
- Keep components focused: one responsibility per component

**If any component includes a form:**
Read and follow the `rhf-heroui-form` skill before writing form code:
```
.agents/skills/rhf-heroui-form/SKILL.md
```
Never write form logic, validation, or input wiring without consulting it first.

**If any component fetches data via React Query:**
Use the localized tristate pattern — never let a fetch error break the whole page. The standard block is:

```tsx
{isError ? (
  <QueryError
    message={error instanceof Error ? error.message : undefined}
    onRetry={() => refetch()}
  />
) : isLoading ? (
  <SpecificSkeleton />
) : (
  <ActualComponent data={data} />
)}
```

Rules:
- Always use `QueryError` for the error state — never render a raw error string, `null`, or a full-page error boundary for localized data fetches
- Always pass `message` from the error object using `error instanceof Error ? error.message : undefined` — never assume the error shape
- Always pass `onRetry` pointing to `refetch` so the user can recover without a full page reload
- For the loading state, prefer a **page/context-specific skeleton** (e.g. `UserTableSkeleton`) that matches the shape of the real content; use a generic spinner only when no skeleton exists
- Order is always: `isError` first → `isLoading` second → data/content last

---

## Flow Summary

```
Requirements
     │
     ▼
Step 1: Ambiguous? ──yes──► Clarify (max 3 questions) ──► re-evaluate
     │ no
     ▼
Step 2: Output file plan ──► implicit approval ──► proceed
     │
     ▼
Step 3: Read design references (always 5 core + conditional)
     │
     ▼
Step 4: Implement
     │
     ├── Has form? ──► read rhf-heroui-form/SKILL.md first
     │
     ├── Fetches data? ──► use QueryError + skeleton tristate pattern
     │
     └── Done
```