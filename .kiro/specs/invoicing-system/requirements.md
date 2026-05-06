# Requirements Document: Invoicing System

## Introduction

The Invoicing System is a premium module for the "Wired for Crochet" app that provides professional invoicing, quoting, and payment tracking capabilities. It converts the existing RedKiteApp Flask-based invoicing functionality into the Next.js/Supabase architecture. The module enables users to create and manage invoices with staged payments, generate and send quotes, record payments, produce PDF documents, and email documents directly to clients. All invoicing features are gated behind the Pro subscription tier and integrate with the existing customers table and user settings.

## Glossary

- **Invoice_Manager**: The module responsible for creating, editing, viewing, and managing invoices
- **Quote_Manager**: The module responsible for creating, editing, viewing, and managing quotes
- **Payment_Recorder**: The module responsible for recording payments against invoices and updating balances
- **PDF_Generator**: The service that produces downloadable PDF documents for invoices, quotes, and payment receipts
- **Email_Sender**: The service that sends PDF documents to client email addresses and tracks send history
- **Invoice_Record**: A single invoice entry with number, client, dates, line items, totals, status, and stage payment configuration
- **Invoice_Item**: A single line item on an invoice with description, quantity, unit price, and calculated line total
- **Quote_Record**: A single quote entry with number, client, issue date, line items, total, and status
- **Quote_Item**: A single line item on a quote with description, quantity, unit price, and calculated line total
- **Payment_Record**: A single payment entry recording an amount paid against an invoice on a specific date
- **Email_Log**: A record of when a document was emailed, to whom, and how many times it has been sent
- **Stage_Payment**: A payment milestone configuration splitting an invoice total into deposit, stage 2, and final percentages
- **Business_Profile**: The user's business details (company name, address, phone, email, bank details, logo) used on generated documents
- **Tier_Gate**: The access control mechanism that checks a user's subscription tier before allowing access to invoicing features
- **Customer_Record**: An existing customer entry in the customers table with name, email, phone, and address

## Requirements

### Requirement 1: Invoice Creation and Management

**User Story:** As a crochet business owner, I want to create and manage professional invoices for my clients, so that I can bill for my work and track what is owed.

#### Acceptance Criteria

1. WHEN a user creates an Invoice_Record, THE Invoice_Manager SHALL store the client reference, issue date, due date, and one or more Invoice_Items
2. WHEN a user creates an Invoice_Record, THE Invoice_Manager SHALL auto-generate a unique invoice number in the format "INV-001", "INV-002" incrementing sequentially per user
3. THE Invoice_Manager SHALL calculate each Invoice_Item line total as quantity multiplied by unit price
4. THE Invoice_Manager SHALL calculate the Invoice_Record total as the sum of all Invoice_Item line totals
5. THE Invoice_Manager SHALL support the following invoice statuses: draft, unpaid, partial, paid, overdue
6. WHEN a user creates an Invoice_Record, THE Invoice_Manager SHALL set the initial status to "draft"
7. THE Invoice_Manager SHALL allow users to edit Invoice_Records that have status "draft" or "unpaid"
8. THE Invoice_Manager SHALL allow users to delete Invoice_Records that have status "draft"
9. WHEN a user views the invoice list, THE Invoice_Manager SHALL display all invoices with their number, client name, total, amount paid, remaining balance, and status
10. WHEN a user views a single Invoice_Record, THE Invoice_Manager SHALL display all invoice details including line items, stage payment breakdown, payment history, and current balance
11. IF a user attempts to create an Invoice_Record without a client, issue date, due date, or at least one Invoice_Item, THEN THE Invoice_Manager SHALL reject the submission and display a validation error
12. IF a user attempts to create an Invoice_Item without a description, quantity, or unit price, THEN THE Invoice_Manager SHALL reject the submission and display a validation error
13. THE Invoice_Manager SHALL enforce that quantity is a positive integer and unit price is a positive number for each Invoice_Item
14. THE Invoice_Manager SHALL allow optional linking of an Invoice_Record to an existing project

### Requirement 2: Stage Payments

**User Story:** As a crochet business owner, I want to split invoice payments into stages (deposit, second payment, final payment), so that I can manage cash flow across long projects.

#### Acceptance Criteria

1. WHEN a user creates an Invoice_Record, THE Invoice_Manager SHALL allow configuring stage payment percentages for deposit, stage 2, and final payment
2. THE Invoice_Manager SHALL default stage payment percentages to 40% deposit, 40% stage 2, and 20% final payment
3. THE Invoice_Manager SHALL calculate each stage amount as the stage percentage multiplied by the invoice total
4. IF the sum of deposit, stage 2, and final percentages does not equal 100, THEN THE Invoice_Manager SHALL reject the configuration and display a validation error
5. WHEN a user views an Invoice_Record, THE Invoice_Manager SHALL display the stage payment breakdown showing each stage label, percentage, amount, and whether it has been covered by payments received
6. THE Invoice_Manager SHALL determine a stage as "covered" when the cumulative amount paid meets or exceeds the cumulative total of that stage and all preceding stages
7. WHEN all stage payments are covered, THE Invoice_Manager SHALL display the invoice as fully paid

