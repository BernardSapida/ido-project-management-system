# Test Patterns

Concrete Cypress patterns for interactions common in this stack (HeroUI v3 + React Aria + RHF).

---

## Typing into an input

HeroUI `<Input>` renders a real `<input>` underneath. RHF passes the `name` attribute through.

With `data-cy` on the wrapper:
```ts
cy.get('[data-cy="name-input"]').type("Widget")
```

With `data-cy` directly on the inner `<input>` (preferred):
```ts
cy.get('[data-cy="name-input"]').type("Widget")
```

To clear before typing:
```ts
cy.get('[data-cy="name-input"]').clear().type("Updated Name")
```

---

## Selecting from a HeroUI Select (React Aria listbox)

HeroUI Select renders a trigger button + a popover listbox. Two-step interaction:

```ts
// 1. Click the trigger to open the dropdown
cy.get('[data-cy="status-select"]').click()

// 2. Click the option by visible text
cy.get('[role="option"]').contains("Active").click()
```

If multiple selects are open at once, scope the option selector:
```ts
cy.get('[data-cy="status-select"]').click()
cy.get('[data-cy="status-select-listbox"] [role="option"]').contains("Active").click()
```

---

## Clicking a button

HeroUI `<Button>` renders as `<button role="button">`. Standard click:

```ts
cy.get('[data-cy="submit-btn"]').click()
```

For a button that opens a modal:
```ts
cy.get('[data-cy="add-product-btn"]').click()
cy.get('[data-cy="create-product-modal"]').should("be.visible")
```

---

## Submitting a form

Click the submit button and wait for a success indicator (toast, redirect, or table row):

```ts
cy.get('[data-cy="submit-btn"]').click()
// wait for success toast
cy.get('[data-cy="toast-success"]').should("be.visible")
```

Or assert the new item appears in the table:
```ts
cy.get('[data-cy="submit-btn"]').click()
cy.get('[data-cy="products-table"]').should("contain", "Widget")
```

---

## Asserting validation errors

Submit with empty/invalid data and assert the error message:

```ts
cy.get('[data-cy="submit-btn"]').click()
cy.get('[data-cy="name-error"]').should("be.visible").and("contain", "required")
```

HeroUI inputs show `errorMessage` as a sibling element when `isInvalid` is set. Put `data-cy` on the error element or use `.contains()` on the field wrapper:

```ts
cy.get('[data-cy="name-field"]').should("contain", "Name is required")
```

---

## Confirming a delete dialog

If delete triggers a confirmation modal:

```ts
cy.get('[data-cy="delete-btn"]').click()
cy.get('[data-cy="confirm-delete-modal"]').should("be.visible")
cy.get('[data-cy="confirm-delete-btn"]').click()
// assert item is gone
cy.get('[data-cy="products-table"]').should("not.contain", "Widget")
```

---

## Asserting a toast message

This project uses a toast system. After a mutation, assert the toast appears:

```ts
cy.get('[data-cy="toast"]').should("be.visible").and("contain", "Product created")
```

If toasts auto-dismiss, assert before dismissal:
```ts
cy.get('[data-cy="toast"]').should("exist")
```

---

## Asserting a redirect

After form submit redirects to a detail page:

```ts
cy.get('[data-cy="submit-btn"]').click()
cy.url().should("match", /\/products\/[a-z0-9-]+/)
```

---

## Asserting empty state

When no records exist:

```ts
cy.get('[data-cy="empty-state"]').should("be.visible")
cy.get('[data-cy="products-table"]').should("not.exist")
```

---

## Waiting correctly

Never use `cy.wait(ms)`. Use DOM assertions as the wait condition:

```ts
// ❌
cy.wait(2000)
cy.get('[data-cy="products-table"]').should("contain", "Widget")

// ✅
cy.get('[data-cy="products-table"]').should("contain", "Widget")
```

Cypress retries `.should()` automatically until the condition is met or times out.
