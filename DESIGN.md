# Koetaw: Design Direction

| | |
|---|---|
| Product | Koetaw, kasir dan analitik penjualan untuk satu kafe |
| Owner | Fais |
| Surface | Web app (HP 360px, tablet, laptop), struk 80mm, rekap A4 |
| Language | Bahasa Indonesia |
| Timezone | Asia/Makassar (WITA) |
| Currency | Rupiah, tanpa desimal |
| Status | Applied. Light and dark themes implemented, drift cleared. |

This file holds direction: identity, palette, type, shape, component rules, screen jobs, and the reasons behind them. Product rules and the data model live in `prd.md` (sections 5 and 9). When the two disagree about behaviour, `prd.md` wins. When they disagree about appearance, this file wins.

---

## 1. Design Read and dials

> Reading this as: a single-cafe POS for kasir and owner in Makassar, in a calm utilitarian language, dial ENERGY 1 / RHYTHM 1 / MOTION 1.

| Dial | Value | Reason |
|---|---|---|
| ENERGY | 1 | The kasir uses this for a full shift. The interface should stay quiet and let the menu and the numbers speak. |
| RHYTHM | 1 | Predictable anatomy builds muscle memory. Screens differ by job, not by decoration. |
| MOTION | 1 | Hover, focus, and state transitions only. Nothing moves on its own. |

Page-level composition still follows the job of each screen (section 12). That is content structure, not rhythm variation.

---

## 2. Product and audience

Koetaw is not a marketing site. It is a tool used behind a counter, sometimes in a hurry, often on a tablet.

- Owner (Fais): checks sales, manages menu, stock, staff, and reports.
- Kasir (1 to 2 people): takes orders and payments, checks stock, sees today's own transactions.
- Context: one cafe, warm room, daylight, customers waiting. Speed and clarity beat flourish.
- Target: a simple transaction in 30 seconds or less.

Design consequences:

- Big, obvious targets. Nothing important below 44px on touch.
- Numbers are the content. They get tabular figures, right alignment, and room to breathe.
- A mistaken tap must be recoverable. Destructive actions confirm and explain.
- No hidden affordances. If it looks pressable, it works.

---

## 3. Personality and voice

Koetaw sounds like a careful cafe owner: calm, plain, warm, and specific. Not a startup, not a chatbot.

**Voice rules**

- Bahasa Indonesia, sentence case, concrete verbs. "Simpan transaksi", not "Lanjutkan".
- Short sentences. One idea per line.
- No em dash. Use a comma, a colon, or a full stop.
- No emoji in UI text, headings, buttons, or badges.
- No English buzzwords: seamless, powerful, next generation, AI powered, revolutionary, effortless.
- No exclamation marks.
- Numbers always carry a unit and a period: "Rp 25.000", "12 transaksi", "3 bahan di bawah minimum".
- Name the cause and the next action in empty, loading, and error states.
- Placeholders say what they are: "Nama menu", "email@contoh.com", "[DATA ASLI]". Never fabricate a person, a review, or a statistic.
- Domain words are used consistently: transaksi, lunas, void, bahan baku, resep, restock, stok opname.

**Tone examples**

| Situation | Write | Do not write |
|---|---|---|
| Save a sale | "Transaksi tersimpan. Stok bahan sudah diperbarui." | "Yeay, transaksi berhasil!" |
| Empty stock list | "Belum ada bahan baku. Tambahkan bahan pertama untuk mulai menghitung stok." | "No data available." |
| Missing recipe | "Resep belum diatur. Menu tetap bisa dijual, stok tidak berkurang." | "Setup incomplete." |
| Void | "Batalkan transaksi? Stok akan dikembalikan dan omzet dikurangi." | "Are you sure?" |

---

## 4. Brand

The brand is two things: a maroon K with a fork, and cream paper. Everything else stays quiet.

**Assets**

- `public/brand/koetaw-logo.png`: wordmark, for the sidebar and login.
- `public/brand/koetaw-logo-cream.png`: wordmark on cream.
- `public/brand/koetaw-mark.png`: the K mark, for favicon, compact header, loading.

**Usage**

- The mark and wordmark sit on the cream plate `#f7f2df`, as already built. The plate is part of the lockup, not a card.
- Clear space around the lockup: at least the height of the K stem.
- Minimum wordmark width on screen: 120px. Below that, use the K mark alone.
- Never recolour the logo, add a gradient, add a shadow, stretch it, rotate it, or place it on a busy photo.
- Never rebuild the logo in type. Use the asset.

