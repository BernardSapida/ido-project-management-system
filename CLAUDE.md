# TanStack Start Monolith Template

## Commands

- **Dev:** `npm run dev` (port 3000)
- **Build:** `npm run build`
- **Lint/Format/Typecheck:** `npm run check` (Biome — runs all)
- **DB migrate:** `npm run db:migrate`
- **DB push (no migration):** `npm run db:push`
- **DB generate client:** `npm run db:generate`
- **DB studio:** `npm run db:studio`

## Stack

- **Framework:** TanStack Start (React 19, file-based routing via TanStack Router)
- **UI:** HeroUI v3 + Tailwind CSS v4 — compound component pattern, no Provider needed
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod v4 + `@hookform/resolvers`
- **Server state:** TanStack Query
- **Client state:** Zustand
- **API:** tRPC v11 (routers in `src/integrations/trpc/`)
- **Auth:** Better Auth (server in `src/features/auth/utils/better-auth.ts`, client in `auth-client.ts`)
- **ORM:** Prisma v7 + PostgreSQL (`src/lib/prisma.ts`)
- **Env validation:** T3Env (`src/env.ts`) — import `env` from there, never `process.env` directly
- **Linter/Formatter:** Biome

## Environment Variables

Use **`.env` or `.env.local`** — Vite loads both and `.env.local` wins. Both are
gitignored (`.env` directly, `.env.local` via `*.local`). See `.env.example`.

```
BETTER_AUTH_SECRET=
VITE_BASE_URL=http://localhost:4000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SERVER_URL=            # optional
```

Note the `db:*` scripts hardcode `dotenv -e .env.local`, so they read nothing if
you only have `.env`. Either keep a `.env.local`, or run
`npx dotenv -e .env -- prisma ...` directly.

## File uploads (S3)

Wired and ready; add four variables and it works. Full console runbook —
bucket policy, CORS, IAM — is `../infrastructure/docs/aws/s3-setup.md`.

```
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

All four or none. Leave them blank and the app runs normally; only an upload
fails, naming the missing ones. **Server only — never a `VITE_` prefix.**

Verify the setup at `/components/s3-upload` (the **S3 upload** lab), signed in as
an ADMIN. It is the smallest thing that proves the bucket, credentials, policy
and CORS rule are all correct.

### Uploads are deferred to submit

Dropping a file does **not** touch the network. It is parked in
`lib/pending-uploads.ts` under an object URL that travels through the form where
a real S3 URL would sit; the bytes move when the author saves. Uploading on drop
means every picture somebody dropped and thought better of is already in the
bucket with nothing pointing at it.

Four pieces, and a form needs all four:

| File | Role |
|---|---|
| `lib/use-deferred-upload.ts` | `useDeferredUpload(folder)` — the `UploadHandler` you hand `AppFileUpload`. Parks, does not send |
| `lib/use-uploading-submit.ts` | `useUploadingSubmit` — flush → rewrite → save → release, in that order |
| `lib/pending-uploads.ts` | The registry, plus `pendingUrlsIn` / `withUploadedUrls` / `storedImageUrl` |
| `lib/use-s3-upload.ts` | `useS3Uploader` — presign then PUT with real byte progress |

**Put `storedImageUrl` on every stored field an image URL can reach** (the
server's shape, not the form's). It rejects `blob:` URLs, so a flush that never
ran fails at the boundary instead of saving a record whose image is permanently
blank.

Add a prefix to `UPLOAD_FOLDERS` per feature that uploads — it becomes the key
prefix, and it is what a lifecycle rule or bulk cleanup selects on.

### Cleaning up orphans

`npm run s3:sweep` (dry run; `-- --delete` to act) removes objects no row
references and older than 24h. **It refuses to run until you fill in
`REFERENCE_SOURCES` in `scripts/s3-sweep.ts`** — with no sources every object
looks unreferenced, and a delete would empty the bucket.

`src/lib/image-urls.ts` is where "which images does this record use" belongs,
read by both the sweep and your delete handlers. A URL it fails to report is an
image the sweep deletes out from under a live record — rich-text bodies are
where this bites, since images embedded mid-sentence live in a Json column.

## Project Structure

```
src/
  components/
    ui/          # Display-only, no RHF, each has className prop
    form/        # RHF-bound, generic <T extends FieldValues>, useController
    composite/   # Composed of ui + form (e.g. DataTableCard, FormModal, AppForm)
    feedback/    # Toast, QueryError
  features/      # Feature-based: auth/, user/, admin/ — each has api/, hooks/, validations/
  integrations/
    trpc/        # init.ts, router.ts, react.ts, routers/
  hooks/         # Shared hooks (use-debounce, useRouteBreadcrumbs, etc.)
  lib/           # prisma.ts, schemas/, status-maps/
  store/         # Zustand stores (auth.store.ts, ui.store.ts)
  config/        # navigation.config.ts, seo.config.ts, query-client.ts
  types/         # Shared TS types
  utils/         # cn.ts (class merging), format.ts, config.ts
  routes/        # TanStack Router file-based routes
  env.ts         # T3Env validated environment
