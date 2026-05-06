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
import type { QuoteWithDetails, BusinessProfile } from '@/types/invoicing'
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
  quoteTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    marginBottom: 8,
  },
  quoteMeta: {
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
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
  validityNote: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  validityText: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
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

interface QuoteDocumentProps {
  quote: QuoteWithDetails
  profile: BusinessProfile | null
  currency: string
}

export function QuoteDocument({ quote, profile, currency }: QuoteDocumentProps) {
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
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteMeta}>Quote #: {quote.quote_number}</Text>
            <Text style={styles.quoteMeta}>Issue Date: {quote.issue_date}</Text>
            <Text style={styles.quoteMeta}>Status: {quote.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Prepared For */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prepared For</Text>
          <Text style={styles.clientName}>{quote.customer.name}</Text>
          {quote.customer.email && (
            <Text style={styles.clientRow}>{quote.customer.email}</Text>
          )}
          {quote.customer.address && (
            <Text style={styles.clientRow}>{quote.customer.address}</Text>
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
            {quote.items.map((item) => (
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
            <Text style={styles.totalValue}>{formatCurrency(quote.total, currency)}</Text>
          </View>
        </View>

        {/* Validity Note */}
        <View style={styles.validityNote}>
          <Text style={styles.validityText}>
            This quote is valid for 30 days from the issue date. Prices may be subject to change after this period.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {profile?.company_name ? `${profile.company_name} — ` : ''}Thank you for considering our services
        </Text>
      </Page>
    </Document>
  )
}