### Requirement 3: Payment Recording

**User Story:** As a crochet business owner, I want to record payments received against invoices, so that I can track how much has been paid and what remains outstanding.

#### Acceptance Criteria

1. WHEN a user records a Payment_Record, THE Payment_Recorder SHALL store the invoice reference, payment amount, and payment date
2. WHEN a Payment_Record is created, THE Payment_Recorder SHALL add the payment amount to the Invoice_Record amount_paid field
3. WHEN a Payment_Record is created and the resulting amount_paid equals the invoice total, THE Payment_Recorder SHALL update the Invoice_Record status to "paid"
4. WHEN a Payment_Record is created and the resulting amount_paid is greater than zero but less than the invoice total, THE Payment_Recorder SHALL update the Invoice_Record status to "partial"
5. THE Payment_Recorder SHALL allow recording multiple Payment_Records against a single Invoice_Record
6. WHEN a user views an Invoice_Record, THE Payment_Recorder SHALL display the payment history ordered by payment date descending
7. IF a user attempts to record a Payment_Record without an amount or payment date, THEN THE Payment_Recorder SHALL reject the submission and display a validation error
8. IF a user attempts to record a Payment_Record with an amount that would cause amount_paid to exceed the invoice total, THEN THE Payment_Recorder SHALL reject the submission and display a validation error
9. THE Payment_Recorder SHALL allow deleting a Payment_Record and recalculate the Invoice_Record amount_paid and status accordingly

### Requirement 4: Quote Creation and Management

**User Story:** As a crochet business owner, I want to create and send quotes to potential clients, so that I can provide pricing before starting work.

#### Acceptance Criteria

1. WHEN a user creates a Quote_Record, THE Quote_Manager SHALL store the client reference, issue date, and one or more Quote_Items
2. WHEN a user creates a Quote_Record, THE Quote_Manager SHALL auto-generate a unique quote number in the format "QTE-001", "QTE-002" incrementing sequentially per user
3. THE Quote_Manager SHALL calculate each Quote_Item line total as quantity multiplied by unit price
4. THE Quote_Manager SHALL calculate the Quote_Record total as the sum of all Quote_Item line totals
5. THE Quote_Manager SHALL support the following quote statuses: draft, sent, accepted, rejected, expired
6. WHEN a user creates a Quote_Record, THE Quote_Manager SHALL set the initial status to "draft"
7. THE Quote_Manager SHALL allow users to edit Quote_Records that have status "draft"
8. THE Quote_Manager SHALL allow users to delete Quote_Records that have status "draft"
9. WHEN a user views the quote list, THE Quote_Manager SHALL display all quotes with their number, client name, total, status, and issue date
10. IF a user attempts to create a Quote_Record without a client, issue date, or at least one Quote_Item, THEN THE Quote_Manager SHALL reject the submission and display a validation error
11. IF a user attempts to create a Quote_Item without a description, quantity, or unit price, THEN THE Quote_Manager SHALL reject the submission and display a validation error
12. THE Quote_Manager SHALL enforce that quantity is a positive integer and unit price is a positive number for each Quote_Item

### Requirement 5: Quote to Invoice Conversion

**User Story:** As a crochet business owner, I want to convert an accepted quote into an invoice, so that I can bill the client without re-entering all the line items.

#### Acceptance Criteria

1. WHEN a user converts a Quote_Record to an invoice, THE Quote_Manager SHALL create a new Invoice_Record with the same client, line items (descriptions, quantities, and prices), and total as the quote
2. WHEN a Quote_Record is converted to an invoice, THE Quote_Manager SHALL set the quote status to "accepted"
3. WHEN a Quote_Record is converted to an invoice, THE Invoice_Manager SHALL set the new invoice issue date to the current date and require the user to provide a due date
4. THE Quote_Manager SHALL only allow conversion of Quote_Records with status "sent" or "draft"
5. WHEN a Quote_Record is converted, THE Invoice_Manager SHALL store a reference linking the new Invoice_Record back to the originating Quote_Record

### Requirement 6: PDF Generation

**User Story:** As a crochet business owner, I want to generate professional PDF documents for invoices, quotes, and payment receipts, so that I can share them with clients.

#### Acceptance Criteria

1. WHEN a user requests an invoice PDF, THE PDF_Generator SHALL produce a PDF containing the business details header, invoice number, client details, issue date, due date, line items table, invoice total, stage payment breakdown, payment history, remaining balance, and bank payment details
2. WHEN a user requests a quote PDF, THE PDF_Generator SHALL produce a PDF containing the business details header, quote number, client details, issue date, line items table, and quote total
3. WHEN a user requests a payment receipt PDF, THE PDF_Generator SHALL produce a PDF containing the business details header, invoice reference, payment date, payment amount, and updated remaining balance
4. THE PDF_Generator SHALL use the user's Business_Profile details (company name, address, phone, email, bank details) in the document header and payment details sections
5. WHERE a user has uploaded a business logo in their Business_Profile, THE PDF_Generator SHALL include the logo in the PDF header
6. THE PDF_Generator SHALL format all monetary values using the user's configured currency from user settings
7. THE PDF_Generator SHALL produce the PDF as a downloadable file accessible via a unique URL

