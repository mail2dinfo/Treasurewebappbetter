import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 28,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        color: '#111827',
    },
    subtitle: {
        fontSize: 9,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
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
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 11,
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
        padding: 6,
        fontSize: 8,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    headerCell: {
        padding: 6,
        fontSize: 8,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    colName: { width: '28%' },
    colPhone: { width: '18%' },
    colAmt: { width: '18%' },
    colProgress: { width: '36%' },
    footer: {
        marginTop: 14,
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const VehicleFinanceSubscriberWiseOutstandingDuePDF = ({
    subscribers = [],
    generatedAt,
    asOfDate,
    totals = {},
}) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.title}>Subscriber Wise Outstanding Due</Text>
            <Text style={styles.subtitle}>
                As of {asOfDate || 'now'}
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
                    <Text style={[styles.headerCell, styles.colName]}>Subscriber Name</Text>
                    <Text style={[styles.headerCell, styles.colPhone]}>Phone Number</Text>
                    <Text style={[styles.headerCell, styles.colAmt]}>Total Due</Text>
                    <Text style={[styles.headerCell, styles.colProgress]}>Progress</Text>
                </View>

                {subscribers.map((row, index) => {
                    const isCumulative = Boolean(row.isCumulative);
                    return (
                        <View
                            key={row.subscriberId || index}
                            style={[styles.tableRow, isCumulative ? { backgroundColor: '#f3f4f6' } : null]}
                        >
                            <Text style={[styles.cell, styles.colName, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {row.subscriberName || '-'}
                            </Text>
                            <Text style={[styles.cell, styles.colPhone]}>{row.phoneNumber || ''}</Text>
                            <Text style={[styles.cell, styles.colAmt, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {formatMoney(row.totalDue)}
                            </Text>
                            <Text style={[styles.cell, styles.colProgress, isCumulative ? { fontWeight: 'bold' } : null]}>
                                {row.progress || ''}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.footer}>
                {Math.max(0, subscribers.filter((row) => !row.isCumulative).length)} subscriber(s) · last row is cumulative
            </Text>
        </Page>
    </Document>
);

export default VehicleFinanceSubscriberWiseOutstandingDuePDF;
