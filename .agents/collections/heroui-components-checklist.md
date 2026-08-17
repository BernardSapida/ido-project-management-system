# HeroUI v3 Reusable Components — Build Checklist

> **How to use:** Work through each phase in order. For each component, complete all checklist items, then mark the component as done. When testing is passed, check off the **✅ Passed** item at the bottom of each section.
>
> **Stack:** TanStack Start · HeroUI v3 · React Hook Form · Zod · TypeScript strict

---

## Phase 1 — Foundation (Build First)

---

### `AppTextField`

> RHF-bound single-line text input. The base field all other text-like fields follow.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Accepts optional `description`, `placeholder`, `isDisabled`, `isReadOnly`
- [x] Uses `useController` from RHF internally — no `register()` at callsite
- [x] Wires `value`, `onChange`, `onBlur` from `field` to HeroUI `Input`
- [x] Wires `isInvalid` from `fieldState.invalid`
- [x] Wires `errorMessage` from `fieldState.error?.message`
- [x] Supports `type` prop: `"text"` (default), `"email"`, `"password"`, `"url"`
- [x] Validation fires on blur (first touch) and clears on change after first error
- [x] Parent form uses `mode: "onTouched"` and `reValidateMode: "onChange"`
- [x] TypeScript: generic over field values via `Control<T>`
- [x] No `isInvalid` or `errorMessage` needed at callsite
- [x] **✅ Passed**

---

### `AppSelect`

> RHF-bound select dropdown. Accepts an items array — no native DOM ref approach.

- [x] Accepts `name`, `label`, `control`, `items` as required props
- [x] `items` is typed as `{ label: string; value: string }[]`
- [x] Uses `useController` — controlled only (HeroUI Select has no native ref)
- [x] Renders HeroUI `Select` with `SelectItem` children mapped from `items`
- [x] Wires `selectedKeys`, `onSelectionChange` to RHF field value
- [x] Handles single selection — returns a `string` to RHF, not a `Set`
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `placeholder`, `isDisabled`, `isLoading`
- [x] TypeScript strict — no `any` casts on selection change
- [x] **✅ Passed**

---

### `AppSwitch`

> RHF-bound boolean toggle for settings and preference forms.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Uses `useController` — wires `isSelected` and `onValueChange` to RHF field
- [x] Accepts optional `description` displayed below the switch label
- [x] Returns `boolean` to RHF (not `"true"`/`"false"` strings)
- [x] Wires `isDisabled` prop through
- [x] No `isInvalid` visual needed (switch is binary, errors are rare — but `errorMessage` still renders if present)
- [x] **✅ Passed**

---

### `AppDatePicker`

> RHF-bound date picker. Single agreed-upon return type used everywhere.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Return type decision documented in component file comment: either `CalendarDate` (HeroUI native) or `Date` (JS native) — pick one, enforce it everywhere
- [x] Uses `useController` — wires `value` and `onChange` to RHF
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `minValue`, `maxValue`, `isDisabled`
- [x] Zod schema helper exported alongside component (e.g. `calendarDateSchema`) so validation is consistent across forms
- [x] **✅ Passed**

---

### `AppTable`

> Array-driven data table. Pass columns config + rows — get a full table with states handled.

- [x] Accepts `columns: { key: string; label: string; render?: (row) => ReactNode }[]`
- [x] Accepts `rows: T[]` where `T` has at least `{ id: string | number }`
- [x] Accepts `isLoading?: boolean` — renders skeleton rows (at least 5) when true
- [x] Accepts `emptyContent?: string | ReactNode` — shown when `rows` is empty and not loading
- [x] Accepts optional `onRowAction?: (id: string | number) => void` for row click
- [x] Accepts optional `selectionMode?: "none" | "single" | "multiple"`
- [x] Accepts optional `selectedKeys` and `onSelectionChange` for controlled selection
- [x] Column `render` function receives the full row object — no index gymnastics at callsite
- [x] TypeScript generic: `AppTable<T extends { id: ... }>`
- [x] **✅ Passed**

