# PROMPT.md

Copy-paste prompts for implementing the specs in this folder.

**One spec per session.** Start a fresh Claude Code session in the repo root, paste the
prompt, let it finish, commit, then `/clear` and move to the next. That is the whole point
of splitting them: a session that has already read six specs pays for all six on every turn.

The prompts are short on purpose. Every rule lives in [README.md](./README.md) and in the
spec file itself, so the prompt only has to say *which* spec — never *how*.

`/implement-spec` does **not** work here. It targets `project-template/specs/` and the Nx
`surfaces` format; these are monolith specs.

---

## Before the first spec

```
Install dependencies and get the app running. Report what's missing before you fix anything.
```

---

## 0 — Setup

Run once, before 001.

```
Read specs/README.md and specs/001-foundation-schema-roles-permissions.json.
Don't implement anything yet — tell me what you'd change and what you need from me first.
```

---

## The prompts

Each one assumes a fresh session. Paste as-is.

### 001 — Foundation

```
Read specs/README.md, then implement specs/001-foundation-schema-roles-permissions.json in full.
Run the migration and the seed when you're done. No tests — the spec lists them for later.
```

### 002 — Sign-up with position

```
Read specs/README.md, then implement specs/002-sign-up-with-position.json.
For the email-verification edge case: mark self sign-ups emailVerified, and write down that we did it and why.
No tests.
```

### 003 — Profile and signature

```
Read specs/README.md, then implement specs/003-profile-and-signature.json.
S3 must be configured first — tell me if it isn't. No tests.
```

### 004 — My Requests

```
Read specs/README.md, then implement specs/004-my-requests.json. No tests.
```

### 005 — New Request

```
Read specs/README.md, then implement specs/005-new-request.json. No tests.
```

### 006 — Request detail

```
Read specs/README.md, then implement specs/006-request-detail.json. No tests.
```

### 007 — Edit Request

```
Read specs/README.md, then implement specs/007-edit-request.json. No tests.
```

### 008 — Comment thread

```
Read specs/README.md, then implement specs/008-request-comment-thread.json.
Mount it on the pages the spec names. No tests.
```

### 009 — Staff dashboard

```
Read specs/README.md, then implement specs/009-staff-dashboard.json. No tests.
```

### 010 — IDO first review

```
Read specs/README.md, then implement specs/010-ido-first-review.json. No tests.
```

### 011 — Budget officer review

```
Read specs/README.md, then implement specs/011-budget-officer-review.json. No tests.
```

### 012 — Director first approval

```
Read specs/README.md, then implement specs/012-director-first-approval.json.
Read the approve/reject asymmetry in edge_cases carefully — it is deliberate. No tests.
```

### 013 — IDO final review

```
Read specs/README.md, then implement specs/013-ido-final-review.json. No tests.
```

### 014 — Final director approval

```
Read specs/README.md, then implement specs/014-final-director-approval.json.
The whole approval is one transaction. No tests.
```

### 015 — CSM

```
Read specs/README.md, then implement specs/015-csm-satisfaction-form.json. No tests.
```

### 016 — Request PDF

```
Read specs/README.md, then implement specs/016-request-pdf.json.
Add @react-pdf/renderer — it isn't in package.json yet. No tests.
```

### 017 — Admin accounts

```
Read specs/README.md, then implement specs/017-admin-account-management.json. No tests.
```

---

## Order

`001 → 002 → 003` first — nothing else runs without them. Then `004-008`, then `009` before
any of `010-014`, then `015-017`.

`depends_on` inside each spec is the authoritative graph if you want to run two in parallel.

---

## Useful extras

Append to any prompt when you want the behaviour.

| Want | Add |
|---|---|
| Review before it commits | `Show me a summary before you commit anything.` |
| Smaller commits | `Commit after each finished piece, not once at the end.` |
| It to stop guessing | `Stop and ask if anything is ambiguous before writing code.` |
| See it actually work | `Then run the app and walk the flow the spec describes.` |
| Resume after a break | `Which specs are already implemented? Check the code, not the spec files.` |
| Only part of a spec | `Implement only the trpc_procedures from specs/0NN-….json — leave the frontend for later.` |

## When to write the tests

Every spec carries `test_requirements` with the file and what each must cover. When you are
ready:

```
Read specs/0NN-….json and write the tests in its test_requirements. Run them until green.
```

Do the security ones first, and verify each fails when you remove the guard it covers. A
green suite you have never seen fail proves nothing.
</content>
