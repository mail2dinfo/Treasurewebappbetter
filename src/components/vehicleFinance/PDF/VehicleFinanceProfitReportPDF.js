import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 15,
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
    cumulativeRow: {
        backgroundColor: '#f3f4f6',
    },
    cell: {
        padding: 5,
        fontSize: 8,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    headerCell: {
        padding: 5,
        fontSize: 8,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    boldCell: {
        fontWeight: 'bold',
    },
    colLoanNo: { width: '14%' },
    colCustomer: { width: '18%' },
    colAmt: { width: '17%' },
    footer: {
        marginTop: 12,
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const shortId = (id) => {
    if (!id) return '-';
    if (id === 'Cumulative') return 'Cumulative';
    const str = String(id);
    return str.length > 12 ? `${str.slice(0, 8)}…` : str;
};

const VehicleFinanceProfitReportPDF = ({ loans = [], generatedAt }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.title}>Profit Report</Text>
            <Text style={styles.subtitle}>
                Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
            </Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, styles.colLoanNo]}>Loan No</Text>
                    <Text style={[styles.headerCell, styles.colCustomer]}>Customer</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Principal Disbursed</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Interest Earned</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Penalty Earned</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Balance Outstanding</Text>
                </View>

                {loans.map((loan, index) => {
                    const isCumulative = Boolean(loan.isCumulative);
                    return (
                        <View
                            key={loan.loanId || index}
                            style={[styles.tableRow, isCumulative ? styles.cumulativeRow : null]}
                        >
                            <Text style={[styles.cell, styles.colLoanNo, isCumulative ? styles.boldCell : null]}>
                                {shortId(loan.loanId)}
                            </Text>
                            <Text style={[styles.cell, styles.colCustomer, isCumulative ? styles.boldCell : null]}>
                                {loan.customerName || (isCumulative ? '' : '-')}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? styles.boldCell : null]}>
                                {formatMoney(loan.principalDisbursed)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? styles.boldCell : null]}>
                                {formatMoney(loan.interestEarned)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? styles.boldCell : null]}>
                                {formatMoney(loan.penaltyEarned)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? styles.boldCell : null]}>
                                {formatMoney(loan.balanceOutstanding)}
                            </Text>
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

export default VehicleFinanceProfitReportPDF;