---

### `AppAlertDialog`

> Reusable confirm/delete dialog. Callback-driven — no local state at callsite.

- [x] Accepts `isOpen`, `onClose`, `onConfirm` as required props
- [x] Accepts `title: string` and `description: string`
- [x] Accepts optional `confirmLabel?: string` (default: `"Confirm"`)
- [x] Accepts optional `cancelLabel?: string` (default: `"Cancel"`)
- [x] Accepts optional `variant?: "default" | "danger"` — danger colors the confirm button destructively
- [x] `onConfirm` can be async — button shows loading spinner while promise is pending
- [x] Dialog closes automatically after `onConfirm` resolves
- [x] Focus is trapped inside dialog while open
- [x] `onClose` is called on cancel and on backdrop click
- [x] **✅ Passed**

---

## Phase 2 — High ROI

---

### `AppAlert`

> Inline status banner for server errors, warnings, and feedback messages — not a toast.

- [x] Accepts `description: string` as required prop
- [x] Accepts optional `title?: string` — rendered as bold heading above description
- [x] Accepts optional `color?: "default" | "primary" | "success" | "warning" | "danger"` (default: `"default"`)
- [x] Accepts optional `onClose?: () => void` — renders a dismiss button when provided
- [x] Accepts optional `icon?: LucideIcon` — overrides the default contextual icon per color
- [x] Accepts optional `className?: string`
- [x] Renders HeroUI `Alert` with `Alert.Indicator`, `Alert.Title`, `Alert.Description` slots
- [x] Does NOT auto-dismiss — inline only, use `useToast` for transient notifications
- [x] **✅ Passed**

---

### `AppChip`

> Generic chip for labels, tags, and categories. Distinct from `StatusChip` — no statusMap dependency.

- [x] Accepts `label: string` as required prop
- [x] Accepts optional `color` passed through to HeroUI `Chip`
- [x] Accepts optional `variant` passed through to HeroUI `Chip`
- [x] Accepts optional `size` passed through to HeroUI `Chip`
- [x] Accepts optional `onRemove?: () => void` — shows an × button when provided
- [x] Accepts optional `startContent?: ReactNode` — icon or avatar before the label
- [x] No statusMap — callsite decides color directly
- [x] **✅ Passed**

---

### `AppModal`

> Generic modal shell. Building block for non-form overlays. Use `FormModal` for form flows.

- [x] Accepts `isOpen: boolean` and `onClose: () => void` as required props
- [x] Accepts `title: string` — rendered in the modal header
- [x] Accepts `children: ReactNode` — the modal body content
- [x] Accepts optional `footer?: ReactNode` — custom action buttons slot (e.g. Close, Confirm)
- [x] Accepts optional `size` passed through to HeroUI `Modal`
- [x] Accepts optional `isDismissable?: boolean` (default: `true`) — controls backdrop click close
- [x] Focus is trapped inside while open (HeroUI handles this via React Aria)
- [x] No form logic — does not use RHF or Zod internally
- [x] **✅ Passed**

---

### `AppRadioGroup`

> RHF-bound radio group for single-choice selection from a fixed set of options.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Accepts `items: { label: string; value: string }[]` as required prop
- [x] Uses `useController` — returns a `string` to RHF (selected value)
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `orientation?: "horizontal" | "vertical"` (default: `"vertical"`)
- [x] Accepts optional `description?: string` displayed below the group label
- [x] Accepts optional `isDisabled`
- [x] API mirrors `AppCheckboxGroup` — only import name and return type differ
- [x] **✅ Passed**

---

### `AppTabs`

> Declarative tabs from an items array. No repeated `<Tab>` JSX at every callsite.

