# Requirements Document

## Introduction

The Crochet Project Tracker is a web application that enables crocheters to manage their projects from start to finish. The app tracks time spent, yarn inventory, hooks used, pattern notes, progress photos, stitch/row counters, pricing calculations, and supports pattern creation with PDF export. The MVP focuses on core project management, time tracking, counters, yarn/hook inventory, photos/notes, pricing, and pattern export. Advanced features like OCR scanning, voice notes, and pattern sharing are deferred to future releases.

The recommended tech stack is React/Next.js for the frontend with Supabase for database, authentication, and file storage.

## Glossary

- **App**: The Crochet Project Tracker web application
- **User**: An authenticated person using the App
- **Project**: A crochet project being tracked, containing metadata, time sessions, counters, linked yarn, hooks, photos, notes, and pricing
- **Time_Session**: A recorded period of work on a Project, with start time, end time, and optional notes
- **Counter**: A named numeric tracker attached to a Project (e.g., rows, stitches, border repeats)
- **Yarn_Entry**: A record in the User's yarn inventory with details such as brand, colour, weight, and quantity
- **Yarn_Usage**: A link between a Yarn_Entry and a Project, tracking quantity consumed
- **Hook_Entry**: A record in the User's hook collection with size, type, brand, and material
- **Hook_Usage**: A link between a Hook_Entry and a Project, with optional notes about which part of the pattern used that hook
- **Pattern**: A crochet pattern document, either uploaded as a file or written within the App
- **Pattern_Export**: A PDF file generated from a Pattern created within the App
- **Pricing_Calculator**: A tool that computes a suggested price for a Project based on materials, time, hourly rate, extras, and profit margin
- **Progress_Photo**: An image uploaded to a Project showing work in progress or the finished item
- **Note**: A written comment or reminder attached to a Project
- **Timer**: A real-time clock mechanism that records elapsed work time on a Project

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to create an account and log in securely, so that my projects and data are private and persistent.

#### Acceptance Criteria

1. THE App SHALL allow users to register with email and password
2. THE App SHALL allow users to log in with valid credentials
3. WHEN a user provides invalid credentials, THE App SHALL display a clear error message without revealing which field is incorrect
4. THE App SHALL require email verification before granting full access
5. WHEN a user is not authenticated, THE App SHALL restrict access to all project data and redirect to the login page
6. THE App SHALL provide a password reset flow via email

---

### Requirement 2: Project Management

**User Story:** As a user, I want to create, edit, and delete crochet projects, so that I can organize and track all my work in one place.

#### Acceptance Criteria

1. WHEN a user submits a valid project form, THE App SHALL create a new Project with the provided name, description, date started, status, and difficulty
2. THE App SHALL support the following project status values: planned, in progress, paused, completed, abandoned
3. THE App SHALL allow the user to edit all Project fields after creation
4. WHEN a user requests deletion of a Project, THE App SHALL prompt for confirmation before permanently removing the Project and all associated data
5. THE App SHALL allow an optional customer name field on a Project
6. THE App SHALL allow one or more final photos to be attached to a completed Project
7. THE App SHALL display a list of all Projects belonging to the authenticated user
8. THE App SHALL allow filtering and sorting of the project list by status, date started, and difficulty

---

### Requirement 3: Time Tracking

**User Story:** As a user, I want to track time spent on each project using a timer, so that I can see how long my projects take and use the data for pricing.

#### Acceptance Criteria

1. WHEN a user starts the timer on a Project, THE App SHALL record the current timestamp as the session start time
2. WHEN a user stops the timer on a Project, THE App SHALL record the current timestamp as the session end time and save the Time_Session
3. THE App SHALL store each Time_Session as a separate record linked to the Project
4. THE App SHALL allow manual editing of start and end times on any Time_Session
5. THE App SHALL display the total accumulated time across all Time_Sessions for a Project
6. THE App SHALL allow an optional text note to be added to each Time_Session
7. WHILE a timer is running on a Project, THE App SHALL display the elapsed time in real-time
8. IF a user attempts to start a timer while another timer is already running on the same Project, THEN THE App SHALL prevent the duplicate timer and notify the user

---

### Requirement 4: Stitch and Row Counters

**User Story:** As a user, I want to add multiple named counters to a project, so that I can track rows, stitches, repeats, and other counts without losing my place.

#### Acceptance Criteria

1. THE App SHALL allow one or more Counters to be added to a Project
2. WHEN a user creates a Counter, THE App SHALL require a name and initial count value
3. THE App SHALL allow an optional target count on each Counter
4. WHEN a user taps increment on a Counter, THE App SHALL increase the current count by one
5. WHEN a user taps decrement on a Counter, THE App SHALL decrease the current count by one, with a minimum value of zero
6. WHEN a user resets a Counter, THE App SHALL set the current count to zero
7. THE App SHALL allow manual editing of the current count value on a Counter
8. WHERE a target count is set, THE App SHALL display progress toward the target (e.g., current/target)

---

### Requirement 5: Yarn Inventory

**User Story:** As a user, I want to maintain a yarn inventory with detailed information, so that I can track what I own and link yarn to projects.

#### Acceptance Criteria

1. THE App SHALL allow the user to create a Yarn_Entry with the following fields: name, brand, colour, shade code, dye lot, weight category, thickness, fibre content, washing instructions, recommended hook size, quantity owned, cost per unit, and an optional photo
2. THE App SHALL allow editing and deletion of Yarn_Entry records
3. THE App SHALL allow a Yarn_Entry to be linked to one or more Projects
4. WHEN a Yarn_Entry is linked to a Project, THE App SHALL record the quantity used for that Project as a Yarn_Usage record
5. THE App SHALL allow editing of the quantity used in a Yarn_Usage record
6. THE App SHALL display the total quantity used across all Projects for each Yarn_Entry
7. THE App SHALL display a list of all Yarn_Entry records belonging to the user with search and filter capabilities

