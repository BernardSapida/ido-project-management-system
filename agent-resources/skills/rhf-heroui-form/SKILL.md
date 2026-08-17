---
name: rhf-heroui-form
description: Redirect only. Form patterns for this project live in useAppForm, the App* field wrappers from @bernardsapida/web-ui, and the form-reference lab route. Read those, not this. Kept as a stub because feature-implementation and ui-ux-creation link here.
---

# rhf-heroui-form — superseded

**This skill no longer carries form patterns.** It taught raw `@heroui/react` inputs wrapped
in a hand-written `Controller` per field, and its references imported from
`@/components/form/AppTextField` — a path from the previous project that does not exist here.
Following it produced forms two generations behind the code.

It is a stub rather than a deletion because
`agent-resources/skills/feature-implementation/SKILL.md` and
`agent-resources/skills/ui-ux-creation/SKILL.md` both route form work here.

## What to read instead

| Question | Source |
|---|---|
| How do I start a form? | `src/hooks/use-app-form.ts` |
| Which wrapper, and how is it bound? | `src/routes/(references)/components/form-reference.tsx` |
| What are the project's form rules? | `CLAUDE.md`, "Forms" |

## The three rules, in short

**1. Every form starts with `useAppForm`.** Never `useForm` directly for a form a user
submits. `useAppForm` is `useForm` with this project's validation timing already applied —
`mode: "onBlur"`, `reValidateMode: "onChange"` — and the resolver already attached. A lint
rule enforces this; see `biome.json`.

```ts
const { control, handleSubmit } = useAppForm<SignInFormValues>(SignInFormSchema, {
  defaultValues: { email: "", password: "" },
});
```

For an edit form, pass `values` and let RHF reset when the record arrives. Do not write an
effect that calls `reset`.

**2. Fields are `App*` wrappers from `@bernardsapida/web-ui`, bound with `control` + `name`.**
No `Controller`, no `register`, no raw `<Input>`. The wrappers take a two-mode binding —
either `{ control, name }` or `{ value, onChange, errorMessage }` — and the two are mutually
exclusive in the types, so a half-wired field is a compile error rather than a field that
silently ignores what you typed.

```tsx
<AppInputGroup control={control} label="Email" name="email" placeholder="you@example.com" />
```

**3. Never add your own error element.** The wrappers render the field error from RHF. A
hand-rolled `<p className="text-danger">` duplicates it and drifts.

The value prop and change handler differ per wrapper — `AppComboBox` is
`selectedKey`/`onSelectionChange`, `AppSwitch` is `isSelected`/`onValueChange`, and so on.
The table at the top of the form-reference lab is the list. Read it rather than guessing.

## The one place bare `useForm` is right

A lab specimen or a preview board — somewhere a `control` is needed to render a field and
nothing is ever submitted. `useAppForm` requires a schema, so using it there would mean
inventing validation for a specimen. Those files are exempted by glob in `biome.json`, and a
new exemption needs a comment saying why.
</content>