**Identity motif**

The wordmark's rounded geometric letterforms and the fork-cut diagonal are the brand gesture. That gesture shows up in type choice, generous corner radii, and the maroon-on-cream contrast. It does not become a background pattern, a texture, or a repeated decorative line.

**Imagery**

- No stock illustrations, no 3D blobs, no AI avatars, no generic cafe photos.
- Menu photos only when the owner supplies real photos. Until then, no image slots.
- The logo is the only image the app needs to ship.

---

## 5. Color

### 5.1 Brand trio

The palette is intentionally monochrome. Maroon is the brand. Cream is the paper. Espresso is the furniture.

| Name | Hex | Role |
|---|---|---|
| Ink Maroon | `#701615` | Primary actions, active nav, key figures, brand marks |
| Paper Cream | `#faf7f2` | App background |
| Espresso | `#2a1211` | Sidebar and login panel |

There is no second brand accent. A brass, green, or blue accent would compete with the semantic colors below, so it is not used. Maroon is the single accent: it carries the primary action, the active navigation item, and the key figure, and it is never spread as decoration.

### 5.2 Semantic colors

Semantic color is information, not decoration. Each one appears only for its meaning, and always with a label or icon.

| Meaning | Light | Dark |
|---|---|---|
| Success (lunas, stok aman) | `#2e7d32` | `#7bc47f` |
| Warning (stok menipis) | `#b45309` | `#e0a54a` |
| Danger (void, gagal, hapus) | `#c62828` | `#ef7d7d` |

Rules:

- Never use success green for a neutral primary action.
- Never use maroon to mean danger.
- Chart colors do not come from the semantic set.

### 5.3 Light tokens

Target values for `:root`. They match the current `src/app/globals.css` except where marked.

| Token | Value | Use |
|---|---|---|
| background | `#faf7f2` | App canvas |
| foreground | `#2b1a18` | Body text |
| card | `#ffffff` | Surfaces |
| card-foreground | `#2b1a18` | Text on surfaces |
| primary | `#701615` | Primary fill |
| primary-foreground | `#fff8f1` | Text on primary |
| secondary | `#f3e7d7` | Secondary fill |
| secondary-foreground | `#4a2a26` | Text on secondary |
| muted | `#f4ede5` | Quiet surface |
| muted-foreground | `#7c6a63` | Secondary text |
| accent | `#f2dfd3` | Hover wash |
| accent-foreground | `#4a2a26` | Text on hover wash |
| destructive | `#c62828` | Danger |
| destructive-foreground | `#fff7f7` | Text on danger |
| success | `#2e7d32` | Success |
| success-foreground | `#f2fdf5` | Text on success |
| warning | `#b45309` | Warning (current file has `#b26a00`, which fails 4.5:1) |
| warning-foreground | `#fffbeb` | Text on warning |
| border | `#e7d9ce` | Dividers and card edges |
| input | `#9a8577` | Form field edge (current `#ddcec2` is too faint) |
| ring | `#701615` | Focus ring |
| sidebar | `#2a1211` | Sidebar |
| sidebar-foreground | `#f8efe3` | Sidebar text |
| sidebar-accent | `#4a2421` | Sidebar active item |

Radius base: 12px (`0.75rem`).

### 5.4 Dark tokens

Direction for the theme toggle. Verified for text contrast; not yet implemented.

| Token | Value | Use |
|---|---|---|
| background | `#171110` | App canvas |
| foreground | `#f3e9df` | Body text (15.6:1 on background) |
| card | `#211816` | Surfaces |
| card-foreground | `#f3e9df` | Text on surfaces |
| primary | `#8f231f` | Primary fill (cream text at 8.22:1) |
| primary-foreground | `#fff8f1` | Text on primary |
| primary-text | `#e8897a` | Maroon used as text, link, or icon (7.38:1) |
| secondary | `#2b1f1c` | Secondary fill |
| secondary-foreground | `#f3e9df` | Text on secondary (13.3:1) |
| muted | `#2b1f1c` | Quiet surface |
| muted-foreground | `#b7a49a` | Secondary text (6.68:1) |
| accent | `#35251f` | Hover wash |
| accent-foreground | `#f3e9df` | Text on hover wash (12.2:1) |
| destructive | `#b5342e` | Filled danger (cream text at 5.69:1) |
| destructive-text | `#ef7d7d` | Danger text (7.03:1) |
| success | `#7bc47f` | Success text (8.94:1) |
| warning | `#e0a54a` | Warning text (8.59:1) |
| border | `#3a2c28` | Dividers |
| input | `#7a6259` | Form field edge (3.31:1 on canvas, 3.08:1 on card) |
| ring | `#e8897a` | Focus ring |
| sidebar | `#120c0b` | Sidebar |
| sidebar-foreground | `#f3e9df` | Sidebar text |
| sidebar-accent | `#33241f` | Sidebar active item (13.1:1) |

