# Implementation Plan: Project, Pattern & Hooks Enhancements

## Overview

This plan implements enhancements to the Wired for Crochet app across multiple feature areas: project-pattern linking, completion tracking, per-project currency, bulk pattern upload, hook compatibility metadata, hook recommendations, and a pattern upload bug fix. Tasks are ordered to build incrementally: database migration first, then types/validators, then the high-priority upload fix, followed by each feature area with UI components wired in at the end.

## Tasks

- [x] 1. Database migration and schema updates
  - [x] 1.1 Create the SQL migration file adding `currency` column to projects and `yarn_types`/`pattern_types` JSONB columns to hook_entries
    - Create `supabase/migrations/<timestamp>_project_pattern_hooks_enhancements.sql`
    - Add `currency varchar(3) NOT NULL DEFAULT 'USD'` to projects table
    - Add `yarn_types jsonb DEFAULT '[]'::jsonb` to hook_entries table
    - Add `pattern_types jsonb DEFAULT '[]'::jsonb` to hook_entries table
    - Create GIN indexes: `idx_hook_entries_yarn_types` and `idx_hook_entries_pattern_types`
    - _Requirements: 4.6, 6.7_

  - [x] 1.2 Update TypeScript types in `src/types/database.ts`
    - Add `currency: string` to projects Row type
    - Add `currency?: string` to projects Insert and Update types
    - Add `yarn_types: string[] | null` and `pattern_types: string[] | null` to hook_entries Row type
    - Add optional `yarn_types` and `pattern_types` to hook_entries Insert and Update types
    - _Requirements: 4.2, 6.3, 6.4_

  - [x] 1.3 Update Zod validators for projects and hooks
    - Add `SUPPORTED_CURRENCIES` constant and `currency` field to `projectFormSchema` in `src/lib/validators/project.ts`
    - Add `YARN_TYPE_OPTIONS`, `PATTERN_TYPE_OPTIONS` constants and `yarn_types`/`pattern_types` array fields to `hookFormSchema` in `src/lib/validators/hook.ts`
    - Update `hookUpdateSchema` to include the new fields
    - _Requirements: 4.1, 4.3, 6.1, 6.2_

- [x] 2. Fix pattern file upload (high priority)
  - [x] 2.1 Create Supabase Storage policy migration for the `pattern-files` bucket
    - Create `supabase/migrations/<timestamp>_fix_pattern_files_storage.sql`
    - Add INSERT policy: users can upload to their own `user_id/` prefix folder
    - Add SELECT policy: users can read their own files
    - Add DELETE policy: users can delete their own files
    - Ensure bucket is set to non-public with authenticated access
    - _Requirements: 8.1, 8.4_

  - [x] 2.2 Create file validation utility at `src/lib/file-validation.ts`
    - Implement `validatePatternFile(file: { size: number; type: string })` returning `{ valid: boolean; error?: string }`
    - Max size: 20 MB (20,971,520 bytes)
    - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
    - Export constants `MAX_FILE_SIZE` and `ALLOWED_MIME_TYPES`
    - _Requirements: 8.6, 8.7_

  - [x] 2.3 Update the pattern creation page (`src/app/(dashboard)/patterns/new/page.tsx`) to use correct upload flow
    - Upload file to `pattern-files/{user_id}/{uuid}_{filename}` path
    - Validate file client-side before upload using `validatePatternFile`
    - On success, store `file_path` and `file_name` in the pattern record
    - Generate signed URL for preview/download link after upload
    - Display descriptive error messages for storage failures (file too large, permission denied, network error)
    - _Requirements: 8.2, 8.3, 8.5, 8.6, 8.8, 8.9_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Per-project currency support
  - [x] 4.1 Create currency utility at `src/lib/currency.ts`
    - Implement `formatCurrency(amount: number, currencyCode: string): string`
    - Define `CURRENCY_SYMBOLS` map for USD, GBP, EUR, AUD, CAD, NZD
    - Fallback to currency code if symbol not found
    - _Requirements: 4.4_

  - [ ]* 4.2 Write property test for currency formatting
    - **Property 7: Currency formatting correctness**
    - Test that `formatCurrency` produces string starting with correct symbol and amount to 2 decimal places
    - **Validates: Requirements 4.4**

  - [x] 4.3 Create `CurrencySelector` component at `src/components/projects/CurrencySelector.tsx`
    - Dropdown with options: USD, GBP, EUR, AUD, CAD, NZD
    - Accept `value` and `onChange` props
    - Default selection is USD
    - _Requirements: 4.1, 4.3_

  - [x] 4.4 Update `createProject` and `updateProject` server actions to handle `currency` field
    - Extract `currency` from FormData in `src/lib/actions/projects.ts`
    - Include in insert/update payloads
    - _Requirements: 4.2, 4.5_

  - [x] 4.5 Update `PricingBreakdown` component to accept and use currency prop
    - Modify `src/components/pricing/PricingBreakdown.tsx` to accept `currency` prop
    - Use `formatCurrency` for all monetary amount displays
    - Update `src/app/(dashboard)/projects/[id]/pricing/page.tsx` to pass project currency
    - _Requirements: 4.4_

  - [ ]* 4.6 Write property test for currency persistence round-trip
    - **Property 6: Currency persistence round-trip**
    - Test that saving any supported currency code and reading back returns the same code; default is USD
    - **Validates: Requirements 4.2, 4.3**

