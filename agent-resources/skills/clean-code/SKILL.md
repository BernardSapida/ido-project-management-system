---
name: clean-code
description: Use this skill when writing, reviewing, or refactoring any component, hook, utility, or feature in this project. Trigger on any mention of refactor, improve, review, clean up, audit, or when creating new non-trivial code. Establishes naming, structure, TypeScript, state, imports, and error logging standards for this codebase.
---

# Clean Code Skill

Apply these rules to every file you write or touch. Rules are ordered by impact — read all of them before writing a single line.

---

## Component Reusability Rules

- **All feature-specific components must be colocated inside:**
/features/[featureName]/components/

- **Never place feature components in global `/components`**
→ Global `/components` is reserved only for truly reusable, design-system-level UI.

---

### When to Create a New Component

Create a component when:
- A UI block takes more lines or used **more than once**
- A section becomes **visually or logically distinct**
- A piece of UI has a **single clear responsibility**
- A part is section **even static only**

---

### When NOT to Extract a Component

Avoid extracting when:
- It is still tightly coupled to surrounding logic
- Extraction makes the code harder to read instead of clearer

---

### Reuse Boundaries

| Scope | Rule |
|------|------|
| Within same component | Keep inline |
| Within same feature | Extract to `/features/[feature]/components` |
| Across multiple features | Consider moving to `/components` (global UI) |

---

### Composition Rule

Prefer **composition over configuration-heavy props**:

```tsx
// ❌ Too configurable, harder to maintain
<UserCard variant="compact" showAvatar showActions />

// ✅ Composed, explicit, reusable parts
<UserCard>
  <UserAvatar />
    <UserInfo />
  <UserActions />
</UserCard>

## 1. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case` | `user-profile.tsx` |
| Components | `PascalCase` | `UserProfile` |
| Hooks | `useCamelCase` | `useUserProfile` |
| Utilities | `camelCase` | `formatDate` |
| Zod schemas | `camelCase + Schema` | `updateProfileSchema` |
| Types/Interfaces | `PascalCase` | `UserProfile` |
| Boolean vars/props | `is*`, `has*`, `can*` | `isLoading`, `hasError` |
| Event handlers (internal) | `handle*` | `handleSubmit` |
| Event handler props | `on*` | `onSuccess` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |

**Names must be self-describing.** If you need a comment to explain what a variable is, rename it instead.

---

## 2. Component Structure Order

Every component file follows this exact order — no exceptions:

```tsx
// 1. External imports
import { useState } from 'react'
import { Button } from '@heroui/react'

// 2. Internal imports
import { useUserProfile } from '@/features/user/hooks/use-user-profile'
import { formatDate } from '@/utils/format'

// 3. Types
interface UserCardProps {
  userId: string
  onSuccess?: () => void
}

// 4. Constants (if any)
const MAX_NAME_LENGTH = 50

// 5. Component
export function UserCard({ userId, onSuccess }: UserCardProps) {
  // 5a. Hooks first
  const { data, isLoading } = useUserProfile(userId)

  // 5b. Derived state
  const displayName = data?.name ?? 'Unknown'

  // 5c. Handlers
  function handleEdit() { /* ... */ }

  // 5d. Render
  return <div>{displayName}</div>
}

// 6. Sub-components (only if small and tightly coupled), this should be stored in separate file "component" and not within.
function UserCardSkeleton() {
  return <div />
}
```

---

## 3. TypeScript Hygiene

- **No `any`** — use `Record<string, unknown>`, proper generics, or `unknown`
- **No `as` casts** without a comment explaining why it's safe
- **Derive types from source of truth** — never duplicate:
  ```ts
  type FormData = z.infer<typeof schema>              // from Zod
  type ButtonVariant = ComponentProps<typeof Button>['variant']  // from HeroUI
  ```
- **No redundant type annotations** when TypeScript can infer:
  ```ts
  // ❌
  const count: number = 0
  // ✅
  const count = 0
  ```
- **Props interfaces over inline types** for reusability and readability
- **Never use `!` non-null assertion** — handle the null case explicitly

---

## 4. Function & Hook Design