Dark mode rules:

- Maroon `#701615` is a background, never text on dark. Use `#e8897a` for maroon text.
- Images (`next/image` logo) keep their cream plate in both themes. The plate is part of the lockup.
- Receipts and PDFs stay light in both themes.

### 5.5 Charts

Charts use one ink tone and rely on labels, not color, to separate series.

- Bar fill: `primary` at 80% or `#9c3a32` in light, `#e8897a` in dark.
- Comparison or secondary series: muted neutral (`#b7a49a`) or a dashed line.
- No rainbow categories. No amber, emerald, sky, or violet series.
- If a stacked bar is unavoidable, its segments need 3:1 contrast against each other and a direct label.
- A chart's title states the question it answers: "Penjualan per jam, hari ini".

### 5.6 Color rules

- Maximum active palette: maroon, cream, espresso, plus the three semantic colors. No fourth brand hue.
- No gradients anywhere in the product UI. A gradient is not a hierarchy tool here; spacing and weight are.
- No radial or blurred glow orbs behind panels.
- No glassmorphism except the sticky header, which may use one soft blur to separate itself from scrolling content.
- No background grid, dot pattern, or blueprint texture.
- No colored left stripes on cards, rows, or headings.
- Selection color: `#ebc7bd` on `#2b1a18`, as already built.

### 5.7 Verified contrast

Checked with the antislop-human contrast checker (WCAG 2.x). Normal text needs 4.5:1, large text and UI edges need 3:1.

| Pair | Ratio | Verdict |
|---|---|---|
| `#2b1a18` on `#faf7f2` | 15.55:1 | PASS |
| `#7c6a63` on `#faf7f2` | 4.79:1 | PASS |
| `#7c6a63` on `#ffffff` | 5.12:1 | PASS |
| `#fff8f1` on `#701615` | 10.99:1 | PASS |
| `#f8efe3` on `#2a1211` | 15.46:1 | PASS |
| `#b45309` on `#fffbeb` | 4.84:1 | PASS |
| `#c62828` on `#fff7f7` | 5.33:1 | PASS |
| `#2e7d32` on `#f2fdf5` | 4.92:1 | PASS |
| `#9a8577` on `#faf7f2` | 3.28:1 | PASS (UI edge) |
| `#f3e9df` on `#171110` | 15.60:1 | PASS |
| `#b7a49a` on `#211816` | 7.28:1 | PASS |
| `#fff8f1` on `#8f231f` | 8.22:1 | PASS |
| `#e8897a` on `#171110` | 7.38:1 | PASS |
| `#7a6259` on `#211816` | 3.08:1 | PASS (UI edge) |
| `#7bc47f` on `#171110` | 8.94:1 | PASS |
| `#e0a54a` on `#171110` | 8.59:1 | PASS |
| `#ef7d7d` on `#171110` | 7.03:1 | PASS |

Known failures in the current code: `#b26a00` on `#fffbeb` is 4.09:1, and `#ddcec2` on `#faf7f2` is 1.44:1. Both are replaced above.

---

## 6. Typography

**Family:** Plus Jakarta Sans Variable, already bundled through `@fontsource-variable/plus-jakarta-sans`.

**Reason:** it is a geometric humanist sans with rounded terminals that echo the rounded wordmark, it holds up at 12px on a tablet in a bright room, and its variable weights let the hierarchy come from weight instead of from extra colors. It is set as the only UI family.

**Scale**

