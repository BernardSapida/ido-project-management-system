# Auth Commands

---

## cy.login()

Defined in `cypress/support/commands.ts`. Sends a POST to the Better Auth sign-in endpoint, which sets the session cookie. Subsequent `cy.visit()` calls will be authenticated.

```ts
Cypress.Commands.add("login", () => {
  cy.request({
    method: "POST",
    url: "/api/auth/sign-in/email",
    body: {
      email: Cypress.env("TEST_USER_EMAIL"),
      password: Cypress.env("TEST_USER_PASSWORD"),
    },
    failOnStatusCode: true,
  })
})
```

Credentials are read from `cypress.env.json` (gitignored). Never hardcode them in spec files.

---

## Usage in specs

Call `cy.login()` inside `beforeEach` for every authenticated test:

```ts
describe("Products", () => {
  beforeEach(() => {
    cy.login()
    cy.visit("/products")
  })

  it("loads the products page", () => {
    cy.get('[data-cy="page-title"]').should("contain", "Products")
  })
})
```

Login is done fresh for every test. No session caching.

---

## Auth guard tests

Auth guard tests must NOT be inside a `beforeEach` that calls `cy.login()`. Use a separate `describe` block and clear cookies first:

```ts
describe("Products — auth guard", () => {
  it("redirects unauthenticated user to /sign-in", () => {
    cy.clearCookies()
    cy.visit("/products")
    cy.url().should("include", "/sign-in")
  })
})
```

---

## Role-based access (if applicable)

If the feature has admin-only routes, define a second login command for the admin user:

```ts
Cypress.Commands.add("loginAsAdmin", () => {
  cy.request({
    method: "POST",
    url: "/api/auth/sign-in/email",
    body: {
      email: Cypress.env("TEST_ADMIN_EMAIL"),
      password: Cypress.env("TEST_ADMIN_PASSWORD"),
    },
    failOnStatusCode: true,
  })
})
```

Add `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` to `cypress.env.json`.
