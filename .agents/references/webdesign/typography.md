# Typography

Typography is the 20% of design work that produces 80% of the results. Most UIs are text, buttons, and icons — getting type right is the single highest-leverage design skill.

> Typography is not just about the font you choose. It's how you use the font you choose.

---

## Font size scale — keep it minimal

Pick one base size. Deviate as little as possible.

| Size | Use |
|------|-----|
| **14px or 16px** | Base — body text, labels, input text, secondary content |
| **base ±2px** | The only other sizes needed for 99% of UI |
| **One larger size** | Primary page/section headings only |

**Three sizes maximum** covers almost every interface. More than that produces messy, random-feeling layouts.

**The weight+color substitution:** You don't need a new font size to create hierarchy. Combining weight and lightness achieves the same result:

```css
/* Same 16px base — four visually distinct levels */
.title       { font-size: 1rem; font-weight: 600; color: hsl(0,0%,90%); }
.body        { font-size: 1rem; font-weight: 400; color: hsl(0,0%,75%); }
.secondary   { font-size: 1rem; font-weight: 400; color: hsl(0,0%,55%); }
.label-caps  { font-size: 1rem; font-weight: 500; color: hsl(0,0%,45%); letter-spacing: 0.06em; text-transform: uppercase; }
```

**Use max 2 font sizes per component.** Use weight and color for all other hierarchy levels.

**Code for document hierarchy, style for visual hierarchy.** An `h1` tag doesn't always need to be the biggest visual element. Use semantic HTML correctly, then override visually based on what the user actually focuses on.

---

## Line height

Line height creates invisible breathing room. Get it wrong and text feels like a wall.

| Text type | Line height multiplier |
|-----------|----------------------|
| Large headings (32px+) | 1.1–1.2× |
| Medium headings (20–32px) | 1.2–1.3× |
| Body text | 1.4–1.5× |

**Rule: line height shrinks as text size grows.**

Real-world references: Google, Dropbox ~1.2× for headings; Uber 1.2–1.5×; all major design systems 1.4–1.5× for body.

**Line height as automatic spacing:** Correct line height eliminates the need for manual `margin-bottom` on most text elements — it acts as the gap between heading and content below.

```css
:root {
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.5rem;    /* 24px */
  --text-2xl:  2rem;      /* 32px */

  --leading-tight:  1.2;  /* headings */
  --leading-normal: 1.5;  /* body */
}
```

Use `rem` not `px` — users can scale their browser font size for accessibility.

---

## Letter spacing

| Context | Value | Effect |
|---------|-------|--------|
| Large headings (70px+) | -2% to -4% | Crisp, premium, tight — the "mwah" quality |
| Regular headings | -1% to -2% | Slightly tighter than default |
| Body text | 0 — never negative | Negative body tracking kills readability |
| All-caps labels | +5% to +10% | Compensates for optical closeness of capitals |

**Large text rule:** At >70–80px font size, letter spacing matters significantly. Apply -2% to -4% as default for display/hero text. Below this threshold, browsers handle it acceptably.

**Font-dependent:** Always eyeball after applying. When unsure, use the more negative value.

```css
.display   { font-size: 5rem;    letter-spacing: -0.03em; line-height: 1.1; }
.heading   { font-size: 2rem;    letter-spacing: -0.02em; line-height: 1.2; }
.subhead   { font-size: 1.25rem; letter-spacing: -0.01em; line-height: 1.3; }
.body      { font-size: 1rem;    letter-spacing: 0;        line-height: 1.5; }
.label     { font-size: 0.75rem; letter-spacing: 0.06em;   text-transform: uppercase; }
```

---

## Text alignment

| Situation | Alignment |
|-----------|-----------|
| Body text, paragraphs (3+ lines) | Left — always |
| Short headings, hero text | Center is fine |
| Numeric data in tables | Right-align |

**Never mix alignments** between a heading and its body text. Center heading + left body = broken. Pick one per content block.

**Why center-aligned paragraphs are harder to read:** At the end of each line, the eye searches for where the next line starts — the start point shifts every line. Left alignment gives the eye a fixed left rail to return to.

---

## Text width (line length)

Long lines are perceived as intimidating. Users faced with overly long lines are more likely to skip reading.

**Optimal range:** 50–75 characters per line for body text.

```css
/* ch unit = width of "0" character in current font */
.prose    { max-width: 65ch; }

/* Pixel equivalent for ~18px body text */
.prose    { max-width: 600px; }
```

Backed by UX research (Baymard Institute): shorter lines → more reading → better comprehension → more conversions.

---

## Prioritizing the right information

A common mistake is making labels bigger than values. In a metrics card, the **number** should be prominent, not the label:

```html
<!-- Wrong: label is big, value is small -->
<div class="metric">
  <p class="label-large">Total Sales</p>
  <p class="value-small">591</p>
</div>

<!-- Correct: value is prominent, label is secondary -->
<div class="metric">
  <p class="value-large">591</p>
  <p class="label-small">Total Sales</p>
</div>
```

Users came to see the number. The label is secondary context. Visual hierarchy should reflect what users actually need.

---

## Light/dark mode type colors (via HSL)

```css
:root { /* dark mode */
  --text-primary:   hsl(0, 0%, 90%);  /* NOT 100% — pure white too harsh */
  --text-secondary: hsl(0, 0%, 60%);
  --text-tertiary:  hsl(0, 0%, 40%);
}
[data-theme="light"] {
  --text-primary:   hsl(0, 0%, 10%);  /* 100 - 90 = 10 */
  --text-secondary: hsl(0, 0%, 40%);  /* 100 - 60 = 40 */
  --text-tertiary:  hsl(0, 0%, 60%);  /* 100 - 40 = 60 */
}
```