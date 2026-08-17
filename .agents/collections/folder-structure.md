# Folder Structure

> **Stack:** TanStack Start · HeroUI v3 · React Hook Form · Zod · tRPC · Prisma · Better Auth · Zustand · TypeScript strict

---

## Directory Tree

```
src/
├── components/
│   ├── ui/                            # Display-only HeroUI wrappers — no RHF, no domain logic
│   │   ├── AppAccordion.tsx
│   │   ├── AppAlert.tsx
│   │   ├── AppAlertDialog.tsx
│   │   ├── AppAvatar.tsx
│   │   ├── AppBadge.tsx
│   │   ├── AppBreadcrumbs.tsx
│   │   ├── AppChip.tsx
│   │   ├── AppDropdown.tsx
│   │   ├── AppInputGroup.tsx
│   │   ├── AppInputOTP.tsx
│   │   ├── AppModal.tsx
│   │   ├── AppPagination.tsx
│   │   ├── AppPopover.tsx
│   │   ├── AppProgressBar.tsx
│   │   ├── AppProgressCircle.tsx
│   │   ├── AppSpinner.tsx
│   │   ├── AppTable.tsx
│   │   ├── AppTabs.tsx
│   │   ├── AppTagGroup.tsx
│   │   ├── AppToggleButton.tsx
│   │   ├── AppTooltip.tsx
│   │   ├── AsyncButton.tsx
│   │   ├── StatusChip.tsx
│   │   └── index.ts                   ← barrel export
│   │
│   ├── form/                          # RHF-bound field wrappers — always uses useController
│   │   ├── AppAutocomplete.tsx
│   │   ├── AppCheckbox.tsx
│   │   ├── AppCheckboxGroup.tsx
│   │   ├── AppDatePicker.tsx
│   │   ├── AppDateRangePicker.tsx
│   │   ├── AppNumberField.tsx
│   │   ├── AppRadioGroup.tsx
│   │   ├── AppSearchField.tsx
│   │   ├── AppSelect.tsx
│   │   ├── AppSwitch.tsx
│   │   ├── AppTextArea.tsx
│   │   ├── AppTextField.tsx
│   │   └── index.ts                   ← barrel export
│   │
│   ├── composite/                     # Page-level composites — combines ui/ + form/
│   │   ├── AppForm.tsx
│   │   ├── AppForm.types.ts           ← AppFormField discriminated union
│   │   ├── DataTableCard.tsx
│   │   ├── FormModal.tsx
│   │   └── index.ts                   ← barrel export
│   │
│   ├── feedback/                      # Global feedback utilities
│   │   ├── QueryError.tsx             ← TanStack Query error display
│   │   ├── useToast.ts                ← Toast hook (wraps HeroUI Toast)
│   │   └── index.ts                   ← barrel export
│   │
│   ├── NotFound.tsx                   ← 404 component (used in __root.tsx)
│   └── ThemeToggle.tsx                ← Light/dark/auto theme switcher
│
├── config/
│   ├── navigation.config.ts           ← Sidebar/nav link definitions
│   ├── query-client.ts                ← TanStack Query client setup
│   └── seo.config.ts                  ← App name, meta defaults
│
├── errors/
│   ├── ErrorBoundary.tsx              ← React error boundary wrapper
│   └── error-messages.ts             ← Shared error message constants
│
├── features/                          # Feature-based modules — self-contained
│   ├── admin/
│   │   ├── api/
│   │   │   └── admin.router.ts        ← tRPC admin router (server)
│   │   ├── components/
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminStatCard.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── UserTableSkeleton.tsx
│   │   ├── config/
│   │   │   └── admin.config.ts
│   │   └── hooks/
│   │       └── use-admin-admin-queries.ts
│   │
│   ├── auth/
│   │   ├── functions/
│   │   │   └── auth.functions.ts      ← TanStack server functions for auth
│   │   ├── hooks/
│   │   │   └── useAuth.ts             ← Auth state hook
│   │   ├── lib/
│   │   │   └── session.ts             ← Session loader helper
│   │   └── utils/
│   │       ├── auth-client.ts         ← Better Auth browser client
│   │       └── better-auth.ts         ← Better Auth server instance
│   │
│   └── user/
│       ├── api/
│       │   └── user.router.ts         ← tRPC user router (server)
│       ├── hooks/
│       │   └── use-user-profile-mutations.ts
│       └── validations/schema/
│           └── update-profile.schema.ts
│
├── hooks/                             # Shared app-level hooks
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   ├── use-outside-click.ts
│   └── useRouteBreadcrumbs.ts         ← Reads staticData.breadcrumb from route matches
│
├── integrations/
│   ├── better-auth/
│   │   └── header-user.tsx            ← User avatar + dropdown in header
│   ├── tanstack-query/
│   │   ├── devtools.tsx
│   │   └── root-provider.tsx          ← QueryClientProvider wrapper
│   └── trpc/
│       ├── init.ts                    ← tRPC instance + context
│       ├── react.ts                   ← useTRPC hook export
│       ├── router.ts                  ← Root tRPC router (merges feature routers)
│       └── routers/
│           ├── admin.router.ts        ← Admin sub-router
│           └── user.router.ts         ← User sub-router
│
├── lib/
│   ├── prisma.ts                      ← Prisma client singleton
│   ├── schemas/
│   │   ├── common.schema.ts           ← Reusable Zod primitives (requiredString, etc.)
│   │   └── date.schema.ts             ← calendarDateSchema + calendarDateRangeSchema
│   └── status-maps/
│       ├── account-status.ts          ← StatusChip config for account states
│       └── order-status.ts            ← StatusChip config for order states
│
├── routes/                            # TanStack Router file-based routes
│   ├── __root.tsx                     ← Root layout — QueryProvider, Toast, DevTools
│   ├── index.tsx                      ← Landing page (/)
│   ├── about.tsx
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── unauthorized.tsx
│   ├── ui-components.tsx              ← Component showcase / dev reference
│   ├── dashboard.tsx                  ← Dashboard layout + breadcrumb root
│   ├── dashboard/
│   │   ├── index.tsx                  ← /dashboard
│   │   ├── admin.tsx                  ← /dashboard/admin
│   │   └── profile.tsx                ← /dashboard/profile
│   ├── api.trpc.$.tsx                 ← tRPC HTTP handler
│   └── api/auth/$.ts                  ← Better Auth HTTP handler
│
├── store/
│   ├── auth.store.ts                  ← Zustand — current user session state
│   └── ui.store.ts                    ← Zustand — theme mode, sidebar open, etc.
│
├── types/
│   ├── api.types.ts                   ← Shared API response types
│   ├── auth.types.ts                  ← User, Session types
│   └── common.types.ts                ← General shared types
│
├── utils/
│   ├── cn.ts                          ← clsx + tailwind-merge helper
│   ├── config.ts                      ← Runtime config helpers
│   └── format.ts                      ← Date, number, string formatters
│
├── env.ts                             ← T3Env — validated environment variables
├── router.tsx                         ← TanStack Router instance
├── routeTree.gen.ts                   ← Auto-generated (do not edit)
└── styles.css                         ← Global styles + Tailwind + HeroUI imports
```

