# Requirements Document

## Introduction

This document specifies enhancements to the existing "Wired for Crochet" application. The enhancements improve the project-pattern linking workflow, add project completion tracking, introduce per-project currency support, enable bulk pattern uploads, extend hook entries with yarn/pattern type compatibility metadata for future recommendations, and fix the existing pattern upload functionality. These changes build on the existing database schema (which already has `pattern_id`, `date_completed`, and `status` fields on the projects table) and extend it where needed.

## Glossary

- **App**: The Wired for Crochet web application
- **User**: An authenticated person using the App
- **Project**: A crochet project being tracked, containing metadata, time sessions, counters, linked yarn, hooks, photos, notes, and pricing
- **Pattern**: A crochet pattern document, either uploaded as a file or written within the App
- **Pattern_Library**: The collection of all Pattern records belonging to a User
- **Hook_Entry**: A record in the User's hook collection with size, type, brand, material, and compatibility metadata
- **Hook_Compatibility**: Structured data on a Hook_Entry describing which yarn types and pattern types the hook works well with
- **Project_Form**: The create/edit form for a Project
- **Upload_Session**: A single batch operation where one or more pattern files are uploaded simultaneously
- **Currency**: A three-letter ISO 4217 currency code (e.g., USD, GBP, EUR, AUD) stored on a Project for pricing display
- **Supabase_Storage**: The file storage service used for pattern files and photos
- **Storage_Policy**: Row-level security and bucket access rules configured in Supabase Storage

## Requirements

### Requirement 1: Link Project to Existing Pattern

**User Story:** As a user, I want to link an existing pattern from my library to a project, so that I can see which pattern I am following for each project.

#### Acceptance Criteria

1. WHEN a user creates or edits a Project, THE Project_Form SHALL display a pattern selection field listing all patterns in the User's Pattern_Library
2. WHEN a user selects a pattern from the list, THE App SHALL store the selected pattern's ID in the Project's pattern_id field
3. THE App SHALL allow the user to clear the pattern link by deselecting the pattern
4. WHEN a Project has a linked Pattern, THE App SHALL display the Pattern title and a link to the Pattern detail page on the Project detail view
5. THE App SHALL allow searching or filtering the pattern selection list by pattern title

---

### Requirement 2: Create Pattern from Project Form

**User Story:** As a user, I want to create a new pattern directly from the project form, so that I can quickly set up a pattern without navigating away from project creation.

#### Acceptance Criteria

1. WHEN a user is creating or editing a Project, THE Project_Form SHALL provide an option to create a new Pattern inline
2. WHEN the user selects the inline pattern creation option, THE Project_Form SHALL display pattern fields: title, type, introduction, materials list, hook size, yarn info, gauge, abbreviations, instructions, and notes
3. WHEN the user saves the Project with inline pattern data, THE App SHALL first create the Pattern record in the patterns table, then link the new Pattern to the Project via pattern_id
4. IF the Pattern creation fails, THEN THE App SHALL display an error message and not save the Project
5. IF the Project save fails after Pattern creation succeeds, THEN THE App SHALL retain the created Pattern in the Pattern_Library and inform the user
6. THE App SHALL validate all inline pattern fields using the same validation rules as the standalone pattern creation form

---

### Requirement 3: Project Completion Tracking

**User Story:** As a user, I want to mark a project as finished with a completion date, so that I can track when I completed each project.

#### Acceptance Criteria

1. THE Project_Form SHALL display a "Mark as finished" toggle or checkbox
2. WHEN the user activates the "Mark as finished" toggle, THE App SHALL set the Project status to "completed"
3. WHEN the user activates the "Mark as finished" toggle, THE Project_Form SHALL display a "Date finished" date input field
4. WHEN the user marks a Project as finished without providing a date, THE App SHALL default the date_completed field to the current date
5. THE App SHALL allow the user to edit the date_completed field after the Project is marked as finished
6. WHEN the user deactivates the "Mark as finished" toggle, THE App SHALL revert the Project status to its previous value and clear the date_completed field
7. THE App SHALL persist the date_completed value in the existing date_completed column on the projects table

---

### Requirement 4: Per-Project Currency Support

**User Story:** As a user, I want to select a currency for each project, so that pricing calculations display amounts in the correct currency for my customers.

#### Acceptance Criteria

1. THE Project_Form SHALL display a currency selection field with common currency options (USD, GBP, EUR, AUD, CAD, NZD)
2. THE App SHALL store the selected currency code on the Project record in a currency column
3. WHEN no currency is selected, THE App SHALL default to USD
4. WHEN a Project has a currency set, THE Pricing_Calculator SHALL display all monetary amounts with the correct currency symbol
5. THE App SHALL allow the user to change the currency on an existing Project
6. THE App SHALL add a currency column of type varchar(3) to the projects table via a database migration

