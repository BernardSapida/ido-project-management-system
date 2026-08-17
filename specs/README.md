# specs/

One strict-JSON file per page or slice of the **IRMS → IPMS migration**. A spec describes
**what to build**, written before the code, read by whoever implements it.

```
specs/
  001-foundation-schema-roles-permissions.json    NNN-<feature-slug>.json
```

The source system is `../../Projects/IRMS-old` (TanStack Start monolith, HeroUI v2-era
hand-rolled components, Cloudinary uploads). The target is this repo: same stack, but the
UI is assembled from the **Component Labs** in `@bernardsapida/web-ui` and uploads go to
**S3**. Every spec names the old files it was derived from under `source_reference`, so an
implementer can read the original behaviour without guessing.

---

## The four rules every spec in this folder obeys

**1. The frame is `AppLayout`, and no page builds its own.**
`src/routes/_authenticated.tsx` already mounts `AppLayout` + `AppHeader` + `AppSidebar` +
`AppMobileDrawer`. A page spec therefore never lists a layout, a sidebar, a navbar, a
`<main>`, or a breadcrumb bar among its components. A page contributes exactly three things
to the frame:

| | |
|---|---|
| `staticData.breadcrumb` | the trail segment, read by `useRouteBreadcrumbs` |
| `staticData.mainWidth` | `"default" \| "wide" \| "prose" \| "full"` — the content measure |
| `AppPageHeader` | the page's own title/subtitle/action, first thing inside the outlet |

The `app-layout` lab (`/components/app-layout`) is the reference for what the frame decides
versus what a page decides. Anything the lab says belongs to the frame is out of scope for
a page spec.

**2. Component Labs first, HeroUI v3 only for the gap.**
Every component entry carries two keys:

- `lab_components[]` — `App*` names from `@bernardsapida/web-ui`, verbatim. **Check here
  first.** The lab index is `/components`.
- `heroui_components[]` — raw `@heroui/react` names, allowed only where no lab component
  covers the need. Each such entry needs a `heroui_note` saying why the lab does not cover
  it. `Typography` is the standing exception: per `CLAUDE.md` all text goes through
  HeroUI's `Typography` and there is no `AppTypography`.

A component that differs from the lab version is wrapped in `src/components/project/<Name>/`
and gets its own lab page — never edited in the package.

**3. One spec per page (or per shared slice), with flow, requirements and validations.**
`flow` is the human story — actors, happy path, alternate paths. `requirements` is what must
be true, split into `functional`, `authorization` and `ux`. `validations` is the two-sided
gate: the Zod schema on the client and the server guard behind it. A UI gate without a
server guard is a bug, not a feature.

**4. Tests are specified, not written.**
Every spec carries `test_requirements[]` — the files, their type, and what each must cover.
No test code ships with the spec. When you are ready to write them, the list is already
there, including the authorization branches that are the whole point.

---

## Top-level shape

```jsonc
{
  "spec_number": 4,
  "spec_title": "My Requests",
  "feature_name": "user-dashboard",          // kebab-case; maps to src/features/<name>/
  "description": "…",                        // 1-3 sentences: scope + why it exists
  "depends_on": [1, 3],                      // spec numbers that must ship first ([] = none)

  "source_reference": {                      // where this came from in IRMS-old
    "pages": ["src/routes/_authenticated/requests/index.tsx"],
    "files": ["src/features/user-dashboard/…"],
    "docs":  ["flows/01-user-submit-request.md"]
  },

  "flow": {
    "actors": ["USER"],
    "happy_path":      [ { "step": 1, "actor": "USER", "action": "…", "result": "…" } ],
    "alternate_paths": [ { "name": "…", "trigger": "…", "result": "…" } ]
  },

  "database":         { "models": [ … ] },   // required; "models": [] if untouched
  "trpc_procedures":  [ … ],                 // required; [] if none
  "frontend":         { … },                 // required
  "pdf_layout":       { … },                 // optional — PDF specs only
  "seeder":           { … },                 // optional — seeding specs only

  "requirements": {
    "functional":    [ … ],
    "authorization": [ … ],
    "ux":            [ … ]
  },
  "validations": {
    "schemas":       [ … ],
    "server_guards": [ … ]
  },

  "test_requirements": [ … ],
  "acceptance_criteria": [ { "given": "…", "when": "…", "then": "…" } ],
  "edge_cases":   [ … ],
  "out_of_scope": [ … ]
}
```

Key order above is the convention. Keep it identical across files.

### `database`

Same rules as the old `mvps/format.md`:

```jsonc
{
  "name": "Request",
  "action": "create",          // "create" | "extend" | "reuse"
  "prisma_note": "New model in prisma/models/request.prisma",
  "fields": [
    { "name": "id", "type": "String", "prisma_modifier": "@id @default(cuid())" },
    { "name": "user", "type": "User", "relation": "User",
      "prisma_modifier": "@relation(\"UserRequests\", fields: [userId], references: [id])" }
  ]
}
```

- `create` — new model; `fields` lists every column.
- `extend` — existing model; `fields` lists **only the added** fields.
- `reuse` — no schema change; `fields` is `[]`, `prisma_note` says which spec defined it.

### `trpc_procedures[]`

```jsonc
{
  "name": "myList",
  "router": "src/integrations/trpc/routers/request.router.ts",
  "type": "query",                       // query | mutation
  "procedure": "protectedProcedure",     // protectedProcedure | roleProcedure(...) | adminProcedure | publicProcedure
  "input_schema": "src/features/…/validations/schema/….ts",   // or null for an inline z.object
  "input": { "page": "number", "search": "string?" },
  "output": { "items": "Request[]", "total": "number" },
  "guards": ["owner-only: request.userId === ctx.user.id"],
  "invalidates": [],                     // mutations only
  "description": "…"
}
```

