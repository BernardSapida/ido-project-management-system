# Accessibility

Accessibility is not optional — it affects usability for everyone, improves SEO, and is legally required in many contexts. HeroUI v3 handles the foundation automatically via React Aria. Your job is to layer on the parts it cannot know — labels, alt text, semantics, and contrast — without breaking what it already provides.

---

## What HeroUI v3 handles automatically

HeroUI v3 is built on React Aria. Do not duplicate or override these — they are already correct:

- ARIA roles (`role="button"`, `role="dialog"`, `role="listbox"`, etc.)
- Keyboard navigation (Tab, Enter, Space, Escape, Arrow keys)
- Focus management (traps focus in modals, returns focus on close)
- Screen reader announcements for state changes
- Touch and pointer events normalized
- Reduced motion support (via Framer Motion integration)

---

## Native HTML vs HeroUI v3 components

Never use native HTML tags when a HeroUI v3 equivalent exists. Using native tags bypasses the React Aria accessibility foundation built into every HeroUI component.

```jsx
// WRONG — bypasses React Aria keyboard nav, focus, and ARIA roles
<button onClick={handleClick}>Submit</button>
<a href="/dashboard">Go to dashboard</a>
<input type="text" placeholder="Search..." />

// CORRECT — use HeroUI v3 components
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";

<Button onPress={handleClick}>Submit</Button>
<Link href="/dashboard">Go to dashboard</Link>
<Input placeholder="Search..." aria-label="Search" />
```

For navigation between routes, use TanStack Router's `<Link>` component, not a native `<a>` tag.

```jsx
// WRONG
<a href="/settings">Settings</a>

// CORRECT
import { Link } from "@tanstack/react-router";
<Link to="/settings">Settings</Link>
```

---

## aria-label requirements

HeroUI v3 components built on React Aria will produce browser console warnings when `aria-label` or `aria-labelledby` is missing. Treat these as required on every HeroUI component — not optional.

**Rule:** If the component's purpose cannot be determined from its visible text content alone, it must have `aria-label`.

```jsx
// Icon-only buttons — always required
<Button isIconOnly aria-label="Close dialog">
  <XIcon />
</Button>

// Inputs — always required, even with placeholder
<Input aria-label="Search projects" placeholder="Search..." />

// Tables — always required
<Table aria-label="Recent transactions">

// Selects, dropdowns, modals — always required
<Select aria-label="Choose a country">
<Modal aria-label="Edit profile">
```

For inputs with a visible label, use `aria-labelledby` pointing to the label's `id` instead of duplicating the text in `aria-label`.

---

## WCAG contrast ratios

| Text type | Minimum ratio | Level |
|---|---|---|
| Normal text (<18px or <14px bold) | 4.5:1 | AA |
| Large text (≥18px or ≥14px bold) | 3:1 | AA |
| UI components, icons, focus rings | 3:1 | AA |
| Decorative elements | None | — |

Safe HeroUI / Tailwind v4 choices:

```jsx
// Safe on dark backgrounds
<p className="text-foreground">        {/* primary — always safe */}
<p className="text-default-700">       {/* secondary — safe */}
<p className="text-default-500">       {/* check at small sizes */}

// Safe on light backgrounds
<p className="text-default-900">       {/* primary */}
<p className="text-default-600">       {/* check below 16px */}

// Danger zones — avoid for body text
// text-default-400 and below will fail WCAG AA at normal text sizes
// White text on yellow, lime, or light brand colors
// Mid-tone brand colors on white backgrounds
```

Check contrast using browser DevTools accessibility panel or the `axe` extension.

---

## Focus states

HeroUI v3 provides focus rings on all interactive components automatically. Never suppress them.

```jsx
// WRONG — removes focus ring, fails keyboard accessibility
<button className="focus:outline-none">Click</button>

// CORRECT — HeroUI Button has a focus ring built in, nothing needed
<Button>Click</Button>

// CORRECT — custom interactive element that has no HeroUI equivalent
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg cursor-pointer"
>
  Custom card
</div>
```

Always use `focus-visible:` — not `focus:`. It shows the ring only for keyboard navigation, not mouse clicks.

---

## Semantic HTML

HeroUI components use correct semantic elements internally. In surrounding markup:

