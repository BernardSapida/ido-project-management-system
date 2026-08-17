# Responsive Design

How to build layouts that work across all screen sizes using Tailwind v4 breakpoints and HeroUI v3 components.

---

## Tailwind v4 breakpoints

Tailwind v4 uses a CSS-first config approach. All breakpoints are **mobile-first** — unprefixed classes apply to all sizes, prefixed classes apply at that size and above.

| Prefix | Min-width | Typical target |
|--------|-----------|----------------|
| (none) | 0px | Mobile — always the default |
| `sm:` | 640px | Large mobile / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Small desktop / landscape tablet |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |

**Custom breakpoints in Tailwind v4 (CSS-first config):**
```css
@import "tailwindcss";

@theme {
  --breakpoint-xs: 480px;   /* custom — use sparingly */
  --breakpoint-3xl: 1920px; /* custom for wide monitors */
}
```

---

## The mobile-first mindset

Always design and code mobile first. Add complexity as screen size increases — never remove it.

```jsx
// Mobile: stacked full-width, Desktop: side by side
<div className="flex flex-col lg:flex-row gap-6">
  <div className="w-full lg:w-1/2">...</div>
  <div className="w-full lg:w-1/2">...</div>
</div>
```

**Common stacking patterns:**

| Mobile | Desktop |
|--------|---------|
| Single column | 2–3 columns |
| Full-width cards | Card grid |
| Bottom nav | Side nav |
| Hidden sidebar | Visible sidebar |
| Stacked form fields | Inline form fields |
| Icon only | Icon + label |

---

## Layout patterns by screen size

### Navigation

```jsx
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";

// Responsive top nav — desktop links hidden on mobile
<Navbar>
  <NavbarBrand>
    <Logo />
    <p className="font-semibold text-inherit">AppName</p>
  </NavbarBrand>
  <NavbarContent className="hidden md:flex gap-6" justify="center">
    <NavbarItem>
      <Link to="/features">Features</Link>
    </NavbarItem>
    <NavbarItem>
      <Link to="/pricing">Pricing</Link>
    </NavbarItem>
  </NavbarContent>
  <NavbarContent justify="end">
    <NavbarItem className="hidden md:flex">
      <Link to="/login">Sign in</Link>
    </NavbarItem>
    <NavbarItem>
      <Button color="primary" size="sm" onPress={handleGetStarted}>Get started</Button>
    </NavbarItem>
  </NavbarContent>
</Navbar>
```

### Dashboard layout

```jsx
// Sidebar hidden on mobile, visible on lg+
<div className="flex h-screen">
  <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-default-50 border-r border-default-200">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1 lg:pl-64 overflow-auto">
    {/* Page content */}
  </main>
</div>
```

### Card grids

```jsx
{/* 1 col mobile → 2 col tablet → 3 col desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>

{/* Metric cards: 2 col mobile → 4 col desktop */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {metrics.map(m => <MetricCard key={m.id} {...m} />)}
</div>
```

### Hero sections

```jsx
<section className="flex flex-col items-center text-center gap-8 py-16 px-6 lg:flex-row lg:text-left lg:items-center lg:gap-16 lg:py-24 lg:px-12">
  <div className="lg:w-1/2">
    {/* Text content */}
  </div>
  <div className="lg:w-1/2">
    {/* Image/illustration */}
  </div>
</section>
```

---

## Responsive typography

```jsx
{/* Responsive text sizes using Tailwind breakpoint prefixes */}
<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight">
<h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
<p className="text-sm md:text-base leading-relaxed">
```

**Fluid typography with clamp — define in Tailwind v4 CSS config:**
```css
@theme {
  --text-display: clamp(2.5rem, 5vw, 5rem);   /* scales 40px–80px */
  --text-heading: clamp(1.5rem, 3vw, 2.5rem); /* scales 24px–40px */
}
```

**Text width constraint — always:**
```jsx
<p className="max-w-prose">  {/* ~65ch — built into Tailwind */}
<p className="max-w-2xl">    {/* 672px — good for body text */}
```

---

## Responsive spacing

```jsx
{/* Padding scales up with screen size */}
<section className="px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-24">

{/* Gap scales up */}
<div className="flex flex-col gap-4 md:gap-6 lg:gap-8">

{/* Container with responsive max-width */}
<div className="container mx-auto px-4 md:px-6 lg:px-8">
```

**Tailwind v4 container configuration:**
```css
@theme {
  --container-padding: 1rem;  /* default container side padding */
}
```

---

## HeroUI v3 responsive props

HeroUI v3 components accept responsive prop objects on some properties. For layout responsiveness, prefer Tailwind breakpoint classes on wrapper divs.

```jsx
// Responsive grid using Tailwind — preferred
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
  <Card />
</div>

// HeroUI Tabs — responsive layout using Tailwind on wrapper
<div className="w-full overflow-x-auto">
  <Tabs aria-label="Views" color="primary">
    <Tab key="overview" title="Overview">...</Tab>
    <Tab key="analytics" title="Analytics">...</Tab>
  </Tabs>
</div>
```

---

## Images and media

```jsx
{/* Responsive image — never overflow container */}
<img className="w-full h-auto object-cover" src="..." alt="Descriptive alt text" />

{/* Responsive aspect ratio */}
<div className="aspect-video md:aspect-[4/3] lg:aspect-video overflow-hidden rounded-lg">
  <img className="w-full h-full object-cover" src="..." alt="..." />
</div>

{/* Hide/show by breakpoint */}
<img className="block md:hidden" src="mobile-image.jpg" alt="..." />
<img className="hidden md:block" src="desktop-image.jpg" alt="..." />
```

---

## What to never do

- **Never design desktop first** — adding breakpoints to remove things is harder than adding things progressively
- **Never use fixed pixel widths** — use `w-full`, `max-w-*`, `min-w-*`, or grid/flex proportions
- **Never hide important content on mobile** — if it's important, it should be accessible on all screens; restructure instead of hiding
- **Never use `px` for font sizes** — use Tailwind's text scale or `rem` values so browser scaling works
- **Never rely on hover-only interactions on mobile** — touch devices have no hover state; all functionality must be accessible via tap
- **Never use native `<input>`, `<button>`, or `<select>` in responsive layouts** — use HeroUI equivalents so accessibility is maintained across all screen sizes