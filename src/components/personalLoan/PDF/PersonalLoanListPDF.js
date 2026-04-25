import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from '../../PDF/PDFHeader';

const styles = StyleSheet.create({
    page: {
        paddingTop: 35,
        paddingBottom: 48,
        paddingHorizontal: 48,
        fontSize: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#dc2626',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 15,
        textAlign: 'center',
        color: '#666',
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginTop: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#bfbfbf',
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
    },
    tableCell: {
        width: '16.66%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        padding: 5,
        fontSize: 8,
    },
    tableHeaderCell: {
        width: '16.66%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        padding: 5,
        fontSize: 9,
        fontWeight: 'bold',
        backgroundColor: '#f3f4f6',
    },
    summary: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 48,
        right: 48,
        textAlign: 'center',
        fontSize: 8,
        color: '#666',
    },
});

// Format currency for PDF (use Rs. instead of ₹)
const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date for PDF
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const PersonalLoanListPDF = ({ loans = [], companyData = {} }) => {
    const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
    const totalLoans = activeLoans.length;
    const totalDisbursed = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.principal_amount || 0), 0);
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.total_outstanding || 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={companyData} />
                
                <Text style={styles.title}>Active Loans Report</Text>
                <Text style={styles.subtitle}>
                    Generated on {new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                </Text>

                {activeLoans.length > 0 ? (
                    <>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={styles.tableHeaderCell}>Subscriber</Text>
                                <Text style={styles.tableHeaderCell}>Loan Amount</Text>
                                <Text style={styles.tableHeaderCell}>Outstanding</Text>
                                <Text style={styles.tableHeaderCell}>Mode</Text>
                                <Text style={styles.tableHeaderCell}>Disbursed Date</Text>
                                <Text style={styles.tableHeaderCell}>Status</Text>
                            </View>

                            {/* Table Rows */}
                            {activeLoans.map((loan, index) => (
                                <View key={loan.id || index} style={styles.tableRow}>
                                    <Text style={styles.tableCell}>
                                        {loan.subscriber?.pl_cust_name || 'N/A'}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {formatCurrency(loan.principal_amount)}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {formatCurrency(loan.total_outstanding)}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {loan.loan_mode === 'INTEREST_FREE' ? 'Interest-Free' : 'Interest-Only'}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {formatDate(loan.disbursed_date)}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {loan.status || 'ACTIVE'}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Summary */}
                        <View style={styles.summary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Active Loans:</Text>
                                <Text style={styles.summaryValue}>{totalLoans}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Disbursed:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(totalDisbursed)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Outstanding:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(totalOutstanding)}</Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>
                        No active loans found
                    </Text>
                )}

                <Text style={styles.footer}>
                    This is a computer-generated document. No signature is required.
                </Text>
            </Page>
        </Document>
    );
};

export default PersonalLoanListPDF;