- [x] Accepts `items: { key: string; label: string; content: ReactNode }[]`
- [x] Accepts optional `defaultSelectedKey` and `selectedKey` + `onSelectionChange` for controlled mode
- [x] Accepts optional `variant` and `color` passed through to HeroUI `Tabs`
- [x] Accepts optional `disabledKeys: string[]`
- [x] Works in both uncontrolled (defaultSelectedKey) and controlled (selectedKey) modes
- [x] TypeScript: `key` values are inferred as a union from the items array where possible
- [x] **✅ Passed**

---

### `AppAccordion`

> Array-driven accordion. Like the example discussed — pass items, get the full component.

- [x] Accepts `items: { key: string; title: string; content: ReactNode; subtitle?: string }[]`
- [x] Accepts optional `selectionMode?: "single" | "multiple"` (default: `"single"`)
- [x] Accepts optional `defaultExpandedKeys` and `expandedKeys` + `onExpandedChange` for controlled mode
- [x] Accepts optional `variant` passed through to HeroUI `Accordion`
- [x] No `AccordionItem` JSX needed at callsite — fully array-driven
- [x] **✅ Passed**

---

### `StatusChip`

> Single chip component that works across all domains via a `statusMap` config.

- [x] Accepts `status: string` and `statusMap: Record<string, { label: string; color: ChipProps["color"] }>` as required props
- [x] Renders HeroUI `Chip` with the resolved `label` and `color` from the map
- [x] Falls back to rendering the raw `status` string with neutral color if key not found in map
- [x] Accepts optional `size` and `variant` passed through to HeroUI `Chip`
- [x] Each domain (orders, accounts, etc.) defines and exports its own `statusMap` constant — `StatusChip` itself stays generic
- [x] TypeScript: `status` prop is typed as `keyof typeof statusMap` when statusMap is passed as const
- [x] **✅ Passed**

---

### `AppToast` + `useToast`

> Global notification system. Called from mutations and form handlers without prop drilling.

- [x] `AppToastProvider` wraps the app at root level (once)
- [x] `useToast()` hook returns `{ toast }` — callable from any component
- [x] `toast.success(message)` shows a success notification
- [x] `toast.error(message)` shows an error notification
- [x] `toast.info(message)` shows an info notification
- [x] `toast.warning(message)` shows a warning notification
- [x] Each toast auto-dismisses after a configurable duration (default: 4000ms)
- [x] Toasts stack and queue — multiple toasts don't overlap
- [x] Accepts optional `description` in addition to the main message
- [x] **✅ Passed**

---

### `AppPagination`

> Controlled pagination bar. Used below every AppTable.

- [x] Accepts `page: number`, `total: number`, `onPageChange: (page: number) => void` as required props
- [x] Accepts optional `rowsPerPage?: number` (default: 10) for displaying "Showing X–Y of Z" text
- [x] Renders HeroUI `Pagination` component
- [x] Shows total item count and current range as readable text
- [x] Does not render at all (returns null) when `total <= rowsPerPage`
- [x] **✅ Passed**

---

### `AppTextArea`

> RHF-bound multiline text input. Same API shape as `AppTextField`.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Accepts optional `description`, `placeholder`, `isDisabled`, `isReadOnly`, `minRows`, `maxRows`
- [x] Uses `useController` — same pattern as `AppTextField`
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Supports `minRows` / `maxRows` for auto-resize via HeroUI Textarea props
- [x] API is identical to `AppTextField` at callsite — only import name differs
- [x] **✅ Passed**

---

## Phase 3 — Composites

---

### `DataTableCard`

> Full data table page section in one component. Composes AppTable + AppPagination + search.

