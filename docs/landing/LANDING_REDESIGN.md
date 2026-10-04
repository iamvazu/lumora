# Lumora Landing Page Redesign: Build Spec + Image Prompts

Owner: Product · Status: Ready to build · Applies to: `apps/web/src/app/page.tsx` (+ new components)

## 0. Goal

Replace the current text-only landing page with an image-led, conversion-focused page.
Use the section rhythm common to top creator platforms (split hero with photo, product
mock-ups, profile preview, steps, category gallery, protection, FAQ, closing CTA, rich footer),
but keep Lumora's own brand (dark, aurora gradient) and add things the reference lacks:
floating live UI cards, an interactive feature switcher, an earnings calculator,
a live-streaming showcase, and transparent pricing.

Hard rules:
- Original copy, layout details, and imagery only. Do not reuse any other platform's text, logos, photos, or brand colors.
- No "As featured in" press logos unless Lumora has actually been covered. No invented testimonials, creator counts or stats. Use only claims that are true today (80% payout, 2FA, ID-verified creators).
- All people in imagery are fictional adults (25 to 40), fully clothed, tasteful, non-suggestive. The landing page is safe-for-work and indexable.

---

## 1. Design system for this page

**Theme:** dark-first "after-hours studio". Deep ink backgrounds, warm golden-hour photography,
aurora gradient (violet → magenta → amber) used sparingly for emphasis.

| Token | Value |
| --- | --- |
| `bg` | `#07070A` |
| `surface` | `#101015` |
| `surface-2` | `#16161D` |
| `border` | `rgba(255,255,255,0.08)` |
| `text` | `#F5F5F7` |
| `text-muted` | `#A1A1AA` |
| `violet` | `#8B5CF6` |
| `magenta` | `#EC4899` |
| `amber` | `#F59E0B` |
| `aurora` | `linear-gradient(100deg,#8B5CF6 0%,#EC4899 55%,#F59E0B 100%)` |
| Section light band | `#F7F5FB` bg / `#0B0B12` text (used for 2 sections to break the dark rhythm) |

**Type:** load with `next/font/google`:
- Display: **Plus Jakarta Sans** 700/800, tracking `-0.03em`. H1 `clamp(2.75rem, 6vw, 5.25rem)`, H2 `clamp(2rem, 4vw, 3.25rem)`.
- Body: **Inter** 400/500, 16 to 18px, line-height 1.6.
- Eyebrow labels: Inter 600, 12px, uppercase, tracking `0.14em`, aurora-gradient text.

**Shape and depth:** radius 20px for cards, 28px for image frames, 999px for pills.
Glass cards: `bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.35)]`.

**Motion:** use the `motion` package (Framer Motion). Fade-up 16px on scroll (`whileInView`, once, 0.5s, stagger 0.08).
Floating cards bob 6px over 6s. Respect `prefers-reduced-motion` (disable all non-essential motion).

**Layout:** container `max-w-[1240px] px-5 md:px-8`. Section padding `py-20 md:py-28`.
Every section must look right at 360px, 768px, 1280px, 1536px.

---

## 2. Page structure (top to bottom)

### 2.1 Age gate (existing `AgeGate` component)
Show on first visit only (cookie `lumora_age_ok`, 30 days). Full-screen blur over the page, Lumora logo,
"Lumora is for adults 18+. Confirm your age to continue." Buttons: "I'm 18 or older" / "Leave".
Must not block crawlers from SFW landing content (render page server-side; gate is a client overlay).

### 2.2 Navbar
- Floating glass pill, `sticky top-4`, centered, `max-w-[1240px]`, height 64px, rounded-2xl.
- Left: logo mark (aurora rounded square + spark icon) + "Lumora" wordmark.
- Center (desktop): Discover · Creators · How it works · Live · Safety · Pricing (anchor links, smooth scroll, active-section highlight via IntersectionObserver).
- Right: "Log in" (ghost) + "Join free" (aurora gradient button with soft glow).
- On scroll > 24px: background goes from `white/5` to `#0B0B10/80` and shadow appears.
- Mobile: logo + "Join free" + hamburger → full-height sheet with links, large tap targets, and both CTAs at the bottom.