---

### Requirement 6: Hook Tracking

**User Story:** As a user, I want to track my crochet hooks and link them to projects, so that I know which hooks I used and for which parts of a pattern.

#### Acceptance Criteria

1. THE App SHALL allow the user to create a Hook_Entry with the following fields: size, type, brand, and material
2. THE App SHALL allow editing and deletion of Hook_Entry records
3. THE App SHALL allow a Hook_Entry to be linked to one or more Projects
4. WHEN a Hook_Entry is linked to a Project, THE App SHALL allow an optional note describing which part of the pattern used that hook
5. THE App SHALL display a list of all Hook_Entry records belonging to the user

---

### Requirement 7: Pattern Management

**User Story:** As a user, I want to upload pattern files or write patterns within the app, so that I can keep all pattern information organized alongside my projects.

#### Acceptance Criteria

1. THE App SHALL allow uploading pattern files in PDF and image formats (JPEG, PNG)
2. THE App SHALL allow the user to write a Pattern within the App with the following fields: title, introduction, materials list, hook size, yarn, gauge, abbreviations, instructions, and notes
3. THE App SHALL allow a Pattern to be linked to a Project
4. THE App SHALL allow the user to add private alteration notes to a Pattern or Project
5. WHEN a user edits a Pattern written in the App, THE App SHALL save changes and maintain version history of the instructions field
6. THE App SHALL validate that uploaded files do not exceed 20 MB per file
7. IF an upload fails, THEN THE App SHALL display an error message and allow the user to retry

---

### Requirement 8: Photos and Notes

**User Story:** As a user, I want to upload progress photos and add written notes to my projects, so that I can document my progress and remember important details.

#### Acceptance Criteria

1. THE App SHALL allow uploading one or more Progress_Photos to a Project
2. THE App SHALL accept image files in JPEG, PNG, and WEBP formats for Progress_Photos
3. THE App SHALL allow the user to add written Notes to a Project
4. THE App SHALL support a "things to remember next time" note category on a Project
5. THE App SHALL support a "pattern alteration notes" category on a Project
6. THE App SHALL display Progress_Photos in chronological order within a Project
7. THE App SHALL allow deletion of individual Progress_Photos and Notes
8. THE App SHALL validate that uploaded photo files do not exceed 10 MB per file
9. IF a photo upload fails, THEN THE App SHALL display an error message and allow the user to retry

---

### Requirement 9: Pricing Calculator

**User Story:** As a user, I want to calculate a suggested selling price for my projects, so that I can price my work fairly based on materials, time, and desired profit.

#### Acceptance Criteria

1. THE Pricing_Calculator SHALL compute a suggested price using the formula: material cost + (time taken × hourly rate) + extra costs + profit margin
2. THE App SHALL allow the user to set a default hourly rate in their profile settings
3. THE App SHALL allow a Project to override the default hourly rate with a project-specific rate
4. THE Pricing_Calculator SHALL display a clear breakdown showing: material cost, time cost, extra costs, profit margin amount, and total suggested price
5. WHEN the user has not entered an hourly rate (neither default nor project-specific), THE Pricing_Calculator SHALL prompt the user to set one before calculating
6. THE Pricing_Calculator SHALL use the total time from all Time_Sessions on the Project for the time calculation
7. THE App SHALL allow the user to input optional extra costs with descriptions (e.g., shipping, packaging)
8. THE App SHALL allow the user to input a profit margin as a percentage or fixed amount

---

### Requirement 10: Pattern PDF Export

**User Story:** As a user, I want to export patterns I've written in the app as PDF files, so that I can share or print them in a professional format.

#### Acceptance Criteria

1. WHEN a user requests a PDF export of a Pattern written in the App, THE App SHALL generate a PDF document
2. THE Pattern_Export SHALL include: title, materials list, hook size, gauge, abbreviations, instructions, and any attached photos
3. THE Pattern_Export SHALL format the content in a readable, structured layout
4. WHEN the PDF generation is complete, THE App SHALL provide the file for download
5. IF PDF generation fails, THEN THE App SHALL display an error message and allow the user to retry
6. THE Pattern_Export SHALL render the Pattern content faithfully without altering the user's written instructions

---

### Requirement 11: Data Privacy and Security

**User Story:** As a user, I want my data to be secure and private, so that only I can access my projects, inventory, and personal information.

#### Acceptance Criteria

1. THE App SHALL enforce row-level security so that users can only access their own data
2. THE App SHALL store passwords using a secure hashing algorithm (handled by Supabase Auth)
3. THE App SHALL serve all pages over HTTPS
4. THE App SHALL validate and sanitize all user inputs on both client and server side
5. WHEN a user deletes their account, THE App SHALL permanently remove all associated data within 30 days
6. THE App SHALL restrict file uploads to allowed MIME types and enforce size limits
7. THE App SHALL generate signed URLs with expiration for accessing uploaded files

---

### Requirement 12: Responsive User Interface

**User Story:** As a user, I want the app to work well on both desktop and mobile devices, so that I can track my projects while crocheting on the couch or at my desk.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on screen widths from 320px to 2560px
2. THE App SHALL provide touch-friendly tap targets (minimum 44×44px) for counter increment/decrement and timer controls
3. THE App SHALL load the initial page content within 3 seconds on a standard broadband connection
4. THE App SHALL maintain accessibility compliance with WCAG 2.1 Level AA for colour contrast, keyboard navigation, and screen reader labels
