import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#555', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', marginBottom: 12, gap: 6 },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#f8f9fa',
  },
  summaryLabel: { fontSize: 7, color: '#666', marginBottom: 2 },
  summaryValue: { fontSize: 10, fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#b91c1c',
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  th: { color: '#fff', fontSize: 7, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  td: { fontSize: 7, color: '#222' },
  colHostel: { width: '14%' },
  colMonth: { width: '12%' },
  colMode: { width: '10%' },
  colName: { width: '16%' },
  colPhone: { width: '12%' },
  colAmt: { width: '12%', textAlign: 'right' },
  footer: { marginTop: 16, fontSize: 8, color: '#777', textAlign: 'center' },
});

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const HostelOutstandingReportPDF = ({
  hostelName = 'All hostels',
  monthLabel = 'All months',
  modeLabel = 'All modes',
  rows = [],
  summary = {},
  showHostel = false,
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.title}>Hostel Outstanding Report</Text>
      <Text style={styles.subtitle}>
        {hostelName} · {monthLabel} · {modeLabel} · Generated {new Date().toLocaleDateString('en-IN')}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Rows</Text>
          <Text style={styles.summaryValue}>{summary.count || rows.length || 0}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{rs(summary.total_due)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={styles.summaryValue}>{rs(summary.total_paid)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Due</Text>
          <Text style={styles.summaryValue}>{rs(summary.total_balance)}</Text>
        </View>
      </View>

      <View style={styles.tableHeader}>
        {showHostel && <Text style={[styles.th, styles.colHostel]}>Hostel</Text>}
        <Text style={[styles.th, styles.colMonth]}>Month</Text>
        <Text style={[styles.th, styles.colMode]}>Mode</Text>
        <Text style={[styles.th, styles.colName]}>Tenant</Text>
        <Text style={[styles.th, styles.colPhone]}>Phone</Text>
        <Text style={[styles.th, styles.colAmt]}>Total</Text>
        <Text style={[styles.th, styles.colAmt]}>Paid</Text>
        <Text style={[styles.th, styles.colAmt]}>Due</Text>
      </View>
      {rows.map((r, idx) => (
        <View key={r.id || idx} style={styles.row} wrap={false}>
          {showHostel && (
            <Text style={[styles.td, styles.colHostel]}>{r.hostel_name || '—'}</Text>
          )}
          <Text style={[styles.td, styles.colMonth]}>{r.month_label || '—'}</Text>
          <Text style={[styles.td, styles.colMode]}>{r.rent_plan || '—'}</Text>
          <Text style={[styles.td, styles.colName]}>{r.resident_name || '—'}</Text>
          <Text style={[styles.td, styles.colPhone]}>{r.resident_phone || '—'}</Text>
          <Text style={[styles.td, styles.colAmt]}>{rs(r.amount_due)}</Text>
          <Text style={[styles.td, styles.colAmt]}>{rs(r.amount_paid)}</Text>
          <Text style={[styles.td, styles.colAmt]}>{rs(r.balance)}</Text>
        </View>
      ))}
      {rows.length === 0 && (
        <Text style={{ marginTop: 12, textAlign: 'center', color: '#666' }}>No outstanding dues for this period.</Text>
      )}
      <Text style={styles.footer}>MyTreasure · Hostel Management</Text>
    </Page>
  </Document>
);

export default HostelOutstandingReportPDF;
