import { NextRequest, NextResponse } from 'next/server'
import { generateTaxSummary } from '@/lib/actions/tax-summary'

/**
 * GET /api/tax-report/[year]
 * Generates a PDF of the SA103 tax summary for the given tax year.
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

  const { data: summary, error } = await generateTaxSummary(taxYear)
  if (error || !summary) {
    return NextResponse.json({ error: error ?? 'Failed to generate' }, { status: 500 })
  }

  const React = (await import('react')).default
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
    section: { marginTop: 14, marginBottom: 6 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 3 },
    boxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
    boxNum: { width: 30, fontWeight: 'bold', color: '#7c3aed' },
    boxLabel: { flex: 1 },
    boxAmount: { width: 70, textAlign: 'right', fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: '#374151', marginTop: 4 },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, paddingLeft: 30 },
    detailText: { fontSize: 8, color: '#6b7280' },
    detailAmount: { fontSize: 8, color: '#374151', width: 60, textAlign: 'right' },
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const boxRow = (num: number, label: string, amount: number) =>
    React.createElement(View, { key: `box-${num}`, style: styles.boxRow },
      React.createElement(Text, { style: styles.boxNum }, `${num}`),
      React.createElement(Text, { style: styles.boxLabel }, label),
      React.createElement(Text, { style: styles.boxAmount }, `£${amount.toFixed(2)}`),
    )

  const doc = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(Text, { style: styles.title }, `SA103 Self-Employment — Tax Year ${summary.taxYear}`),
      React.createElement(Text, { style: styles.subtitle }, `Period: ${formatDate(summary.taxYearStart)} to ${formatDate(summary.taxYearEnd)}`),
      React.createElement(Text, { style: styles.subtitle }, `Business: ${summary.businessName}`),
      React.createElement(Text, { style: { ...styles.subtitle, marginBottom: 10 } }, `Generated: ${new Date().toLocaleDateString('en-GB')}`),

      // Income
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Income'),
        boxRow(9, 'Turnover — total business income', summary.box9_turnover),
        boxRow(10, 'Any other business income', summary.box10_otherIncome),
      ),

      // Expenses
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Allowable Business Expenses'),
        boxRow(11, 'Cost of goods bought for resale or goods used', summary.box11_costOfGoods),
        boxRow(12, 'Car, van and travel expenses', summary.box12_carVanTravel),
        boxRow(13, 'Wages, salaries and other staff costs', summary.box13_wages),
        boxRow(14, 'Rent, rates, power and insurance costs', summary.box14_rent),
        boxRow(15, 'Repairs and maintenance', summary.box15_repairs),
        boxRow(16, 'Professional fees', summary.box16_finance),
        boxRow(17, 'Interest and bank charges', summary.box17_interest),
        boxRow(18, 'Phone, stationery and office costs', summary.box18_phone),
        boxRow(19, 'Other allowable expenses', summary.box19_other),
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: { ...styles.boxNum, fontSize: 11 } }, '20'),
          React.createElement(Text, { style: { ...styles.boxLabel, fontWeight: 'bold', fontSize: 11 } }, 'Total allowable expenses'),
          React.createElement(Text, { style: { ...styles.boxAmount, fontSize: 11 } }, `£${summary.box20_totalExpenses.toFixed(2)}`),
        ),
      ),

      // Net profit
      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: { ...styles.totalRow, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 4 } },
          React.createElement(Text, { style: { ...styles.boxNum, fontSize: 12 } }, '21'),
          React.createElement(Text, { style: { ...styles.boxLabel, fontWeight: 'bold', fontSize: 12 } }, 'Net profit (or loss)'),
          React.createElement(Text, { style: { ...styles.boxAmount, fontSize: 12 } }, `£${summary.box21_netProfit.toFixed(2)}`),
        ),
      ),

      // Expense breakdown
      ...(summary.expensesByCategory.length > 0
        ? [React.createElement(View, { key: 'breakdown', style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'Expense Breakdown (Evidence Reference)'),
            ...summary.expensesByCategory.flatMap((cat) => [
              React.createElement(Text, { key: `cat-${cat.boxNumber}`, style: { fontWeight: 'bold', fontSize: 9, marginTop: 6 } }, `Box ${cat.boxNumber}: ${cat.category} — £${cat.total.toFixed(2)}`),
              ...cat.items.map((item, idx) =>
                React.createElement(View, { key: `item-${cat.boxNumber}-${idx}`, style: styles.detailRow },
                  React.createElement(Text, { style: styles.detailText }, `${formatDate(item.date)} — ${item.description}`),
                  React.createElement(Text, { style: styles.detailAmount }, `£${item.amount.toFixed(2)}`),
                )
              ),
            ]),
          )]
        : []
      ),

      // Footer
      React.createElement(Text, { style: styles.footer }, 'Wired for Crochet — SA103 Tax Return Helper | For personal reference only — verify all figures before submitting to HMRC'),
    )
  )

  const buffer = await renderToBuffer(doc as unknown as Parameters<typeof renderToBuffer>[0])

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sa103-tax-return-${summary.taxYear}.pdf"`,
    },
  })
}
