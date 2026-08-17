# TanStack Start Skill

## Pre-Execution Check (Run Before Every Task)

Before writing any code, answer these four questions:

1. **Is this new code or existing code?**
   - New → activate **Build Mode**
   - Existing → check for Audit Mode triggers

2. **Should I activate Audit Mode?**
   - Activate if task includes: `refactor`, `improve`, `fix`, `optimize`, `review`, `audit`
   - Default: Build Mode

3. **Do I need to read references?**
   - Use the table in [Reference Decision Matrix](#reference-decision-matrix) to decide

4. **What execution context applies?**
   - Server-only / Client-only / Isomorphic / SSR+Client — see [Execution Context Rules](#execution-context-rules)

5. **Am I creating or modifying a route file (`src/routes/**`)?**
   - Yes → run [Rendering Strategy Check](#rendering-strategy-check) before writing the route
   - No → skip

---

## Mode System

### 🟢 Build Mode
- Creating new features from scratch
- Focus: correct implementation from the start, minimal complexity
- Trust the spec; implement the happy path cleanly

### 🔴 Audit Mode (Senior Review)
- Triggered by: `refactor`, `improve`, `fix`, `optimize`, `review`, `audit`
- Assume existing code **may be wrong**
- Aggressively detect and rewrite architectural issues
- Do NOT preserve incorrect patterns — correctness > minimal diff

**Audit Mode Process:**

**ANALYZE** — Determine execution context for every file touched:
- Is it isomorphic, server-only, or client-only?
- What is its boundary role?

**DIAGNOSE** — Check for these violations:
- [ ] Loader treated as server-only (loaders are isomorphic)
- [ ] `process.env` secrets accessed in loaders or components (not wrapped in `createServerFn`)
- [ ] `import.meta.env` used without `VITE_` prefix in client code
- [ ] This project uses T3Env (`src/env.ts`) — `process.env` or `import.meta.env` must never be used directly; always import `env` from `@/env`
- [ ] Browser APIs (`localStorage`, `window`, `document`) called during SSR
- [ ] Hydration mismatch sources: `Date.now()`, `Math.random()`, `Intl`, locale/timezone divergence
- [ ] Mixed barrel exports combining server-only and client-safe code
- [ ] Server-only file imported outside a `createServerFn` handler (import protection violation)
- [ ] Client-only code in a server context without `<ClientOnly>` or `createClientOnlyFn`
- [ ] Auth/session checks done in components instead of `beforeLoad`/`loader`
- [ ] Middleware context data passed from client to server without server-side validation

**REFACTOR** — Rewrite using correct TanStack Start patterns. Do not patch around violations.

**VERIFY** — Confirm after rewrite:
- [ ] All execution boundaries are correct
- [ ] No hydration risk remains
- [ ] Env access uses `env` from `@/env` (T3Env) for all vars
- [ ] Server-only secrets never reach the client bundle

**Priority Rule:** SKILL.md rules override existing code patterns. Never preserve incorrect patterns.

---

## Execution Context Rules

### Isomorphic (runs on both server and client)
- Route `loader` and `beforeLoad` — always isomorphic
- Shared utilities, formatters, business logic
- Zod schemas, type definitions

### Server-Only
Use `createServerFn()` for RPC (callable from client via network):
```tsx
const getUser = createServerFn({ method: 'GET' })
  .inputValidator(UserSchema)
  .handler(async ({ data }) => {
    return await db.users.findUnique({ where: { id: data.id } })
  })
```

Use `createServerOnlyFn()` for utilities that must never run on client:
```tsx
const getSecret = createServerOnlyFn(() => env.DATABASE_URL)
```

Use `.server.*` file suffix for modules that must never enter the client bundle.

### Client-Only
Use `createClientOnlyFn()` for browser utilities:
```tsx
const saveToStorage = createClientOnlyFn((key: string, val: unknown) => {
  localStorage.setItem(key, JSON.stringify(val))
})
```

Use `<ClientOnly fallback={...}>` for components using browser APIs.

Use `useHydrated()` for conditional rendering based on hydration state.

### Isomorphic with Split Behavior
Use `createIsomorphicFn()` when the same logical operation has different implementations per environment:
```tsx
const logger = createIsomorphicFn()
  .server((msg) => console.log(`[SERVER]: ${msg}`))
  .client((msg) => console.log(`[CLIENT]: ${msg}`))
```

---

## Critical Anti-Patterns (Never Do These)

| ❌ Wrong | ✅ Correct |
|----------|------------|
| `process.env.SECRET` in a loader | Wrap in `createServerFn` handler |
| `process.env.*` anywhere | Import `env` from `@/env` (T3Env) |
| `import.meta.env.NON_VITE_VAR` in client | Use `VITE_` prefix for client vars |
| `localStorage` in a component without guard | Use `createClientOnlyFn` or `<ClientOnly>` |
| `new Date().toLocaleString()` in render | Use `useEffect` + `useState`, or `<ClientOnly>` |
| Loader accessing `process.env` for secrets | Loader is isomorphic — use `createServerFn` instead |
| Barrel export mixing server + client code | Split into separate entry files |
| Auth check inside a component | Do it in `beforeLoad`; throw `redirect` |
| Client context sent to server without validation | Validate with Zod in `.server()` middleware |
| `createServerFn` with dynamic `import()` | Always use static imports for server functions |

---

## Environment Variables

This project uses **T3Env** (`src/env.ts`). Always import `env` from there.

```tsx
// ✅ Correct — always
import { env } from '@/env'
const val = env.DATABASE_URL      // server-only var
const pub = env.VITE_BASE_URL     // client-safe var

// ❌ Never use these directly
process.env.DATABASE_URL
import.meta.env.VITE_BASE_URL
```

Server vars: no prefix, accessed only inside `createServerFn` handlers or `createServerOnlyFn`.
Client vars: `VITE_` prefix, safe in components.
Runtime client vars: pass from server to client via loader data.

---

## Hydration Error Prevention

When output could differ between server and client render:

**Strategy 1 — Match server and client** (preferred): compute via server function, pass through loader
**Strategy 2 — Let client report its context**: set cookies on first visit via `useEffect`, server uses UTC until cookie arrives
**Strategy 3 — Client-only wrap**: `<ClientOnly fallback={<span>—</span>}><RelativeTime /></ClientOnly>`
**Strategy 4 — Selective SSR**: `ssr: 'data-only'` (data fetches server-side, component renders client-side) or `ssr: false`
**Strategy 5 — Last resort**: `suppressHydrationWarning` on leaf nodes only

---

## Route Patterns

### File-based routing
```
src/routes/
  __root.tsx          # always rendered, document shell goes here
  index.tsx           # /
  posts.tsx           # /posts layout
  posts/$postId.tsx   # /posts/:postId
  posts/$postId/      # nested children
  api/users.ts        # server route at /api/users
```

`__root.tsx` must include `<HeadContent />` in `<head>` and `<Scripts />` in `<body>`.

### Route definition
```tsx
export const Route = createFileRoute('/posts/$postId')({
  // SSR control
  ssr: true,           // default: full SSR
  ssr: 'data-only',    // data on server, component on client
  ssr: false,          // full client render

  // Runs on server (initial) + client (navigation) — isomorphic
  beforeLoad: async ({ context, params }) => {
    // auth checks go here — throw redirect() if unauthenticated
  },
  loader: async ({ params }) => {
    return await getPost({ data: { id: params.postId } }) // via createServerFn
  },

  component: PostComponent,
  errorComponent: PostError,
  pendingComponent: PostSkeleton,
})
```

### Protected routes
```tsx
beforeLoad: async ({ context }) => {
  if (!context.user) throw redirect({ to: '/sign-in' })
}
```

### Breadcrumbs (project convention)
```tsx
export const Route = createFileRoute('/posts')({
  staticData: { breadcrumb: 'Posts' },
  ...
})
```

---

## Server Functions

### Basic pattern
```tsx
// src/features/posts/api/posts.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { getPostById } from './posts.server'

export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return getPostById(data.id)
  })
```

### File organization
```
src/features/posts/
  api/
    posts.functions.ts   # createServerFn wrappers — safe to import anywhere
    posts.server.ts      # DB queries / server-only helpers — never import in client
  hooks/
    use-posts.ts         # TanStack Query hooks using useTRPC or useServerFn
  validations/
    posts.schema.ts      # Zod schemas — isomorphic
```

### Calling from components
```tsx
// In a loader
loader: () => getPost({ data: { id: params.postId } })

// In a component (mutation)
const handleSubmit = useServerFn(savePost)
```

### Error/redirect in server functions
```tsx
import { redirect, notFound } from '@tanstack/react-router'

// Redirect
throw redirect({ to: '/sign-in' })

// 404
throw notFound()

// Validation error — return, don't throw
return { error: 'Invalid input' }
```

---

## Server Routes (HTTP endpoints)

Use when you need raw HTTP handling (webhooks, file uploads, OAuth callbacks):

```tsx
// src/routes/api/webhook.ts
export const Route = createFileRoute('/api/webhook')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ ok: true })
      },
    },
  },
})
```

Prefer `createServerFn` over server routes for application data fetching. Use server routes for external-facing HTTP endpoints.

---

## Middleware

### Global middleware (src/start.ts)
```tsx
import { createStart, createMiddleware } from '@tanstack/react-start'

const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await getSession({ headers: request.headers })
  return next({ context: { session } })
})

export const startInstance = createStart(() => ({
  requestMiddleware: [authMiddleware],
  functionMiddleware: [loggingMiddleware],
}))
```

### Server function middleware
```tsx
const fn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.session is available
  })
```

### Security: validate client-sent context on server
```tsx
.client(async ({ next, context }) => {
  return next({ sendContext: { workspaceId: context.workspaceId } })
})
.server(async ({ next, context }) => {
  const workspaceId = z.string().parse(context.workspaceId) // validate
  return next()
})
```

---

## Import Protection

Naming convention enforced by the build:
- `*.server.ts` → blocked from client bundle
- `*.client.ts` → blocked from server bundle
- `import '@tanstack/react-start/server-only'` → marks any file as server-only
- `import '@tanstack/react-start/client-only'` → marks any file as client-only

Avoid mixed barrels. Split server-only and client-safe exports into separate entry points.

When you see an import protection violation, fix the root cause — do not suppress.

---

## Rendering Strategy Check

**Only run when creating or modifying a route file (`src/routes/**`).**

### Step 1 — Classify the route

Answer the first question that matches, then look up the `ssr` value in the [Selective SSR Decision](#selective-ssr-decision) table below:

- Is the page SEO-critical or needs fast initial HTML? → `ssr: true`
- Does the component depend on browser APIs (`canvas`, `localStorage`, `window`)? → `ssr: false`
- Does the route fetch server-side data but render a dynamic/interactive component? → `ssr: 'data-only'`
- Is the entire app a static shell with no SSR server? → SPA mode

### Step 2 — Default

If no condition above applies clearly: **omit `ssr` entirely.** The default is `ssr: true` and is correct for most routes.

### Step 3 — Escalate only if needed

Read extra references only when one of these is true:
- Performance is a stated requirement for this route
- The page is explicitly public-facing and SEO is a concern
- Data update frequency is unclear and ISR/static prerendering may apply
- A hydration or loading issue is already occurring

→ Then read: `selective-ssr.md`, `spa-mode.md`, `static-prerendering.md`, `isr.md`

### Step 4 — Guard rails

- Do NOT disable SSR without a clear reason — `ssr: true` is the safe default
- Do NOT use SPA mode globally for a single problematic route — use `ssr: false` per-route instead
- Do NOT ignore ISR/caching for content that changes infrequently

---

## Selective SSR Decision

| Situation | Use |
|-----------|-----|
| SEO-critical, stable render | `ssr: true` (default) |
| Component uses browser APIs | `ssr: false` |
| Data needed server-side, component dynamic | `ssr: 'data-only'` |
| Hydration mismatch, no fix available | `ssr: false` or `ssr: 'data-only'` |
| Entire app is SPA-style | SPA mode in `vite.config.ts` |

---

## Reference Decision Matrix

Read a reference file when the task involves that topic. Do not read references for topics not involved.

| Task involves... | Read this reference |
|-----------------|---------------------|
| Where code runs, server vs client | `execution-model.md`, `code-execution-patterns.md` |
| `createServerFn`, server data fetching | `server-functions.md` |
| Route files, `createFileRoute`, loaders | `routing.md` |
| `*.server.*` files, import errors | `import-protection.md` |
| Hydration warning / mismatch | `hydration-errors.md` |
| Env vars, `process.env`, `VITE_` | `environment-variables.md` |
| `createMiddleware`, auth middleware | `middleware.md` |
| `ssr:` property, per-route SSR control | `selective-ssr.md` |
| HTTP endpoints, webhooks, REST | `server-routes.md` |
| `createIsomorphicFn`, `createServerOnlyFn`, `createClientOnlyFn` | `environment-functions.md` |
| Error boundaries, `errorComponent` | `error-boundaries.md` |
| Auth patterns, session, login/logout | `authentication.md`, `authentication-overview.md` |
| SPA mode, disabling SSR globally | `spa-mode.md` |
| Static generation, ISR | `static-prerendering.md`, `isr.md` |
| CDN assets, public URLs | `cdn-asset-urls.md` |
| SEO, `<head>` tags | `seo.md` |
| Observability, tracing | `observability.md` |
| Database access patterns | `databases.md` |
| Server entry point customization | `server-entry-point.md` |
| Client entry point customization | `client-entry-point.md` |
| Server components (RSC) | `server-components.md` |
| Cached/static server functions | `static-server-functions.md` |

References are in: `agent-resources/references/tanstack-start/`

---

## This Project's Stack Constraints

When implementing for this project, these conventions override generic TanStack Start patterns:

- **Env vars**: Always import `env` from `@/env` (T3Env). Never use `process.env` or `import.meta.env` directly.
- **API layer**: Use tRPC (`src/integrations/trpc/`) for application data; `createServerFn` for one-off server operations.
- **Auth**: Better Auth — server in `src/features/auth/utils/better-auth.ts`, client in `auth-client.ts`, store in `src/store/auth.store.ts`.
- **ORM**: Prisma v7 via `src/lib/prisma.ts` — DB access only inside `*.server.ts` files or `createServerFn` handlers.
- **UI**: HeroUI v3 + Tailwind v4 — fetch component docs before implementing new HeroUI components.
- **Forms**: React Hook Form + Zod v4 — form components in `src/components/form/`.
- **Protected routes**: Check session in `beforeLoad`; throw `redirect({ to: '/sign-in' })` if unauthenticated.
- **Breadcrumbs**: Set `staticData: { breadcrumb: 'Label' }` on route definitions; use `useRouteBreadcrumbs` hook.
