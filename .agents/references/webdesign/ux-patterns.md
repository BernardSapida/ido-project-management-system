# UX Patterns

The design principles that go beyond visual aesthetics — how interfaces should behave and how they should reduce friction for users.

---

## Interaction cost

> Interaction cost = the cognitive + physical + time effort a user must exert to reach their goal.

Every unnecessary action removed improves the user experience. This is one of the most important UX principles and one of the most commonly ignored.

**Reduce interaction cost by:**
- Exposing content directly instead of hiding it behind banners
- Combining steps (recent recipients replaces a "choose from history" button)
- Pre-selecting the most likely option (same currency as last transfer)
- Using selection instead of free-text input where possible
- Showing relevant data without requiring navigation

**"Discover 100+ recipes" banner vs. showing the top 10 recipes immediately:**
- Banner = extra tap + wait + decision about whether to engage
- Direct content = immediate value, zero friction
- Users are more likely to engage with content they can see instantly

---

## Recognition over recall

Users should recognize what they need — not have to remember it:

```html
<!-- Recall: user must remember account number -->
<input type="text" placeholder="Enter recipient account number">

<!-- Recognition: user sees familiar faces/names -->
<div class="recent-recipients">
  <div class="recipient">
    <img src="michaela.jpg" alt="Michaela">
    <span>Michaela</span>
  </div>
  <!-- ... -->
</div>
```

**Payment flow application:**
- Show profile photo or avatar next to recipient's name and account number
- Users recognize faces instantly — reduces accidental transfers
- Builds confidence that money is going to the right person

**Recent history surfaced prominently** replaces a "choose from history" button — the data is already there, show it.

---

## Prioritize the primary task

Design the screen around what the user is most likely trying to do. Secondary actions should be accessible but not distracting.

**Currency selector in payment flow:**
```
❌ Junior: Two equal-weight fields — currency and amount side by side
✅ Senior: Amount is the prominent, large focus; currency selector tucked into corner of amount field
```

The amount is always entered. The currency rarely changes. The design should reflect these frequencies.

**Progressive disclosure:** Show only what's needed for the primary task. Reveal complexity on demand.

---

## Real-time feedback and transparency

Users need to understand the consequences of their actions in real time:

**Balance preview after transfer:**
```
Current balance: $2,450.00
Transfer amount: -$500.00
─────────────────────────
New balance:     $1,950.00
```
This eliminates post-action surprises and builds confidence. Most banking apps miss this.

**Multi-account clarity:**
Prominently display which account is being debited when the user has multiple accounts. Let them switch accounts before confirming.

**Dynamic selection feedback:**
- Selected state must be visually distinct — larger emoji, color change, bold text
- As user interacts (slider, carousel), feedback updates in real time
- Gives the feel of "the app is responding to me" rather than "I'm filling out a form"

---

## Thumb zone design (mobile)

Mobile devices are operated primarily with one thumb. Primary actions must be reachable without grip adjustment.

**Thumb zone:**
- Safe zone: lower 60% of screen
- Stretch zone: upper 40% — requires grip adjustment
- Hard to reach: top corners — avoid placing primary CTAs here

**Apply to:**
- Primary CTA buttons → lower portion of screen
- Navigation → bottom bar preferred over top bar on mobile
- Form submit buttons → below the form, within reach

```css
/* Mobile: fix primary CTA to bottom of viewport */
.cta-primary-mobile {
  position: fixed;
  bottom: 24px;
  left: 16px;
  right: 16px;
}
```

---

## Empty states — turn them into opportunities

An empty state is a missed opportunity if it just shows a blank screen.

**Bad empty state:**
```
You have no projects.
```

**Good empty state:**
```
[Illustration]
Start managing your projects
Stay organized and hit your deadlines

• Invite team members to collaborate
• Set deadlines to keep everyone on track

[Create new project]  ← clear CTA
```

**Every empty state needs:**
1. Visual element (illustration or icon) — makes it feel intentional, not broken
2. Explanatory heading — frames the empty state positively
3. Actionable guidance — tells the user what to do next
4. CTA button — gives a direct path forward

**Empty states to never skip:** error states, loading states, no-results-found states, first-time user states.

---

## Conversational language reduces friction

The way questions are phrased affects how easily users can answer:

| Bad | Better | Best |
|-----|--------|------|
| "Enter sleep duration" | "How many hours did you sleep?" | "How long did you sleep last night?" |
| "Select recipient" | "Who are you sending to?" | Show recent recipients directly |
| "Input transfer amount" | "How much are you sending?" | Large, prominent amount field |

Natural, conversational phrasing feels like the app is talking to the user, not asking them to fill out a form.

**Personalization:** Using the user's name ("Hi Emily") increases engagement — people respond more positively when they feel recognized.

---

## F-pattern and reading order

Users read in an F-pattern: left-to-right across the top, then scanning down the left edge.

**Apply to layout:**
- Place the most important element top-left
- Interactive controls (radio buttons, checkboxes) go on the left — aligns with natural reading order
- Secondary info goes right
- Put the least important info last (bottom-right)

**In a form:**
```
[Radio] Option label          ← radio on left (F-pattern aligned)
[Radio] Option label
[Radio] Option label
```
Not:
```
Option label  [Radio]         ← radio on right — breaks reading flow
```

---

## Visual cues accelerate comprehension

Users process images and icons faster than text. Visual cues reduce the need to read:

- **Color-coded sender icons** with initials → faster email scanning
- **Company logos / profile photos** → immediate recognition of sender
- **Icons next to selection options** → meaning understood before text is read
- **Emoji in sleep tracking** → emotional response communicates quality faster than words

Every piece of information that can be conveyed visually should be — text is a fallback, not the default.