# Implementation Plan: Crochet Project Tracker

## Overview

This plan implements the Crochet Project Tracker as a full-stack Next.js (App Router) application with Supabase for database, auth, and storage. Tasks follow the 7 development phases from the design document, building incrementally from foundation through polish. Each task references specific requirements for traceability.

## Tasks

- [x] 1. Project foundation and Supabase setup
  - [x] 1.1 Initialize Next.js project with App Router, TypeScript, Tailwind CSS, and install core dependencies (TanStack Query, React Hook Form, Zod, @supabase/ssr, @supabase/supabase-js)
    - Create Next.js 14+ project with `src/` directory structure
    - Configure Tailwind CSS and base styles
    - Set up path aliases in tsconfig.json
    - _Requirements: 12.1_

  - [x] 1.2 Create Supabase project configuration and database schema with RLS policies
    - Create SQL migration files for all tables: user_settings, projects, time_sessions, counters, yarn_entries, yarn_usages, hook_entries, hook_usages, patterns, pattern_versions, progress_photos, notes, pricing_extras
    - Enable RLS on all tables with `user_id = auth.uid()` policies for SELECT, INSERT, UPDATE, DELETE
    - Create storage buckets: progress-photos, pattern-files, yarn-photos with appropriate policies
    - Set up environment variables for Supabase URL and keys
    - _Requirements: 11.1, 11.6, 11.7_

  - [x] 1.3 Implement Supabase client utilities and auth middleware
    - Create `src/lib/supabase/client.ts` for browser client
    - Create `src/lib/supabase/server.ts` for server client using `@supabase/ssr`
    - Create `src/lib/supabase/middleware.ts` for auth session refresh
    - Create Next.js middleware that protects dashboard routes and redirects unauthenticated users to login
    - _Requirements: 1.5, 11.1_

  - [x] 1.4 Generate TypeScript types from Supabase schema
    - Create `src/types/database.ts` with generated types for all tables
    - Define form data types and response types used across the app
    - _Requirements: 11.4_

  - [x] 1.5 Implement authentication pages and flows
    - Create `src/app/(auth)/login/page.tsx` with email/password form
    - Create `src/app/(auth)/register/page.tsx` with registration form and email confirmation
    - Create `src/app/(auth)/verify-email/page.tsx` with verification status and resend link
    - Create `src/app/(auth)/reset-password/page.tsx` with reset request and new password forms
    - Implement server actions for auth operations in `src/lib/actions/auth.ts`
    - Display generic error messages on login failure (don't reveal which field is incorrect)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.6 Create dashboard layout shell and navigation
    - Create `src/app/(dashboard)/layout.tsx` with responsive sidebar/header navigation
    - Include navigation links: Projects, Yarn, Hooks, Patterns, Settings
    - Create `src/app/(dashboard)/settings/page.tsx` with default hourly rate setting
    - Implement user_settings server actions (create/update default_hourly_rate)
    - _Requirements: 9.2, 12.1_

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Core project management
  - [x] 3.1 Create Zod validation schemas for project forms
    - Define `ProjectFormData` schema with name (required), description, status, difficulty, customer_name, date_started, hourly_rate_override
    - Validate status enum: planned, in_progress, paused, completed, abandoned
    - Validate difficulty enum: beginner, easy, intermediate, advanced, expert
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]* 3.2 Write property test for project status validation
    - **Property 2: Project status validation**
    - Test that only valid status values are accepted and all others are rejected
    - **Validates: Requirements 2.2**

  - [x] 3.3 Implement project server actions (CRUD)
    - Create `src/lib/actions/projects.ts` with createProject, updateProject, deleteProject
    - Ensure createProject sets user_id from auth session
    - Implement soft confirmation pattern for deletion (cascade all associated data)
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 3.4 Write property test for project data round-trip
    - **Property 1: Project data round-trip**
    - Test that creating a project and reading it back returns matching fields
    - Test that partial updates are correctly reflected
    - **Validates: Requirements 2.1, 2.3, 2.5**

  - [x] 3.5 Create project list page with filtering and sorting
    - Create `src/app/(dashboard)/projects/page.tsx` with grid/list view
    - Implement FilterBar component with status, difficulty filters and sort controls (date_started, status, difficulty)
    - Create ProjectCard component for list items
    - Create EmptyState component for when no projects exist
    - _Requirements: 2.7, 2.8_

  - [ ]* 3.6 Write property test for project list filtering and sorting
    - **Property 3: Project list filtering and sorting**
    - Test that filtered results satisfy filter predicates and results are correctly ordered
    - **Validates: Requirements 2.8**

  - [x] 3.7 Create project form and detail pages
    - Create `src/app/(dashboard)/projects/new/page.tsx` with project creation form
    - Create `src/app/(dashboard)/projects/[id]/page.tsx` with tabbed detail view
    - Implement ConfirmDialog component for delete confirmation
    - Wire React Hook Form with Zod validation
    - _Requirements: 2.1, 2.3, 2.4, 2.6_

