# Tasks: Tax Return & Bookkeeping Upgrade

## Phase A: Enhanced SA103 Core

### A1: Database migration — tax config and expense adjustments
- [ ] Create `tax_config` table (user_id, accounting_basis, personal_allowance, tax_year_settings)
- [ ] Create `expense_tax_adjustments` table (expense_id, business_use_percentage, disallowable_amount, tax_notes)
- [ ] Add `business_use_percentage` column to `purchases` table
- [ ] Create `hmrc_mtd_thresholds` table (threshold_amount, start_date, description)
- [ ] Seed MTD thresholds (£50k from Apr 2026, £30k from Apr 2027, £20k from Apr 2028)
- **Status:** Not started

### A2: TypeScript types
- [ ] Add TaxConfig type
- [ ] Add ExpenseTaxAdjustment type
- [ ] Add MTDThreshold type
- [ ] Add QuarterlyUpdate type
- [ ] Add TaxEstimate type (income tax bands, NI rates)
- **Status:** Not started

### A3: Cash basis vs traditional accounting
- [ ] Add accounting basis selector to tax config
- [ ] Update tax-summary.ts to respect cash basis (only count received payments)
- [ ] Show clear label on SA103 page: "Cash Basis" or "Traditional Accounting"
- [ ] Explain difference in help text
- **Status:** Not started

### A4: Private-use expense handling
- [ ] Add business_use_percentage field to expense form
- [ ] Calculate adjusted allowable amount (cost × business_use_percentage / 100)
- [ ] Show original gross amount and adjusted amount in SA103
- [ ] Update tax-summary.ts to use adjusted amounts
- **Status:** Not started

### A5: Tax estimate dashboard
- [ ] Create tax estimate calculation (taxable profit → income tax bands → NI)
- [ ] Show estimated income tax (basic rate 20%, higher rate 40%)
- [ ] Show estimated Class 2 and Class 4 NI
- [ ] Add personal allowance (default £12,570, configurable)
- [ ] Add clear disclaimer: "Estimates only — not financial advice"
- **Status:** Not started

### A6: Evidence completeness for tax year
- [ ] Count expenses with/without receipts for the tax year
- [ ] Count income with/without linked invoices
- [ ] Show percentage complete
- [ ] List items missing evidence
- [ ] Flag unusual values compared to category averages
- **Status:** Not started

---

## Phase B: Year-End Checklist & UI

### B1: Year-end checklist
- [ ] Create `tax_year_checklists` table (user_id, tax_year, checklist_data jsonb)
- [ ] Define 10 checklist items:
  1. All receipts uploaded
  2. Stock/materials on hand valued
  3. Mileage log complete
  4. Use of home calculated
  5. Equipment/capital purchases recorded
  6. Private-use adjustments made
  7. Trading allowance considered (£1,000)
  8. Bad debts written off
  9. Accountant review (if applicable)
  10. Final review — ready to submit to HMRC
- [ ] Save checklist state per tax year
- [ ] Show progress bar
- **Status:** Not started

### B2: Status cards
- [ ] Add tax year status: Draft → Needs Review → Ready → Exported
- [ ] Show status prominently on tax return page
- [ ] Allow user to advance status
- [ ] Lock editing when status is "Exported"
- **Status:** Not started

### B3: Help text and UI polish
- [ ] Add expandable help text for each SA103 box
- [ ] Plain English explanations of tax terms
- [ ] Mobile-responsive layout improvements
- [ ] Calm, reassuring design language
- **Status:** Not started

---

## Phase C: MTD Readiness

### C1: MTD eligibility checker
- [ ] Create UI at /business/tax-return/mtd-readiness
- [ ] Ask/store annual qualifying income
- [ ] Compare against configurable thresholds
- [ ] Show likely MTD start date
- [ ] Show current status: "Not yet required" / "Required from [date]"
- **Status:** Not started

### C2: Quarterly update preparation
- [ ] Generate 4 quarterly periods for selected tax year
- [ ] Show period dates and estimated submission deadlines
- [ ] Calculate income and expenses per quarter
- [ ] Status per quarter: Not Started → Draft → Ready → Submitted Manually → Locked
- **Status:** Not started

### C3: Digital records completeness
- [ ] Check every record has: date, amount, category, description
- [ ] Check evidence where applicable
- [ ] Show missing data checklist per quarter
- [ ] Show overall completeness percentage
- **Status:** Not started

### C4: Future HMRC API placeholders
- [ ] Create placeholder tables (hmrc_mtd_obligations, etc.)
- [ ] Add TODO comments for future API integration points
- [ ] Create placeholder server actions with clear documentation
- [ ] No actual HMRC connection
- **Status:** Not started

### C5: Quarterly export
- [ ] PDF export per quarter (income, expenses, totals, warnings)
- [ ] CSV export per quarter
- [ ] Evidence index per quarter
- **Status:** Not started

---

## Phase D: Accountant Export Pack

### D1: ZIP generation API route
- [ ] Create /api/accountant-pack/[year]/route.ts
- [ ] Generate ZIP file server-side
- [ ] Name format: wired-for-crochet-tax-pack-YYYY-YY.zip
- [ ] Return as downloadable response
- **Status:** Not started

### D2: PDF builders
- [ ] SA103 summary PDF (already exists — reuse)
- [ ] Profit and loss report PDF
- [ ] Income summary PDF
- [ ] Expense summary by category PDF
- [ ] Evidence checklist PDF
- [ ] Year-end adjustment notes PDF
- **Status:** Not started

### D3: CSV builders
- [ ] income.csv (date, source, amount, invoice ref, payment method)
- [ ] expenses.csv (date, description, category, amount, supplier, business_use_%, adjusted_amount)
- [ ] customers.csv (name, email, phone, address)
- [ ] suppliers.csv (name, email, phone, website)
- [ ] payments.csv (date, amount, method, invoice ref, customer)
- [ ] evidence-index.csv (file name, linked transaction, date, category, amount, evidence_present)
- [ ] audit-log.csv (timestamp, action, entity, details)
- **Status:** Not started

### D4: UI and audit
- [ ] "Create Accountant Pack" button on tax return page
- [ ] Progress indicator during generation
- [ ] Create `accountant_export_log` table
- [ ] Log every export with timestamp and tax year
- [ ] Show export history
- **Status:** Not started

---

## Dependencies

- Phase A must be done before Phase B (checklist references adjustments)
- Phase C can run in parallel with Phase B
- Phase D depends on Phase A (needs adjusted calculations) and Phase B (needs checklist data)

## Estimated Effort

| Phase | Complexity | Estimated Time |
|-------|-----------|---------------|
| A | High | 2-3 sessions |
| B | Medium | 1-2 sessions |
| C | Medium | 1-2 sessions |
| D | High | 2-3 sessions |