| Role | Size / line height | Weight | Use |
|---|---|---|---|
| Page title | 24 / 1.25 | 700 | The one H1 of a screen (20 on mobile) |
| Section title | 20 / 1.3 | 600 | Card and panel headings (18 on mobile) |
| Subheading | 16 / 1.4 | 600 | Groups inside a panel |
| Body | 14 / 1.5 | 400 | Default text |
| Body strong | 14 / 1.5 | 600 | Labels, row names |
| Meta | 12 / 1.4 | 500 | Hints, timestamps, units |
| Micro | 11 / 1.3 | 500 | Only dense table notes; never body copy |
| Money large | 24 / 1.1 | 700 | Stat values, cart total |
| Numeric | 14 / 1.4 | 500 | Tables and inline figures |

**Rules**

- Sentence case for headings, labels, buttons, tabs, and table headers. No wide-tracked uppercase. No "HOW IT WORKS" style labels.
- Use `font-variant-numeric: tabular-nums` for every price, quantity, count, and table column in both themes.
- Tracking stays at the font default. Headings may use `-0.01em`, nothing more.
- Maximum two weights in one component. A card does not need 400, 500, 600, and 700.
- Body line length: 60 to 75 characters.
- The only monospace is the receipt sheet and print report, where alignment is functional. Mono is never used for headings or UI chrome.
- The only uppercase is inside the receipt and PDF header block, as an existing print convention.

---

## 7. Shape, spacing, elevation

**Radius**

| Value | Applies to |
|---|---|
| 8px | Inputs, selects, small controls, table action targets |
| 12px | Buttons, cards, panels, menu tiles |
| 16px | Dialogs, sheets, the mobile cart drawer |
| 999px | Status chips, count badges, and category filter pills only |

- Pills are a signal, not a default. Buttons, cards, and inputs are never pill-shaped.
- Menu tiles and cards keep one radius. A card containing a pill does not make the card a pill.

**Spacing** (4px base): 4, 8, 12, 16, 20, 24, 32, 40, 48.

- Page gutter: 16 mobile, 24 from `sm`, 32 on wide desktop.
- Card padding: 16 mobile, 20 from `sm`.
- Grid gap: 12 for dense POS tiles, 16 for content panels, 20 between page sections.
- Section spacing varies only where hierarchy needs it. Do not alternate background colors to create rhythm.

**Elevation**

- Cards are flat: 1px border, no shadow.
- Shadow is reserved for things that float above the page: dialogs, dropdowns, toasts, the mobile cart bar, and the mobile drawer.
- The sticky header uses a border plus at most one soft blur. It is the only glass surface.
- No glow on buttons, cards, icons, or badges.

---

## 8. Components

**Button**

- Variants: primary (maroon fill), secondary (warm fill), outline (border), ghost (text), destructive (danger fill).
- Heights: 36 desktop toolbar, 40 default, 48 for the POS primary action and payment confirmation.
- Minimum touch target: 44x44. Icon-only buttons on touch screens are 44.
- Radius 12. Focus: 2px ring in `ring`, 2px offset. Never remove the outline without a replacement.
- One primary button per decision area. The kasir screen's primary is "Bayar", not "Cetak".

**Input**

- Height 40 desktop, 44 touch. Radius 8. Border `input`. Focus ring 2px.
- Labels sit above the field, sentence case, 12px medium. Placeholders are examples, not labels.
- Money inputs are right-aligned with tabular figures and a `Rp` prefix.
- Errors appear under the field, name the fix, and use `destructive` plus an icon.

**Card**

- Surface: `card`, 1px `border`, radius 12, padding 16 or 20, no shadow.
- A card earns its border by grouping related content. Do not wrap every paragraph in one.

**Stat card**

- At most four per row, and only metrics that are real and useful.
- Exactly one card may carry the primary tone (Omzet). The rest are neutral.
- Label 12px, value 24px tabular, hint 12px muted.
- A delta appears only with a real, named baseline: "Naik 8% dari kemarin". No invented comparisons.

**Table**

- Header 12px medium in muted, sentence case, no uppercase.
- The column that decides the next action comes first or second.
- Numbers right-aligned and tabular. Dates use "26 Okt 2026, 14:30".
- Row height 44 minimum. Row actions exist only if they work; destructive row actions confirm.
- Below `md`, tables become stacked rows with labels. Never horizontal scroll the page itself.

**Dialog**

- Radius 16, max width 480 for confirms, 640 for forms, 90dvh for the mobile cart.
- Title 16/600, description 14 muted, actions right-aligned with the safe action first.
- Escape closes. Focus is trapped and returns to the trigger. Destructive confirms require a reason field.
- The transaction success dialog shows the real receipt and three actions: new transaction, history, print.