### 2.3 Hero (split, image-led)
Two columns on desktop (text 6/12, image 6/12); stacked on mobile (image under text, cropped 4:5).

Left:
- Eyebrow: "The creator-owned 18+ platform"
- H1: "Your fans. Your rules." newline, then "Your **income**." with "income" in aurora gradient.
- Sub: "Subscriptions, paid messages, live shows and content drops in one place, with 80% of every dollar going straight to you."
- CTAs: "Start creating →" (primary, aurora) and "Explore creators" (secondary glass).
- Micro-trust row (icons + text, no numbers): "ID-verified creators" · "Payouts weekly" · "2FA on every creator account".

Right: `hero-creator.webp` in a 28px-radius frame with a subtle aurora rim light (gradient border 1px).
Overlay 3 floating glass cards (built in HTML, not baked into the image), staggered and bobbing:
1. Top-left: green dot + "New subscriber" / "@demo_fan joined · just now"
2. Mid-right: "This week" / "$1,240.00" with a tiny sparkline (label the page section "Example dashboard")
3. Bottom-left: red "LIVE" pill + "Friday 8:00 PM · 214 waiting"
Background: two blurred aurora blobs behind the image, plus faint noise texture.

### 2.4 Trust strip (replaces press logos)
Thin band, border top/bottom. Infinite marquee (pauses on hover) of category chips with small icons:
Fitness · Music · Art · Fashion · Travel · Coaching · Cosplay · Cooking · Gaming · Wellness · Comedy · Photography.

### 2.5 "Everything you need to earn" (interactive feature switcher)
Eyebrow "All in one place". H2 "Everything you need to earn, nothing you don't."
Left: vertical list of 6 features; clicking (or auto-advancing every 6s) swaps the right panel.
| Feature | One-liner | Right panel image | HTML overlay on the image |
| --- | --- | --- | --- |
| Subscriptions | Monthly memberships, multi-month discounts and free trials. | `feature-subscriptions.webp` | Plan picker card: 1 mo $9.99 / 3 mo -15% / 6 mo -25% |
| Paid messages | Lock photos and videos inside DMs and set your price. | `feature-messages.webp` | Chat bubble with a blurred locked attachment + "Unlock for $12" |
| Live shows | Go live from your browser or OBS, with tip goals. | `feature-live.webp` | Tip-goal progress bar 68% + floating "+$20 tip" |
| Bundles | Package your best content into one-time drops. | `feature-bundles.webp` | Stacked thumbnails + "Summer pack · 24 items · $29" |
| Tips | Fans can tip on posts, chats and streams. | reuse `feature-live.webp` crop | Tip sheet with $5 / $10 / $25 chips |
| Vault | One private library, reused everywhere. | `feature-vault.webp` | Folder grid with tags |
Panel transitions: crossfade + 8px slide, 300ms.

### 2.6 Creator dashboard preview (light band section)
Light background band. Left copy: eyebrow "Built for creators", H2 "Run your page like a business.",
3 bullet stats framed as product capabilities (not results): "Earnings by source", "Top fans and churn", "Payout status in real time". CTA "See the creator tools".
Right: an HTML/CSS dashboard mock (not an image): welcome header with avatar `avatar-1.webp`,
cards for Subscribers / Messages / Upcoming live, and a "Recent activity" list (New subscriber 2m, Paid message unlocked 15m, Tip received 1h).
Tilt 3D on hover (max 6deg), subtle shadow.

### 2.7 "Own your audience" profile preview
Two columns. Left: eyebrow "Creator-first", H2 "Own your audience. Keep your edge.", paragraph, CTA "Become a creator →".
Right: `profile-creator.webp` (portrait) with an overlaid HTML profile card in the lower-right:
avatar, display name "Ava Monroe (example)" @ava.example, verified tick, stats Posts / Fans / Likes,
buttons "Follow" + "Subscribe · $9.99/mo", "About" two-line bio.
Small caption under the image: "Example profile".

### 2.8 Earnings calculator (new)
Glass card centered. Two sliders: "Paying fans" (10 to 5,000) and "Monthly price" ($4.99 to $49.99).
Output: big number "You'd earn ≈ $X / month" computed as fans × price × 0.80, with a breakdown line
"Fans pay $Y · Lumora fee 20% · You keep 80%". Footnote: "Estimate before taxes and processing adjustments."
Use integer cents in the calculation; format with `Intl.NumberFormat`.