---

### Requirement 5: Bulk Pattern Upload

**User Story:** As a user, I want to upload multiple pattern files at once, so that I can quickly add my pattern collection to the library without uploading one at a time.

#### Acceptance Criteria

1. THE App SHALL allow the user to select multiple files in a single file picker interaction on the patterns page
2. THE App SHALL accept PDF and image files (JPEG, PNG) for bulk pattern upload
3. WHEN multiple files are selected, THE App SHALL upload each file to Supabase_Storage and create a corresponding Pattern record in the patterns table with type set to "uploaded"
4. THE App SHALL derive the Pattern title from the file name (without extension) for each uploaded file
5. WHILE an Upload_Session is in progress, THE App SHALL display upload progress for the overall batch
6. WHEN an individual file upload succeeds, THE App SHALL display a success indicator for that file
7. IF an individual file upload fails, THEN THE App SHALL display an error indicator for that file and continue uploading remaining files
8. THE App SHALL validate that each file does not exceed 20 MB before uploading
9. THE App SHALL validate that each file has an allowed MIME type (application/pdf, image/jpeg, image/png) before uploading
10. WHEN all uploads in a batch complete, THE App SHALL display a summary showing the count of successful and failed uploads

---

### Requirement 6: Hook Compatibility Metadata

**User Story:** As a user, I want to record which yarn types and pattern types work well with each hook, so that I can get recommendations when starting new projects.

#### Acceptance Criteria

1. THE Hook_Entry form SHALL display a "Works great with yarn type" multi-select field with options including: cotton, acrylic, chunky, wool, bamboo, silk, polyester, and a custom text input option
2. THE Hook_Entry form SHALL display a "Works great with pattern type" multi-select field with options including: amigurumi, blankets, garments, lace, accessories, home decor, and a custom text input option
3. THE App SHALL store yarn type compatibility as a JSON array in a yarn_types column on the hook_entries table
4. THE App SHALL store pattern type compatibility as a JSON array in a pattern_types column on the hook_entries table
5. WHEN viewing a Hook_Entry detail page, THE App SHALL display the associated yarn types and pattern types as tags or badges
6. THE App SHALL allow editing of yarn type and pattern type selections on existing Hook_Entry records
7. THE App SHALL add yarn_types and pattern_types columns of type jsonb to the hook_entries table via a database migration

---

### Requirement 7: Hook Recommendation Suggestions

**User Story:** As a user, I want to receive hook suggestions when creating a project or selecting yarn, so that I can choose the best hook for my materials and pattern type.

#### Acceptance Criteria

1. WHEN a user is creating or editing a Project and has selected a yarn type or pattern type, THE App SHALL query Hook_Entry records whose yarn_types or pattern_types arrays contain matching values
2. WHEN matching hooks are found, THE App SHALL display a suggestion list showing hook size, brand, and material
3. IF no matching hooks are found, THEN THE App SHALL not display the suggestion section
4. THE App SHALL make hook suggestions non-blocking, allowing the user to ignore suggestions and proceed
5. THE App SHALL design the hook_entries schema so that yarn_types and pattern_types columns support efficient array containment queries

---

### Requirement 8: Fix Pattern File Upload

**User Story:** As a user, I want pattern file uploads to work reliably, so that I can store my pattern PDFs and images in the app without errors.

#### Acceptance Criteria

1. THE App SHALL verify that the Supabase_Storage bucket "pattern-files" exists and is configured with correct access policies
2. WHEN a user uploads a pattern file, THE App SHALL upload the file to the "pattern-files" bucket using the authenticated user's session
3. THE App SHALL store the resulting file path and original file name in the Pattern record's file_path and file_name columns
4. THE App SHALL enforce Storage_Policy rules that allow authenticated users to upload to their own folder (user_id prefix) and read their own files
5. IF a file upload fails due to a storage error, THEN THE App SHALL display a descriptive error message indicating the failure reason (e.g., file too large, permission denied, network error)
6. THE App SHALL validate file size (maximum 20 MB) and MIME type (application/pdf, image/jpeg, image/png) on the client side before initiating the upload
7. THE App SHALL validate file size and MIME type on the server side as a secondary check
8. WHEN a pattern file is successfully uploaded, THE App SHALL generate a signed URL for viewing the file and display a confirmation with a preview or download link
9. IF the storage bucket does not exist or policies are misconfigured, THEN THE App SHALL log a descriptive server-side error and display a user-friendly message indicating the upload service is temporarily unavailable

