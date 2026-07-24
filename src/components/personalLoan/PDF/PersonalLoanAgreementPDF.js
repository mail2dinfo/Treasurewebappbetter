import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PersonalLoanPDFHeader from './PersonalLoanPDFHeader';
import { getPlLoanModeLabel } from '../../../utils/personalLoanModes';

const styles = StyleSheet.create({
    page: { paddingTop: 35, paddingBottom: 48, paddingHorizontal: 40, fontSize: 10 },
    title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#dc2626' },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 10, color: '#111827' },
    row: { flexDirection: 'row', marginBottom: 4 },
    label: { width: '40%', color: '#6b7280' },
    value: { width: '60%', color: '#111827', fontWeight: 'bold' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#fee2e2', paddingVertical: 6, paddingHorizontal: 4 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 5, paddingHorizontal: 4 },
    cell: { fontSize: 8 },
    c1: { width: '10%' },
    c2: { width: '22%' },
    c3: { width: '22%' },
    c4: { width: '22%' },
    c5: { width: '24%' },
    terms: { marginTop: 12, padding: 8, backgroundColor: '#fff7ed' },
    term: { fontSize: 8, marginBottom: 3, color: '#374151' },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
    signatureBox: { width: '45%' },
    signatureLine: { borderTopWidth: 1, borderTopColor: '#111827', marginTop: 40, paddingTop: 4, fontSize: 8, color: '#6b7280' },
    footer: { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

const formatMoney = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const PersonalLoanAgreementPDF = ({
    loan,
    subscriber,
    companyData,
    schedule = [],
    modeLabel,
}) => {
    const previewRows = schedule.slice(0, 24);
    const companyName = companyData?.company_name || companyData?.name || 'Personal Loan';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PersonalLoanPDFHeader
                    companyData={companyData}
                    reportTitle="Loan Agreement"
                    reportDate={new Date().toLocaleDateString('en-IN')}
                />
                <Text style={styles.title}>PERSONAL LOAN AGREEMENT</Text>

                <Text style={styles.sectionTitle}>Loan Details</Text>
                <View style={styles.row}><Text style={styles.label}>Loan ID</Text><Text style={styles.value}>{loan?.id || 'N/A'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Mode</Text><Text style={styles.value}>{modeLabel || getPlLoanModeLabel(loan?.loan_mode)}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Principal</Text><Text style={styles.value}>{formatMoney(loan?.principal_amount)}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Interest Rate</Text><Text style={styles.value}>{loan?.interest_rate != null ? `${loan.interest_rate}%` : 'N/A'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Tenure</Text><Text style={styles.value}>{loan?.tenure_months ? `${loan.tenure_months} months` : 'N/A'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Disbursed Date</Text><Text style={styles.value}>{formatDate(loan?.disbursed_date)}</Text></View>

                <Text style={styles.sectionTitle}>Borrower</Text>
                <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{subscriber?.pl_cust_name || 'N/A'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{subscriber?.pl_cust_phone || 'N/A'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Address</Text><Text style={styles.value}>{subscriber?.pl_cust_address || 'N/A'}</Text></View>

                {previewRows.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Repayment Schedule</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.cell, styles.c1]}>#</Text>
                            <Text style={[styles.cell, styles.c2]}>Due Date</Text>
                            <Text style={[styles.cell, styles.c3]}>Principal</Text>
                            <Text style={[styles.cell, styles.c4]}>Interest</Text>
                            <Text style={[styles.cell, styles.c5]}>Total</Text>
                        </View>
                        {previewRows.map((row) => (
                            <View key={row.installmentNo} style={styles.tableRow}>
                                <Text style={[styles.cell, styles.c1]}>{row.installmentNo}</Text>
                                <Text style={[styles.cell, styles.c2]}>{formatDate(row.dueDate)}</Text>
                                <Text style={[styles.cell, styles.c3]}>{formatMoney(row.principal)}</Text>
                                <Text style={[styles.cell, styles.c4]}>{formatMoney(row.interest)}</Text>
                                <Text style={[styles.cell, styles.c5]}>{formatMoney(row.total)}</Text>
                            </View>
                        ))}
                        {schedule.length > previewRows.length && (
                            <Text style={{ fontSize: 8, marginTop: 4, color: '#6b7280' }}>
                                ... and {schedule.length - previewRows.length} more installments
                            </Text>
                        )}
                    </>
                )}

                <View style={styles.terms}>
                    <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                    <Text style={styles.term}>1. Borrower agrees to repay as per the selected loan/collection mode and schedule.</Text>
                    <Text style={styles.term}>2. Delayed payments may attract follow-up and additional charges as per company policy.</Text>
                    <Text style={styles.term}>{`3. This agreement is subject to the terms of ${companyName} / Personal Loan division.`}</Text>
                    <Text style={styles.term}>4. Borrower confirms the details above are correct and accepts the repayment obligation.</Text>
                </View>

                <View style={styles.signatureRow}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Borrower Signature</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Authorized Signatory</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    {`Computer-generated loan agreement — ${companyName}`}
                </Text>
            </Page>
        </Document>
    );
};

export default PersonalLoanAgreementPDF;