### 2.9 How it works (3 steps)
Eyebrow "Simple from day one". H2 "Live in three steps."
Horizontal stepper with a connecting gradient line (vertical on mobile). Each step = image card on top + number badge + title + text:
1. `step-1-setup.webp` · "Create and verify" · "Set up your page and verify your ID in minutes."
2. `step-2-share.webp` · "Post, message, go live" · "Share exclusive drops and connect one-to-one."
3. `step-3-earn.webp` · "Get paid weekly" · "Watch earnings land and withdraw to your bank."

### 2.10 Live showcase (full-bleed)
Full-width `live-stage.webp` (16:9, darkened bottom gradient). Overlays in HTML:
"LIVE" pill + viewer count, right-side chat column (5 fake handles labelled demo), a tip-goal bar, and a floating tip burst animation.
Copy on the left over the gradient: H2 "Go live. Get closer.", text, CTA "Learn about live".

### 2.11 Made for every kind of creator (categories gallery)
Eyebrow "Every passion belongs". H2 "Built for every kind of creator."
Desktop: 8 tall tiles in a row that expand on hover (flex-grow accordion: hovered tile grows to 2.2x and shows a one-line description).
Mobile: horizontal snap-scroll carousel, 75% card width.
Each tile: image, bottom glass label with category name.
Tiles: Fitness, Music, Art, Fashion, Travel, Coaching, Cosplay, Cooking.

### 2.12 Creator personas (replaces fake testimonials)
Eyebrow "Creators like you". H2 "However you create, it fits."
Carousel of 4 persona cards with prev/next buttons and drag: image (3:4) + overlay glass panel with
persona label ("Fitness coach", "Music producer", "Cosplay artist", "Home chef") and what they sell on Lumora
(e.g. "Monthly training plans, form-check DMs, live Q&As").
Leave a `TestimonialSlot` component ready for real, consented creator quotes later. Do not ship invented quotes.

### 2.13 Your business, protected (light band section)
Eyebrow "Creator protection". H2 "Your business, protected."
Left: `safety-shield.webp` (abstract 3D, no people). Right: 2x3 grid of feature cards with icons:
Secure payments · Privacy and geo-blocking · Watermarked media · Copyright takedowns · Verified creators only · Real human support.
Link "Read our safety approach →" to `/safety`.

### 2.14 Simple pricing
Single card: "Free to join. We only earn when you do." Big split bar 80% (aurora) / 20% (muted) with labels
"You keep 80%" / "Lumora 20%". Bullets: no setup fees, no monthly fees, weekly payouts, 50+ countries supported (only if true; else remove).

### 2.15 FAQ
Two columns: left heading "Questions, answered." + "Visit help center →"; right accordion (one open at a time, smooth height animation, `aria-expanded`):
- How do I get paid? → Earnings move from pending to available after a short hold, then you withdraw weekly to your verified payout method.
- What can I post? → Original content you own, featuring only verified adults who have consented. See our content rules.
- How do subscriptions work? → Fans pay monthly or choose a discounted multi-month bundle; you set the price.
- Is my content protected? → Media is private by default, streamed via expiring links and watermarked with each viewer's handle.
- Can fans cancel anytime? → Yes. Access continues until the end of the paid period.
- Who can see my page? → You control geo-blocking, blocked users and what non-subscribers see.

### 2.16 Closing CTA
Full-width band with aurora gradient mesh background (`cta-aurora.webp`) and a floating 5-image collage
(reuse category images at small sizes, rotated -6° to 6°). H2 "Your next chapter starts tonight." Sub, "Start creating →" white button.

### 2.17 Footer
4 link columns (Company · Creators · Support · Legal), logo + one-line mission, social icon buttons, newsletter email field,
bottom row: "© 2026 Lumora" · "18+ only" · language picker · "18 U.S.C. §2257 statement" link.

---

## 3. Image generation prompts

Generate every image below, save to `apps/web/public/landing/`, export WebP (quality 82) plus AVIF via `next/image`.
Prepend the **house style** to every prompt, and append the **avoid** list to every prompt.

