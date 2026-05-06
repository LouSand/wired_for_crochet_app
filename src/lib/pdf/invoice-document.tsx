'use client'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { InvoiceWithDetails, BusinessProfile, PaymentRow } from '@/types/invoicing'
import { formatCurrency } from '@/lib/currency'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '60%',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    marginBottom: 8,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  clientRow: {
    fontSize: 9,
    marginBottom: 2,
    color: '#4b5563',
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDescription: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colUnitPrice: { width: '17.5%', textAlign: 'right' },
  colTotal: { width: '17.5%', textAlign: 'right' },
  headerText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 9,
    color: '#4b5563',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
  stageGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  stageBox: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  stageLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  stageAmount: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  stageStatus: {
    fontSize: 8,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  balanceValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
  bankSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  bankTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  bankDetail: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface InvoiceDocumentProps {
  invoice: InvoiceWithDetails
  profile: BusinessProfile | null
  currency: string
}

export function InvoiceDocument({ invoice, profile, currency }: InvoiceDocumentProps) {
  const remaining = invoice.total - invoice.amount_paid

  // Calculate stage amounts
  const depositAmount = (invoice.total * invoice.deposit_percent) / 100
  const stage2Amount = (invoice.total * invoice.stage2_percent) / 100
  const finalAmount = (invoice.total * invoice.final_percent) / 100

  // Determine stage coverage
  const paid = invoice.amount_paid
  const depositCovered = paid >= depositAmount
  const stage2Covered = paid >= depositAmount + stage2Amount
  const finalCovered = paid >= invoice.total

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {profile?.logo_url && (
              <Image src={profile.logo_url} style={styles.logo} />
            )}
            {profile?.company_name && (
              <Text style={styles.companyName}>{profile.company_name}</Text>
            )}
            {profile?.address && (
              <Text style={styles.companyDetail}>{profile.address}</Text>
            )}
            {profile?.phone && (
              <Text style={styles.companyDetail}>{profile.phone}</Text>
            )}
            {profile?.email && (
              <Text style={styles.companyDetail}>{profile.email}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice #: {invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Issue Date: {invoice.issue_date}</Text>
            <Text style={styles.invoiceMeta}>Due Date: {invoice.due_date}</Text>
            <Text style={styles.invoiceMeta}>Status: {invoice.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.clientName}>{invoice.customer.name}</Text>
          {invoice.customer.email && (
            <Text style={styles.clientRow}>{invoice.customer.email}</Text>
          )}
          {invoice.customer.address && (
            <Text style={styles.clientRow}>{invoice.customer.address}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
              <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
              <Text style={[styles.headerText, styles.colUnitPrice]}>Unit Price</Text>
              <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
            </View>
            {invoice.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cellText, styles.colUnitPrice]}>
                  {formatCurrency(item.unit_price, currency)}
                </Text>
                <Text style={[styles.cellText, styles.colTotal]}>
                  {formatCurrency(item.line_total, currency)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total, currency)}</Text>
          </View>
        </View>

        {/* Stage Payment Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Stages</Text>
          <View style={styles.stageGrid}>
            <View style={styles.stageBox}>
              <Text style={styles.stageLabel}>Deposit ({invoice.deposit_percent}%)</Text>
              <Text style={styles.stageAmount}>{formatCurrency(depositAmount, currency)}</Text>
              <Text style={[styles.stageStatus, { color: depositCovered ? '#059669' : '#dc2626' }]}>
                {depositCovered ? '✓ Covered' : '○ Outstanding'}
              </Text>
            </View>
            <View style={styles.stageBox}>
              <Text style={styles.stageLabel}>Stage 2 ({invoice.stage2_percent}%)</Text>
              <Text style={styles.stageAmount}>{formatCurrency(stage2Amount, currency)}</Text>
              <Text style={[styles.stageStatus, { color: stage2Covered ? '#059669' : '#dc2626' }]}>
                {stage2Covered ? '✓ Covered' : '○ Outstanding'}
              </Text>
            </View>
            <View style={styles.stageBox}>
              <Text style={styles.stageLabel}>Final ({invoice.final_percent}%)</Text>
              <Text style={styles.stageAmount}>{formatCurrency(finalAmount, currency)}</Text>
              <Text style={[styles.stageStatus, { color: finalCovered ? '#059669' : '#dc2626' }]}>
                {finalCovered ? '✓ Covered' : '○ Outstanding'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {invoice.payments.map((payment: PaymentRow) => (
              <View key={payment.id} style={styles.paymentRow}>
                <Text style={styles.cellText}>{payment.payment_date}</Text>
                <Text style={[styles.cellText, { fontFamily: 'Helvetica-Bold' }]}>
                  {formatCurrency(payment.amount, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Remaining Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(remaining, currency)}</Text>
        </View>

        {/* Bank Details */}
        {profile && (profile.bank_account_name || profile.bank_account_number) && (
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>Payment Details</Text>
            {profile.bank_account_name && (
              <Text style={styles.bankDetail}>Account Name: {profile.bank_account_name}</Text>
            )}
            {profile.bank_account_number && (
              <Text style={styles.bankDetail}>Account Number: {profile.bank_account_number}</Text>
            )}
            {profile.bank_sort_code && (
              <Text style={styles.bankDetail}>Sort Code: {profile.bank_sort_code}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {profile?.company_name ? `${profile.company_name} — ` : ''}Thank you for your business
        </Text>
      </Page>
    </Document>
  )
}