- [x] 5. Project-pattern linking
  - [x] 5.1 Create `PatternSelector` component at `src/components/projects/PatternSelector.tsx`
    - Searchable dropdown listing user's patterns (fetched via `getPatterns()`)
    - Include a "Create new pattern" option that triggers inline form
    - Support clearing the selection (deselect)
    - Filter patterns by title as user types
    - _Requirements: 1.1, 1.3, 1.5_

  - [ ]* 5.2 Write property test for pattern search filtering
    - **Property 2: Pattern search filtering**
    - Test that filtering by query returns only patterns whose title contains the query (case-insensitive)
    - **Validates: Requirements 1.5**

  - [x] 5.3 Create `InlinePatternForm` component at `src/components/projects/InlinePatternForm.tsx`
    - Collapsible form with fields: title, type, introduction, materials_list, hook_size, yarn_info, gauge, abbreviations, instructions, notes
    - Use same validation rules as `patternFormSchema`
    - On submit, call `createInlinePattern` server action
    - _Requirements: 2.1, 2.2, 2.6_

  - [x] 5.4 Implement `createInlinePattern` server action in `src/lib/actions/patterns.ts`
    - Validate using `patternFormSchema`
    - Create pattern record and return `patternId` on success
    - Handle partial failure: if pattern creates but project save fails, retain pattern and inform user
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 5.5 Write property test for inline pattern validator consistency
    - **Property 3: Inline pattern validator consistency**
    - Test that inline validation produces same accept/reject as standalone `patternFormSchema`
    - **Validates: Requirements 2.6**

  - [x] 5.6 Integrate PatternSelector and InlinePatternForm into project create/edit pages
    - Update `src/app/(dashboard)/projects/new/page.tsx` to include PatternSelector
    - Update project edit form to include PatternSelector with current pattern pre-selected
    - Wire inline pattern creation: create pattern first, then save project with new pattern_id
    - _Requirements: 1.2, 2.3_

  - [x] 5.7 Display linked pattern on project detail page
    - Update `src/app/(dashboard)/projects/[id]/ProjectDetailClient.tsx` to show pattern title and link to pattern detail
    - _Requirements: 1.4_

  - [ ]* 5.8 Write property test for pattern linking round-trip
    - **Property 1: Pattern linking round-trip**
    - Test that creating/updating a project with a pattern_id and reading back returns the same pattern_id
    - **Validates: Requirements 1.2, 2.3**

- [x] 6. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Project completion tracking
  - [x] 7.1 Create `MarkAsFinishedToggle` component at `src/components/projects/MarkAsFinishedToggle.tsx`
    - Toggle/checkbox that sets project status to "completed"
    - When activated, show date picker for `date_completed` (default: today)
    - When deactivated, revert status to previous value and clear `date_completed`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 7.2 Update `createProject` and `updateProject` to handle mark-as-finished logic
    - When `mark_as_finished` is true: set status to "completed", default date_completed to today if not provided
    - When `mark_as_finished` is false: revert status, set date_completed to null
    - Persist date_completed in existing column
    - _Requirements: 3.2, 3.4, 3.6, 3.7_

  - [x] 7.3 Integrate MarkAsFinishedToggle into project create/edit pages
    - Add toggle to `src/app/(dashboard)/projects/new/page.tsx`
    - Add toggle to project edit form
    - _Requirements: 3.1_

  - [ ]* 7.4 Write property tests for mark-as-finished logic
    - **Property 4: Mark-as-finished sets completed status**
    - **Property 5: Mark-as-finished toggle off reverts status**
    - **Validates: Requirements 3.2, 3.4, 3.6**

