import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
  },
  instructionsText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: '#1f2937',
    fontFamily: 'Courier',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    width: 100,
    color: '#4b5563',
  },
  metaValue: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
})

interface PatternTemplateProps {
  title: string
  introduction?: string | null
  materials_list?: string | null
  hook_size?: string | null
  yarn_info?: string | null
  gauge?: string | null
  abbreviations?: string | null
  instructions?: string | null
  notes?: string | null
}

export default function PatternTemplate({
  title,
  introduction,
  materials_list,
  hook_size,
  yarn_info,
  gauge,
  abbreviations,
  instructions,
  notes,
}: PatternTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Introduction */}
        {introduction && (
          <View>
            <Text style={styles.text}>{introduction}</Text>
          </View>
        )}

        {/* Materials & Hook Size meta section */}
        {(hook_size || yarn_info || gauge) && (
          <View>
            <Text style={styles.sectionTitle}>Pattern Details</Text>
            {hook_size && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Hook Size:</Text>
                <Text style={styles.metaValue}>{hook_size}</Text>
              </View>
            )}
            {yarn_info && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Yarn:</Text>
                <Text style={styles.metaValue}>{yarn_info}</Text>
              </View>
            )}
            {gauge && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Gauge:</Text>
                <Text style={styles.metaValue}>{gauge}</Text>
              </View>
            )}
          </View>
        )}

        {/* Materials List */}
        {materials_list && (
          <View>
            <Text style={styles.sectionTitle}>Materials</Text>
            <Text style={styles.text}>{materials_list}</Text>
          </View>
        )}

        {/* Abbreviations */}
        {abbreviations && (
          <View>
            <Text style={styles.sectionTitle}>Abbreviations</Text>
            <Text style={styles.text}>{abbreviations}</Text>
          </View>
        )}

        {/* Instructions */}
        {instructions && (
          <View>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>{instructions}</Text>
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated from Wired for Crochet
        </Text>
      </Page>
    </Document>
  )
}
