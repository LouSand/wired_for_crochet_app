# Wired for Crochet

A comprehensive crochet project management app built with Next.js 16, Supabase, TypeScript, and Tailwind CSS. Designed for crocheters who want to track projects, manage their business, and eventually sell patterns.

**Live URL:** https://www.wiredforcrochet.com/  
**Repository:** https://github.com/LouSand/wired_for_crochet_app  
**Supabase Project:** `ounfsyrsiozelbmtlnqm`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Generation:** @react-pdf/renderer
- **Validation:** Zod
- **Deployment:** Vercel (planned)

## Tier Structure

| Tier | Features |
|------|----------|
| **Free** | Project tracking, time tracking, counters, yarn inventory, hooks, patterns, photos, notes, pricing calculator |
| **Pro** | Business suite: suppliers, expenses, materials inventory, products, BOM, customers, sales, dashboard |
| **Pro+** | Invoicing: invoices, quotes, payments, PDF generation, email sending, business profile |

---

## Current Feature Status

### ✅ Fully Built

| Feature | Status | Key Files |
|---------|--------|-----------|
| Auth (login, register, email verification) | ✅ Done | `src/app/(auth)/` |
| Landing page with branding | ✅ Done | `src/app/page.tsx` |
| Project CRUD | ✅ Done | `src/app/(dashboard)/projects/` |
| Project dashboard (unified view) | ✅ Done | `ProjectDashboard.tsx` |
| Timer (start/stop/manual entry) | ✅ Done | `src/components/timer/` |
| Row/stitch counters | ✅ Done | `src/components/counters/` |
| Yarn inventory | ✅ Done | `src/app/(dashboard)/yarn/` |
| Hook inventory | ✅ Done | `src/app/(dashboard)/hooks/` |
| Pattern CRUD (written + uploaded) | ✅ Done | `src/app/(dashboard)/patterns/` |
| Pattern file upload (PDF/images) | ✅ Done | Pattern form + Supabase Storage |
| Pattern photos (gallery + cover) | ✅ Done | `src/components/patterns/PatternPhotos.tsx` |
| Pattern yarn requirements | ✅ Done | `src/components/patterns/PatternYarnRequirements.tsx` |
| Bulk pattern upload | ✅ Done | `BulkPatternUploader.tsx` |
| Progress photos per project | ✅ Done | `src/app/(dashboard)/projects/[id]/photos/` |
| Project notes | ✅ Done | `src/app/(dashboard)/projects/[id]/notes/` |
| Pricing calculator | ✅ Done | `src/app/(dashboard)/projects/[id]/pricing/` |
| PDF export (patterns) | ✅ Done | `src/app/api/pdf/` |
| Project deadlines + priority | ✅ Done | `estimated_completion_date`, `priority` columns |
| Deadline notifications | ✅ Done | `DeadlineNotifications.tsx` |
| Create Invoice from Project | ✅ Done | `project-to-invoice.ts` |
| Settings (currency, hourly rate, profit margin) | ✅ Done | `src/app/(dashboard)/settings/` |
| Business suite (Pro tier) | ✅ Done | `src/app/(dashboard)/business/` |
| Invoicing system (Pro+ tier) | ✅ Done | `src/app/(dashboard)/business/invoicing/` |
| Invoice/Quote PDF generation | ✅ Done | `src/lib/pdf/` |
| Email sending (stub) | ✅ Done | `supabase/functions/send-email/` |
| Overdue invoice detection | ✅ Done | `checkOverdueInvoices()` |
| Materials secondary units | ✅ Done | `secondary_unit`, `secondary_quantity` |
| Hook compatibility metadata | ✅ Done | `yarn_types`, `pattern_types` on hooks |

### 🟡 Partially Built / Needs Improvement

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Project page UI | 🟡 Partial | Pattern/PDF not shown near counters; no tile photos on project cards; not optimised for active crocheting |
| Responsive/mobile design | 🟡 Partial | Basic responsive grid exists but not optimised for phone-in-hand crocheting use |
| Pattern highlighting | 🟡 Not started | No row/stitch highlighting on patterns |
| Pattern-linked notes | 🟡 Not started | Notes exist on projects but not linked to specific pattern rows |
| Timer in counter area | 🟡 Partial | Timer exists on dashboard but could be more integrated with counters |
| Yarn label photo upload | 🟡 Not started | Yarn has text fields but no photo upload for labels |
| Multiple hooks per pattern section | 🟡 Not started | Hooks can be assigned to projects but not to specific pattern sections |
| Auto-created counters from patterns | 🟡 Not started | Counters are manual only |
| Progress bar | 🟡 Partial | Counter progress bars exist but no overall project progress bar |

### ❌ Not Started