- [x] 4. Time tracking system
  - [x] 4.1 Implement time tracking server actions and validation
    - Create `src/lib/actions/time-sessions.ts` with startTimer, stopTimer, updateTimeSession
    - Enforce no duplicate running timers per project (check for existing session with null end_time)
    - Use server timestamps for start/end times
    - Create Zod schema for manual time session editing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_

  - [ ]* 4.2 Write property test for no duplicate running timers
    - **Property 5: No duplicate running timers**
    - Test that starting a timer when one is already running on the same project is rejected
    - **Validates: Requirements 3.8**

  - [x] 4.3 Create timer UI component with real-time display
    - Create `src/hooks/useTimer.ts` custom hook for client-side timer state
    - Create `src/components/timer/Timer.tsx` with start/stop controls and elapsed time display
    - Handle browser tab close detection for orphaned sessions
    - Implement network failure retry for stop action
    - _Requirements: 3.7, 3.8_

  - [x] 4.4 Create time tracking page with session history
    - Create `src/app/(dashboard)/projects/[id]/time/page.tsx`
    - Display session list with start/end times, duration, and notes
    - Show total accumulated time across all sessions
    - Implement manual session editing form
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 4.5 Write property test for time session total computation
    - **Property 4: Time session total computation**
    - Test that total time equals sum of individual session durations
    - **Validates: Requirements 3.5**