**House style (prepend):**
> Editorial lifestyle photography, shot on a full-frame camera with a 50mm lens at f/2, warm golden-hour or soft neon ambient light with violet and magenta accents, rich shadows, shallow depth of field, natural skin texture, candid and confident mood, premium magazine quality, color grade: deep blacks, warm highlights, subtle violet tint in shadows.

**Avoid (append):**
> No text, no logos, no watermarks, no brand names on devices, no nudity, no lingerie, no suggestive poses, no minors or youthful-looking people, no celebrity likeness, no distorted hands or faces, no extra fingers, no plastic AI skin.

All people: fictional adults aged 25 to 40, fully clothed, diverse ethnicities and body types across the set.

| # | File | Size (px) | Ratio | Prompt (after house style) |
| --- | --- | --- | --- | --- |
| 1 | `hero-creator.webp` | 1600×2000 | 4:5 | A confident woman in her early 30s with dark wavy hair, wearing a tailored black blazer over a simple top, standing on a city rooftop terrace at dusk, holding a smartphone, looking off-frame with a slight smile, city skyline softly blurred behind her with warm window lights, a small ring light glowing violet at frame edge, generous empty space on the left side of the frame for UI overlays. |
| 2 | `feature-subscriptions.webp` | 1600×1200 | 4:3 | A fitness coach in his late 20s in a modern home gym at golden hour, sitting on a bench reviewing his phone, kettlebells and plants in background, warm sunlight streaks, calm and focused. |
| 3 | `feature-messages.webp` | 1600×1200 | 4:3 | A woman in her 30s curled up on a velvet sofa in a cozy apartment at night, lit by a warm lamp and a magenta neon accent, smiling at her phone, blanket and coffee mug nearby. |
| 4 | `feature-live.webp` | 1600×1200 | 4:3 | A music creator in her late 20s with headphones around her neck, in a home studio with a ring light and a camera on a tripod facing her, waving to the camera, violet LED strips on the wall, energetic mood. |
| 5 | `feature-bundles.webp` | 1600×1200 | 4:3 | Flat-lay on a dark wooden desk: a mirrorless camera, printed photo contact sheets, a laptop with a blank screen, a notebook and a coffee cup, warm side light, overhead shot, no people. |
| 6 | `feature-vault.webp` | 1600×1200 | 4:3 | A creator's desk at night seen over the shoulder of a man in his 30s organizing photos on a large monitor showing an abstract blurred grid of thumbnails, violet desk lamp glow, tidy minimal setup. |
| 7 | `profile-creator.webp` | 1400×1750 | 4:5 | Portrait of a woman in her early 30s with curly hair and a neutral linen shirt, leaning on a balcony railing in soft morning light, city behind her softly blurred, warm and approachable expression, empty space in the lower-right for a profile card overlay. |
| 8 | `avatar-1.webp` … `avatar-6.webp` | 512×512 | 1:1 | Six separate head-and-shoulders portraits on soft neutral blurred backgrounds, each a different adult (ages 25 to 40, varied ethnicity and gender), friendly natural expressions, consistent warm lighting. Generate one image per avatar. |
| 9 | `step-1-setup.webp` | 1200×900 | 4:3 | A person in their late 20s at a sunlit kitchen table setting up an account on a laptop, holding a passport-style ID card face down, relaxed expression, plants and morning light. |
| 10 | `step-2-share.webp` | 1200×900 | 4:3 | A creator in her 30s filming herself with a phone on a small tripod in a bright minimalist living room, ring light on, cheerful energy. |
| 11 | `step-3-earn.webp` | 1200×900 | 4:3 | A man in his 30s on a café terrace in the evening glancing at his phone with a satisfied smile, warm string lights, cappuccino on the table. |
| 12 | `live-stage.webp` | 2400×1350 | 16:9 | Wide shot from behind a camera and ring light toward a creator in her late 20s sitting on a stool in a stylish loft studio, mid-laugh, talking to the camera, violet and amber practical lights, bokeh, generous dark area on the left third for text and on the right edge for a chat overlay. |
| 13 | `cat-fitness.webp` | 900×1350 | 2:3 | A woman in her early 30s in athletic wear doing a kettlebell swing in a sunlit industrial gym. |
| 14 | `cat-music.webp` | 900×1350 | 2:3 | A man in his late 20s playing an acoustic guitar beside a studio microphone, warm lamp light. |
| 15 | `cat-art.webp` | 900×1350 | 2:3 | A woman in her 30s painting on a large canvas in a loft studio, paint on her hands, afternoon light. |
| 16 | `cat-fashion.webp` | 900×1350 | 2:3 | A stylist in her 30s adjusting a jacket on a tailor's mannequin in a boutique atelier, clothing rails behind. |
| 17 | `cat-travel.webp` | 900×1350 | 2:3 | A man in his 30s with a camera and backpack on a cliffside path above the sea at sunset. |
| 18 | `cat-coaching.webp` | 900×1350 | 2:3 | A woman in her 30s presenting to camera in front of a whiteboard with abstract diagrams (no readable text), confident gesture. |
| 19 | `cat-cosplay.webp` | 900×1350 | 2:3 | An adult cosplayer in his late 20s in an original sci-fi armor costume of his own design (not any existing character), in a workshop with craft tools, dramatic violet rim light. |
| 20 | `cat-cooking.webp` | 900×1350 | 2:3 | A chef in her 30s plating a colorful dish in a home kitchen, steam rising, warm pendant light. |
| 21 | `persona-fitness.webp` … `persona-chef.webp` | 1200×1600 | 3:4 | Reuse the same characters as images 13, 14, 19, 20 in a different pose for continuity (mid-shot, looking at camera, friendly). Generate one per persona: fitness, music, cosplay, chef. |
| 22 | `safety-shield.webp` | 1600×1600 | 1:1 | Abstract 3D render, no people: a translucent frosted-glass shield and padlock floating above a dark reflective surface, internal glow in violet to magenta to amber gradient, soft volumetric light, minimal premium tech aesthetic. |
| 23 | `cta-aurora.webp` | 2400×1000 | 12:5 | Abstract background, no people: flowing aurora light ribbons in violet, magenta and amber on a near-black background, soft grain, gentle depth, lots of negative space in the center. |
| 24 | `og-image.png` | 1200×630 | 1.91:1 | Composite in code (not generated): `hero-creator` cropped right, dark left panel with Lumora logo and the hero headline. Build with `next/og` (`opengraph-image.tsx`). |