```html
<!-- One h1 per page, logical descending order — never skip levels -->
<h1>Page title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

<!-- Never use heading levels for visual sizing — use className or HeroUI Typography props -->

<!-- Actions vs navigation -->
<!-- Button triggers an action -->
<!-- Link navigates — use HeroUI Link or TanStack Router Link -->

<!-- Never use div or span with onClick for interactive elements -->
<!-- Always use role="button" + tabIndex + onKeyDown if no HeroUI equivalent exists -->

<!-- Landmarks — one per role -->
<main>    <!-- one per page -->
<nav>     <!-- navigation regions -->
<aside>   <!-- sidebar content -->
<article> <!-- self-contained content -->
<section> <!-- thematic group with a heading -->
```

---

## Color — never rely on color alone

Color-blind users and high contrast mode users need a second signal beyond color.

```jsx
// WRONG — color is the only differentiator
<div className="text-green-500">Success</div>
<div className="text-red-500">Error</div>

// CORRECT — color + icon + text
<div className="flex items-center gap-2 text-success-700">
  <CheckCircleIcon className="w-4 h-4" />
  <span>Payment successful</span>
</div>

// CORRECT — HeroUI Input handles error color + icon automatically
<Input
  isInvalid={!!error}
  errorMessage={error}
/>
```

---

## Images

```jsx
// Meaningful image — descriptive alt text
<img src="chart.png" alt="Revenue growth chart showing 40% increase in Q4" />

// Decorative image — empty alt so screen readers skip it
<img src="background-pattern.png" alt="" />
```

Never use `alt="image"`, `alt="photo"`, or `alt="icon"` — these are meaningless to screen readers.

---

## Loading states

Skeleton and spinner states are invisible to assistive technology without an announcement.

```jsx
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Spinner aria-label="Loading content" /> : <Content />}
</div>
```

---

## Animations and reduced motion

HeroUI v3 and Framer Motion both respect `prefers-reduced-motion` automatically. Do not create animations in `styles.css` using `@keyframes` or `transition` — these bypass the OS preference entirely.

```jsx
// WRONG — CSS animation ignores prefers-reduced-motion
// styles.css:
// @keyframes slide-in { from { opacity: 0; transform: translateY(8px); } }
// .card { animation: slide-in 0.3s ease; }

// CORRECT — Framer Motion respects reduced motion automatically
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Card content
</motion.div>
```

If a CSS animation is genuinely unavoidable (e.g. a CSS-only spinner), wrap it in the media query:

```css
@media (prefers-reduced-motion: no-preference) {
  .spinner {
    animation: spin 1s linear infinite;
  }
}
```

Or use Tailwind's motion utilities:

```jsx
<div className="motion-safe:transition-transform motion-safe:hover:scale-105">
  Card
</div>
```

---

## Form accessibility

HeroUI's `Input` component handles label association automatically when you pass the `label` prop. Use it instead of building label/input pairs manually.

```jsx
// WRONG — label not associated, missing required indicators
<label>Email</label>
<input type="email" />

// CORRECT — HeroUI Input handles all association internally
<Input
  label="Email"
  isRequired
  aria-required="true"
  description="We'll never share your email"
  isInvalid={!!errors.email}
  errorMessage={errors.email}
/>
```

---

## Skip navigation

Add a skip link at the very top of every page. Keyboard users need a way to bypass repeated navigation.

```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
>
  Skip to main content
</a>

<main id="main-content">
  {/* page content */}
</main>
```

---

## Pre-ship checklist

- [ ] All images have descriptive `alt` text (empty `alt=""` for decorative)
- [ ] All HeroUI components have `aria-label` or `aria-labelledby`
- [ ] No native `<button>`, `<a>`, or `<input>` where a HeroUI v3 equivalent exists
- [ ] No `focus:outline-none` without a visible replacement
- [ ] No information conveyed by color alone (icon + text alongside)
- [ ] WCAG AA contrast passes on all text (check with DevTools or axe)
- [ ] Heading levels are logical and not skipped
- [ ] One `<h1>` and one `<main>` per page
- [ ] Loading states use `aria-live` + `aria-busy`
- [ ] All animations use Framer Motion — no custom `@keyframes` in CSS files
- [ ] Skip navigation link present at top of every page
- [ ] `<Button>` for actions, HeroUI/TanStack `<Link>` for navigation — not interchangeable