- [x] 5. Stitch and row counters
  - [x] 5.1 Implement counter server actions and validation
    - Create `src/lib/actions/counters.ts` with createCounter, incrementCounter, decrementCounter, resetCounter, updateCounterValue
    - Enforce minimum value of 0 on decrement
    - Create Zod schema for counter form (name required, optional target_value > 0)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 5.2 Write property test for counter arithmetic
    - **Property 6: Counter arithmetic**
    - Test increment yields N+1, decrement yields N-1 (or 0 if already 0)
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 5.3 Write property test for counter value setting
    - **Property 7: Counter value setting**
    - Test that setting a counter to any non-negative integer persists that value, and reset always yields 0
    - **Validates: Requirements 4.6, 4.7**

  - [x] 5.4 Create counters page and UI components
    - Create `src/app/(dashboard)/projects/[id]/counters/page.tsx`
    - Create `src/components/counters/Counter.tsx` with increment/decrement/reset controls
    - Ensure touch-friendly tap targets (minimum 44×44px)
    - Display progress toward target when target is set (current/target)
    - Create `src/hooks/useCounter.ts` for optimistic updates
    - _Requirements: 4.4, 4.5, 4.8, 12.2_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Yarn inventory management
  - [x] 7.1 Implement yarn entry server actions and validation
    - Create `src/lib/actions/yarn.ts` with createYarnEntry, updateYarnEntry, deleteYarnEntry, linkYarnToProject
    - Create Zod schema for yarn form with all fields (name required, all others optional)
    - Validate weight_category enum: lace, fingering, sport, dk, worsted, aran, bulky, super_bulky
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for yarn entry data round-trip
    - **Property 8: Yarn entry data round-trip**
    - Test that creating a yarn entry and reading it back returns matching fields
    - **Validates: Requirements 5.1, 5.2**

  - [x] 7.3 Create yarn inventory pages and components
    - Create `src/app/(dashboard)/yarn/page.tsx` with searchable/filterable list
    - Create `src/app/(dashboard)/yarn/[id]/page.tsx` with full details and linked projects
    - Implement yarn create/edit forms with all fields
    - Display total quantity used across all projects for each yarn entry
    - _Requirements: 5.1, 5.6, 5.7_

  - [ ]* 7.4 Write property test for yarn usage total computation
    - **Property 9: Yarn usage total computation**
    - Test that total quantity used equals sum of all individual yarn_usage quantities
    - **Validates: Requirements 5.4, 5.6**

  - [x] 7.5 Implement yarn-to-project linking UI
    - Create component for linking yarn entries to projects with quantity input
    - Allow editing quantity_used in yarn_usage records
    - Show linked yarn on project detail page
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 8. Hook collection management
  - [x] 8.1 Implement hook entry server actions and validation
    - Create `src/lib/actions/hooks.ts` with createHookEntry, updateHookEntry, deleteHookEntry, linkHookToProject
    - Create Zod schema for hook form (size required, type/brand/material optional)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 8.2 Create hook collection pages and components
    - Create `src/app/(dashboard)/hooks/page.tsx` with hook list
    - Create `src/app/(dashboard)/hooks/[id]/page.tsx` with hook details
    - Implement hook create/edit forms
    - Create hook-to-project linking UI with optional note field
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [x] 9. Photos and progress documentation
  - [x] 9.1 Implement file upload utilities and validation
    - Create `src/lib/validators/file.ts` with file type and size validation
    - Validate MIME types: image/jpeg, image/png, image/webp for photos; application/pdf, image/jpeg, image/png for patterns
    - Enforce size limits: 10 MB for photos, 20 MB for patterns, 5 MB for yarn photos
    - Create signed URL generation utility
    - _Requirements: 8.2, 8.8, 11.6, 11.7_

  - [ ]* 9.2 Write property test for file type and size validation
    - **Property 15: File type and size validation**
    - Test that only allowed MIME types are accepted per context and oversized files are rejected
    - **Validates: Requirements 8.2, 11.6**

  - [x] 9.3 Implement photo upload server actions
    - Create `src/lib/actions/photos.ts` with uploadPhoto, deletePhoto
    - Generate signed upload URLs for direct client-to-Supabase upload
    - Save metadata (file_path, file_name, file_size, mime_type) to progress_photos table
    - Handle upload failures with retry capability
    - _Requirements: 8.1, 8.7, 8.9_

  - [x] 9.4 Create photos page with upload and display
    - Create `src/app/(dashboard)/projects/[id]/photos/page.tsx`
    - Create `src/components/photos/PhotoUploader.tsx` with drag-and-drop
    - Display photos in chronological grid (oldest first)
    - Support caption editing and deletion
    - Support marking photos as "final" for completed projects
    - _Requirements: 8.1, 8.6, 8.7, 2.6_

  - [ ]* 9.5 Write property test for photo chronological ordering
    - **Property 12: Photo chronological ordering**
    - Test that photos are displayed in ascending chronological order
    - **Validates: Requirements 8.6**

  - [x] 9.6 Implement notes server actions and UI
    - Create `src/lib/actions/notes.ts` with createNote, updateNote, deleteNote
    - Create `src/app/(dashboard)/projects/[id]/notes/page.tsx`
    - Implement category tabs: general, remember_next_time, pattern_alteration
    - Create note create/edit forms
    - _Requirements: 8.3, 8.4, 8.5, 8.7_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Pattern management
  - [x] 11.1 Implement pattern server actions and validation
    - Create `src/lib/actions/patterns.ts` with createPattern, updatePattern, exportPatternPdf
    - Create Zod schema for pattern form (title required, all content fields optional)
    - Implement version history: save pattern_versions record on each edit to instructions field
    - Handle pattern file upload for uploaded type patterns
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.7_

  - [ ]* 11.2 Write property test for pattern creation round-trip
    - **Property 10: Pattern creation round-trip**
    - Test that creating a pattern and reading it back returns matching fields
    - **Validates: Requirements 7.2, 6.1**

  - [ ]* 11.3 Write property test for pattern version history preservation
    - **Property 11: Pattern version history preservation**
    - Test that N edits produce exactly N version entries in chronological order
    - **Validates: Requirements 7.5**

  - [x] 11.4 Create pattern pages and editor
    - Create `src/app/(dashboard)/patterns/page.tsx` with pattern list
    - Create `src/app/(dashboard)/patterns/new/page.tsx` with creation form
    - Create `src/app/(dashboard)/patterns/[id]/page.tsx` with pattern editor
    - Implement all pattern fields: title, introduction, materials_list, hook_size, yarn_info, gauge, abbreviations, instructions, notes
    - Support linking patterns to projects
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 11.5 Implement PDF export with @react-pdf/renderer
    - Create `src/lib/pdf/` with PDF template components
    - Create `src/app/api/pdf/[patternId]/route.ts` API route for PDF generation
    - Render all pattern fields in structured layout: title, materials, hook size, gauge, abbreviations, instructions
    - Ensure instructions text is rendered faithfully without alteration
    - Provide file for download on completion
    - Handle generation failures with error message and retry
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 11.6 Write property test for PDF content fidelity
    - **Property 14: PDF content fidelity**
    - Test that generated PDF contains all non-empty pattern fields and instructions match exactly
    - **Validates: Requirements 10.2, 10.6**