- **One responsibility per function** — if you need "and" to describe what it does, split it
- **Extract to a hook** when a component exceeds ~80 lines of logic
- **No nested function definitions** that recreate on every render — define outside the component or use `useCallback` only when passing to a memoized child
- **Hooks only at top level** — never inside conditionals, loops, or callbacks
- **Return early** instead of deeply nested conditionals:
  ```ts
  // ❌
  function getLabel(status: string) {
    if (status) {
      if (status === 'active') {
        return 'Active'
      }
    }
  }

  // ✅
  function getLabel(status: string) {
    if (!status) return ''
    if (status === 'active') return 'Active'
    return ''
  }
  ```

---

## 5. State Placement Rules

Escalate only when necessary — always start at local state:

| State type | Use |
|-----------|-----|
| Ephemeral UI state (open/closed, hover) | `useState` in the component |
| Shared UI state (sidebar, theme) | Zustand (`src/store/ui.store.ts`) |
| Auth state | Zustand (`src/store/auth.store.ts`) |
| Server data (fetching, caching) | TanStack Query via tRPC |
| Form state | React Hook Form — never `useState` for form fields |
| URL state (filters, pagination) | TanStack Router search params |

**Colocation rule:** state lives as close to where it's used as possible. Don't lift state to a global store just because it's "cleaner" — that's premature abstraction.

---

## 6. Import Hygiene

- **Always use path aliases** — never relative `../../`:
  ```ts
  // ❌
  import { Button } from '../../../components/ui/button'
  // ✅
  import { Button } from '@/components/ui/button'
  ```
- **Import from barrel exports** for `ui/` and `form/` folders:
  ```ts
  import { AppTextField, AppSelect } from '@/components/form'
  ```
- **Never mix server and client exports** in a barrel — split into separate entry files
- **Group imports:** external → internal → types. One blank line between groups.
- **No unused imports** — Biome enforces this, but don't introduce them in the first place

---

## 7. Simplicity Heuristics

- **Three-strikes rule:** write the thing twice inline before abstracting it. Three usages justify a shared utility.
- **No defensive error handling for impossible states** — don't add `try/catch` around code that can't throw
- **No feature flags or backwards-compat shims** — change the code directly
- **No half-finished implementations** — if it's not ready, don't commit it
- **No premature optimization** — no `useMemo`/`useCallback` without a measured perf problem
- **Three similar lines is better than a premature abstraction** — duplication is cheaper than the wrong abstraction

---

## 8. Project-Specific Anti-Patterns

| ❌ Never do | ✅ Do instead |
|------------|--------------|
| `process.env.X` or `import.meta.env.X` | `import { env } from '@/env'` |
| Raw HeroUI inputs in forms (`<Input>`, `<Select>`) | Use `App*` wrappers from `@/components/form` |
| `onClick` on HeroUI components | `onPress` |
| Custom `<p className="text-red-500">` for form errors | `isInvalid` + `errorMessage` props |
| `register` with HeroUI inputs | `Controller` + `useController` |
| Auth check inside a component | `beforeLoad` in the route definition |
| `localStorage` / `window` in a component directly | `createClientOnlyFn` or `<ClientOnly>` |
| `console.log` left in committed code | Remove before commit |
| Empty `catch {}` blocks | Always log or rethrow |
| `isNaN()` | `Number.isNaN()` |
| `as any` | `Record<string, unknown>` or proper generic |

---

## 9. Biome-Enforced Rules (will fail lint)

These are not optional — Biome will reject them on `npm run check`:

- JSX attributes must be **alphabetically sorted**
- `Number.isNaN()` — never `isNaN()`
- No `as any`
- No unused variables or imports
- `forEach` callbacks must not return values — use `for...of` when you need early returns

Run `npm run check` before considering any task done.

---

## 10. Comments

Default: **write no comments.**

Only add a comment when the WHY is non-obvious:
- A hidden constraint or external requirement
- A workaround for a specific library bug
- A subtle invariant that would surprise a reader

Never write comments that describe WHAT the code does — well-named identifiers already do that.

---

## 11. Error Logging

Never swallow errors silently. Every `catch` block must either log or rethrow.

For concrete logging patterns (logger utility, server vs client, correlation IDs, Prisma error helpers, what never to log):

**Read: `agent-resources/clean-code/references/error-logging-patterns.md`**
