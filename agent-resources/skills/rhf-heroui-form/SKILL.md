---
name: rhf-heroui-form
description: Use this skill whenever creating, editing, or debugging any form component that uses React Hook Form (RHF) with HeroUI v3 input components. Trigger on any mention of form, input field, validation, onBlur, submit, error message, required field, field validation, useForm, Controller, register, or any HeroUI form components like Input, Select, Checkbox, Textarea, Switch. Always use this skill before writing any form-related code — do not invent form patterns from scratch.
---

# RHF + HeroUI v3 Form Skill

Forms in this project use **React Hook Form** for state/validation and **HeroUI v3** components for rendering. Never mix custom input elements with HeroUI form components. Never add custom error `<p>` or `<span>` tags — HeroUI handles error display via its own props.

---

## Core Setup

```tsx
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input, Button } from "@heroui/react"
```

### useForm config

```tsx
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur",         // validate on blur
  reValidateMode: "onChange", // re-validate on change after first error
  defaultValues: {
    email: "",
    password: "",
  },
})
```

---

## The Most Important Rule: Submit on Empty Form

**Problem**: If user hits submit without touching any field, `touched` is all false, so `onBlur` errors never fire and the form looks valid.

**Fix**: On submit, trigger validation for ALL fields first:

```tsx
const { handleSubmit, trigger, formState: { errors } } = form

const onSubmit = handleSubmit(async (data) => {
  // This runs only if validation passes
  await yourApiCall(data)
})

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Force validate all fields before RHF runs handleSubmit
  const isValid = await trigger()
  if (!isValid) return
  await onSubmit(e as any)
}
```

Or simpler — just use `handleSubmit` directly, which already calls full validation:

```tsx
<form onSubmit={handleSubmit(onSubmitFn)}>
```

`handleSubmit` from RHF already validates all fields on submit regardless of touched state. **The bug usually comes from calling a custom submit handler that skips `handleSubmit`.** Always wrap submit logic in `handleSubmit`.

---

## Wiring HeroUI Fields with RHF

Use `Controller` for all HeroUI inputs. Do NOT use `register` directly — HeroUI components are controlled components.

### Input / Textarea

```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Input
      {...field}
      label="Email"
      type="email"
      isInvalid={!!fieldState.error}
      errorMessage={fieldState.error?.message}
      onBlur={field.onBlur}
    />
  )}
/>
```

### Select

```tsx
<Controller
  name="role"
  control={form.control}
  render={({ field, fieldState }) => (
    <Select
      label="Role"
      selectedKeys={field.value ? [field.value] : []}
      onSelectionChange={(keys) => field.onChange([...keys][0])}
      isInvalid={!!fieldState.error}
      errorMessage={fieldState.error?.message}
    >
      <SelectItem key="admin">Admin</SelectItem>
      <SelectItem key="user">User</SelectItem>
    </Select>
  )}
/>
```

### Checkbox

```tsx
<Controller
  name="acceptTerms"
  control={form.control}
  render={({ field, fieldState }) => (
    <Checkbox
      isSelected={field.value}
      onValueChange={field.onChange}
      isInvalid={!!fieldState.error}
    >
      I accept the terms
    </Checkbox>
  )}
/>
```

---

## Error Display Rules

- **NEVER** add a custom `<p className="text-red-500">` for errors
- **NEVER** add `className` to override HeroUI's error text color, size, or spacing
- HeroUI's `errorMessage` prop handles display — trust it
- Only pass `isInvalid={!!fieldState.error}` and `errorMessage={fieldState.error?.message}`
- If you need a form-level error (e.g. API error), use HeroUI's `addToast` or a separate non-intrusive alert component — not inline error text hacked into the form

---

## Zod Schema Pattern

Define schema separately, outside the component:

```tsx
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginForm = z.infer<typeof loginSchema>
```

Keep error messages short and human. Avoid:
- "This field is required" → use "Email is required"
- "Invalid input" → use "Enter a valid email"
- "String must contain at least 1 character(s)" → never expose Zod defaults

---

## Full Example: Login Form

```tsx
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input, Button } from "@heroui/react"

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: FormData) => {
    await login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            label="Email"
            type="email"
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            label="Password"
            type="password"
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />

      <Button type="submit" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  )
}
```

---

## Component-Specific Wiring

Each App* component has a different value prop, change handler, and Zod schema pattern. Before wiring any input, read:

**`references/form-inputs.md`** — covers all 15 component types with exact schema patterns, default values, and usage examples. Always check this before writing a new field, especially for: AppSelect, AppComboBox, AppAutocomplete, AppDatePicker, AppDateRangePicker, AppTimeField, AppNumberField.

**`src/routes/form-reference.tsx`** — the canonical working implementation of every input type in the project. Read this when you need the full picture or are debugging something tricky. Do not invent patterns that aren't in this file.

### Available inputs in this project

| Category | Components |
|---|---|
| Text | `AppTextField`, `AppTextArea`, `AppInputGroup` (with icon prefix) |
| Number | `AppNumberField` (stepper with min/max/step) |
| Selection | `AppSelect`, `AppComboBox`, `AppAutocomplete` |
| Date & Time | `AppDateField`, `AppDatePicker`, `AppDateRangePicker`, `AppTimeField` |
| Toggles | `AppCheckbox`, `AppCheckboxGroup`, `AppRadioGroup`, `AppSwitch` |

All components live in `@/components/form/`. Never use raw HeroUI input primitives directly in a form — always use the App* wrappers.

---

## DO / DON'T Summary

| DO | DON'T |
|----|-------|
| Use `Controller` for all HeroUI inputs | Use `register` directly on HeroUI components |
| Use `isInvalid` + `errorMessage` props | Add custom error `<p>` tags |
| Wrap submit in `handleSubmit(fn)` | Write a custom submit handler that skips `handleSubmit` |
| Write human error messages in Zod schema | Expose Zod's default error strings |
| Let HeroUI manage field error styling | Add `className` to override error text appearance |
| Use `mode: "onBlur"` + `reValidateMode: "onChange"` | Leave mode as default `"onSubmit"` only |

---

## Debugging Checklist

If errors don't show on submit:
1. Is submit wrapped in `handleSubmit`? If not, that's the bug.
2. Is `isInvalid` bound to `!!fieldState.error`? Check it's not always `false`.
3. Is the field name in `Controller` matching the Zod schema key exactly?
4. Is `defaultValues` set for every field? Missing defaults cause uncontrolled/controlled warnings and can break validation.

If onBlur doesn't trigger errors:
1. Is `mode: "onBlur"` set in `useForm`?
2. Is `onBlur={field.onBlur}` passed to the HeroUI component? (Most spread via `{...field}` but double-check for Select/custom inputs.)