**Toast**

- Sonner, top-center, 4 seconds, plain sentence, no emoji.
- Success names what changed. Error names what failed and what to do next.

**Badge**

- Status only: Lunas, Void, Stok menipis, Owner, Kasir, Resep belum diatur.
- No "AI Powered", "Beta", "New", or decorative pills. No capsule plus dot plus glow combination.

**Segmented filter**

- Category filters may be pills because they are a segmented control and the shape communicates selection.
- Selected: maroon fill, cream text. Unselected: card surface with border. No icon on "Semua".

**States**

Every data view ships four states:

1. First run: say what is missing and how to add the first item.
2. Filtered to nothing: say which filter emptied the view and offer a reset.
3. Loading: name what is loading ("Memuat menu..."), use a skeleton only where the layout is known.
4. Error: name the failure, offer retry, and keep navigation usable.

"Belum ada data" alone is not an empty state.

---

## 9. Icons and imagery

**Icon set:** Lucide, already a dependency.

- Size 20px in navigation and actions, 16px inside dense tables, 24px in empty states.
- Stroke 1.75. Icons inherit text color; they do not get their own accent.
- Icons are allowed where they help scanning: navigation, POS categories, actions with a text label, status.
- Icons are not decoration. No icon above every feature card, no icon in a heading unless it is a status.
- Forbidden glyphs: sparkle, star, magic wand, lightning, diamond, robot, orb. The "Semua" filter gets no icon.
- Category mapping is honest: `Coffee` for kopi, `CupSoda` for non-kopi, `Cookie` for snack and dessert, `UtensilsCrossed` as fallback. If a category has no honest glyph, it has no icon.
- Emoji never appear in UI text.
- Arrows (`→`, `↗`) are not added to buttons by default. A directional icon is used only where the direction is the message, such as opening a transaction detail.

---

## 10. Motion

- Purpose: confirm a state change or reveal a result. Nothing animates to look busy.
- Durations: 120ms for color and opacity, 150ms for small transforms, 200ms for panels.
- Easing: ease-out.
- Allowed: hover and focus transitions, dialog enter and exit, toast slide, cart drawer slide, the menu tile lift of 2px on hover (affordance that the tile is pressable).
- Not allowed: page entrance animations, staggered reveals, floating elements, endless pulses, parallax, auto-playing carousels.
- Loading may use one spinner or a named skeleton. The logo never pulses on a loop.
- Respect `prefers-reduced-motion`: remove transforms and keep only opacity changes.

---

## 11. Data display

- Money: `Rp 25.000`. No decimals. One space between `Rp` and the amount, with thousands separated by a period.
- Quantity: plain integer plus unit ("12 porsi", "250 g", "3 pcs"). Never round away a real decimal in stock beyond the unit's reality.
- Dates: "Senin, 26 Oktober 2026" in prose, "26 Okt 2026, 14:30" in tables. All times WITA.
- Percent: one decimal at most. A percent appears only when the denominator is real and stated.
- Void: show the amount struck through plus a "Void" badge. Void transactions stay visible in history and are excluded from omzet.
- Charts: title states the question, axis is labeled, the unit is named. If one sentence answers it better, write the sentence.
- Never invent a number, a trend, a customer, a review, or a feed entry. If real data is missing, show an honest empty state or `[DATA ASLI]`.
- Stock may go negative by business rule. Show it in `destructive` with an explanation, never hide it.

---

## 12. Screen jobs

Each screen has one job and one decision. The layout follows that decision, not a dashboard template.

| Route | Job | The one decision | Composition |
|---|---|---|---|
| `/login` | Sign in | Which account | Brand panel plus a single form. The panel states what the app is in one line, not a feature list. |
| `/kasir` | Take an order | What goes in the cart, then how it is paid | The menu grid is the page. Cart is always visible on desktop, a bottom sheet on mobile. Today's summary is a small strip, not a hero. |
| `/transaksi` | Find a transaction | View, reprint, or void | Filters first (date, kasir, method, type), then the list. No stat row. |
| `/transaksi/[id]` | Read one receipt | Reprint or void | Receipt on the left, facts and actions on the right. Void requires a reason. |
| `/menu` | Keep the sellable list correct | What is active and priced right | Grouped list or table by category. Show "Resep belum diatur" where true. |
| `/stok` | Know what to reorder | Restock, adjust, or record waste | Sorted by urgency: below minimum first. Current stock and minimum in the same row. |
| `/stok/[id]` | Read one ingredient's history | Understand why stock moved | Ledger first. Restock and adjust actions stay available. |
| `/dashboard` | Decide what needs attention today | What to act on | One summary row of real metrics, then the alerts and the insight. Charts answer a named question. |
| `/laporan` | Produce a PDF | Daily or monthly, which period | Period picker, preview, download. The preview must match the PDF. |
| `/pengaturan` | Set cafe identity and staff | Change a setting or an account | Grouped settings, low frequency, no dashboard chrome. |

