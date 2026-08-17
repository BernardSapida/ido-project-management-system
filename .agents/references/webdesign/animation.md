# Animation and Transitions

Animation should serve the user — confirming actions, communicating state, and guiding attention. It should never exist purely for visual flair or slow the user down.

> Good animation is invisible. Users feel it but don't notice it. Bad animation is noticed — and then resented.

---

## What HeroUI v3 handles automatically

HeroUI v3 uses Framer Motion internally. These animations are built in — don't replace them:

- ✅ Modal open/close (scale + fade)
- ✅ Dropdown open/close (slide + fade)
- ✅ Tooltip show/hide (fade)
- ✅ Button press feedback (scale)
- ✅ Tabs transition (slide indicator)
- ✅ Accordion expand/collapse
- ✅ Toast notifications (slide in/out)
- ✅ Skeleton shimmer

**Don't add custom animations on top of HeroUI's built-in ones** — they'll stack and feel heavy.

---

## When to animate (and when not to)

| Animate | Don't animate |
|---------|--------------|
| State changes (open/close, show/hide) | Decorative elements that don't change |
| User feedback (button press, form submit) | Page backgrounds or static illustrations |
| Loading states (skeleton, spinner) | Every element on page load |
| Navigation transitions | Text that's just rendering |
| Data updates (count changes, chart updates) | Hover effects on non-interactive elements |

**The question to ask:** Does this animation communicate something to the user, or is it just moving for the sake of moving?

---

## Duration guidelines

Speed communicates weight. Fast = light, responsive. Slow = heavy, important.

| Type | Duration | Use for |
|------|----------|---------|
| Micro | 75–100ms | Button press, checkbox tick, switch toggle |
| Fast | 150–200ms | Tooltips, dropdown open, hover state |
| Default | 250–300ms | Modal open, drawer slide, tab change |
| Slow | 400–500ms | Page transitions, large content reveals |
| Never | >500ms | Any UI transition — feels broken |

```jsx
// Tailwind duration utilities — use on wrapper divs, not HeroUI components
// duration-75   — micro interactions
// duration-150  — fast
// duration-200  — fast
// duration-300  — default
// duration-500  — slow, use sparingly
```

---

## Easing curves

Easing makes motion feel natural — objects don't start and stop instantly in the real world.

| Easing | Use for |
|--------|---------|
| Ease out | Elements entering the screen (decelerates into place) |
| Ease in | Elements leaving the screen (accelerates away) |
| Ease in-out | Elements moving within the screen |
| Linear | Progress bars, loading indicators, spinners |

```jsx
import { motion } from "framer-motion";

// Element appearing (ease-out — starts fast, settles into place)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// Element disappearing (ease-in — accelerates away)
<motion.div
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2, ease: "easeIn" }}
>
```

---

## Tailwind v4 transition utilities

Use Tailwind transition utilities on wrapper divs and non-HeroUI elements only. Never add transition classes directly to HeroUI components — they manage their own animation via Framer Motion internally.

```jsx
// On a plain wrapper div — fine
<div className="transition-colors duration-200 hover:bg-default-100">

// On a plain div card — fine
<div className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">

// On a HeroUI Button — WRONG, HeroUI manages its own press animation
<Button className="transition-transform duration-200">  {/* remove this */}
```

**Performance rule:** Animate only `transform` and `opacity` when possible — these are GPU-accelerated and won't cause layout reflows. Avoid animating `width`, `height`, `margin`, `padding` — they trigger expensive layout recalculations.

---

## Common animation patterns

### Fade in on mount

```jsx
import { motion } from "framer-motion";

// Simple fade-in for content that appears
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>
```

### Hover lift on cards

```jsx
import { motion } from "framer-motion";

// Subtle — preferred for dashboards
<motion.div
  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}
  transition={{ duration: 0.2, ease: "easeOut" }}
  className="cursor-pointer"
>
  <Card>...</Card>
</motion.div>

// Or with Tailwind on a plain wrapper div
<div className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer">
  <Card>...</Card>
</div>
```