| Feature | Status |
|---------|--------|
| Pattern row/stitch highlighting | ❌ |
| Keep/delete highlights on project finish | ❌ |
| Reusable pattern annotations | ❌ |
| Project tile photos/icons on cards | ❌ |
| Camera capture for patterns | ❌ |
| Yarn label photo scanning | ❌ |
| AI-assisted pattern reading | ❌ |
| Community pattern sharing | ❌ |
| Pattern marketplace (buying/selling) | ❌ |
| Payment/commission system | ❌ |

---

## Development Roadmap

### Phase 1: UI Cleanup and Responsive Foundations
**Goal:** Make the app usable while actively crocheting on any device.

**Features:**
- [x] Improve project dashboard layout for phone-in-hand use
- [x] Show pattern/PDF/photo near counters at bottom of project page
- [x] Add tile photo/icon on project cards for visual scanning
- [x] Audit and fix responsive breakpoints across all pages
- [x] Ensure touch targets are 44px+ for mobile use
- [x] Improve sidebar navigation for mobile (bottom nav option)
- [ ] Dark mode consideration for long crafting sessions

**Status:** Done  
**Files affected:** `ProjectDashboard.tsx`, `ProjectCard.tsx`, `sidebar.tsx`, all page layouts  
**Dependencies:** None  
**Notes:** Mobile-first redesign complete with bottom nav, large touch targets, and visual project cards.

---

### Phase 2: Project Workspace Improvements
**Goal:** Make the project page a true "workspace" for active crocheting.

**Features:**
- [x] Integrate timer controls directly beside/below counters
- [x] Show linked pattern (PDF viewer or image) in the workspace
- [x] Quick-access notes panel (collapsible)
- [x] Project progress bar (auto from counters or manual)
- [x] "Active crocheting mode" — minimal UI, large buttons, counters + timer only
- [ ] Swipe gestures for counter increment on mobile

**Status:** Done (swipe gestures deferred — requires touch event handling library)  
**Files affected:** `ProjectDashboard.tsx`, `page.tsx`  
**Dependencies:** Phase 1  
**Notes:** The workspace now shows pattern viewer, progress bar, collapsible notes, and a full-screen focus mode for active crocheting.

---

### Phase 3: Pattern Upload and Storage Enhancements
**Goal:** Support all ways crocheters get patterns — PDFs, photos, camera.

**Features:**
- [ ] Camera capture for pattern photos (mobile)
- [x] In-app PDF viewer for uploaded patterns
- [x] Pattern image zoom/pan for following along
- [x] Organise patterns into folders/categories
- [x] Pattern search and filtering improvements

**Status:** Mostly done (camera capture deferred — requires native device API)  
**Files affected:** `src/app/(dashboard)/patterns/`, `PatternListClient.tsx`, migration  
**Dependencies:** None  
**Notes:** PDF viewing with annotation, image zoom, category filtering, and search all implemented.

---

### Phase 4: Pattern Notes and Highlighting
**Goal:** Let users mark their progress on a pattern and annotate it.

**Features:**
- [x] Highlight completed rows/stitches on written patterns
- [x] Highlight regions on pattern images/PDFs
- [x] Notes linked to specific pattern rows/sections
- [x] On project finish: prompt to keep or delete highlights
- [x] Reusable annotations (keep notes for next time)
- [x] "Reset progress" option for restarting a pattern

**Status:** Done  
**Files affected:** `ProjectDashboard.tsx`, `PdfAnnotationViewer.tsx`, `pattern-annotations.ts`, migration  
**Dependencies:** Phase 3 (pattern viewer)  
**Notes:** Full annotation system with draw/highlight/text/eraser tools, persistent save to Supabase, keep/discard on project completion, and reset progress button.

---

### Phase 5: Multiple Hook Tracking
**Goal:** Track which hooks are used for which parts of a pattern.

**Features:**
- [ ] Assign multiple hooks to a project
- [ ] Record which hook was used for which section/part
- [ ] Hook change log (when you switched hooks during a project)
- [ ] Hook recommendations based on pattern requirements

**Status:** Partially done (hooks assigned to projects, not to sections)  
**Files affected:** `src/app/(dashboard)/projects/[id]/hooks/`, hook actions  
**Dependencies:** None  
**Notes:** Hook recommendations already exist based on yarn_types/pattern_types metadata.

---

### Phase 6: Yarn Label Upload and Database
**Goal:** Make it easy to record yarn details from the label.

**Features:**
- [ ] Upload/take photo of yarn label
- [ ] Manual entry of all label details (brand, colour, weight, hook rec, washing, dye lot, fibre)
- [ ] Yarn photo gallery
- [ ] Link yarn entries to patterns and projects
- [ ] Prepare data structure for future AI extraction

