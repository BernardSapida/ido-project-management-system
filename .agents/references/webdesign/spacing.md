# Spacing

Spacing signals relationship. Elements that are closer together feel more related. Elements that are farther apart feel more independent. This is the most important mental model for spacing decisions.

---

## The 8px grid system

All spacing values should be multiples of 8px (or 4px for micro-gaps). Tailwind's default spacing scale already follows this — use it directly.

| Tailwind class | Value | Use case |
|----------------|-------|----------|
| `gap-1` / `p-1` | 4px | Icon-to-label gaps, tight inline pairs |
| `gap-2` / `p-2` | 8px | Between sibling elements inside a component |
| `gap-4` / `p-4` | 16px | Internal card/component padding |
| `gap-6` / `p-6` | 24px | Wrapper padding, title-to-content gap |
| `gap-8` / `p-8` | 32px | Between major content sections |
| `gap-12` | 48px | Between top-level page sections on desktop |
| `py-16` / `py-24` | 64–96px | Vertical padding on hero and marketing sections |

Use the same system for corner radii and icon sizes where possible.

---

## The Outside-In Method

Apply spacing from outermost layer inward. Each layer uses less space than the one containing it.

```
Page edge
  └── Wrapper padding:          px-6 (24px)    ← screen breathing room
        └── Between sections:       gap-12 / mt-12   ← largest internal gap
              └── Title → content:      mb-6 (24px)    ← heading belongs here
                    └── Card padding:       p-4 (16px)    ← inside the component
                          └── Element gaps:    gap-2 (8px)   ← smallest unit
```

**Layer 1 — Wrapper / screen padding (`px-6` desktop, `px-4` mobile)**
Content never touches the viewport edge.

**Layer 2 — Between major sections (`mt-12` or `gap-12`)**
The gap between distinctly different content groups. This large gap says: *these are separate topics*.

**Layer 3 — Heading to its content group (`mb-6`)**
The heading belongs to the content below it — pulled toward its content, not floating between sections.

**Layer 4 — Component internal padding (`p-4`)**
Padding inside cards, buttons, inputs. Tighter than section gaps — contents of a card are closely related.

**Layer 5 — Individual elements (`gap-2`)**
Minimum `gap-1` (4px) between any two visible elements. Below this, things read as merged or broken.

---

## The relationship multiplier rule

If the gap between an element and its closest neighbor is `1×`, the gap between that element and a less-related neighbor should be `2×`.

```jsx
// Section heading at mb-6, section gap at mt-12 (2x)
<div>
  <h2 className="mb-6">Section heading</h2>  {/* 1× — close to its content */}
  <div className="grid grid-cols-3 gap-4">
    <Card />
    <Card />
    <Card />
  </div>
</div>

<div className="mt-12">  {/* 2× — next section is unrelated */}
  <h2 className="mb-6">Next section</h2>
  ...
</div>
```

Applies everywhere: hero text → CTA (close), CTA → next section (far), card title → card body (close), card → next card (farther).

---

## Dashboard-specific spacing

Dashboards use **smaller font sizes and tighter spacing** than landing pages — more content density is required.

```jsx
// Landing page section spacing
<section className="py-24">

// Dashboard section spacing
<section className="py-6">

// Dashboard card grid — tighter gap
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## Hard rules

| Rule | Tailwind equivalent |
|------|---------------------|
| Minimum element gap | `gap-1` (4px) |
| Tappable target spacing (mobile) | `gap-3` to `gap-10` (12–42px) |
| All values on 4px grid | Use Tailwind default scale only |
| Parent gap > child gap | Always |

---

## Lines vs spacing for list separation

Prefer spacing over divider lines:

```jsx
// Preferred — cleaner, less visual noise
<div className="flex flex-col gap-4">
  {items.map(item => <ListItem key={item.id} {...item} />)}
</div>

// If spacing must be tight: alternating background
<div className="flex flex-col">
  {items.map((item, i) => (
    <div key={item.id} className={i % 2 === 0 ? "" : "bg-default-50"}>
      <ListItem {...item} />
    </div>
  ))}
</div>

// Avoid: divider lines everywhere — use HeroUI Divider only when necessary
import { Divider } from "@heroui/react";
<Divider />  {/* sparingly */}
```

Rule: the fewer visual elements used to communicate the same thing, the better.

---

## Common mistakes

- **Same gap everywhere** — flattens hierarchy; everything feels equally related
- **No wrapper** — content bleeding to viewport edges; looks unfinished
- **Title too far from its content** — the heading visually disowns the content it belongs to
- **Mobile too tight** — mobile needs more vertical spacing than desktop, not less
- **Inconsistent padding** — a card with `pt-4 px-6` (16px top, 24px side) looks unbalanced; keep all sides equal unless there's a deliberate reason

---

## Tailwind spacing quick reference

```jsx
// Gaps
<div className="gap-1">   {/* 4px — icon to label */}
<div className="gap-2">   {/* 8px — elements within a component */}
<div className="gap-4">   {/* 16px — card internal spacing */}
<div className="gap-6">   {/* 24px — title to content */}
<div className="gap-8">   {/* 32px — between sections */}
<div className="gap-12">  {/* 48px — major section separation */}

// Section padding
<section className="py-12">   {/* dashboard section */}
<section className="py-24">   {/* landing page section */}
<section className="py-32">   {/* landing page hero */}

// Container
<div className="max-w-7xl mx-auto px-6">
```