### Requirement 7: Email Delivery

**User Story:** As a crochet business owner, I want to email invoices and quotes directly to my clients, so that I can deliver documents without manual attachment.

#### Acceptance Criteria

1. WHEN a user sends an invoice by email, THE Email_Sender SHALL deliver the invoice PDF as an attachment to the client's email address on file
2. WHEN a user sends a quote by email, THE Email_Sender SHALL deliver the quote PDF as an attachment to the client's email address on file
3. WHEN a document is emailed, THE Email_Sender SHALL create an Email_Log recording the document type, document ID, recipient email, subject line, sender email, timestamp, and send count
4. WHEN a user re-sends a previously emailed document, THE Email_Sender SHALL increment the resend count on the existing Email_Log
5. WHEN a user views an Invoice_Record or Quote_Record, THE Email_Sender SHALL display whether the document has been emailed, when it was last sent, and how many times it has been sent
6. IF the client linked to the document does not have an email address on file, THEN THE Email_Sender SHALL prevent sending and display a message indicating the client email is missing
7. WHEN an invoice is emailed and its status is "draft", THE Invoice_Manager SHALL update the status to "unpaid"
8. WHEN a quote is emailed and its status is "draft", THE Quote_Manager SHALL update the status to "sent"

### Requirement 8: Business Profile Management

**User Story:** As a crochet business owner, I want to store my business details, so that they appear on all generated invoices and quotes.

#### Acceptance Criteria

1. THE Business_Profile SHALL store the following fields: company name, address, phone number, email address, bank account name, bank account number, and bank sort code
2. THE Business_Profile SHALL allow uploading a business logo image in JPEG or PNG format with a maximum file size of 5 MB
3. WHEN a user updates their Business_Profile, THE Business_Profile SHALL persist the changes and use the updated details on all subsequently generated PDFs
4. THE Business_Profile SHALL be stored as part of the user's settings record
5. IF a user has not configured their Business_Profile, THEN THE PDF_Generator SHALL generate PDFs without business header details and display a prompt encouraging the user to complete their profile
6. THE Business_Profile SHALL validate that bank sort code follows the format "XX-XX-XX" where X is a digit

### Requirement 9: Pro Tier Access Control

**User Story:** As a product owner, I want to gate all invoicing features behind the Pro subscription tier, so that the feature is part of the premium offering.

#### Acceptance Criteria

1. WHEN a user with subscription_tier "free" navigates to an invoicing page, THE Tier_Gate SHALL display an upgrade prompt instead of the page content
2. WHEN a user with subscription_tier "pro" navigates to an invoicing page, THE Tier_Gate SHALL render the full page content
3. THE Tier_Gate SHALL enforce access control at both the UI rendering layer and the server action layer for all invoicing operations
4. IF a user with subscription_tier "free" attempts to call an invoicing server action directly, THEN THE Tier_Gate SHALL return an error indicating a Pro subscription is required

### Requirement 10: Integration with Existing Systems

**User Story:** As a crochet business owner, I want invoicing to work with my existing customer data and project records, so that I do not need to re-enter information.

#### Acceptance Criteria

1. THE Invoice_Manager SHALL use the existing customers table as the source of client data for invoices and quotes
2. WHEN a user selects a client for an Invoice_Record or Quote_Record, THE Invoice_Manager SHALL present a searchable list of Customer_Records from the existing customers table
3. THE Invoice_Manager SHALL allow optionally linking an Invoice_Record to an existing project from the projects table
4. THE PDF_Generator SHALL use the currency configured in the user's settings (from the existing user_settings table) for all monetary formatting
5. WHEN a user views a Customer_Record, THE Customer_Database SHALL display all invoices and quotes linked to that customer
6. THE Invoice_Manager SHALL use the user's Business_Profile from user_settings for all document generation without requiring separate configuration per invoice

### Requirement 11: Invoice Status Automation

**User Story:** As a crochet business owner, I want invoice statuses to update automatically based on payments and due dates, so that I always know which invoices need attention.

#### Acceptance Criteria

1. WHEN the current date passes an Invoice_Record due date and the status is "unpaid" or "partial", THE Invoice_Manager SHALL update the status to "overdue"
2. WHEN a payment is recorded against an overdue Invoice_Record that results in full payment, THE Payment_Recorder SHALL update the status to "paid"
3. WHEN a user views the invoice list, THE Invoice_Manager SHALL display overdue invoices with a visual indicator distinguishing them from other statuses
4. THE Invoice_Manager SHALL provide a filtered view showing only overdue invoices
