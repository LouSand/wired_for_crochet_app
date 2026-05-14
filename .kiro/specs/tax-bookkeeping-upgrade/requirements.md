# Requirements: Tax Return & Bookkeeping Upgrade

## 1. Cash Basis vs Traditional Accounting

### 1.1 User can select accounting basis
- Default: Cash basis
- Options: Cash basis, Traditional (accruals)
- Stored per user in tax_config table

### 1.2 Cash basis behaviour
- Income = money actually received during the tax year
- Expenses = money actually paid during the tax year
- Unpaid invoices excluded from turnover
- Clear label showing which basis is active

### 1.3 Traditional accounting behaviour (future)
- Income = invoiced amounts regardless of payment
- Expenses = incurred amounts regardless of payment
- Includes debtors and creditors

---

## 2. Private-Use Expense Handling

### 2.1 Business use percentage
- Each expense can have a business_use_percentage (default 100%)
- Allowable amount = cost × (business_use_percentage / 100)
- Original gross amount preserved for audit

### 2.2 Disallowable amounts
- System calculates disallowable portion automatically
- User can add tax_notes explaining the split
- SA103 uses adjusted (allowable) amounts only

### 2.3 Common splits
- Use of home: typically 10-25% business use
- Phone: typically 50-75% business use
- Car: mileage-based or percentage

---

## 3. Tax Estimate Dashboard

### 3.1 Income tax estimate
- Apply personal allowance (default £12,570)
- Basic rate: 20% on £12,571–£50,270
- Higher rate: 40% on £50,271–£125,140
- Additional rate: 45% above £125,140
- Show estimated tax due

### 3.2 National Insurance estimate
- Class 2: flat rate if profit > £12,570 (£3.45/week for 2024/25)
- Class 4: 6% on profits £12,570–£50,270, 2% above £50,270
- Show estimated NI due

### 3.3 Disclaimers
- "These are estimates only"
- "Not financial advice"
- "Consult an accountant for accurate figures"
- "Does not account for other income sources"

---

## 4. Year-End Checklist

### 4.1 Checklist items
1. All receipts and invoices uploaded
2. Stock/materials on hand valued at year end
3. Mileage log complete and accurate
4. Use of home calculation done
5. Equipment and capital purchases recorded
6. Private-use adjustments applied
7. Trading allowance considered (£1,000 — if expenses < £1,000, may be simpler to use allowance)
8. Bad debts identified and written off
9. Accountant review completed (if using one)
10. Final review — figures ready to enter into HMRC

### 4.2 Behaviour
- Each item: Not Done / Done / Not Applicable
- Progress bar showing completion
- Cannot mark tax year as "Ready" until all applicable items are Done or N/A
- Saved per user per tax year

---

## 5. MTD Readiness

### 5.1 Eligibility
- Based on qualifying income (self-employment + property)
- Thresholds stored in database (configurable):
  - > £50,000: MTD from 6 April 2026
  - > £30,000: MTD from 6 April 2027
  - > £20,000: MTD from 6 April 2028

### 5.2 Quarterly updates
- 4 periods per tax year (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar)
- Each quarter shows: income, expenses, profit
- Deadline: ~1 month after quarter end
- Status tracking per quarter

### 5.3 Digital records
- Every transaction must have: date, amount, category, description
- Evidence recommended but not mandatory for MTD
- Completeness checker shows gaps

---

## 6. Accountant Export Pack

### 6.1 Contents
- SA103 summary PDF
- Profit and loss PDF
- Income summary PDF
- Expense summary by category PDF
- Evidence checklist PDF
- Year-end adjustment notes PDF
- income.csv, expenses.csv, customers.csv, suppliers.csv, payments.csv
- evidence-index.csv, audit-log.csv

### 6.2 ZIP format
- Single downloadable ZIP file
- Named: wired-for-crochet-tax-pack-YYYY-YY.zip
- Generated server-side

### 6.3 Security
- Only account owner can generate
- Export logged in audit table
- No public URLs for evidence files

---

## 7. UI Requirements

### 7.1 Design principles
- Calm, simple, non-overwhelming
- Plain English (no jargon without explanation)
- Large touch targets for mobile
- Clear progress indicators
- Reassuring tone ("You're on track", "Nearly there")

### 7.2 Status system
- Draft: grey, just started
- Needs Review: amber, has warnings
- Ready: green, all checks passed
- Exported: blue, accountant pack generated

### 7.3 Help text
- Expandable "What's this?" beside complex terms
- Examples where helpful
- Links to HMRC guidance where appropriate
