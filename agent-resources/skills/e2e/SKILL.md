---
name: e2e
description: Use this skill to write Cypress E2E tests. Trigger on: "write E2E test for X", "add cypress test", "create test for this flow". The user will describe the flow and provide the data-cy selectors. The agent's only job is to write the spec file and verify it runs.
---

# E2E Testing Skill (Cypress)

The user describes the test flow and specifies `data-cy` selectors. The agent writes the spec file, nothing else.

Tests hit the real database. No mocking. No `cy.intercept()`. Auth is done fresh per test via `cy.login()`.

---

## Pre-flight: Is Cypress Installed?

Before writing any test, check:

```bash
ls cypress/
cat cypress.config.ts
```

If `cypress/` or `cypress.config.ts` is missing, follow `references/setup.md` in full before continuing.

---

## Receiving the Flow

The user will provide:
- A description of what the user does (the flow)
- The `data-cy` attribute values for each element to interact with

Example input from user:
> "Go to /products. Click `[data-cy="add-product-btn"]`. Fill `[data-cy="name-input"]` with 'Widget'. Select 'Active' in `[data-cy="status-select"]`. Submit `[data-cy="submit-btn"]`. Assert 'Widget' appears in `[data-cy="products-table"]`."

Do not infer selectors. Do not add extra interactions. Write exactly what the user described.

---

## Writing the Spec

### File location

```
cypress/e2e/[feature]/[descriptive-name].cy.ts
```

### Structure

```ts
// [Feature] — [short description of what this test covers]
describe("[Feature] — [flow name]", () => {
  beforeEach(() => {
    cy.login()
  })

  it("[action] — [expected outcome]", () => {
    // test body
  })
})
```

### Selector convention

Always use `data-cy` attributes as the user provided:

```ts
cy.get('[data-cy="add-product-btn"]').click()
cy.get('[data-cy="name-input"]').type("Widget")
```

Never substitute `data-cy` with class names, IDs, or text matchers unless the user explicitly says there is no `data-cy` on that element.

### Auth guard tests

Auth guard tests must NOT call `cy.login()`. Use a separate `describe` block:

```ts
describe("[Feature] — auth guard", () => {
  it("redirects unauthenticated user to /sign-in", () => {
    cy.clearCookies()
    cy.visit("/[feature]")
    cy.url().should("include", "/sign-in")
  })
})
```

### Login in beforeEach

For all non-auth-guard tests:

```ts
beforeEach(() => {
  cy.login()
})
```

`cy.login()` hits the real Better Auth endpoint and sets the session cookie. See `references/auth-commands.md`.

---

## Common Patterns

Read `references/test-patterns.md` before writing. It covers:
- Typing into HeroUI inputs
- Selecting from a HeroUI Select / React Aria listbox
- Clicking HeroUI buttons (they use `role="button"`)
- Asserting toast messages
- Confirming delete dialogs

---

## Run and Verify

After writing the spec, run it:

```bash
# Terminal 1
npm run dev

# Terminal 2
npx cypress run --spec "cypress/e2e/[feature]/[file].cy.ts"
```

All tests must pass. On failure:
1. Read the error + check `cypress/screenshots/`
2. Fix selector, assertion, or wait condition — never skip or disable
3. Re-run until all pass

---

## Hard Rules

- No `cy.wait(ms)` — use `.should("be.visible")` or `cy.contains(...)` to wait on DOM state
- No `cy.intercept()` — tests hit the real database
- No `cy.session()` — fresh login via `cy.login()` in `beforeEach`
- No hardcoded credentials in spec files — use `Cypress.env("TEST_USER_EMAIL")`
- Selectors are exactly what the user provided — do not invent or change them