- [ ] 8. Hook compatibility metadata
  - [x] 8.1 Create `HookCompatibilityFields` component at `src/components/hooks/HookCompatibilityFields.tsx`
    - Multi-select for yarn types: cotton, acrylic, chunky, wool, bamboo, silk, polyester + custom text input
    - Multi-select for pattern types: amigurumi, blankets, garments, lace, accessories, home decor + custom text input
    - Accept `yarnTypes` and `patternTypes` props for edit mode
    - _Requirements: 6.1, 6.2_

  - [x] 8.2 Update `createHookEntry` and `updateHookEntry` server actions to handle `yarn_types` and `pattern_types`
    - Extract JSONB array data from FormData in `src/lib/actions/hooks.ts`
    - Include in insert/update payloads
    - _Requirements: 6.3, 6.4, 6.6_

  - [x] 8.3 Integrate HookCompatibilityFields into hook create/edit pages
    - Update `src/app/(dashboard)/hooks/new/page.tsx` to include HookCompatibilityFields
    - Update `src/app/(dashboard)/hooks/[id]/edit/HookEditForm.tsx` to include HookCompatibilityFields with existing values
    - _Requirements: 6.1, 6.2, 6.6_

  - [x] 8.4 Display compatibility metadata on hook detail page
    - Update `src/app/(dashboard)/hooks/[id]/HookDetailClient.tsx` to show yarn_types and pattern_types as badges/tags
    - _Requirements: 6.5_

  - [ ]* 8.5 Write property test for hook compatibility data round-trip
    - **Property 11: Hook compatibility data round-trip**
    - Test that saving yarn_types/pattern_types arrays and reading back returns same elements in same order
    - **Validates: Requirements 6.3, 6.4**

- [ ] 9. Hook recommendation suggestions
  - [x] 9.1 Implement `getHookRecommendations` server action in `src/lib/actions/hooks.ts`
    - Accept `{ yarnTypes?: string[], patternTypes?: string[] }` options
    - Query hook_entries using JSONB containment (`cs` filter) for matching yarn_types or pattern_types
    - Return matching hook entries or empty array
    - _Requirements: 7.1, 7.5_

  - [x] 9.2 Create `HookRecommendations` component at `src/components/hooks/HookRecommendations.tsx`
    - Display suggestion list showing hook size, brand, and material
    - Non-blocking: hide section entirely if no matches found
    - Trigger query when user selects yarn type or pattern type in project form
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 9.3 Integrate HookRecommendations into project create/edit pages
    - Add HookRecommendations to `src/app/(dashboard)/projects/new/page.tsx`
    - Wire to yarn type and pattern type selections from the form
    - _Requirements: 7.1_

  - [ ]* 9.4 Write property test for hook recommendation query correctness
    - **Property 12: Hook recommendation query correctness**
    - Test that results include exactly hooks with matching yarn_types OR pattern_types elements
    - **Validates: Requirements 7.1**

- [x] 10. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Bulk pattern upload
  - [x] 11.1 Create filename-to-title utility at `src/lib/filename-title.ts`
    - Implement `deriveTitleFromFilename(filename: string): string`
    - Remove last extension (including dot) from filename
    - If no dot in filename, return full filename
    - _Requirements: 5.4_

  - [ ]* 11.2 Write property test for title derivation from filename
    - **Property 9: Title derivation from filename**
    - Test that filenames with dots have last extension removed; filenames without dots return unchanged
    - **Validates: Requirements 5.4**

  - [x] 11.3 Create batch summary utility at `src/lib/batch-summary.ts`
    - Implement `computeBatchSummary(results: Array<{ success: boolean }>): { total: number; successes: number; failures: number }`
    - Ensure successes + failures === total
    - _Requirements: 5.10_

  - [ ]* 11.4 Write property test for batch upload summary counts
    - **Property 10: Batch upload summary counts**
    - Test that S successes + F failures === N total for any batch of results
    - **Validates: Requirements 5.10**

  - [x] 11.5 Implement `bulkUploadPatterns` server action in `src/lib/actions/patterns.ts`
    - Accept array of file metadata (name, path, size, mimeType)
    - For each file: create pattern record with `type: 'uploaded'`, derive title from filename, store file_path and file_name
    - Return per-file results with success/failure status
    - Continue processing remaining files if one fails
    - _Requirements: 5.3, 5.4, 5.7_

  - [x] 11.6 Create `BulkPatternUploader` component at `src/components/patterns/BulkPatternUploader.tsx`
    - Multi-file picker accepting PDF, JPEG, PNG
    - Client-side validation per file (size ≤ 20MB, allowed MIME type) using `validatePatternFile`
    - Parallel upload to `pattern-files/{user_id}/{uuid}_{filename}`
    - Display per-file progress/status indicators (success/error)
    - Show batch summary on completion (X succeeded, Y failed)
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 11.7 Write property test for file validation rules
    - **Property 8: File validation rules**
    - Test that files are accepted iff size ≤ 20MB AND MIME type is allowed
    - **Validates: Requirements 5.2, 5.8, 5.9, 8.6, 8.7**

  - [x] 11.8 Integrate BulkPatternUploader into patterns page
    - Add BulkPatternUploader to `src/app/(dashboard)/patterns/page.tsx`
    - Revalidate pattern list after successful uploads
    - _Requirements: 5.1_

  - [ ]* 11.9 Write property test for pattern file metadata persistence
    - **Property 13: Pattern file metadata persistence**
    - Test that uploaded file's file_path and file_name are retrievable on subsequent reads
    - **Validates: Requirements 8.3**

- [x] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The migration in task 1.1 should be run against the Supabase instance before testing tasks that depend on new columns
- Task 2 (pattern upload fix) is prioritized as high-priority per requirements