Rules that apply across screens:

- One focal point per screen. On `/kasir` it is the menu; on `/dashboard` it is what needs action.
- Do not add a section because dashboards usually have one. If a panel has no decision, remove it.
- Role matters. A kasir never sees an owner control, not even disabled.

---

## 13. Print

Print is a separate light surface, not a screenshot of the app.

**Receipt (80mm)**

- Monospace, 10 to 11pt, black on white. No maroon fills, no background color.
- Cafe name, address, phone, order number, time, cashier, items, totals, payment method, change, footer from settings.
- Void receipts are marked clearly in text.
- The on-screen receipt keeps the same mono treatment on a neutral sheet.

**Report (A4)**

- Neutral ink on white. Maroon only for the header rule and the cafe name.
- Charts use ink bars, not the amber bars currently in the preview.
- Sections follow `prd.md` section 6. Every number matches the dashboard for the same period.
- No dark mode in print. Never invert the report.

---

## 14. Drift cleared in Phase 2

These were implementation details that contradicted the direction. All are fixed; the table records what the first pass corrected.

| Where | Was | Rule |
|---|---|---|
| `src/app/login/page.tsx` | Two blurred color orbs | R-01, R-13 |
| `src/app/login/page.tsx` | Eyebrow pill above the headline | R-09 |
| `src/app/(kasir)/kasir/page.tsx` | Sparkles icon on "Semua" | R-04 |
| `src/app/(owner)/dashboard/page.tsx` | Amber, emerald, sky, and violet series | R-29, section 5.5 |
| `src/components/layout/stat-card.tsx` | Uppercase wide-tracked label | R-06, section 6 |
| `src/app/globals.css` | Warning `#b26a00` failed 4.5:1 | R-25, section 5.3 |
| `src/app/globals.css` | Input border `#ddcec2` at 1.44:1 | R-25, section 5.3 |
| `src/components/ui/card.tsx` | Shadow on every card | R-12, section 7 |
| `src/components/layout/app-shell.tsx` | Pulsing logo on loading | R-19, section 10 |
| `src/app/(owner)/laporan/page.tsx` | Amber chart bars in the report preview | section 13 |

---

## 15. Decision log

- Maroon and cream stay: they are the logo's own colors, not a generated palette.
- No second accent: semantic colors already occupy the attention budget.
- Plus Jakarta Sans: rounded geometric forms echo the wordmark and stay legible at tablet size.
- Dials 1/1/1: a shift-long tool should be quiet, predictable, and still.
- Flat cards with borders: elevation is reserved for overlays so the page keeps a ground plane.
- Radius set 8/12/16/999: shape distinguishes control, surface, overlay, and status.
- Category filters stay pills: selection is the only place where a pill communicates state.
- One ink tone for charts: labels encode the series; color does not.
- Satu layar satu keputusan: the dashboard serves attention, the kasir serves speed.
- Dark palette is warm charcoal, not black: it keeps the cafe material feel and avoids a tech default.
- Print stays neutral ink: toner, legibility, and archival clarity beat brand color.
- Monospace only on receipts: alignment is the reason, not a terminal aesthetic.
- Theme starts from the system preference, then follows the user's toggle and stores that choice in `localStorage`.
- Maroon text in dark mode uses `#e8897a`; filled maroon surfaces use `#8f231f` with cream text.

---

## 16. Open items

- Owner to supply real cafe and menu photos if imagery is wanted. Until then, no imagery beyond the logo.
- Confirm whether receipts will be printed on thermal paper or only through the browser. The 80mm direction assumes either.
- No pricing page, testimonials, FAQ, or marketing sections exist in this product, and this direction does not create them.
