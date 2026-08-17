---
name: monolith-project-structure
description: Understand and navigate the TanStack Start Monolith project structure, directory patterns, and architectural rules.
---

# Monolith Project Structure Skill

This skill documents the project structure, directory patterns, and architectural rules for the TanStack Start Monolith template. Use this to ensure all new code follows the established conventions.

## 🏗️ Core Directory Structure

All code is organized within the `src/` directory, following a feature-based modular approach.

### 🧩 `src/features/` (Feature Modules)
Each major application feature gets its own directory.
- `[feature]/components/`: Feature-scoped UI components (one component per file).
- `[feature]/hooks/`: Hooks for data fetching (`use-[actor]-[feature]-queries.ts`) and mutations (`use-[actor]-[feature]-mutations.ts`).
- `[feature]/store/`: Feature-scoped Zustand stores for UI state (NOT server data).
- `[feature]/types/`: TypeScript types and interfaces (usually `index.ts`).
- `[feature]/validations/`: Zod schemas (`schema/`) and validation rules (`rules/`).
- `[feature]/config/`: Feature-specific constants, enums, and dropdown options.

### 🌐 `src/integrations/` (Third-Party & Core Shared Services)
- `trpc/`: tRPC router setup and the root router.
  - `routers/[feature].router.ts`: One file per feature module for all data queries and mutations.
- `tanstack-query/`: Global Query Client and context providers.
- `better-auth/`: Base authentication components (like `header-user.tsx`).

### 📦 `src/components/` (Shared UI)
Generic, feature-unaware components.
- `feedback/`: Error states (`QueryError.tsx`), skeletons, and empty states.
- `ThemeToggle.tsx`, `NotFound.tsx`, etc.

### 🛣️ `src/routes/` (Page Routes)
TanStack Start file-based routing (`.tsx` files in `src/routes`).
- **Rules**: Keep page files thin. They should purely compose feature components.
- **Auth**: Handle `beforeLoad` checks using server functions from `@/features/auth/functions`.

### 🗄️ `prisma/models/` (Database Schema)
Multi-file schema structure.
- `[feature].prisma`: One file per feature domain.
- `schema.prisma`: Global generator/datasource config - **DO NOT MODIFY**.
- `auth.prisma` & `user.prisma`: Base models - **DO NOT MODIFY**.

---

## 📜 Naming & Suffix Conventions

Stick to these suffixes to maintain consistency:

| Suffix | Purpose | Example |
| :--- | :--- | :--- |
| `.router.ts` | tRPC router definition | `orders.router.ts` |
| `.functions.ts` | `createServerFn` (Auth ONLY) | `auth.functions.ts` |
| `.store.ts` | Zustand store | `ui.store.ts` |
| `.schema.ts` | Zod validation schema | `create-order.schema.ts` |
| `.config.ts` | Constants, enums, dropdown options | `navigation.config.ts` |
| `.types.ts` | TypeScript interfaces | `api.types.ts` |

---

## ⚖️ Responsibility Split

| Concern | Tool | Location |
| :--- | :--- | :--- |
| **Data Queries (GET)** | tRPC `query` | `[feature].router.ts` |
| **Data Mutations** | tRPC `mutation` | `[feature].router.ts` |
| **Auth Checks** | `assertAuthenticatedFn` | `beforeLoad` in route file |
| **Role Checks** | `assertAuthenticatedRoleFn` | `beforeLoad` in route file |
| **Redirects** | `redirectAuthenticatedUserFn` | `beforeLoad` in route file |

---

## 🚫 Critical Rules

- **Never** use tRPC for auth checks.
- **Never** use `createServerFn` for data fetching.
- **One component per file**. Defined each component in its own file under `features/[feature]/components`.
- **ErrorBoundary**: Every feature-level component must be wrapped in an `ErrorBoundary` (from `@/errors/ErrorBoundary`).
- **Prisma Import**: Always import from `prisma/generated/client`, never `@prisma/client`.
- **HeroUI v3**: Read `AGENTS.md` and then `.heroui-docs/[component].md` before using any HeroUI component.
