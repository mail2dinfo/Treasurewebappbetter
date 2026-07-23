// components/pdf/GroupAccountsPdf.jsx
import React from 'react';
import {
    Document, Page, Text, View, StyleSheet
} from '@react-pdf/renderer';
import PDFHeader from './PDFHeader';

// PDF styles
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 10,
        fontFamily: 'Helvetica'
    },
    section: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottom: '1px solid #ccc',
    },
    heading: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textDecoration: 'underline',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 3,              // Tighter spacing between rows
        alignItems: 'flex-start',     // Align values at top of the line
    },
    label: {
        minWidth: 110,                // Fixed label width
        paddingRight: 8,              // Add spacing between label and value
        fontSize: 10,
        fontWeight: 'bold',
    },
    value: {
        fontSize: 10,
        flexShrink: 1,
        paddingLeft: 2,               // Optional slight gap from label
    },

    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        marginTop: 8,
    },
    tableRow: {
        flexDirection: 'row'
    },
    tableCellHeader: {
        flex: 1,
        padding: 4,
        fontWeight: 'bold',
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 10,
    },
    tableCell: {
        flex: 1,
        padding: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 10,
    }
});


// Format date utility
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
};

// Main PDF component
const GroupAccountsPdf = ({ data = {}, companyData = {} }) => {
    const { groupAccountResult, amount, commisionType, commissionAmount, groupName, type } = data.results;

    // Group Details section
    const renderGroupDetails = () => (
        <View style={styles.section}>
            <Text style={styles.heading}>Group Details</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{groupName || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{type || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>₹{amount || 0}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Commission Type:</Text>
                <Text style={styles.value}>{commisionType || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Commission:</Text>
                <Text style={styles.value}>₹{commissionAmount || 0}</Text>
            </View>
        </View>
    );

    // Table Headers
    const renderTableHeaders = () => {
        const t = String(type || '').toUpperCase();
        if (t === 'FIXED' || t === 'ADAPTIVE') {
            return ['S.No', 'Date', 'Due', 'Profit', 'Comm', 'Prize', 'AucAmt'];
        } else if (t === 'DEDUCTIVE') {
            return ['S.No', 'Date', 'AucAmt', 'Comm', 'Profit', 'Due'];
        } else if (t === 'ACCUMULATIVE') {
            return ['S.No', 'Date', 'AucAmt', 'Comm', 'Reserve', 'Due'];
        }
        return ['S.No', 'Date', 'AucAmt', 'Due'];
    };

    // Row rendering
    const renderRowData = (item, index) => {
        const {
            auctionDate, auctionAmount, commision, profit,
            customerDue, prizeMoney, reserve, sno
        } = item;
        const t = String(type || '').toUpperCase();

        if (t === 'FIXED' || t === 'ADAPTIVE') {
            return [
                sno ?? index + 1,
                formatDate(auctionDate),
                customerDue ?? 0,
                profit ?? 0,
                commision ?? 0,
                prizeMoney ?? 0,
                auctionAmount ?? 0
            ];
        } else if (t === 'DEDUCTIVE') {
            return [
                sno ?? index + 1,
                formatDate(auctionDate),
                auctionAmount ?? 0,
                commision ?? 0,
                profit ?? 0,
                customerDue ?? 0
            ];
        } else if (t === 'ACCUMULATIVE') {
            return [
                sno ?? index + 1,
                formatDate(auctionDate),
                auctionAmount ?? 0,
                commision ?? 0,
                reserve ?? 0,
                customerDue ?? 0
            ];
        }
        return [index + 1, formatDate(auctionDate), auctionAmount ?? 0, customerDue ?? 0];
    };

    // Group Accounts Table
    const renderGroupAccountsTable = () => (
        <View style={styles.section}>
            <Text style={styles.heading}>Group Accounts - {type}</Text>
            <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableRow}>
                    {renderTableHeaders().map((header, idx) => (
                        <Text key={idx} style={styles.tableCellHeader}>{header}</Text>
                    ))}
                </View>

                {/* Rows */}
                {groupAccountResult.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        {renderRowData(item, i).map((cell, j) => (
                            <Text key={j} style={styles.tableCell}>{cell}</Text>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={companyData} />
                {renderGroupDetails()}
                {renderGroupAccountsTable()}
            </Page>
        </Document>
    );
};

export default GroupAccountsPdf;