- [x] Accepts `columns` (same shape as `AppTable`)
- [x] Accepts `queryFn: (params: { page: number; search: string }) => Promise<{ rows: T[]; total: number }>`
- [x] Manages `page` and `search` state internally
- [x] Debounces search input (300ms) before triggering refetch
- [x] Shows loading state in `AppTable` while query is in flight
- [x] Renders `AppPagination` below the table, connected to internal page state
- [x] Accepts optional `title?: string` rendered as a section header above the table
- [x] Accepts optional `actions?: ReactNode` slot for buttons in the header row (e.g. "Create" button)
- [x] Accepts optional `onRowAction` passed through to `AppTable`
- [x] Resets to page 1 when search changes
- [x] **✅ Passed**

---

### `FormModal`

> Modal + RHF form combined. Create and edit flows without repeated boilerplate.

- [x] Accepts `isOpen`, `onClose` as required props
- [x] Accepts `title: string` for the modal header
- [x] Accepts `onSubmit: (values: T) => Promise<void>` — async, triggers loading state
- [x] Accepts `schema: ZodType<T, FieldValues>` — wired to `zodResolver` internally
- [x] Accepts `defaultValues: Partial<T>` for edit flows (pre-fills the form)
- [x] Accepts `children: (control: Control<T>) => ReactNode` — render prop pattern for fields
- [x] Submit button shows loading spinner while `onSubmit` promise is pending
- [x] Form resets to `defaultValues` when modal closes
- [x] `onClose` is NOT called automatically on submit — caller decides when to close (after success toast, etc.)
- [x] Accepts optional `submitLabel?: string` (default: `"Save"`)
- [x] Accepts optional `size` passed through to HeroUI `Modal`
- [x] **✅ Passed**

---

### `AppForm`

> Flat field array renderer. Eliminates JSX field layout for standard forms.

- [x] Accepts `control: Control<T>` as required prop
- [x] Accepts `fields: AppFormField[]` — flat array, no nested row arrays
- [x] Accepts optional `cols?: 1 | 2 | 3` (default: `1`)
- [x] `AppFormField` supports `type`: `"text"`, `"email"`, `"password"`, `"number"`, `"textarea"`, `"select"`, `"switch"`, `"date"`, `"section"`
- [x] Fields with `col: "full"` span all columns regardless of `cols` setting
- [x] `type: "section"` renders a divider + label — has no `name`, is ignored by RHF
- [x] Fields with `showIf: (values: T) => boolean` are filtered out when condition returns false
- [x] Uses `useWatch` internally to reactively evaluate `showIf` conditions
- [x] `select` type field requires `items` in the field config
- [x] TypeScript: `name` on each field is typed as `keyof T` where possible
- [x] **✅ Passed**

---

## Phase 4 — Add When Needed

---

### `AppBreadcrumbs`

> Navigation breadcrumbs showing current location within a hierarchy. Pairs with `useRouteBreadcrumbs` hook for automatic route-driven generation.

- [x] Accepts `items: { key: string; label: string; href?: string; icon?: LucideIcon }[]`
- [x] Last item with no `href` is treated as the current (non-clickable) crumb automatically
- [x] Accepts optional `separator?: ReactNode` — custom separator between crumbs
- [x] Accepts optional `className?: string`
- [x] Renders HeroUI `Breadcrumbs` + `Breadcrumbs.Item`
- [x] `useRouteBreadcrumbs` hook reads `staticData.breadcrumb` + `staticData.breadcrumbIcon` from TanStack Router matches
- [x] Routes opt in via `staticData: { breadcrumb: "Label" }` — zero config at layout level
- [x] Module augmentation of `StaticDataRouteOption` is co-located in the hook file
- [x] **✅ Passed**

---

### `AppSpinner`

> Lightweight loading indicator for async states within sections or buttons.

- [x] Accepts optional `size?: "sm" | "md" | "lg"` (default: `"md"`)
- [x] Accepts optional `label?: string` — rendered below spinner for accessibility and UX
- [x] Accepts optional `color` passed through to HeroUI `Spinner`
- [x] Accepts optional `className?: string`
- [x] Thin wrapper — exists for consistent sizing and color defaults across the app
- [x] **✅ Passed**

---

### `AppTooltip`

