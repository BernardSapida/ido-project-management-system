# Form Inputs Reference

All App* form wrappers use `useController` from RHF internally. Always pass `control` and `name` — never use `register`.

Source of truth: `src/routes/form-reference.tsx` in the monorepo template.

---

## Quick Reference Table

| Component | value prop | change handler | Zod type |
|---|---|---|---|
| `AppTextField` | `value` | `onChange` | `z.string()` |
| `AppTextArea` | `value` | `onChange` | `z.string()` |
| `AppInputGroup` | `value` | `onChange` | `z.string()` |
| `AppNumberField` | `value` | `onChange` | `z.number()` |
| `AppSelect` | `selectedKey` | `onSelectionChange` | `z.string().nullable()` |
| `AppComboBox` | `selectedKey` | `onSelectionChange` | `z.string().nullable()` |
| `AppAutocomplete` | `value` | `onChange` | `z.string().nullable()` |
| `AppCheckbox` | `isSelected` | `onValueChange` | `z.boolean()` |
| `AppCheckboxGroup` | `value` | `onChange` | `z.array(z.string())` |
| `AppRadioGroup` | `value` | `onChange` | `z.string()` |
| `AppSwitch` | `isSelected` | `onValueChange` | `z.boolean()` |
| `AppDateField` | `value` | `onChange` | `z.custom<CalendarDate>()` |
| `AppDatePicker` | `value` | `onChange` | `z.custom<CalendarDate>()` |
| `AppDateRangePicker` | `value` | `onChange` | `z.object({ start, end })` |
| `AppTimeField` | `value` | `onChange` | `z.custom<Time>()` |

---

## Imports

```tsx
import { AppTextField } from "@/components/form/AppTextField"
import { AppTextArea } from "@/components/form/AppTextArea"
import { AppInputGroup } from "@/components/form/AppInputGroup"
import { AppNumberField } from "@/components/form/AppNumberField"
import { AppSelect } from "@/components/form/AppSelect"
import { AppComboBox } from "@/components/form/AppComboBox"
import { AppAutocomplete } from "@/components/form/AppAutocomplete"
import { AppCheckbox } from "@/components/form/AppCheckbox"
import { AppCheckboxGroup } from "@/components/form/AppCheckboxGroup"
import { AppRadioGroup } from "@/components/form/AppRadioGroup"
import { AppSwitch } from "@/components/form/AppSwitch"
import { AppDateField } from "@/components/form/AppDateField"
import { AppDatePicker } from "@/components/form/AppDatePicker"
import { AppDateRangePicker } from "@/components/form/AppDateRangePicker"
import { AppTimeField } from "@/components/form/AppTimeField"
import { Button, FieldError, Fieldset, Form } from "@heroui/react"
import { CalendarDate, Time } from "@internationalized/date"
```

---

## Layout Wrapper

All forms use `Form` + `Fieldset` from HeroUI. Never skip these — they handle aria and validation behavior.

```tsx
<Form
  className="flex flex-col gap-6"
  onSubmit={onSubmit}
  validationBehavior="aria"
>
  <Fieldset>
    <Fieldset.Legend>Section Title</Fieldset.Legend>
    <Fieldset.Group className="flex flex-col gap-4">
      {/* fields go here */}
    </Fieldset.Group>
  </Fieldset>

  <Fieldset.Actions>
    <Button isPending={isSubmitting} type="submit">Submit</Button>
    <Button type="button" variant="secondary" onPress={() => reset()}>Reset</Button>
  </Fieldset.Actions>
</Form>
```

---

## 1. AppTextField

Plain text, email, password, url inputs.

```tsx
// Schema
firstName: z.string().min(1, "First name is required"),
email: z.string().min(1, "Email is required").email("Enter a valid email"),

// Usage
<AppTextField
  control={control}
  name="firstName"
  label="First name"
  placeholder="Jane"
  isRequired
/>
```

---

## 2. AppTextArea

Multiline text.

```tsx
// Schema
bio: z.string().min(10, "Bio must be at least 10 characters"),

// Usage
<AppTextArea
  control={control}
  name="bio"
  label="Bio"
  placeholder="Tell us a bit about yourself..."
  description="Minimum 10 characters."
  isRequired
/>
```

