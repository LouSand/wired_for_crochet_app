# Design: Tax Return & Bookkeeping Upgrade

## Overview

Upgrade the existing SA103 Tax Return Helper to feel closer to professional bookkeeping tools (Xero-like), add MTD readiness, and create an accountant export pack. Remains a preparation tool only — no HMRC submission.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Accounting basis | Cash basis default | Most small self-employed use cash basis; simpler |
| Tax estimates | Show with disclaimers | Helpful but must not be financial advice |
| MTD submission | Placeholder only | Requires HMRC vendor approval (future) |
| Export format | ZIP with PDFs + CSVs | Standard accountant pack format |
| Private-use splits | Percentage field on expenses | Simple, auditable |

## Architecture

### New Database Tables

```
tax_config                    — User tax settings (personal allowance, accounting basis)
expense_tax_adjustments       — Private-use %, disallowable amounts per expense
hmrc_mtd_obligations          — Future: HMRC obligation periods
hmrc_mtd_quarterly_updates    — Quarterly update data
hmrc_mtd_submission_attempts  — Future: submission log
hmrc_mtd_api_connections      — Future: OAuth tokens
hmrc_mtd_thresholds           — Configurable MTD income thresholds
tax_year_checklists           — Year-end checklist completion state
accountant_export_log         — Audit trail for export pack generation
```

### Modified Tables

```
purchases (expenses)          — Add: business_use_percentage, disallowable_amount, tax_notes
```

## Implementation Phases

### Phase A: Enhanced SA103 (Core)
1. Cash basis vs traditional selector
2. Private-use expense handling (percentage splits)
3. Tax estimate dashboard (income tax + NI placeholders)
4. Evidence completeness checker for tax year
5. Updated SA103 calculations with adjustments

### Phase B: Year-End Checklist & UI
1. Guided year-end checklist (10 items)
2. Status cards (Draft → Needs Review → Ready → Exported)
3. Help text tooltips for tax terms
4. Mobile-responsive improvements

### Phase C: MTD Readiness
1. Eligibility checker with configurable thresholds
2. Quarterly update period generation
3. Digital records completeness checker
4. Placeholder tables for future HMRC API
5. Quarterly PDF/CSV export

### Phase D: Accountant Export Pack
1. ZIP generation API route
2. PDF builders (P&L, income summary, expense summary, evidence checklist)
3. CSV builders (income, expenses, customers, suppliers, payments, evidence index, audit log)
4. UI button with progress state
5. Audit logging of exports

## Security

- Only account owner can generate exports
- Export creation logged in audit table
- No private file URLs exposed publicly
- ZIP files generated server-side, served via signed temporary URL
