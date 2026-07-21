import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PDFHeader from '../../PDF/PDFHeader';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#dc2626',
        textTransform: 'uppercase',
    },
    section: { marginBottom: 14 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        backgroundColor: '#fef2f2',
        padding: 6,
        color: '#991b1b',
    },
    row: { flexDirection: 'row', marginBottom: 6 },
    label: { width: '42%', fontWeight: 'bold', color: '#374151' },
    value: { width: '58%', color: '#111827' },
    table: { borderWidth: 1, borderColor: '#e5e7eb', marginTop: 8 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#dc2626',
        color: '#fff',
        padding: 6,
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 5, fontSize: 8 },
    tableRowAlt: { backgroundColor: '#f9fafb' },
    col1: { width: '12%' },
    col2: { width: '28%' },
    col3: { width: '30%' },
    col4: { width: '30%' },
    terms: { marginTop: 12, padding: 8, backgroundColor: '#fff7ed', fontSize: 8 },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
    },
    signatureBox: { width: '45%' },
    signatureLine: { borderTopWidth: 1, borderTopColor: '#000', marginTop: 28, paddingTop: 4, fontSize: 8 },
});

const VehicleFinanceLoanAgreementPDF = ({ loanData, companyData }) => {
    const formatCurrency = (amount) => {
        const num = Number(amount || 0);
        return `Rs. ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const { loan, subscriber, receivables = [] } = loanData;
    const company = companyData || {};
    const vehicleLabel = [loan?.vehicle_make, loan?.vehicle_model].filter(Boolean).join(' ');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={company} />
                <Text style={styles.title}>Vehicle Loan Agreement</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LOAN SUMMARY</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Loan ID:</Text>
                        <Text style={styles.value}>{loan?.id || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Loan Amount:</Text>
                        <Text style={styles.value}>{formatCurrency(loan?.loan_amount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Interest Amount:</Text>
                        <Text style={styles.value}>{formatCurrency(loan?.interest_amount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Repay:</Text>
                        <Text style={styles.value}>{formatCurrency(loan?.total_repay_amount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Interest Rate:</Text>
                        <Text style={styles.value}>{loan?.interest_rate || 0}%</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>EMI / Installment:</Text>
                        <Text style={styles.value}>{formatCurrency(loan?.installment_amount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Repayment Mode:</Text>
                        <Text style={styles.value}>{loan?.repayment_mode || loan?.tenure_mode || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Disbursement Date:</Text>
                        <Text style={styles.value}>{formatDate(loan?.loan_disbursement_date)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>First Due Date:</Text>
                        <Text style={styles.value}>{formatDate(loan?.loan_first_due_date)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Vehicle Type:</Text>
                                <Text style={styles.value}>{loan?.vehicle_type || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Make / Model:</Text>
                                <Text style={styles.value}>{vehicleLabel || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Vehicle Number:</Text>
                                <Text style={styles.value}>{loan?.vehicle_number || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Chassis Number:</Text>
                                <Text style={styles.value}>{loan?.chassis_number || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Engine Number:</Text>
                                <Text style={styles.value}>{loan?.engine_number || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>BORROWER DETAILS</Text>
                    <View style={{ flexDirection: 'row' }}>
                        {(subscriber?.vf_cust_photo_base64format || subscriber?.vf_cust_photo) && (
                            <Image
                                src={subscriber.vf_cust_photo_base64format || subscriber.vf_cust_photo}
                                style={{ width: 70, height: 70, marginRight: 12, borderRadius: 4 }}
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Name:</Text>
                                <Text style={styles.value}>{subscriber?.vf_cust_name || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Mobile:</Text>
                                <Text style={styles.value}>{subscriber?.vf_cust_phone || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Address:</Text>
                                <Text style={styles.value}>{subscriber?.vf_cust_address || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Nominee:</Text>
                                <Text style={styles.value}>
                                    {subscriber?.vf_nominee_name || 'N/A'}
                                    {subscriber?.vf_nominee_phone ? ` (${subscriber.vf_nominee_phone})` : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {receivables.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>REPAYMENT SCHEDULE</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.col1}>#</Text>
                                <Text style={styles.col2}>Due Date</Text>
                                <Text style={styles.col3}>Due Amount</Text>
                                <Text style={styles.col4}>Closing Balance</Text>
                            </View>
                            {receivables.map((r, i) => (
                                <View
                                    key={i}
                                    style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                                >
                                    <Text style={styles.col1}>{i + 1}</Text>
                                    <Text style={styles.col2}>{formatDate(r.due_date)}</Text>
                                    <Text style={styles.col3}>{formatCurrency(r.due_amount)}</Text>
                                    <Text style={styles.col4}>{formatCurrency(r.closing_balance)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.terms}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>TERMS & DECLARATION</Text>
                    <Text>1. The borrower agrees to repay the loan as per the schedule above.</Text>
                    <Text>2. The vehicle remains security for the loan until full repayment.</Text>
                    <Text>3. Late payment charges may apply as per company policy.</Text>
                    <Text>
                        4. I, {subscriber?.vf_cust_name || 'the borrower'}, confirm receipt of{' '}
                        {formatCurrency(loan?.cash_in_hand || loan?.loan_amount)} and accept all terms.
                    </Text>
                </View>

                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Borrower Signature</Text>
                        <Text style={styles.signatureLine}>{subscriber?.vf_cust_name || ''}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Authorised Signatory</Text>
                        <Text style={styles.signatureLine}>{company.name || company.company_name}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default VehicleFinanceLoanAgreementPDF;