### Button press feedback

```jsx
// HeroUI Button has press feedback built in via Framer Motion — nothing needed
<Button color="primary" onPress={handleClick}>Submit</Button>

// For a completely custom element with no HeroUI equivalent:
<motion.div
  role="button"
  tabIndex={0}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.075 }}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
>
  Custom interactive element
</motion.div>
```

### Skeleton loading states

```jsx
// Always use HeroUI Skeleton — shimmer is built in, no custom CSS needed
import { Skeleton, Card, CardBody } from "@heroui/react";

<Card>
  <CardBody className="flex gap-3">
    <Skeleton className="rounded-full w-10 h-10" />
    <div className="flex flex-col gap-2 flex-1">
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
    </div>
  </CardBody>
</Card>

// WRONG — never write a custom shimmer in CSS when HeroUI Skeleton exists
// @keyframes shimmer { ... }   ← don't do this
// .skeleton { animation: shimmer ... }  ← don't do this
```

### Number counter animation (metric cards)

```jsx
import { motion, useSpring, useTransform } from "framer-motion";

// Use Framer Motion springs — not @react-spring/web
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (n) => Math.round(n).toLocaleString());
  return <motion.span>{display}</motion.span>;
}

// Usage
<AnimatedNumber value={targetValue} />
```

### Page / route transitions

```jsx
import { motion, AnimatePresence } from "framer-motion";

// Fade only — most appropriate for dashboards and apps
<AnimatePresence mode="wait">
  <motion.div
    key={routeKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    <PageContent />
  </motion.div>
</AnimatePresence>

// Slide up — appropriate for mobile, settings pages, detail views
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
```

---

## Staggered animations (list reveals)

For landing pages and feature sections — items appearing one after another:

```jsx
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }  // 80ms between each item
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {features.map(f => (
    <motion.li key={f.id} variants={item}>
      <FeatureCard {...f} />
    </motion.li>
  ))}
</motion.ul>
```

**Stagger rules:**
- 60–100ms between items is the sweet spot — faster feels glitchy, slower feels broken
- Only animate the first screenful of items — don't stagger items below the fold
- Only use on landing pages and first-load experiences — never on data tables or repeated interactions

---

## Optimistic UI animation

```jsx
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const handleDelete = async (id: string) => {
  // 1. Remove immediately (optimistic)
  setItems(prev => prev.filter(item => item.id !== id));

  try {
    await deleteItem(id);
    toast.success("Deleted successfully");
  } catch (error) {
    // 2. Restore if error
    setItems(prev => [...prev, restoredItem]);
    toast.error("Failed to delete. Please try again.");
  }
};

// Item exit animation with Framer Motion
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ListItem item={item} onDelete={handleDelete} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Reduced motion — always respect it

HeroUI v3 and Framer Motion handle this automatically. For custom animations, use the Framer Motion hook:

```jsx
import { motion, useReducedMotion } from "framer-motion";

function FadeIn({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

Never use `@media (prefers-reduced-motion: reduce)` to zero out all CSS animations globally — it fights Framer Motion's own reduced motion handling and creates unpredictable results.

---

## Animation anti-patterns

- **Creating custom `@keyframes` in CSS** — use Framer Motion instead; CSS animations bypass `prefers-reduced-motion` handling
- **Animating on every hover** — save hover animations for interactive elements that benefit from them; not every div
- **Bouncy/spring animations on UI elements** — springs feel playful; dashboards and productivity apps should feel crisp and direct
- **Animating large layout changes** — animating `width`, `height`, or `grid-template` causes jank; use `transform` instead
- **Entrance animations on everything** — if the whole page animates in, nothing feels special
- **Long animations on repeated actions** — a delete animation at 500ms feels fine once; after the 10th time it's infuriating
- **Animations that block interaction** — users should be able to click/type before animations finish
- **Adding Framer Motion animations on HeroUI components directly** — HeroUI already uses Framer Motion internally; stacking on top creates double animation