After generation: review every image at 100% for hand/face artifacts, accidental text, or anything that looks under 25 or suggestive; regenerate any that fail.

---

## 4. Implementation rules

- Split the page into components under `apps/web/src/components/landing/` (`Navbar`, `Hero`, `TrustMarquee`, `FeatureSwitcher`, `DashboardPreview`, `ProfilePreview`, `EarningsCalculator`, `HowItWorks`, `LiveShowcase`, `CategoryGallery`, `PersonaCarousel`, `Protection`, `Pricing`, `Faq`, `FinalCta`, `Footer`). `page.tsx` becomes a server component that composes them; only interactive pieces use `'use client'`.
- All copy in one file `apps/web/src/content/landing.ts` so it can be edited without touching layout.
- Images: `next/image` with explicit `sizes`, `placeholder="blur"` (static imports), `priority` only on the hero image. Descriptive `alt` text for every image.
- Performance budget (mobile, Lighthouse): LCP < 2.5s, CLS < 0.05, total JS for the page < 180 KB gzipped. Lazy-load everything below the fold.
- Accessibility: WCAG 2.2 AA contrast, visible focus rings, keyboard-operable carousels, accordion and feature switcher, `prefers-reduced-motion` respected, semantic landmarks.
- SEO: metadata + Open Graph image, JSON-LD `Organization`, one H1, section H2s.
- Keep the existing auth routes; "Join free"/"Start creating" → `/signup?role=creator`, "Explore creators" → `/explore`, "Log in" → `/signin`.

## 5. Acceptance checklist

- [ ] All 17 sections render at 360/768/1280/1536 widths with no horizontal scroll.
- [ ] All images generated, reviewed and optimized; total landing image weight < 2.5 MB on first load.
- [ ] Earnings calculator math verified with unit tests (integer cents).
- [ ] No press logos, invented quotes or unverifiable stats on the page.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [ ] Screenshots of desktop and mobile saved to `docs/landing/screenshots/` for review.
