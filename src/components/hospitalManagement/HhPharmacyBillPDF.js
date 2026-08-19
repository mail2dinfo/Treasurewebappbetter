import React from 'react';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#111827' },
  header: { backgroundColor: '#0e7490', color: '#fff', padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 46, height: 46, objectFit: 'contain', backgroundColor: '#fff', marginRight: 10 },
  headerText: { flexGrow: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 9, marginTop: 3 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  meta: { width: '50%', marginBottom: 6 },
  label: { color: '#6b7280', fontSize: 8 },
  value: { fontSize: 10, marginTop: 1 },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerRow: { backgroundColor: '#ecfeff' },
  medicine: { width: '36%', padding: 6 },
  qty: { width: '14%', padding: 6, textAlign: 'right' },
  amount: { width: '18%', padding: 6, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalLabel: { fontSize: 11, fontWeight: 'bold', marginRight: 12 },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#0e7490' },
  footer: { marginTop: 22, fontSize: 8, color: '#6b7280', textAlign: 'center' },
});

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const valueOf = (value, fallback = '—') => (value == null || value === '' ? fallback : String(value));

const HhPharmacyBillPDF = ({ bill }) => {
  const rows = bill?.medicine_summary || bill?.lines || [];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {bill?.hospital_logo_url && <Image src={bill.hospital_logo_url} style={styles.logo} />}
          <View style={styles.headerText}>
            <Text style={styles.title}>{valueOf(bill?.hospital_name, 'Pharmacy Medicine Bill')}</Text>
            {(bill?.hospital_address || bill?.hospital_phone) && (
              <Text style={styles.subtitle}>
                {[bill?.hospital_address, bill?.hospital_phone].filter(Boolean).join(' · ')}
              </Text>
            )}
            <Text style={styles.subtitle}>
              {[bill?.hospital_registration_no ? `Reg: ${bill.hospital_registration_no}` : null, `Bill No: ${valueOf(bill?.bill_no || bill?.billNo)}`].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.meta}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{valueOf(bill?.patient_name || bill?.patientName)}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{valueOf(bill?.patient_phone || bill?.patientPhone)}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Bill date</Text>
            <Text style={styles.value}>{valueOf(bill?.sale_date || bill?.saleDate)}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{valueOf(bill?.status)}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Payment / ledger account</Text>
            <Text style={styles.value}>
              {valueOf(bill?.payment_method || bill?.payment_mode)}
              {bill?.ledger_account_name ? ` / ${bill.ledger_account_name}` : ''}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Receipt No</Text>
            <Text style={styles.value}>{valueOf(bill?.receipt_no)}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.label}>Transaction reference</Text>
            <Text style={styles.value}>{valueOf(bill?.transaction_number)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.medicine}>Medicine</Text>
            <Text style={styles.qty}>Prescribed</Text>
            <Text style={styles.qty}>Dispensed</Text>
            <Text style={styles.amount}>Unit price</Text>
            <Text style={styles.amount}>Line total</Text>
          </View>
          {rows.map((row, index) => {
            const prescribed = Number(row.prescribed_qty ?? row.prescribedQty ?? row.qty ?? 0);
            const dispensed = Number(row.dispensed_qty ?? row.dispensedQty ?? row.qty ?? 0);
            const unitPrice = Number(row.unit_price ?? row.unitPrice ?? 0);
            const lineTotal = Number(row.line_amount ?? row.lineAmount ?? dispensed * unitPrice);
            return (
              <View style={styles.row} key={row.id || `${row.medicine_name}-${index}`}>
                <Text style={styles.medicine}>{valueOf(row.medicine_name || row.medicineName)}</Text>
                <Text style={styles.qty}>{prescribed}</Text>
                <Text style={styles.qty}>{dispensed}</Text>
                <Text style={styles.amount}>{money(unitPrice)}</Text>
                <Text style={styles.amount}>{money(lineTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Bill total</Text>
          <Text style={styles.totalValue}>{money(bill?.total_amount ?? bill?.totalAmount)}</Text>
        </View>
        <Text style={styles.footer}>Computer-generated pharmacy bill. Keep the bill number for future lookup.</Text>
      </Page>
    </Document>
  );
};

export default HhPharmacyBillPDF;