> Informative label shown on hover or focus. Wraps any trigger element.

- [x] Accepts `content: string | ReactNode` — the tooltip text or rich content
- [x] Accepts `children: ReactNode` — the trigger element (button, icon, etc.)
- [x] Accepts optional `placement` passed through to HeroUI `Tooltip`
- [x] Accepts optional `delay?: number` — open delay in ms (default: HeroUI default)
- [x] Accepts optional `className?: string`
- [x] Does not require the trigger to be a button — works with any focusable element
- [x] **✅ Passed**

---

### `AppBadge`

> Positioned indicator dot or count overlaid on another element (avatar, icon, nav item).

- [x] Accepts `children: ReactNode` — the element the badge is anchored to
- [x] Accepts `content?: string | number | ReactNode` — the badge content (count, dot)
- [x] Accepts optional `color` passed through to HeroUI `Badge`
- [x] Accepts optional `variant` passed through to HeroUI `Badge`
- [x] Accepts optional `placement` (default: `"top-right"`)
- [x] Accepts optional `isInvisible?: boolean` — hides badge when true (e.g. zero notifications)
- [x] **✅ Passed**

---

### `AppToggleButton`

> Stateful on/off button for filters, view toggles, and toolbar states.

- [x] Accepts `isSelected: boolean` and `onChange: (isSelected: boolean) => void` as required props
- [x] Accepts `children: ReactNode` — button label or icon
- [x] Accepts optional `variant`, `size` passed through to HeroUI `ToggleButton`
- [x] Accepts optional `isDisabled`
- [x] Visual state (pressed/active) handled by HeroUI — no custom CSS needed
- [x] **✅ Passed**

---

### `AppInputOTP`

> One-time password input for 2FA and verification screens.

- [x] Accepts `value: string` and `onChange: (value: string) => void` as required props
- [x] Accepts `length?: number` (default: `6`) — number of OTP digits
- [x] Accepts optional `isDisabled`
- [x] Accepts optional `isInvalid?: boolean` and `errorMessage?: string` for manual validation wiring
- [x] Auto-advances focus to next slot on digit entry
- [x] Calls `onChange` with the full current string on every keystroke
- [x] Not RHF-bound internally — used standalone at auth screens; wrap in `useController` at callsite if needed
- [x] **✅ Passed**

---

### `AppProgressBar`

> Determinate or indeterminate horizontal progress indicator.

- [x] Accepts `value?: number` (0–100) — omit for indeterminate mode
- [x] Accepts optional `label?: string` — displayed above the bar
- [x] Accepts optional `showValueLabel?: boolean` — shows `"60%"` text (default: `false`)
- [x] Accepts optional `color` passed through to HeroUI `ProgressBar`
- [x] Accepts optional `isIndeterminate?: boolean` (default: `false`)
- [x] Accepts optional `className?: string`
- [x] **✅ Passed**

---

### `AppProgressCircle`

> Circular progress indicator. Same API shape as `AppProgressBar`.

- [x] Accepts `value?: number` (0–100) — omit for indeterminate mode
- [x] Accepts optional `label?: string` — rendered below the circle
- [x] Accepts optional `size?: "sm" | "md" | "lg"`
- [x] Accepts optional `color` passed through to HeroUI `ProgressCircle`
- [x] Accepts optional `isIndeterminate?: boolean` (default: `false`)
- [x] **✅ Passed**

---

### `AppInputGroup`

> Input with prefix and/or suffix decorators. For currency fields, unit labels, and icon-prefixed inputs.

- [x] Accepts `children: ReactNode` — the inner input element (e.g. `AppTextField`, raw `Input`)
- [x] Accepts optional `startContent?: ReactNode` — prefix slot (icon, text, select)
- [x] Accepts optional `endContent?: ReactNode` — suffix slot (unit label, button)
- [x] Accepts optional `className?: string`
- [x] Thin wrapper around HeroUI `InputGroup` — no RHF logic internally
- [x] **✅ Passed**