**Status:** Partially done (text fields exist, no photo upload for labels)  
**Files affected:** `src/app/(dashboard)/yarn/`, yarn actions, new storage bucket  
**Dependencies:** None  
**Notes:** The yarn inventory already stores brand, colour, weight, fibre content, washing instructions, etc. Just needs photo support.

---

### Phase 7: Counters, Progress, and Timer Integration
**Goal:** Seamless counting and timing while crocheting.

**Features:**
- [ ] Auto-create counters from written pattern rows (where detectable)
- [ ] Overall project progress bar (from counters or manual)
- [ ] Timer integrated into counter section
- [ ] Session history with editable entries
- [ ] Quick-tap counter mode (full-screen, large buttons)
- [ ] Haptic feedback on mobile counter taps

**Status:** Partially done (counters + timer exist separately, not fully integrated)  
**Files affected:** `ProjectDashboard.tsx`, counter components, timer components  
**Dependencies:** Phase 2  
**Notes:** The unified dashboard already shows timer + counters side by side. This phase refines the UX.

---

### Phase 8: AI-Assisted Pattern Reading
**Goal:** Use AI to extract structure from patterns.

**Features:**
- [ ] OCR/parsing of uploaded pattern PDFs
- [ ] Extract row counts and stitch counts from text
- [ ] Auto-generate counters from parsed patterns
- [ ] Smart suggestions for progress tracking
- [ ] Pattern difficulty estimation

**Status:** Not started  
**Files affected:** New AI service, pattern parsing utilities  
**Dependencies:** Phase 4 (pattern annotations), Phase 7 (counters)  
**Notes:** This is a future differentiator. Start with simple text parsing before investing in AI/OCR.

---

### Phase 9: Community and Pattern Sharing
**Goal:** Let users share patterns with each other.

**Features:**
- [ ] "Publish" button on patterns (private → public)
- [ ] Public pattern browsing (no auth required)
- [ ] User profiles / seller pages
- [ ] Pattern categories, tags, search
- [ ] Reviews and ratings
- [ ] Content moderation / reporting

**Status:** Not started (placeholder notes at `.kiro/specs/pattern-marketplace/notes.md`)  
**Files affected:** New public routes, new tables, new components  
**Dependencies:** Phase 3, Phase 4  
**Notes:** This requires public-facing pages, SEO, and content moderation planning.

---

### Phase 10: Marketplace and Paid Pattern Sales
**Goal:** Users can sell patterns; Wired for Crochet takes a commission.

**Features:**
- [ ] Pattern pricing (free or paid)
- [ ] Stripe Connect integration (split payments)
- [ ] Seller onboarding and payouts
- [ ] Buyer purchase flow and library
- [ ] Commission system (platform percentage)
- [ ] Seller dashboard (sales, earnings, analytics)
- [ ] Refund handling
- [ ] Tax/VAT considerations (UK)

**Status:** Not started (notes at `.kiro/specs/pattern-marketplace/notes.md`)  
**Files affected:** New marketplace routes, Stripe integration, new tables  
**Dependencies:** Phase 9  
**Notes:** Major feature requiring Stripe account, legal terms, and content policy.

---

## Migrations to Run

Run these in your Supabase SQL Editor in order:

1. `supabase/migrations/20240101000001_create_tables.sql` (initial schema)
2. `supabase/migrations/20240201000001_project_pattern_hooks_enhancements.sql`
3. `supabase/migrations/20240301000001_business_suite.sql`
4. `supabase/migrations/20240501000001_invoicing_system.sql`
5. `supabase/migrations/20240601000001_project_deadlines.sql`
6. `supabase/migrations/20240601000002_material_secondary_units.sql`
7. `supabase/migrations/20240601000003_pattern_yarn_requirements.sql`
8. `supabase/migrations/20240601000004_pattern_photos.sql`

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Run development server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://ounfsyrsiozelbmtlnqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, verify, reset password
│   ├── (dashboard)/     # Main app (projects, patterns, yarn, hooks, business)
│   └── api/             # API routes (PDF export, settings, patterns)
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks (useTimer, etc.)
├── lib/
│   ├── actions/         # Server actions (CRUD for all entities)
│   ├── pdf/             # PDF document templates
│   ├── supabase/        # Supabase client/server utilities
│   └── validators/      # Zod schemas
├── types/               # TypeScript type definitions
└── proxy.ts             # Auth proxy (Next.js 16 convention)
```

## Recommended Next Steps

Based on the current app state, the safest and highest-impact next steps are:

1. **Phase 1: Responsive UI audit** — The app works but isn't optimised for phone use while crocheting
2. **Phase 2: Project workspace** — Show pattern near counters, add progress bar
3. **Phase 6: Yarn label photos** — Quick win, extends existing yarn inventory

These don't require new database tables or breaking changes, just UI improvements on existing functionality.
