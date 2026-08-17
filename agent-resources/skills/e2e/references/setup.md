# Cypress Setup

Run this once when adding Cypress to the project for the first time.

---

## Install

```bash
npm install cypress --save-dev
```

---

## cypress.config.ts

Create at the project root:

```ts
import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    screenshotsFolder: "cypress/screenshots",
    video: false,
    env: {
      TEST_USER_EMAIL: "",
      TEST_USER_PASSWORD: "",
    },
  },
})
```

---

## cypress/support/e2e.ts

```ts
import "./commands"
```

---

## cypress/support/commands.ts

```ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
    }
  }
}

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

---

## cypress/support/commands.ts tsconfig

Create `cypress/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["cypress"]
  },
  "include": ["**/*.ts"]
}
```

---

## Credentials (never commit)

Create `cypress.env.json` at the project root:

```json
{
  "TEST_USER_EMAIL": "your-test-user@example.com",
  "TEST_USER_PASSWORD": "your-test-password"
}
```

Add to `.gitignore`:

```
cypress.env.json
```

The test user must exist in the database. Create it manually via the app or a seed script.

---

## package.json scripts

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run"
  }
}
```

---

## Seed / Cleanup Tasks (optional)

If tests need pre-existing database records (e.g. for edit/delete tests), add Cypress tasks in `cypress.config.ts`:

```ts
import { defineConfig } from "cypress"
import { prisma } from "./src/lib/prisma"

export default defineConfig({
  e2e: {
    // ...
    setupNodeEvents(on) {
      on("task", {
        async seedRecord(data: Record<string, unknown>) {
          // example: return prisma.product.create({ data })
          return null
        },
        async deleteRecord(id: string) {
          // example: return prisma.product.delete({ where: { id } })
          return null
        },
      })
    },
  },
})
```

Usage in a spec:

```ts
let recordId: string

before(() => {
  cy.task("seedRecord", { name: "Test Product", status: "active" }).then((record) => {
    recordId = (record as { id: string }).id
  })
})

after(() => {
  cy.task("deleteRecord", recordId)
})
```