---

## 3. AppInputGroup

Text input with an icon prefix (`startContent`).

```tsx
// Schema — same as AppTextField
email: z.string().min(1, "Email is required").email("Enter a valid email"),

// Usage
<AppInputGroup
  control={control}
  name="email"
  label="Email"
  placeholder="jane@example.com"
  type="email"
  startContent={<Mail className="size-4 text-text-secondary" />}
  description="Used for your account login."
  isRequired
/>
```

---

## 4. AppNumberField

Numeric stepper with min/max/step.

```tsx
// Schema
// Use z.number() with a custom error message — NOT z.string()
age: z.number({ error: "Age is required" }).min(18, "Must be 18 or older").max(120, "Must be 120 or younger"),

// Default value must be a number, not empty string
defaultValues: { age: 0 }

// Usage
<AppNumberField
  control={control}
  name="age"
  label="Age"
  minValue={0}
  maxValue={120}
  step={1}
  isRequired
/>
```

---

## 5. AppSelect

Dropdown list. Stores the selected item's `value` as a string. `selectedKey` is null when nothing is selected.

```tsx
// Schema — nullable + refine pattern (NOT z.string().min(1))
country: z
  .string()
  .nullable()
  .refine((v) => v !== null && v !== "", "Select a country"),

// Default value must be null
defaultValues: { country: null }

// Options shape
const countryOptions = [
  { value: "ph", label: "Philippines" },
  { value: "us", label: "United States" },
]

// Usage
<AppSelect
  control={control}
  name="country"
  label="Country"
  placeholder="Select a country"
  items={countryOptions}
  isRequired
/>
```

---

## 6. AppComboBox

Combines a text input with a filtered listbox. Stores `selectedKey` (not the typed text).

```tsx
// Schema — same nullable + refine pattern as AppSelect
framework: z
  .string()
  .nullable()
  .refine((v) => v !== null, "Select a framework"),

// Default value must be null
defaultValues: { framework: null }

// Usage
<AppComboBox
  control={control}
  name="framework"
  label="Framework"
  placeholder="Search frameworks..."
  description="Type to filter, then pick from the list."
  items={frameworkOptions}
  isRequired
/>
```

---

## 7. AppAutocomplete

Full-text search inside the popover. Stores the selected value string (not typed text).

```tsx
// Schema — nullable + refine
city: z
  .string()
  .nullable()
  .refine((v) => v !== null, "Select a city"),

// Default value must be null
defaultValues: { city: null }

// Usage
<AppAutocomplete
  control={control}
  name="city"
  label="City"
  placeholder="Select a city"
  description="Full-text search inside the popover."
  items={cityOptions}
  isRequired
/>
```

---

## 8. AppCheckbox

Single boolean checkbox. Use `.refine((v) => v === true)` when the checkbox must be checked to submit (e.g. terms agreement).

```tsx
// Schema — optional (newsletter)
newsletter: z.boolean(),

// Schema — required to be true (terms)
agreeToTerms: z.boolean().refine((v) => v === true, "You must agree to continue"),

// Default value
defaultValues: { newsletter: false, agreeToTerms: false }

// Usage — optional toggle
<AppSwitch
  control={control}
  name="newsletter"
  label="Newsletter"
  description="Receive our weekly product updates."
  isRequired
/>

// Usage — must be checked
<AppCheckbox
  control={control}
  name="agreeToTerms"
  label="I agree to the terms of service"
  isRequired
/>
```

---

## 9. AppCheckboxGroup

Multi-select, stores `string[]`. Use `.min(1)` to require at least one selection.

```tsx
// Schema
notifications: z.array(z.string()).min(1, "Select at least one"),

// Default value must be empty array
defaultValues: { notifications: [] }

// Options shape
const notificationOptions = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
]

// Usage
<AppCheckboxGroup
  control={control}
  name="notifications"
  label="Notifications"
  items={notificationOptions}
  isRequired
/>
```

---

## 10. AppRadioGroup

Single selection from a list. Items can have an optional `description`.

