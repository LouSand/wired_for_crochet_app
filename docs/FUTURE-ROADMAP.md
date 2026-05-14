# Wired for Crochet — Future Roadmap

Everything we want to build next. Organised by priority and effort.

---

## 🧶 Knitting Support (Make it Crochet + Knitting) ✅

**Goal:** The app works for both crochet and knitting. Users choose their craft (or both).

### Changes needed:
- [x] Add "craft type" to user settings: Crochet / Knitting / Both
- [x] Add needle types: straight, circular, DPN, interchangeable
- [x] Add needle sizes (metric + US/UK sizing)
- [x] Pattern terminology field: "Crochet (UK terms)" / "Crochet (US terms)" / "Knitting"
- [x] Stitch dictionary covers both crafts
- [x] Yarn weight categories work for both (already universal)
- [x] Project creation asks: Crochet or Knitting? (craft_type field)
- [x] Marketplace patterns tagged by craft type
- [ ] Rename "Hooks" section to "Tools" (hooks + needles) — UI rename pending
- [ ] Counter labels adapt (rows/rounds for both, stitches per row)
- [ ] Hook recommendations become "tool recommendations"

### Effort: ~~2-3 sessions~~ Done (DB + actions complete, minor UI rename remaining)

---

## 🌍 US/UK Crochet Terminology ✅

**Goal:** Patterns clearly indicate which terminology they use. Eventually offer auto-translation.

### Features:
- [x] Add `terminology` field to patterns: "UK terms" / "US terms" / "Universal"
- [x] Show terminology badge on pattern cards and detail pages
- [x] Built-in conversion reference (US sc = UK dc, etc.)
- [ ] Auto-translate button on written patterns (swap terms)
- [ ] Marketplace filter by terminology
- [ ] User preference: "I use UK/US terms" — highlight when viewing opposite

### Terminology mapping:
| UK Term | US Term |
|---------|---------|
| Double crochet (dc) | Single crochet (sc) |
| Half treble (htr) | Half double crochet (hdc) |
| Treble (tr) | Double crochet (dc) |
| Double treble (dtr) | Treble crochet (tr) |
| Triple treble (ttr) | Double treble (dtr) |
| Tension | Gauge |
| Miss | Skip |
| Yarn round hook (yrh) | Yarn over (yo) |

### Effort: Small (1 session)

---

## 📐 Gauge Calculator ✅

**Goal:** Help users calculate stitches/rows per inch and compare with pattern requirements.

### Features:
- [x] Enter: hook/needle size, yarn weight, measured stitches in 4 inches
- [x] Calculate: stitches per inch, rows per inch
- [x] Compare with pattern gauge requirements
- [x] Suggest hook/needle size adjustment if gauge doesn't match
- [x] Save gauge swatches per yarn + hook combination
- [x] Link gauge to projects (gauge_swatch_id on projects table)

### Effort: ~~Small (1 session)~~ Done

---

## 🔄 Yarn Weight/Length Converter ✅

**Goal:** Convert between measurement systems for yarn.

### Features:
- [x] Grams ↔ Ounces
- [x] Metres ↔ Yards
- [x] "How many balls do I need?" calculator (pattern requires X metres, balls have Y metres each)
- [ ] Calculate metres per gram (from ball band info)
- [ ] Yarn substitution helper (same weight category, similar meterage)

### Effort: ~~Small (1 session)~~ Done

---

## 📋 Project Templates ✅

**Goal:** Save a project setup to reuse for repeat makes.

### Features:
- [x] "Save as Template" button on completed projects
- [x] Template stores: pattern link, counters (names + targets), hooks used, yarn used
- [ ] "New Project from Template" option (UI button pending)
- [ ] Auto-creates counters and links pattern/hooks/yarn
- [ ] Template library in My Library section

### Effort: ~~Small-Medium (1-2 sessions)~~ Done (actions + DB complete, UI integration pending)

---

## 📖 Stitch Dictionary ✅

**Goal:** Built-in reference for common stitches with US/UK terms, descriptions, and tips.

### Features:
- [x] Searchable stitch database
- [x] Each stitch: name (US + UK), abbreviation, description, difficulty
- [x] Category: basic, intermediate, advanced, decorative
- [x] Works for both crochet and knitting
- [x] 18 stitches pre-seeded (crochet + knitting basics)
- [ ] Link stitches to patterns (what stitches does this pattern use?)
- [ ] User can add custom stitches/notes

### Effort: ~~Medium (1-2 sessions)~~ Done

---

## 📸 Project Sharing & Inspiration Gallery ✅

**Goal:** Share finished projects with the community and get inspiration.

### Features:

#### Sharing to socials:
- [x] "Share" button on completed projects (shareProject action)
- [ ] Generate shareable image (project photo + stats overlay)
- [ ] Share to Instagram, Facebook, Pinterest, X
- [ ] Copy link to clipboard
- [ ] Open Graph meta tags for link previews

#### In-app inspiration gallery:
- [x] `/inspiration` page — community gallery of finished projects
- [x] Users opt-in to share (not automatic)
- [x] Shows: photo, project name, pattern link, time taken
- [x] Click through to pattern (if published)
- [x] Like/save for later
- [x] Filter by: craft type
- [ ] "I made this too" — link your own project to the same pattern
- [ ] Filter by category, difficulty, yarn weight

#### Database:
- [x] `shared_projects` table (project_id, user_id, photo_path, caption, is_public)
- [x] `inspiration_likes` table (shared_project_id, user_id)

### Effort: ~~Medium (2-3 sessions)~~ Done (core complete, social sharing pending)

---

## 💾 Backup & Data Export ✅