---

## Folder Rules

### `components/ui/`

- HeroUI wrappers with **no RHF**, no `useController`, no `Control<T>`.
- Every component accepts `className?: string`.
- Props are plain values — no form binding.
- Examples: array-driven UI (`AppTabs`, `AppAccordion`, `AppTable`), overlay UI (`AppModal`, `AppAlertDialog`), display primitives (`AppBadge`, `AppChip`, `AppTooltip`).

### `components/form/`

- Every file uses `useController` internally — generic `<T extends FieldValues>`.
- Callsites only ever pass `name`, `label`, `control` — never `isInvalid`, `onChange`, `value` manually.
- **Nothing outside this folder should import `useController` directly.**
- All field errors come from `fieldState.error?.message` — never passed manually at callsite.
- Form fields that default to `w-full` accept `className` with `?? "w-full"` fallback.

### `components/composite/`

- Combines `ui/` and `form/` into page-level accelerators.
- `AppForm.types.ts` holds the `AppFormField` discriminated union — kept separate from the component to avoid circular imports.

### `components/feedback/`

- `useToast` is called from mutations, form submit handlers, and any action that needs user feedback.
- `QueryError` renders TanStack Query error states with a retry button.

### `features/`

- Each feature is self-contained: `api/`, `components/`, `hooks/`, `validations/`.
- Feature `api/` routers (server-side) are registered in `src/integrations/trpc/router.ts`.
- Feature components are **not** re-exported from `src/components/` — they're used directly by routes.

