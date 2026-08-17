# Layout Composition

Three principles that work together in every layout. Violating any one weakens the whole composition.

---

## 1. Focal Point

The center of interest — **not necessarily the center of the layout**. It's where the eye goes first.

**What creates a focal point:**
- A filled/solid element among outlined ones (more visual presence)
- The largest or highest-contrast element on screen
- The point where two lines or elements intersect
- An image or illustration among text

**Rule of thirds:** Placing the focal point at a grid intersection (1/3 from any edge) creates more visual tension than centering. Apply to hero images, key illustrations, dominant UI elements.

**Every page and every component needs exactly one focal point.** If multiple elements compete, eliminate or subordinate all but one.

**Red flag:** If you ask "where should I look first?" and the answer is "I'm not sure" — there's no focal point.

---

## 2. White Space

Quiet areas of visual rest. Doesn't have to be white — just calm relative to surrounding elements.

**Why it matters:**
- Loud elements only feel loud when surrounded by quiet — like an orchestra earning its fortissimo by playing softly first
- White space makes content easier to navigate
- White space signals premium, confident design
- Eliminating white space to fit more content almost always backfires

**In practice:**
- Not every grid cell needs to be filled
- A background photo provides white space if sky/water/blur gives the eye room to rest
- Navigation and logo areas need generous clear space
- When you feel the urge to fill a gap — pause. The gap might be doing important work.

**In code:**
```css
.section { padding-block: 80px; }           /* generous vertical breathing room */
.prose    { max-width: 65ch; }              /* constrains text, creates side white space */
.hero     { padding-block: 96px 120px; }   /* more below than above for weight */
```

---

## 3. Visual Hierarchy

Giving visual weight to elements in proportion to their importance. Orients users and leads them through content.

**The music analogy:** If everything is at volume 10, nothing is emphasized. The lead vocal comes forward because the bass and drums sit behind it.

**Three levels every page needs:**
1. **Primary** — the one thing the user is here to do or read (headline, hero CTA, main data)
2. **Secondary** — supporting context (subheadline, secondary actions, labels)
3. **Tertiary** — reference information (footer links, metadata, timestamps)

**Tools for creating hierarchy:**
- **Size** — larger = more important
- **Weight** — bolder = more prominent
- **Color/contrast** — higher contrast = more emphasis
- **Position** — top-left gets seen first in LTR reading patterns
- **Isolation** — surrounded elements feel more significant
- **White space** — elements with more space around them carry more weight

**Red flag:** If two buttons on the same screen look equally important, one of them is wrong.

---

## How the three principles interact

- The **focal point** draws the eye
- **White space** around it amplifies its importance
- **Hierarchy** leads the eye from the focal point through the rest of the content in a logical order

**Good hero section:**
- Dominant image or headline as focal point (rule of thirds positioning)
- Generous padding and breathing room around all text
- Headline clearly larger than subheadline, which is clearly larger than body copy
- One primary CTA button, one secondary text link

**Broken hero section:**
- Multiple elements competing for focal point (rotating carousel + large headline + sidebar image)
- No quiet areas — every zone packed with content
- All text treated at similar weight — nothing leads, nothing follows
- All-caps colored text on a colored background competing with everything