`roleProcedure(...)` is the gate that already exists in `src/integrations/trpc/init.ts`.
Prefer it over an inline `if (ctx.user.role !== …)` — the point of the procedure is that the
check cannot be forgotten on the next endpoint.

### `frontend`

```jsonc
"frontend": {
  "pages":  [ … ],                 // required (may be [])
  "components": [ … ],             // required (may be []) — shared/feature components
  "forms":  [ … ],                 // required (may be [])
  "hooks":  [ … ],                 // required (may be [])
  "store":  { "needed": false },   // required
  "navigation_config": { … }       // optional — only the spec that owns the sidebar entry
}
```

**`pages[]`**

```jsonc
{
  "name": "RequestsListPage",
  "route_file": "src/routes/_authenticated/requests/index.tsx",
  "breadcrumb": "Requests",
  "main_width": "wide",
  "role": "USER",                        // single role, "all", or "A | B"
  "layout": "AppLayout (frame, from _authenticated.tsx) — page renders AppPageHeader + content only",
  "page_header": { "title": "Requests", "subtitle": "…", "action": "New Request button" },
  "components": [ … ],
  "actions": [ … ]
}
```

**`components[]`** — inside `pages[]` or at `frontend.components[]`:

```jsonc
{
  "name": "UserRequestsTable",
  "file": "src/features/user-dashboard/components/UserRequestsTable.tsx",
  "type": "table",                       // card | form | modal | table | widget | banner | list
  "lab_components": ["AppDataTable", "AppChip", "AppTableEmptyState"],
  "heroui_components": ["Typography"],
  "heroui_note": "Typography per CLAUDE.md — there is no AppTypography.",
  "props": ["rows: RequestRow[]", "server: DataTableServer"],
  "description": "…"
}
```

**`forms[]`** — `zod_rule` is a literal Zod v4 expression, copied into the schema file.
`success_message` / `error_message` are the exact `AppToast` strings.

**`hooks[]`** — `use-<actor>-<feature>-<queries|mutations>.ts`. `invalidates` is an array of
query-key expressions, `[]` on queries.

### `requirements`

Three flat arrays of strings. Each entry is one checkable statement.

- `functional` — what the page does.
- `authorization` — who may reach it and who may act, **naming the server guard** that
  enforces it. Never "the sidebar hides it": the sidebar organises, the server enforces.
- `ux` — the states a screen must have (loading, empty, error, disabled, pending) and the
  rules from the `ui-ux` skill that apply here.

### `validations`

```jsonc
"validations": {
  "schemas": [
    { "file": "src/features/…/validations/schema/request.schema.ts",
      "used_by": ["RequestForm", "request.create"],
      "rules": [ { "field": "title", "zod_rule": "z.string().min(1, 'Title is required').max(255)" } ] }
  ],
  "server_guards": [
    { "procedure": "request.submit",
      "guard": "masterStatus must be DRAFT or RETURNED",
      "error": "FORBIDDEN — Request cannot be submitted in its current status" }
  ]
}
```

Every client rule that matters has a server guard beside it. The pair is the validation.

### `test_requirements`

```jsonc
[
  { "file": "src/features/request-form/validations/schema/request.schema.test.ts",
    "type": "unit",
    "covers": ["title over 255 chars fails", "priority outside the enum fails"] },
  { "file": "cypress/e2e/requests-create.cy.ts",
    "type": "e2e",
    "covers": ["a USER saves a draft and lands on the detail page"] }
]
```

`type` is `unit` (Vitest, colocated) or `e2e` (Cypress, `cypress/e2e/`). Security guards get
a failing-path entry — a test that only proves the happy path proves nothing about the gate.

---

## Conventions

- File paths are repo-relative, forward slashes.
- Roles are `SCREAMING_SNAKE_CASE`: `USER`, `ADMIN`, `IDO_OFFICER`, `IDO_CHAIRPERSON`,
  `BUDGET_OFFICER`, `DIRECTOR`.
- **Empty over absent** — emit `[]` or `{ "needed": false }` rather than dropping a key.
- Free-text uses an em dash (`—`) to separate a value from its condition or styling.
- Strict JSON: no comments, no trailing commas. The `jsonc` above is annotated for docs only.

## Reading order

`001` → `017` is also the implementation order; `depends_on` is the authoritative graph.

| # | Spec | Page(s) |
|---|---|---|
| 001 | Foundation — schema, roles, permissions, status maps, nav | — |
| 002 | Sign-up with position | `/sign-up` |
| 003 | Profile and signature | `/profile` |
| 004 | My Requests | `/requests` |
| 005 | New Request | `/requests/new` |
| 006 | Request detail | `/requests/$requestId` |
| 007 | Edit Request | `/requests/$requestId/edit` |
| 008 | Request comment thread | shared |
| 009 | Staff dashboard | `/staff/dashboard` |
| 010 | IDO first review | `/requests/$requestId/review` |
| 011 | Budget officer review | `/requests/$requestId/budget-review` |
| 012 | Director first approval | `/requests/$requestId/director-review` |
| 013 | IDO chairperson final review | `/requests/$requestId/final-review` |
| 014 | Final director approval | `/requests/$requestId/final-director-approval` |
| 015 | CSM | `/requests/$requestId/csm` |
| 016 | Request PDF | `/requests/$requestId/pdf` |
| 017 | Admin account management | `/admin` |
</content>
</invoke>
