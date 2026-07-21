import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
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
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        padding: 8,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    summaryLabel: {
        fontSize: 7,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
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
        padding: 4,
        fontSize: 7,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    headerCell: {
        padding: 4,
        fontSize: 7,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    colLoanNo: { width: '11%' },
    colName: { width: '13%' },
    colPhone: { width: '10%' },
    colLoanAmt: { width: '10%' },
    colDisbursed: { width: '10%' },
    colAmt: { width: '11%' },
    colProgress: { width: '9%' },
    footer: {
        marginTop: 12,
        fontSize: 7,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const shortLoanId = (id) => {
    if (!id) return '-';
    if (String(id) === 'Cumulative') return 'Cumulative';
    const str = String(id);
    return str.length > 16 ? `${str.slice(0, 8)}...${str.slice(-4)}` : str;
};

const VehicleFinanceLoanWiseOutstandingDuePDF = ({
    loans = [],
    generatedAt,
    asOfDate,
    totals = {},
}) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.title}>Loan Wise Outstanding Due</Text>
            <Text style={styles.subtitle}>
                As of {asOfDate || 'report date'}
                {' · '}
                Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
            </Text>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Supposed to be collected</Text>
                    <Text style={styles.summaryValue}>{formatMoney(totals.supposed)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Collected</Text>
                    <Text style={styles.summaryValue}>{formatMoney(totals.collected)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={styles.summaryValue}>{formatMoney(totals.pending)}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, styles.colLoanNo]}>Loan Number</Text>
                    <Text style={[styles.headerCell, styles.colName]}>Customer Name</Text>
                    <Text style={[styles.headerCell, styles.colPhone]}>Phone</Text>
                    <Text style={[styles.headerCell, styles.colLoanAmt]}>Loan Amount</Text>
                    <Text style={[styles.headerCell, styles.colDisbursed]}>Disbursed Date</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Total Due</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Total Paid</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Outstanding</Text>
                    <Text style={[styles.headerCell, styles.colProgress]}>Progress</Text>
                </View>

                {loans.map((loan, index) => {
                    const isCumulative = Boolean(loan.isCumulative);
                    return (
                        <View
                            key={loan.loanId || index}
                            style={[styles.tableRow, isCumulative ? { backgroundColor: '#f3f4f6' } : null]}
                        >
                            <Text style={[styles.cell, styles.colLoanNo, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {shortLoanId(loan.loanId)}
                            </Text>
                            <Text style={[styles.cell, styles.colName]}>{loan.customerName || ''}</Text>
                            <Text style={[styles.cell, styles.colPhone]}>{loan.customerPhone || ''}</Text>
                            <Text style={[styles.cell, styles.colLoanAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.loanAmount)}
                            </Text>
                            <Text style={[styles.cell, styles.colDisbursed]}>{loan.disbursedDate || ''}</Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.totalDue)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.totalPaid)}
                            </Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(loan.totalOutstanding)}
                            </Text>
                            <Text style={[styles.cell, styles.colProgress, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {loan.loanProgress || ''}
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

export default VehicleFinanceLoanWiseOutstandingDuePDF;