---

### `AppTagGroup`

> Selectable or removable tag list. Used for interest pickers, filter chips, and skill selectors.

- [x] Accepts `items: { key: string; label: string }[]` as required prop
- [x] Accepts optional `selectionMode?: "none" | "single" | "multiple"` (default: `"none"`)
- [x] Accepts optional `selectedKeys` and `onSelectionChange` for controlled selection mode
- [x] Accepts optional `onRemove?: (key: string) => void` — shows × on each tag when provided
- [x] Accepts optional `isDisabled`
- [x] **✅ Passed**

---

### `AppDateRangePicker`

> RHF-bound date range picker for report filters and date-ranged queries.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Returns `{ start: CalendarDate; end: CalendarDate }` to RHF — matches HeroUI's native type
- [x] Uses `useController` — same pattern as `AppDatePicker`
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `minValue`, `maxValue` passed through
- [x] Accepts optional `isDisabled`
- [x] Zod schema helper exported alongside (e.g. `calendarDateRangeSchema`) for consistent validation
- [x] **✅ Passed**

---

### `AppPopover`

> Rich content panel triggered by a button or custom element. For column pickers, filter panels, and detail previews.

- [x] Accepts `trigger: ReactNode` — the element that opens the popover
- [x] Accepts `children: ReactNode` — the popover body content
- [x] Accepts optional `placement` passed through to HeroUI `Popover`
- [x] Accepts optional `isOpen` and `onOpenChange` for controlled mode
- [x] Accepts optional `className?: string` for the popover panel
- [x] Uncontrolled by default — no state required at callsite
- [x] **✅ Passed**

---

### `AppAvatar`

> Avatar with automatic initials fallback and optional status badge.

- [x] Accepts `name: string` — used to generate initials if no image
- [x] Accepts optional `src?: string` — if provided, shows image; falls back to initials on error
- [x] Initials generated from first + last word of `name` (e.g. "Juan dela Cruz" → "JC")
- [x] Accepts optional `badge?: { color: string; content?: ReactNode }` — renders HeroUI `Badge` overlay
- [x] Accepts optional `size` passed through to HeroUI `Avatar`
- [x] **✅ Passed**

---

### `AsyncButton`

> Button with built-in loading and disabled state for async actions.

- [x] Accepts `onPress: () => Promise<void>` — async handler
- [x] Shows HeroUI `Spinner` inside button while promise is pending
- [x] Button is `isDisabled` while loading — prevents double submission
- [x] Accepts `children: ReactNode` as the button label
- [x] Accepts optional `variant`, `size`, `startContent` passed through to HeroUI `Button`
- [x] Loading spinner replaces `startContent` (if any) while pending
- [x] **✅ Passed**

---

### `AppCheckbox` + `AppCheckboxGroup`

> RHF-bound checkbox controls for single and multi-select use cases.

- [x] `AppCheckbox`: accepts `name`, `label`, `control` — wires `isSelected` to a `boolean` in RHF
- [x] `AppCheckboxGroup`: accepts `name`, `label`, `control`, `items: { label: string; value: string }[]`
- [x] `AppCheckboxGroup` wires `value` (string array) and `onChange` to RHF via `useController`
- [x] Both wire `isInvalid` and `errorMessage` from `fieldState`
- [x] **✅ Passed**

---

### `AppSearchField`

> Debounced search input with clear button. Used standalone or inside DataTableCard.

- [x] Accepts `value`, `onValueChange` as controlled props
- [x] Accepts `debounceMs?: number` (default: `300`) — debounces the `onValueChange` call
- [x] Renders HeroUI `SearchField` with built-in clear button
- [x] Accepts optional `placeholder` (default: `"Search..."`)
- [x] Accepts optional `isDisabled`
- [x] Exposes `onClear` that resets value immediately (no debounce)
- [x] **✅ Passed**

