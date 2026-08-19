# IRMS — Flow Demo Overview

This folder documents the step-by-step flows of the IDO Request Management System (IRMS).
Each file covers one role / stage. Under every step there is a screenshot placeholder —
replace it with your captured image when building the demo PDF.

> **Terminology note:** *PPMP* = **Project Procurement Management Plan**.
> "Defer to Next Year PPMP" means the request is valid, but there is no budget allocated
> this year, so it is set aside for next year's procurement plan.

---

## Roles

| Role | What they do |
|---|---|
| **User / Client** | Files the request (Faculty, Dept. Head, Student rep, etc.) |
| **IDO Officer** | First reviewer |
| **IDO Chairperson** | First reviewer **and** the only one who can do the IDO *final* review & sign |
| **Budget Officer** | Checks budget / PPMP allocation (only in the flow if a Budget Officer account exists) |
| **Director (Campus Director)** | Approves twice — once mid-flow, once at the end |
| **Admin** | Manages accounts & permissions only (never touches a request) |

---

## The full happy path (at a glance)

```
User submits ──► IDO first review ──► [Budget Officer] ──► Director ──►
IDO Chairperson (final) ──► Director (final) ──► APPROVED ──► User submits CSM ──► COMPLETED
```

> **Important rule:** The **Budget Officer stage is conditional.** It only appears if at
> least one Budget Officer account exists. If there is none, IDO's "Recommend" goes
> straight to the Director. Show it as an optional/dashed box in any diagram.

---

## Status legend (what the client sees)

| Status | Meaning |
|---|---|
| Draft | Being written, not yet submitted |
| Submitted / Under Review | In the pipeline |
| Returned by IDO | Sent back to fix and resubmit |
| Director Review / IDO Final Review / Final Review | Moving through approvals |
| Approved | All approvals done, waiting for CSM |
| For Next Year PPMP | Deferred — no budget this year |
| Rejected by IDO / Budget / Director / Final | Stopped at that stage |
| Completed | CSM submitted — fully done |

---

## Files in this folder

1. [01-user-submit-request.md](./01-user-submit-request.md) — User files a request
2. [02-ido-first-review.md](./02-ido-first-review.md) — IDO Officer / Chairperson first review
3. [03-budget-officer-review.md](./03-budget-officer-review.md) — Budget / PPMP check (conditional)
4. [04-director-first-approval.md](./04-director-first-approval.md) — Director first approval
5. [05-ido-chairperson-final-review.md](./05-ido-chairperson-final-review.md) — IDO Chairperson final review & sign
6. [06-director-final-approval.md](./06-director-final-approval.md) — Director final approval
7. [07-user-csm.md](./07-user-csm.md) — User submits CSM (last step)
