import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 18,
        fontSize: 7,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        color: '#111827',
    },
    subtitle: {
        fontSize: 8,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 12,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
    },
    cell: {
        padding: 3,
        fontSize: 7,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    headerCell: {
        padding: 3,
        fontSize: 7,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    colLoanNo: { width: '10%' },
    colCustomer: { width: '12%' },
    colVehicle: { width: '11%' },
    colAmt: { width: '9%' },
    colTenure: { width: '9%' },
    colStatus: { width: '8%' },
    footer: {
        marginTop: 12,
        fontSize: 7,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const shortId = (id) => {
    if (!id) return '-';
    if (String(id) === 'Cumulative') return 'Cumulative';
    const str = String(id);
    return str.length > 12 ? `${str.slice(0, 8)}…` : str;
};

const VehicleFinanceLoanSummaryPDF = ({ loans = [], generatedAt }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.title}>Loan Wise Summary</Text>
            <Text style={styles.subtitle}>
                Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
            </Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, styles.colLoanNo]}>Loan No</Text>
                    <Text style={[styles.headerCell, styles.colCustomer]}>Customer</Text>
                    <Text style={[styles.headerCell, styles.colVehicle]}>Vehicle</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Loan Amt</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Interest</Text>
                    <Text style={[styles.headerCell, styles.colTenure]}>Tenure</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>EMI</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Paid</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Outstanding</Text>
                    <Text style={[styles.headerCell, styles.colStatus]}>Status</Text>
                </View>

                {loans.map((loan, index) => {
                    const isCumulative = Boolean(loan.isCumulative);
                    return (
                        <View
                            key={loan.loanId || index}
                            style={[styles.tableRow, isCumulative ? { backgroundColor: '#f3f4f6' } : null]}
                        >
                            <Text style={[styles.cell, styles.colLoanNo, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {shortId(loan.loanId)}
                            </Text>
                            <Text style={[styles.cell, styles.colCustomer]}>{loan.customerName || ''}</Text>
                            <Text style={[styles.cell, styles.colVehicle]}>{loan.vehicle || ''}</Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.loanAmount)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.interest)}
                            </Text>
                            <Text style={[styles.cell, styles.colTenure]}>{loan.tenure || ''}</Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.emi)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.totalPaid)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.totalOutstanding)}
                            </Text>
                            <Text style={[styles.cell, styles.colStatus]}>{loan.status || ''}</Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.footer}>
                {Math.max(0, loans.filter((row) => !row.isCumulative).length)} loan(s) · last row is cumulative
            </Text>
        </Page>
    </Document>
);

export default VehicleFinanceLoanSummaryPDF;
