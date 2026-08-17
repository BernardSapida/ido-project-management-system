# Landing Page Patterns

Landing pages follow different rules than product UIs and dashboards. A dashboard is a tool — it should be invisible. A landing page is a sales presentation — it needs to persuade, tell a story, and convert.

> A landing page is a salesperson who never sleeps. Every section has a job.

---

## Landing page vs app/dashboard design

| Dimension | Landing Page | App / Dashboard |
|-----------|-------------|-----------------|
| **Goal** | Persuade and convert | Enable tasks efficiently |
| **Typography** | Expressive, large, editorial | Dense, functional, compact |
| **Spacing** | Very generous — sections breathe | Tighter — more content per screen |
| **Color** | Brand-forward, emotionally driven | Neutral-dominant, content-forward |
| **Animation** | Scroll reveals, staggered entrances | Subtle state transitions only |
| **Hierarchy** | Narrative — top to bottom journey | Structural — navigate anywhere |
| **White space** | Abundant — separates story beats | Deliberate — groups related content |
| **Grid** | Often broken intentionally | Followed strictly |

---

## The proven landing page structure

Every section has a specific job. Don't skip sections — each one handles a different objection or stage of the user's decision.

### 1. Hero (above the fold)
The most critical section. If this doesn't work, nothing else matters — users leave before scrolling.

**Five required elements:**

**Headline — communicate value, not features**
- Not: "I build websites" → Yes: "I turn your visitors into paying customers"
- Not: "We sell coffee" → Yes: "The smoothest cold brew you've ever tasted"
- Lead with the outcome the user gets, not what you do
- The Mario rule: feature = flower, benefit = throwing fireballs

**Subtitle — explain how + who it's for**
- Expands on the headline: how is the value delivered?
- Optionally defines the audience: "for small businesses", "for solo founders"
- 1–2 sentences max — it supports the headline, doesn't compete with it

**Visual — help them imagine owning it**
- Product: show it in use, not isolated on white
- Service: show the experience or outcome
- Freelancer/agency: photo of the person — builds trust, humanizes
- SaaS: screenshot of the actual UI — let them see what they're getting

**Social proof — make the claim believable**
- Customer count ("5,000+ companies trust us")
- Client logos (instantly recognizable brands = instant credibility)
- Metrics ("$2M in revenue generated for clients")
- Years in business, awards, press mentions
- Not always available for new products — skip rather than fake it

**Primary CTA — one clear directive**
- One button, one action: "Get started", "Book a call", "Start free trial"
- Never two equal CTAs competing — one primary, one ghost/text secondary
- The button label should state what happens when you click it

```jsx
// Hero section structure with HeroUI + Tailwind v4
<section className="min-h-screen flex flex-col justify-center px-6 py-24 lg:px-12 lg:py-32">
  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

    {/* Left: Copy */}
    <div className="flex flex-col gap-6">
      {/* Social proof badge — above headline for credibility */}
      <div className="flex items-center gap-2 w-fit">
        <AvatarGroup max={3}>{/* customer avatars */}</AvatarGroup>
        <span className="text-sm text-default-500">Trusted by 5,000+ teams</span>
      </div>

      {/* Headline — value, not features */}
      <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
        Turn your visitors into <span className="text-primary">paying customers</span>
      </h1>

      {/* Subtitle — how + who */}
      <p className="text-xl text-default-500 leading-relaxed max-w-lg">
        We build high-converting websites for small businesses that need results,
        not just a pretty page.
      </p>

      {/* CTA */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button color="primary" size="lg">Book a free call</Button>
        <Button variant="light" size="lg">See our work →</Button>
      </div>
    </div>

    {/* Right: Visual */}
    <div className="relative">
      <img src="/hero-visual.png" alt="Dashboard preview" className="w-full rounded-2xl shadow-2xl" />
    </div>
  </div>
</section>
```

---

### 2. Social proof bar (optional, between hero and features)
A horizontal band of logos or a metrics strip. Signals credibility before the user reads any more copy.

```jsx
<section className="border-y border-default-200 py-12 px-6">
  <p className="text-center text-sm text-default-400 mb-8 tracking-wide uppercase">
    Trusted by teams at
  </p>
  <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-60">
    {logos.map(logo => <img key={logo} src={logo} alt="" className="h-6 object-contain" />)}
  </div>
</section>
```

---

### 3. Features & Benefits
You made a big promise in the hero. Now prove it. Show *how* you deliver on it.

**Benefits over features — always:**
- Feature: "256-bit encryption"
- Benefit: "Your data is always private and secure"
- Feature: "AI-powered suggestions"
- Benefit: "Write faster without staring at a blank page"

**Three layout options:**

```jsx
// Option A: 3-column feature grid (most common)
<section className="py-24 px-6">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-center mb-4">
      Everything you need to grow
    </h2>
    <p className="text-default-500 text-center max-w-2xl mx-auto mb-16">
      Stop juggling tools. Everything works together, out of the box.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map(f => (
        <div key={f.title} className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <f.icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">{f.title}</h3>
          <p className="text-default-500 text-sm leading-relaxed">{f.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>

// Option B: Alternating left/right (for deeper explanation)
<section className="py-24 px-6">
  {features.map((f, i) => (
    <div key={f.title} className={`flex flex-col lg:flex-row gap-16 items-center mb-32 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
      <div className="lg:w-1/2 flex flex-col gap-6">
        <span className="text-primary text-sm font-medium tracking-wide uppercase">{f.tag}</span>
        <h2 className="text-3xl font-semibold tracking-tight">{f.title}</h2>
        <p className="text-default-500 leading-relaxed">{f.description}</p>
        <Button variant="light" color="primary" className="w-fit">Learn more →</Button>
      </div>
      <div className="lg:w-1/2">
        <img src={f.image} alt={f.title} className="rounded-2xl shadow-lg w-full" />
      </div>
    </div>
  ))}
