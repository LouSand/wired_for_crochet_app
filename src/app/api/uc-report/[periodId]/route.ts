import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/uc-report/[periodId]
 * Generates a PDF report for a Universal Credit reporting period.
 * Uses @react-pdf/renderer to create a clean, printable summary.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  const { periodId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch period
  const { data: period } = await supabase
    .from('uc_reporting_periods')
    .select('*')
    .eq('id', periodId)
    .eq('user_id', user.id)
    .single()

  if (!period) {
    return NextResponse.json({ error: 'Period not found' }, { status: 404 })
  }

  // Fetch income
  const { data: income } = await supabase
    .from('uc_income_entries')
    .select('*')
    .eq('period_id', periodId)
    .eq('user_id', user.id)
    .order('date_received', { ascending: true })

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('uc_expense_entries')
    .select('*')
    .eq('period_id', periodId)
    .eq('user_id', user.id)
    .order('date_incurred', { ascending: true })

  const incomeEntries = income ?? []
  const expenseEntries = expenses ?? []
  const totalIncome = incomeEntries.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = expenseEntries.reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalIncome - totalExpenses

  // Generate PDF using react-pdf
  const React = (await import('react')).default
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    header: { marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
    section: { marginTop: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
    rowLabel: { flex: 1 },
    rowAmount: { width: 80, textAlign: 'right', fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1.5, borderTopColor: '#374151', marginTop: 4 },
    totalLabel: { flex: 1, fontWeight: 'bold', fontSize: 11 },
    totalAmount: { width: 80, textAlign: 'right', fontWeight: 'bold', fontSize: 11 },
    summaryBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 4, marginTop: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
    meta: { fontSize: 8, color: '#9ca3af', marginTop: 2 },
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const doc = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'Universal Credit — Monthly Report'),
        React.createElement(Text, { style: styles.subtitle }, `Reporting Period: ${formatDate(period.period_start)} to ${formatDate(period.period_end)}`),
        React.createElement(Text, { style: styles.subtitle }, `Submission Due: ${formatDate(period.submission_due)}`),
        React.createElement(Text, { style: styles.subtitle }, `Status: ${period.status.replace(/_/g, ' ')}`),
        React.createElement(Text, { style: styles.meta }, `Generated: ${new Date().toLocaleDateString('en-GB')} | For reference only — not an official document`),
      ),

      // Summary box
      React.createElement(View, { style: styles.summaryBox },
        React.createElement(View, { style: styles.summaryRow },
          React.createElement(Text, null, 'Total Income Received:'),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, `£${totalIncome.toFixed(2)}`),
        ),
        React.createElement(View, { style: styles.summaryRow },
          React.createElement(Text, null, 'Total Allowable Expenses:'),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, `£${totalExpenses.toFixed(2)}`),
        ),
        React.createElement(View, { style: { ...styles.summaryRow, borderTopWidth: 1, borderTopColor: '#d1d5db', paddingTop: 4, marginTop: 4 } },
          React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Estimated Profit:'),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, `£${profit.toFixed(2)}`),
        ),
      ),

      // Income section
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Income Received'),
        ...(incomeEntries.length === 0
          ? [React.createElement(Text, { key: 'no-inc', style: { color: '#9ca3af' } }, 'No income entries for this period')]
          : incomeEntries.map((inc, i) =>
              React.createElement(View, { key: i, style: styles.row },
                React.createElement(Text, { style: styles.rowLabel }, `${formatDate(inc.date_received)} — ${inc.source}${inc.payment_method ? ` (${inc.payment_method.replace(/_/g, ' ')})` : ''}`),
                React.createElement(Text, { style: styles.rowAmount }, `£${Number(inc.amount).toFixed(2)}`),
              )
            )
        ),
        ...(incomeEntries.length > 0
          ? [React.createElement(View, { key: 'inc-total', style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, 'Total Income'),
              React.createElement(Text, { style: styles.totalAmount }, `£${totalIncome.toFixed(2)}`),
            )]
          : []
        ),
      ),

      // Expenses section
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Allowable Expenses'),
        ...(expenseEntries.length === 0
          ? [React.createElement(Text, { key: 'no-exp', style: { color: '#9ca3af' } }, 'No expense entries for this period')]
          : expenseEntries.map((exp, i) =>
              React.createElement(View, { key: i, style: styles.row },
                React.createElement(Text, { style: styles.rowLabel }, `${formatDate(exp.date_incurred)} — ${exp.description} [${exp.category.replace(/_/g, ' ')}]${exp.supplier ? ` — ${exp.supplier}` : ''}`),
                React.createElement(Text, { style: styles.rowAmount }, `£${Number(exp.amount).toFixed(2)}`),
              )
            )
        ),
        ...(expenseEntries.length > 0
          ? [React.createElement(View, { key: 'exp-total', style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, 'Total Expenses'),
              React.createElement(Text, { style: styles.totalAmount }, `£${totalExpenses.toFixed(2)}`),
            )]
          : []
        ),
      ),

      // Notes
      ...(period.notes
        ? [React.createElement(View, { key: 'notes', style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'Notes'),
            React.createElement(Text, null, period.notes),
          )]
        : []
      ),

      // Footer
      React.createElement(Text, { style: styles.footer }, 'Wired for Crochet — Universal Credit Reporting Helper | This is a personal record, not an official UC document'),
    )
  )

  const buffer = await renderToBuffer(doc as unknown as Parameters<typeof renderToBuffer>[0])

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="uc-report-${period.period_start}-to-${period.period_end}.pdf"`,
    },
  })
}
