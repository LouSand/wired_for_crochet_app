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
    width: 60,
    height: 60,
    marginBottom: 8,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 14,
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
  receiptTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
    marginBottom: 8,
  },
  receiptMeta: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
  },
  paymentBox: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 10,
    color: '#065f46',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  paymentDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  balanceValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
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

interface ReceiptDocumentProps {
  invoice: InvoiceWithDetails
  payment: PaymentRow
  profile: BusinessProfile | null
  currency: string
}

export function ReceiptDocument({ invoice, payment, profile, currency }: ReceiptDocumentProps) {
  const remainingAfterPayment = invoice.total - invoice.amount_paid

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
            <Text style={styles.receiptTitle}>RECEIPT</Text>
            <Text style={styles.receiptMeta}>Invoice #: {invoice.invoice_number}</Text>
            <Text style={styles.receiptMeta}>Receipt Date: {payment.payment_date}</Text>
          </View>
        </View>

        {/* Payment Amount */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Payment Received</Text>
          <Text style={styles.paymentAmount}>{formatCurrency(payment.amount, currency)}</Text>
          <Text style={styles.paymentDate}>Date: {payment.payment_date}</Text>
        </View>

        {/* Invoice Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Number</Text>
            <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client</Text>
            <Text style={styles.detailValue}>{invoice.customer.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Total</Text>
            <Text style={styles.detailValue}>{formatCurrency(invoice.total, currency)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid to Date</Text>
            <Text style={styles.detailValue}>{formatCurrency(invoice.amount_paid, currency)}</Text>
          </View>
        </View>

        {/* Remaining Balance */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Remaining Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(remainingAfterPayment, currency)}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {profile?.company_name ? `${profile.company_name} — ` : ''}Thank you for your payment
        </Text>
      </Page>
    </Document>
  )
}
