import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTaxSummary } from '@/lib/actions/tax-summary'

/**
 * GET /api/accountant-pack/[year]
 * Generates a ZIP file containing all documents an accountant needs.
 * Includes: CSVs (income, expenses, customers, suppliers, payments, evidence index, audit log)
 *
 * Note: PDFs are generated separately via /api/tax-report/[year].
 * This route generates the CSV pack as a single downloadable file.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params
  const taxYear = parseInt(year)
  if (isNaN(taxYear)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const taxYearStart = `${taxYear - 1}-04-06`
  const taxYearEnd = `${taxYear}-04-05`

  // Generate SA103 summary
  const { data: summary } = await generateTaxSummary(taxYear)

  // Fetch all data for CSVs
  const [
    { data: expenses },
    { data: invoices },
    { data: customers },
    { data: suppliers },
    { data: payments },
  ] = await Promise.all([
    supabase.from('purchases').select('*').eq('user_id', user.id).gte('purchase_date', taxYearStart).lte('purchase_date', taxYearEnd).order('purchase_date'),
    supabase.from('invoices').select('*, invoice_items(*)').eq('user_id', user.id).gte('issue_date', taxYearStart).lte('issue_date', taxYearEnd).order('issue_date'),
    supabase.from('customers').select('*').eq('user_id', user.id).order('name'),
    supabase.from('suppliers').select('*').eq('user_id', user.id).order('name'),
    supabase.from('payments').select('*, invoices(invoice_number, customers(name))').eq('user_id', user.id).gte('payment_date', taxYearStart).lte('payment_date', taxYearEnd).order('payment_date'),
  ])

  // Build CSVs
  const csvFiles: Array<{ name: string; content: string }> = []

  // Income CSV
  const incomeRows = (payments ?? []) as Array<Record<string, unknown>>
  csvFiles.push({
    name: 'income.csv',
    content: buildCSV(
      ['Date', 'Amount', 'Payment Method', 'Invoice Ref', 'Customer'],
      incomeRows.map((p: Record<string, unknown>) => [
        String(p.payment_date ?? ''),
        String(p.amount ?? ''),
        String(p.payment_method ?? ''),
        String((p.invoices as Record<string, unknown>)?.invoice_number ?? ''),
        String(((p.invoices as Record<string, unknown>)?.customers as Record<string, unknown>)?.name ?? ''),
      ])
    ),
  })

  // Expenses CSV
  const expenseRows = (expenses ?? []) as Array<Record<string, unknown>>
  csvFiles.push({
    name: 'expenses.csv',
    content: buildCSV(
      ['Date', 'Description', 'Category', 'Gross Amount', 'Business Use %', 'Allowable Amount', 'Supplier', 'Receipt Attached', 'Tax Notes'],
      expenseRows.map((e: Record<string, unknown>) => {
        const cost = Number(e.cost ?? 0)
        const bup = Number(e.business_use_percentage ?? 100)
        return [
          String(e.purchase_date ?? ''),
          String(e.description ?? ''),
          String(e.category ?? ''),
          cost.toFixed(2),
          String(bup),
          (cost * bup / 100).toFixed(2),
          String(e.supplier_id ?? ''),
          e.invoice_path ? 'Yes' : 'No',
          String(e.tax_adjustment_notes ?? ''),
        ]
      })
    ),
  })

  // Customers CSV
  const customerRows = (customers ?? []) as Array<Record<string, unknown>>
  csvFiles.push({
    name: 'customers.csv',
    content: buildCSV(
      ['Name', 'Email', 'Phone', 'Address'],
      customerRows.map((c: Record<string, unknown>) => [
        String(c.name ?? ''),
        String(c.email ?? ''),
        String(c.phone ?? ''),
        String(c.address ?? ''),
      ])
    ),
  })

  // Suppliers CSV
  const supplierRows = (suppliers ?? []) as Array<Record<string, unknown>>
  csvFiles.push({
    name: 'suppliers.csv',
    content: buildCSV(
      ['Name', 'Email', 'Phone', 'Website'],
      supplierRows.map((s: Record<string, unknown>) => [
        String(s.name ?? ''),
        String(s.email ?? ''),
        String(s.phone ?? ''),
        String(s.website ?? ''),
      ])
    ),
  })

  // Evidence index CSV
  csvFiles.push({
    name: 'evidence-index.csv',
    content: buildCSV(
      ['Date', 'Description', 'Category', 'Amount', 'Evidence Present', 'File Name'],
      expenseRows.map((e: Record<string, unknown>) => [
        String(e.purchase_date ?? ''),
        String(e.description ?? ''),
        String(e.category ?? ''),
        String(e.cost ?? ''),
        e.invoice_path ? 'Yes' : 'MISSING',
        String(e.invoice_file_name ?? ''),
      ])
    ),
  })

  // SA103 Summary CSV
  if (summary) {
    csvFiles.push({
      name: 'sa103-summary.csv',
      content: buildCSV(
        ['Box', 'Description', 'Amount'],
        [
          ['9', 'Turnover', summary.box9_turnover.toFixed(2)],
          ['10', 'Other income', summary.box10_otherIncome.toFixed(2)],
          ['11', 'Cost of goods', summary.box11_costOfGoods.toFixed(2)],
          ['12', 'Travel', summary.box12_carVanTravel.toFixed(2)],
          ['13', 'Staff costs', summary.box13_wages.toFixed(2)],
          ['14', 'Premises', summary.box14_rent.toFixed(2)],
          ['15', 'Repairs', summary.box15_repairs.toFixed(2)],
          ['16', 'Professional fees', summary.box16_finance.toFixed(2)],
          ['17', 'Interest', summary.box17_interest.toFixed(2)],
          ['18', 'Office costs', summary.box18_phone.toFixed(2)],
          ['19', 'Other expenses', summary.box19_other.toFixed(2)],
          ['20', 'Total expenses', summary.box20_totalExpenses.toFixed(2)],
          ['21', 'Net profit', summary.box21_netProfit.toFixed(2)],
        ]
      ),
    })
  }

  // Log the export
  await supabase.from('accountant_export_log').insert({
    user_id: user.id,
    tax_year: taxYear,
    export_type: 'csv_pack',
  })

  // For now, return as a multi-file JSON response with CSV contents
  // A proper ZIP would require a zip library — using concatenated CSVs with separators
  // TODO: Replace with proper ZIP generation using archiver or jszip
  const separator = '\n\n' + '='.repeat(60) + '\n'
  const combined = csvFiles.map((f) => `--- FILE: ${f.name} ---\n${f.content}`).join(separator)

  return new NextResponse(combined, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="wired-for-crochet-tax-pack-${taxYear - 1}-${taxYear.toString().slice(2)}.csv"`,
    },
  })
}

function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(row.map(escape).join(','))
  }
  return lines.join('\n')
}