**Goal:** Users can download all their data.

### Features:
- [x] "Export My Data" endpoint (`/api/backup`)
- [x] JSON file containing all user data (projects, patterns, time sessions, counters, yarn, hooks, notes, expenses, invoices, customers, settings)
- [x] Export logged for audit
- [x] GDPR compliance (right to data portability)
- [ ] ZIP file with photos/files included
- [ ] Import from backup (restore)

### Effort: ~~Medium (2 sessions)~~ Done (JSON export complete, ZIP + import pending)

---

## 🔔 Notifications & Reminders ✅

**Goal:** Helpful reminders without being annoying.

### Features:
- [x] Notification system (user_notifications table + CRUD actions)
- [x] UC reporting period due (UCReminders component)
- [x] Project deadline approaching (DeadlineNotifications component)
- [ ] Timer still running reminder (if app closed with timer active)
- [ ] Pattern update available (for marketplace patterns)
- [ ] Weekly progress summary (optional)
- [ ] Push notifications (requires service worker)
- [ ] Email digest (optional, weekly)
- [ ] In-app notification bell

### Effort: ~~Medium (2 sessions)~~ Done (core system complete, push/email pending)

---

## ❤️ Favourites & Wishlist ✅

**Goal:** Save patterns you want to make later.

### Features:
- [x] Heart/bookmark button on marketplace patterns (FavouriteButton component)
- [x] `pattern_favourites` table
- [x] Toggle favourite on/off with one tap
- [x] Server actions: toggleFavourite, getFavourites, getFavouritePatterns
- [ ] "Wishlist" section in My Library (filter)
- [ ] "Start Project from Wishlist" — creates project linked to pattern
- [ ] Price drop notifications for paid patterns (future)
- [ ] Share wishlist with friends

### Effort: ~~Small (1 session)~~ Done (core complete, UI integration pending)

---

## 🌐 International Tax Returns

**Goal:** Support tax returns for multiple countries. Users select their country and get the correct form.

### Architecture:
- [ ] `tax_country_config` table — defines boxes, categories, rules per country
- [ ] User selects country in settings
- [ ] Tax module loads correct form structure
- [ ] Expense categories map to country-specific tax categories
- [ ] PDF export generates correct form layout
- [ ] Each country is a config + template, not a full rewrite

### Countries planned:

#### 🇬🇧 UK — SA103 Self-Employment (DONE ✅)
- Cash basis / traditional
- Boxes 9-36
- Class 2 + Class 4 NI
- MTD readiness

#### 🇺🇸 USA — Schedule C (Profit or Loss from Business)
- [ ] Gross receipts (Line 1)
- [ ] Cost of goods sold (Lines 35-42)
- [ ] Expenses by category (Lines 8-27)
- [ ] Net profit/loss (Line 31)
- [ ] Self-employment tax (Schedule SE)
- [ ] Quarterly estimated payments (Form 1040-ES)
- [ ] Standard mileage rate vs actual expenses
- [ ] Home office deduction (Form 8829)
- **Effort: 2-3 sessions**

#### 🇦🇺 Australia — BAS (Business Activity Statement)
- [ ] GST collected and paid
- [ ] Quarterly BAS lodgement
- [ ] Annual income tax return
- [ ] ABN tracking
- [ ] Superannuation (if applicable)
- **Effort: 2-3 sessions**

#### 🇨🇦 Canada — T2125 (Business Income)
- [ ] Gross business income
- [ ] Business expenses by category
- [ ] Net income calculation
- [ ] GST/HST (if registered)
- [ ] CPP contributions
- **Effort: 2 sessions**

#### 🇮🇪 Ireland — Form 11 (Self-Assessment)
- [ ] Trading income
- [ ] Allowable deductions
- [ ] USC + PRSI
- [ ] VAT (if registered)
- **Effort: 2-3 sessions**

### Effort: Large overall (but each country is 2-3 sessions independently)

---

## 🏗️ Technical Improvements

- [ ] Offline support (service worker + local storage sync)
- [ ] PWA (installable on phone home screen)
- [ ] Performance audit (lazy loading, image optimisation)
- [ ] Automated testing (unit + integration)
- [ ] CI/CD pipeline (auto-deploy on push)
- [ ] Error monitoring (Sentry or similar)
- [ ] Analytics (privacy-respecting, e.g. Plausible)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] SEO for marketplace pages

---

## 📊 Priority Order (Suggested)

### Quick wins (1 session each):
1. ~~US/UK terminology field on patterns~~ ✅
2. ~~Gauge calculator~~ ✅
3. ~~Yarn converter~~ ✅
4. ~~Favourites/wishlist~~ ✅

### Medium effort (2-3 sessions each):
5. ~~Knitting support (tools rename + needle types)~~ ✅
6. ~~Project templates~~ ✅
7. ~~Stitch dictionary~~ ✅
8. ~~Sharing & inspiration gallery~~ ✅
9. ~~Notifications~~ ✅
10. ~~Backup/export~~ ✅

### Larger features (ongoing):
11. USA tax (Schedule C)
12. Australia tax (BAS)
13. Canada tax (T2125)
14. Multi-country tax architecture
15. Offline/PWA support

---

## 🎯 App Vision

**Wired for Crochet** (eventually "Wired for Craft"?) becomes the all-in-one app for:
- **Crafters** — track projects, patterns, materials, time
- **Small business owners** — invoicing, expenses, tax returns
- **Pattern designers** — sell patterns, build an audience
- **Community** — share inspiration, discover patterns, connect

Works for crochet AND knitting. Supports crafters worldwide with localised tax/business tools.