</section>
```

---

### 4. Testimonials / Social proof (second pass)
Now that they understand what you do, show them that real people got real results.

```jsx
<section className="py-24 px-6 bg-default-50">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-semibold text-center mb-4">What our customers say</h2>
    <p className="text-default-500 text-center mb-16">Real results from real teams</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {testimonials.map(t => (
        <Card key={t.author} className="p-6">
          <CardBody className="flex flex-col gap-4">
            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-warning" />)}
            </div>
            {/* Quote */}
            <p className="text-default-700 leading-relaxed">"{t.quote}"</p>
            {/* Author */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-default-100">
              <Avatar src={t.avatar} name={t.author} size="sm" />
              <div>
                <p className="text-sm font-medium">{t.author}</p>
                <p className="text-xs text-default-400">{t.role} at {t.company}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 5. FAQ — handle objections
The visitor has objections — reasons they won't buy. Answer them before they leave.

Common objections by category:
- **Risk:** "What if it doesn't work?" "Can I cancel?"
- **Fit:** "Is this right for me?" "Do you work with [type of business]?"
- **Trust:** "How long have you been doing this?" "Who else uses this?"
- **Process:** "How does it work?" "How long does it take?"

```jsx
import { Accordion, AccordionItem } from "@heroui/react";

<section className="py-24 px-6">
  <div className="max-w-3xl mx-auto">
    <h2 className="text-3xl font-semibold text-center mb-4">Frequently asked questions</h2>
    <p className="text-default-500 text-center mb-12">
      Everything you need to know before getting started
    </p>
    <Accordion variant="splitted">
      {faqs.map(faq => (
        <AccordionItem key={faq.q} title={faq.q}>
          <p className="text-default-600 leading-relaxed pb-2">{faq.a}</p>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
</section>
```

---

### 6. Final CTA section
They've read everything. They're ready. Give them the action one more time.

Never end a landing page without a final CTA. This is not a repeat of the hero — it's a closing statement after they've been convinced.

```jsx
<section className="py-24 px-6 bg-primary-50">
  <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 items-center">
    <h2 className="text-4xl font-semibold tracking-tight">
      Ready to grow your business?
    </h2>
    <p className="text-default-600 text-lg max-w-xl">
      Join 5,000+ businesses already seeing results. Get started in minutes.
    </p>
    <div className="flex gap-4 flex-wrap justify-center">
      <Button color="primary" size="lg">Start free trial</Button>
      <Button variant="bordered" size="lg">Talk to sales</Button>
    </div>
    <p className="text-sm text-default-400">No credit card required. Cancel anytime.</p>
  </div>
</section>
```

---

### 7. Footer
Organizational — not a sales tool. Provides navigation, legal, and trust signals.

```jsx
<footer className="border-t border-default-200 py-12 px-6">
  <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
    <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
      <Logo />
      <p className="text-sm text-default-400 max-w-xs">
        The shortest description of what you do and who it's for.
      </p>
    </div>
    {footerLinks.map(col => (
      <div key={col.title} className="flex flex-col gap-3">
        <p className="text-sm font-medium">{col.title}</p>
        {col.links.map(link => (
          <Link key={link.label} href={link.href} className="text-sm text-default-400 hover:text-default-700">
            {link.label}
          </Link>
        ))}
      </div>
    ))}
  </div>
  <div className="max-w-6xl mx-auto border-t border-default-100 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <p className="text-xs text-default-400">© 2025 CompanyName. All rights reserved.</p>
    <div className="flex gap-4">
      <Link href="/privacy" className="text-xs text-default-400">Privacy</Link>
      <Link href="/terms" className="text-xs text-default-400">Terms</Link>
    </div>
  </div>
</footer>
```

---

## Landing page design rules (different from app rules)

**Typography is larger and more expressive:**
```css
/* Landing page scale — bigger than app scale */
.hero-headline  { font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 600; letter-spacing: -0.03em; }
.section-title  { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 600; letter-spacing: -0.02em; }
.body-large     { font-size: 1.125rem; line-height: 1.7; }
```

**Spacing is much more generous:**
```css
/* Landing page section padding — 2–3× what you'd use in a dashboard */
.section { padding-block: 96px; }           /* standard */
.section-hero { padding-block: 120px; }     /* hero gets more */
.section-cta  { padding-block: 96px; }
```

**Brand color can be more present** — landing pages are brand moments, not tool moments. The 60-30-10 rule still applies but the 30% primary color can appear more prominently in section backgrounds, headlines, and accents.

**Breaking the grid is encouraged** — overlapping elements, diagonal layouts, large imagery bleeding off the edge. These create visual interest that dashboards should avoid.

**Scroll-triggered animations are appropriate** — staggered feature reveals, fade-in sections, parallax effects. Use sparingly in dashboards, freely on landing pages.

---

## What makes a hero headline land

| Weak | Strong | Why |
|------|--------|-----|
| "We build websites" | "Turn visitors into customers" | Outcome, not activity |
| "Project management software" | "Your team, finally in sync" | Feeling, not category |
| "AI writing assistant" | "Write 10× faster without the blank page" | Specific benefit + problem solved |
| "Coffee delivery service" | "The best cup you'll have all week, delivered" | Sensory + promise |

**Formula:** `[Desired outcome] for [target audience] without [main pain point]`
Example: "More sales for small businesses without hiring a marketing team"