```tsx
// Schema
role: z.string().min(1, "Select a role"),

// Default value
defaultValues: { role: "" }

// Options shape — description is optional
const roleOptions = [
  { value: "admin", label: "Admin", description: "Full access to all resources" },
  { value: "editor", label: "Editor", description: "Can create and edit content" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
]

// Usage
<AppRadioGroup
  control={control}
  name="role"
  label="Role"
  items={roleOptions}
  isRequired
/>
```

---

## 11. AppSwitch

Boolean toggle. Same pattern as AppCheckbox but visually a switch.

```tsx
// Schema
newsletter: z.boolean(),

// Default value
defaultValues: { newsletter: false }

// Usage
<AppSwitch
  control={control}
  name="newsletter"
  label="Newsletter"
  description="Receive our weekly product updates."
  isRequired
/>
```

---

## 12. AppDateField

Inline date segment input — no calendar popup. Value is a `CalendarDate` from `@internationalized/date`.

```tsx
// Schema — custom validator + nullable + refine
birthDate: z
  .custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a date")
  .nullable()
  .refine((v) => v !== null, "Select a birth date"),

// Default value must be null
defaultValues: { birthDate: null }

// Usage
<AppDateField
  control={control}
  name="birthDate"
  label="Birth date"
  description="Type directly into the date segments."
  isRequired
/>
```

---

## 13. AppDatePicker

Date segment input + calendar popup. Same value type as AppDateField.

```tsx
// Schema — same pattern as AppDateField
appointment: z
  .custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a date")
  .nullable()
  .refine((v) => v !== null, "Select an appointment date"),

// Default value must be null
defaultValues: { appointment: null }

// Usage
<AppDatePicker
  control={control}
  name="appointment"
  label="Appointment"
  isRequired
/>
```

---

## 14. AppDateRangePicker

Start and end date picker. Value is `{ start: CalendarDate, end: CalendarDate }`.

```tsx
// Schema
eventRange: z
  .object({
    start: z.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a start date"),
    end: z.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select an end date"),
  })
  .nullable()
  .refine((v) => v !== null, "Select a date range"),

// Default value must be null
defaultValues: { eventRange: null }

// Usage
<AppDateRangePicker
  control={control}
  name="eventRange"
  label="Event range"
  isRequired
/>
```

---

## 15. AppTimeField

Time segment input (HH:MM AM/PM). Value is a `Time` from `@internationalized/date`.

```tsx
// Schema
meetingTime: z
  .custom<Time>((v) => v instanceof Time, "Select a time")
  .nullable()
  .refine((v) => v !== null, "Select a meeting time"),

// Default value must be null
defaultValues: { meetingTime: null }

// Usage
<AppTimeField
  control={control}
  name="meetingTime"
  label="Meeting time"
  description="Enter the meeting start time."
  isRequired
/>
```

---

## Validation Summary + Form-level Error

Show error count after a failed submit using HeroUI's `FieldError`:

```tsx
const { formState: { errors } } = useForm(...)
const errorCount = Object.keys(errors).length

// Inside the form
{errorCount > 0 && (
  <FieldError className="text-sm">
    {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention above.
  </FieldError>
)}
```

For API/server errors, use a separate block — not a field error:

```tsx
{formError && (
  <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
    <p className="text-sm text-danger">{formError}</p>
  </div>
)}
```

---

## Common Mistakes

**Selection fields (AppSelect, AppComboBox, AppAutocomplete)**
- Default value must be `null`, not `""`
- Schema must use `.nullable().refine(...)` not `.min(1, ...)`

**Date/Time fields**
- Default value must be `null`, not `""`
- Always import `CalendarDate` and `Time` from `@internationalized/date`
- Schema needs `z.custom<CalendarDate>()` — not `z.string()` or `z.date()`

**AppNumberField**
- Default value must be a number (`0`), not `""`
- Schema must be `z.number()` — not `z.string()`

**AppCheckbox / AppSwitch**
- Default value must be `false` — not `""` or `null`
- For required-to-be-true: use `.refine((v) => v === true, "message")`

**AppCheckboxGroup**
- Default value must be `[]` — not `null` or `""`