- [x] 12. Pricing calculator
  - [x] 12.1 Implement pricing calculation logic
    - Create `src/lib/pricing.ts` with calculatePrice function
    - Formula: material_cost + (total_hours × hourly_rate) + sum(extra_costs) + profit_margin_amount
    - Support profit margin as percentage of subtotal or fixed amount
    - Use project-specific hourly rate if set, otherwise use default rate from user_settings
    - Prompt user to set hourly rate if neither is configured
    - _Requirements: 9.1, 9.3, 9.5, 9.6, 9.8_

  - [ ]* 12.2 Write property test for pricing formula correctness
    - **Property 13: Pricing formula correctness**
    - Test that pricing computation matches the formula for any valid inputs
    - Test that project-specific rate overrides default rate
    - **Validates: Requirements 9.1, 9.3, 9.4, 9.6, 9.8**

  - [x] 12.3 Implement pricing server actions
    - Create `src/lib/actions/pricing.ts` with calculatePrice action and extra costs CRUD
    - Integrate with time_sessions (sum total hours) and yarn_usages (sum material costs)
    - Create Zod schema for pricing extras (description required, amount required)
    - _Requirements: 9.1, 9.6, 9.7_

  - [x] 12.4 Create pricing page and breakdown display
    - Create `src/app/(dashboard)/projects/[id]/pricing/page.tsx`
    - Create `src/components/pricing/PricingBreakdown.tsx` showing material cost, time cost, extras, profit margin, total
    - Implement extra costs management (add/remove with descriptions)
    - Implement profit margin input (percentage or fixed amount toggle)
    - _Requirements: 9.4, 9.7, 9.8_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Input validation and security hardening
  - [x] 14.1 Implement input sanitization layer
    - Create `src/lib/validators/sanitize.ts` with HTML/XSS sanitization for all text inputs
    - Ensure all server actions validate inputs with Zod before database operations
    - Sanitize file names to prevent path traversal
    - _Requirements: 11.4_

  - [ ]* 14.2 Write property test for input sanitization
    - **Property 16: Input sanitization**
    - Test that HTML tags, script elements, and SQL injection patterns are neutralized while preserving safe text
    - **Validates: Requirements 11.4**

  - [x] 14.3 Implement account deletion flow
    - Add account deletion option to settings page
    - Implement cascade deletion of all user data (projects, sessions, counters, yarn, hooks, patterns, photos, notes, pricing)
    - Remove associated storage files
    - _Requirements: 11.5_

- [x] 15. Responsive design and accessibility
  - [x] 15.1 Implement responsive layouts across all pages
    - Ensure usable layout from 320px to 2560px screen widths
    - Implement responsive sidebar (collapsible on mobile)
    - Ensure all forms and lists adapt to screen size
    - _Requirements: 12.1_

  - [x] 15.2 Implement accessibility compliance
    - Add proper ARIA labels to all interactive elements
    - Ensure keyboard navigation works for all features
    - Verify colour contrast meets WCAG 2.1 AA standards
    - Ensure touch targets are minimum 44×44px for counter and timer controls
    - Add screen reader labels to icons and buttons
    - _Requirements: 12.2, 12.4_

  - [x] 15.3 Performance optimization
    - Optimize bundle size with dynamic imports for heavy components (PDF renderer, photo uploader)
    - Implement image optimization for progress photos
    - Target initial page load under 3 seconds
    - _Requirements: 12.3_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major phases
- Property tests use fast-check library and validate universal correctness properties from the design document
- Unit tests use Vitest framework
- The application uses TypeScript throughout with Zod for runtime validation
- All server actions re-validate inputs server-side regardless of client validation