---

### `AppNumberField`

> RHF-bound number input with increment/decrement for quantity and price fields.

- [x] Accepts `name`, `label`, `control` as required props
- [x] Uses `useController` — returns a JS `number` to RHF (not a string)
- [x] Accepts optional `minValue`, `maxValue`, `step`
- [x] Accepts optional `formatOptions` for currency/percent display (passed to HeroUI `NumberField`)
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `isDisabled`
- [x] **✅ Passed**

---

### `AppDropdown`

> Action menu from an items array. For row actions and context menus.

- [x] Accepts `items: { key: string; label: string; color?: "danger"; isDisabled?: boolean }[]`
- [x] Accepts `onAction: (key: string) => void`
- [x] Accepts `trigger: ReactNode` — the element that opens the dropdown (e.g. a `...` button)
- [x] Danger actions (e.g. Delete) use `color: "danger"` in the items config — no special prop needed
- [x] Accepts optional `disabledKeys: string[]`
- [x] **✅ Passed**

---

### `AppAutocomplete` _(added)_

> RHF-bound searchable select. Same API as `AppSelect` with built-in filtering.

- [x] Accepts `name`, `label`, `control`, `items` as required props
- [x] `items` is typed as `{ label: string; value: string }[]`
- [x] Built-in search filtering via `useFilter` — no extra setup at callsite
- [x] Returns a `string` to RHF (same as `AppSelect`)
- [x] Wires `isInvalid` and `errorMessage` from `fieldState`
- [x] Accepts optional `placeholder`, `description`, `isDisabled`
- [x] Shows "No results found" empty state when nothing matches
- [x] **✅ Passed**

---

## Summary Tracker

| Component | Phase | Status |
|---|---|---|
| AppTextField | 1 | ✅ Passed |
| AppSelect | 1 | ✅ Passed |
| AppSwitch | 1 | ✅ Passed |
| AppDatePicker | 1 | ✅ Passed |
| AppTable | 1 | ✅ Passed |
| AppAlertDialog | 1 | ✅ Passed |
| AppAlert | 2 | ✅ Passed |
| AppChip | 2 | ✅ Passed |
| AppModal | 2 | ✅ Passed |
| AppRadioGroup | 2 | ✅ Passed |
| AppTabs | 2 | ✅ Passed |
| AppAccordion | 2 | ✅ Passed |
| StatusChip | 2 | ✅ Passed |
| AppToast + useToast | 2 | ✅ Passed |
| AppPagination | 2 | ✅ Passed |
| AppTextArea | 2 | ✅ Passed |
| DataTableCard | 3 | ✅ Passed |
| FormModal | 3 | ✅ Passed |
| AppForm | 3 | ✅ Passed |
| AppAvatar | 4 | ✅ Passed |
| AsyncButton | 4 | ✅ Passed |
| AppCheckbox + AppCheckboxGroup | 4 | ✅ Passed |
| AppSearchField | 4 | ✅ Passed |
| AppNumberField | 4 | ✅ Passed |
| AppDropdown | 4 | ✅ Passed |
| AppAutocomplete | 4 | ✅ Passed |
| AppBreadcrumbs | 4 | ✅ Passed |
| AppSpinner | 4 | ✅ Passed |
| AppTooltip | 4 | ✅ Passed |
| AppBadge | 4 | ✅ Passed |
| AppToggleButton | 4 | ✅ Passed |
| AppInputOTP | 4 | ✅ Passed |
| AppProgressBar | 4 | ✅ Passed |
| AppProgressCircle | 4 | ✅ Passed |
| AppInputGroup | 4 | ✅ Passed |
| AppTagGroup | 4 | ✅ Passed |
| AppDateRangePicker | 4 | ✅ Passed |
| AppPopover | 4 | ✅ Passed |

---

*Stack: TanStack Start · HeroUI v3 · React Hook Form · Zod · TypeScript strict*
