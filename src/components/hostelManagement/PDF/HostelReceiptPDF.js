import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DEFAULT_DOS, DEFAULT_DONTS, parseHouseRules } from '../../../utils/hostelBillProps';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  banner: {
    backgroundColor: '#b91c1c',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 4,
  },
  bannerTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  bannerMeta: { color: '#fecaca', fontSize: 9, marginTop: 3 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  field: { width: '48%', marginBottom: 8 },
  label: { fontSize: 8, color: '#666', marginBottom: 2, fontWeight: 'bold' },
  value: { fontSize: 10, color: '#111' },
  box: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  amountLabel: { fontSize: 10, color: '#444' },
  amountValue: { fontSize: 11, fontWeight: 'bold' },
  due: { color: '#b91c1c' },
  paid: { color: '#15803d' },
  deposit: { color: '#1d4ed8' },
  rulesBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 10,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  ruleHeading: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#374151' },
  ruleLine: { fontSize: 8.5, color: '#4b5563', marginBottom: 3, paddingLeft: 6 },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 8, color: '#777' },
});

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value != null && value !== '' ? String(value) : '—'}</Text>
  </View>
);

const RulesList = ({ title, items }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={styles.ruleHeading}>{title}</Text>
    {(items || []).map((line, i) => (
      <Text key={`${title}-${i}`} style={styles.ruleLine}>• {line}</Text>
    ))}
  </View>
);

const HostelReceiptPDF = ({
  documentTitle,
  hostelName = 'Hostel',
  hostelAddress,
  hostelPhone,
  residentName,
  residentPhone,
  monthLabel,
  periodLabel,
  joinDate,
  expectedEndDate,
  amountDue,
  amountPaid,
  balance,
  pendingBalance,
  securityDeposit,
  securityDepositHeld,
  billNumber,
  paymentMethod,
  paymentType,
  paidAt,
  rentPlan,
  roomLabel,
  status,
  houseRulesText,
}) => {
  const { dos, donts } = parseHouseRules(houseRulesText);
  const pending = pendingBalance != null ? pendingBalance : balance;
  const title = documentTitle
    || (Number(balance) > 0 && Number(amountPaid) <= 0 ? 'Hostel Onboarding Bill' : 'Hostel Rent Receipt');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{title}</Text>
          <Text style={styles.bannerMeta}>
            {hostelName}
            {billNumber ? ` · Receipt ${billNumber}` : ''}
          </Text>
          {(hostelAddress || hostelPhone) && (
            <Text style={styles.bannerMeta}>
              {[hostelAddress, hostelPhone ? `Ph: ${hostelPhone}` : null].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Resident &amp; room</Text>
        <View style={styles.grid}>
          <Field label="Resident name" value={residentName} />
          <Field label="Phone" value={residentPhone} />
          <Field label="Floor / Room / Bed" value={roomLabel} />
          <Field label="Rent plan" value={rentPlan} />
          <Field label="Onboarded" value={joinDate} />
          <Field label="Expected end" value={expectedEndDate} />
          <Field label="Billing period" value={periodLabel || monthLabel} />
          <Field label="Status" value={status} />
        </View>

        <Text style={styles.sectionTitle}>Rent &amp; payment</Text>
        <View style={styles.box}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total charge</Text>
            <Text style={styles.amountValue}>{rs(amountDue)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Paid now</Text>
            <Text style={[styles.amountValue, styles.paid]}>{rs(amountPaid)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Pending balance (this bill)</Text>
            <Text style={[styles.amountValue, styles.due]}>{rs(balance)}</Text>
          </View>
          {Number(pending) > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total pending (all dues)</Text>
              <Text style={[styles.amountValue, styles.due]}>{rs(pending)}</Text>
            </View>
          )}
        </View>

        {(securityDeposit > 0 || securityDepositHeld > 0) && (
          <>
            <Text style={styles.sectionTitle}>Security deposit</Text>
            <View style={styles.box}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Deposit collected</Text>
                <Text style={[styles.amountValue, styles.deposit]}>{rs(securityDeposit)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Deposit held</Text>
                <Text style={[styles.amountValue, styles.deposit]}>{rs(securityDepositHeld ?? securityDeposit)}</Text>
              </View>
              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 4 }}>
                Deposit is adjusted against outstanding dues at checkout. Refund of balance after settlement.
              </Text>
            </View>
          </>
        )}

        {(billNumber || paymentMethod || paidAt) && (
          <>
            <Text style={styles.sectionTitle}>Payment receipt</Text>
            <View style={styles.grid}>
              <Field label="Receipt no." value={billNumber} />
              <Field label="Payment mode" value={paymentMethod} />
              <Field label="Payment type" value={paymentType} />
              <Field
                label="Paid at"
                value={paidAt ? new Date(paidAt).toLocaleString('en-IN') : null}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Do&apos;s and Don&apos;ts</Text>
        <View style={styles.rulesBox}>
          <RulesList title="Do's" items={dos.length ? dos : DEFAULT_DOS} />
          <RulesList title="Don'ts" items={donts.length ? donts : DEFAULT_DONTS} />
        </View>

        <Text style={styles.footer}>
          Generated {new Date().toLocaleString('en-IN')} · MyTreasure Hostel Management
        </Text>
      </Page>
    </Document>
  );
};

export default HostelReceiptPDF;