```

## Component Conventions

There are exactly **two** kinds of component, and which one you are writing
decides where the file goes:

| | Lives in | Who owns it |
|---|---|---|
| **Component Labs** | `@bernardsapida/web-ui` (installed) | project-template. Upgraded with `pnpm up --latest`, replaced wholesale |
| **Project Components** | `src/components/project/<Name>/` | this project. Never synced, never overwritten |

**Never edit a Component Lab from here** - `pnpm up` will wipe it. When one has
to behave differently, wrap it in `components/project/`. `ThemeToggle` is the
worked example: `AppThemeToggle` is props in, markup out, and the binding to
`ui.store` lives in the wrapper.

Import Component Labs from `@bernardsapida/web-ui` and this project's own from
`@/components/project`. Domain-specific components stay in
`features/<domain>/components/`; promote to `components/project/` only when a
second domain needs one.

Every folder has an `index.ts` barrel, and every Project Component is exported
from `components/project/index.ts`.

### Every Project Component gets a lab

Add the component and its lab **in the same change**. A lab is the only place a
component's states are all visible at once, so a component without one has never
actually been looked at.

Four files:

1. `src/components/project/<Name>/` - the component, plus its `index.ts`, plus
   the export in `components/project/index.ts`
2. `src/routes/(references)/components/<slug>.tsx` - the lab page. Copy the
   shape of an existing one: `createFileRoute`, `head` with a noindex meta,
   `staticData.breadcrumb`, then an `AppPageHeader` and one section per thing
   worth checking
3. `src/features/labs/labs.registry.ts` - one `LabEntry`, in the
   `Project Components` group (see below)
4. `src/features/labs/labs.status.json` - optional. A lab with no entry is
   `pending`, which is the honest default; a human flips it to `complete`

Then `pnpm generate-routes`, or let the dev server do it.

**The lab goes under a `Project Components` heading, pinned FIRST in
`LAB_GROUPS`** - above the fifteen alphabetical groups that mirror the Labs
Component Checklist. That group is the only place the sidebar shows the
ownership split. Filed under `Data display`, a project component sits between
two package components and reads as one - and that is how somebody ends up
trying to fix it by editing the package, or losing an edit to the next upgrade.
Sort labs A-Z inside the group, like every other group.

None of this can reach `@bernardsapida/web-ui`. The package is built from
`libs/web/ui/src` in project-template and ships `dist` alone; this project only
installs it. Nothing here is published.

### All text goes through `<Typography type="…" />`

HeroUI's `Typography`, imported raw from `@heroui/react`. There is no
`AppTypography` and there is never going to be one - the type scale IS HeroUI's
(`h1`-`h6`, `body`, `body-sm`, `body-xs`, `code`), and a wrapper would only be a
second name for the same thing.

```tsx
import { Typography } from "@heroui/react";

<Typography type="h2">Billing</Typography>
<Typography color="muted" type="body-sm">Updated 2 minutes ago.</Typography>
```

- **`type` is chosen by what the text IS, not by how big it should look.**
  `h1`-`h6` for titles, `body` / `body-sm` / `body-xs` for paragraphs and
  supporting copy, `code` for code. Reaching for `h4` because it happens to be
  the right size for a caption is the failure this rule exists to stop.
- `Typography.Heading level={n}` renders a real `<h1>`-`<h6>` element - use it
  when the text is a heading in the document outline, not only in the type
  scale. `Typography` alone renders a `<span>`, which is right for a label that
  merely looks large.
- `align`, `color="muted"`, `truncate` and `weight` are props. Do not reach for
  `text-sm text-muted font-semibold` to say something the props already say.
- **The one exception: a text style the design sets explicitly.** When Figma
  gives a piece of text its own size / weight / line-height, that value wins -
  set it on the element. Landing pages, hero copy and CTAs are where this
  happens. Where Figma sets nothing, it is `Typography`; never invent a size.

**Breadcrumbs:** Use `useRouteBreadcrumbs` + add `staticData: { breadcrumb: "Label" }` to route definitions

**Status chips:** Use `StatusChip` with a `statusMap` from `src/lib/status-maps/`

## HeroUI v3 Rules

- **Compound components always:** `<Card><Card.Header>` not `<Card title="x">`
- **No Provider** — HeroUI v3 needs none
- **Semantic variants:** `primary`, `secondary`, `tertiary`, `danger`, `ghost` — no raw colors
- **Use `onPress`** not `onClick`
- **Always fetch docs before implementing** a new HeroUI component:
  ```bash
  node .claude/skills/heroui-react/scripts/get_component_docs.mjs ComponentName
  ```

## Code Rules (Biome enforced)

- JSX attributes must be **alphabetically sorted**
- Use `Number.isNaN()` — never `isNaN()`
- No `as any` — use `Record<string, unknown>` or proper generics
- No unused variables or parameters
- `forEach` callbacks must not return values — use `for...of` if you need early returns

## Path Aliases

`@/*` resolves to `src/*`:
- `@/components/ui` → `src/components/ui`
- `@/integrations/trpc/router` → `src/integrations/trpc/router`

## tRPC Pattern

- Routers live in `src/integrations/trpc/routers/` and `src/features/*/api/`
- Use `useTRPC` from `src/integrations/trpc/react.ts` in components
- Procedures use TanStack Query integration (`useSuspenseQuery`, `useMutation`)

## Auth Pattern

- Session check: `src/features/auth/lib/session.ts`
- Client-side: `authClient` from `src/features/auth/utils/auth-client.ts`
- Auth store: `src/store/auth.store.ts` (Zustand)
- Protected routes check session in loader, redirect to `/sign-in` if unauthenticated

## Skills

- **HeroUI v3:** `.claude/skills/heroui-react/` — use scripts to fetch component docs before implementing