### `hooks/`

- Shared, domain-agnostic hooks only.
- Feature-specific hooks live inside `features/<name>/hooks/`.
- `useRouteBreadcrumbs` reads `staticData.breadcrumb` from TanStack Router matches — add `staticData: { breadcrumb: "Label" }` to any route that should appear in breadcrumbs.

### `integrations/`

- Third-party integration wiring — setup files, providers, devtools.
- tRPC: `init.ts` creates the tRPC instance; `router.ts` merges all routers; `react.ts` exports `useTRPC`.

### `lib/`

- `prisma.ts` — singleton Prisma client, import from here everywhere.
- `schemas/` — shared Zod schemas used across features.
- `status-maps/` — `StatusChip` is generic; each domain file exports a `statusMap` record passed as a prop.

### `store/`

- Zustand stores for client-side global state.
- `auth.store.ts` — current user, session.
- `ui.store.ts` — theme mode, sidebar state.
- Server state (async data) uses TanStack Query, not Zustand.

### `routes/`

- File-based routing via TanStack Router.
- Route files import from `components/` and `features/` — no inline component definitions in route files.
- Protected routes check session in `loader`, redirect to `/sign-in` if unauthenticated.
- Add `staticData: { breadcrumb: "Label" }` to routes that appear in breadcrumb trails.

---

## Import Convention

```ts
// Always import from barrel
import { AppTextField, AppSelect } from "@/components/form"
import { AppTable, AppModal, AppSpinner } from "@/components/ui"
import { DataTableCard, FormModal } from "@/components/composite"
import { useToast } from "@/components/feedback"

// Environment — never process.env directly
import { env } from "@/env"

// Utilities
import { cn } from "@/utils/cn"
import { useTRPC } from "@/integrations/trpc/react"
```

---

## What Goes Where — Quick Reference

| You're building... | Goes in... |
|---|---|
| RHF-bound field (text, select, switch, date, OTP...) | `components/form/` |
| Display-only HeroUI wrapper (tabs, accordion, badge...) | `components/ui/` |
| Confirm/delete dialog | `components/ui/AppAlertDialog` |
| Status badge with color variants | `components/ui/StatusChip` + `lib/status-maps/` |
| Page section with table + pagination + search | `components/composite/DataTableCard` |
| Modal with a form inside | `components/composite/FormModal` |
| Toast notification | `components/feedback/useToast` |
| Feature-specific component | `features/<name>/components/` |
| Feature-specific hook | `features/<name>/hooks/` |
| tRPC procedure | `features/<name>/api/` → registered in `integrations/trpc/router.ts` |
| Shared Zod schema | `lib/schemas/` |
| Status color config | `lib/status-maps/` |
| Global client state | `store/` (Zustand) |
| Shared type | `types/` |
| Utility function | `utils/` |
| A page or route | `routes/` |

---

*Stack: TanStack Start · HeroUI v3 · React Hook Form · Zod · tRPC · Prisma · Better Auth · Zustand · TypeScript strict*
