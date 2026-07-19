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
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1f2937',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        paddingVertical: 3,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    infoValue: {
        fontSize: 10,
        color: '#111827',
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
        padding: 4,
        fontSize: 7,
    },
    tableHeaderCell: {
        padding: 4,
        fontSize: 8,
        fontWeight: 'bold',
        backgroundColor: '#f3f4f6',
    },
    // Column widths - adjust based on whether interest column is shown
    paymentDateCell: { width: '13%' },
    principalCell: { width: '13%' },
    interestCell: { width: '13%' },
    totalCell: { width: '13%' },
    modeCell: { width: '16%' },
    cumulativeCell: { width: '16%' },
    remainingCell: { width: '16%' },
    // For INTEREST_FREE (no interest column), widths will be recalculated
    paymentDateCellNoInterest: { width: '15%' },
    principalCellNoInterest: { width: '15%' },
    totalCellNoInterest: { width: '15%' },
    modeCellNoInterest: { width: '18%' },
    cumulativeCellNoInterest: { width: '18%' },
    remainingCellNoInterest: { width: '19%' },
    summaryBox: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1e40af',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '48%',
        marginBottom: 5,
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

// Format currency for PDF
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

const VehicleFinanceDetailsPDF = ({ loanData = {}, companyData = {} }) => {
    const loan = loanData || {};
    const receipts = loan.receipts || [];
    const subscriber = loan.subscriber || {};

    // Sort receipts by payment date (oldest first)
    const sortedReceipts = [...receipts].sort((a, b) => 
        new Date(a.payment_date) - new Date(b.payment_date)
    );

    // Calculate payment history with running totals
    let cumulativePrincipalPaid = 0;
    const principalAmount = parseFloat(loan.principal_amount || 0);
    
    const paymentHistory = sortedReceipts.map((receipt) => {
        const principalPaid = parseFloat(receipt.principal_paid || 0);
        cumulativePrincipalPaid += principalPaid;
        const remainingPrincipal = principalAmount - cumulativePrincipalPaid;
        
        return {
            ...receipt,
            cumulativePrincipalPaid,
            remainingPrincipal,
        };
    });

    // Calculate totals
    const totalPayments = receipts.length;
    const totalPrincipalPaid = receipts.reduce((sum, r) => sum + parseFloat(r.principal_paid || 0), 0);
    const totalInterestPaid = receipts.reduce((sum, r) => sum + parseFloat(r.interest_paid || 0), 0);
    const totalReceived = receipts.reduce((sum, r) => sum + parseFloat(r.received_amount || 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={companyData} />
                
                <Text style={styles.title}>Loan Details & Payment History</Text>
                <Text style={styles.subtitle}>
                    Generated on {new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                </Text>

                {/* Loan Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loan Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Subscriber Name:</Text>
                        <Text style={styles.infoValue}>{subscriber.vf_cust_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{subscriber.vf_cust_phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Principal Amount:</Text>
                        <Text style={styles.infoValue}>{formatCurrency(loan.principal_amount)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Outstanding Principal:</Text>
                        <Text style={styles.infoValue}>{formatCurrency(loan.outstanding_principal)}</Text>
                    </View>
                    {loan.loan_mode === 'INTEREST_ONLY' && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Outstanding Interest:</Text>
                            <Text style={styles.infoValue}>{formatCurrency(loan.outstanding_interest)}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Loan Mode:</Text>
                        <Text style={styles.infoValue}>
                            {loan.loan_mode === 'INTEREST_FREE' ? 'Interest-Free' : 'Interest-Only'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Disbursed Date:</Text>
                        <Text style={styles.infoValue}>{formatDate(loan.disbursed_date)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={styles.infoValue}>{loan.status || 'ACTIVE'}</Text>
                    </View>
                </View>

                {/* Payment Summary */}
                {receipts.length > 0 && (
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryTitle}>Payment Summary</Text>
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.infoLabel}>Total Payments:</Text>
                                <Text style={styles.infoValue}>{totalPayments}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.infoLabel}>Total Principal Paid:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(totalPrincipalPaid)}</Text>
                            </View>
                            {loan.loan_mode === 'INTEREST_ONLY' && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.infoLabel}>Total Interest Paid:</Text>
                                    <Text style={styles.infoValue}>{formatCurrency(totalInterestPaid)}</Text>
                                </View>
                            )}
                            <View style={styles.summaryItem}>
                                <Text style={styles.infoLabel}>Total Received:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(totalReceived)}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.infoLabel}>Remaining Principal:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(loan.outstanding_principal)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment History */}
                {paymentHistory.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment History</Text>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.paymentDateCell : styles.paymentDateCellNoInterest]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.principalCell : styles.principalCellNoInterest]}>Principal</Text>
                                {loan.loan_mode === 'INTEREST_ONLY' && (
                                    <Text style={[styles.tableHeaderCell, styles.interestCell]}>Interest</Text>
                                )}
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.totalCell : styles.totalCellNoInterest]}>Total</Text>
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.modeCell : styles.modeCellNoInterest]}>Mode</Text>
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.cumulativeCell : styles.cumulativeCellNoInterest]}>Cumulative</Text>
                                <Text style={[styles.tableHeaderCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.remainingCell : styles.remainingCellNoInterest]}>Remaining</Text>
                            </View>

                            {/* Table Rows */}
                            {paymentHistory.map((receipt, index) => (
                                <View key={receipt.id || index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.paymentDateCell : styles.paymentDateCellNoInterest]}>
                                        {formatDate(receipt.payment_date)}
                                    </Text>
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.principalCell : styles.principalCellNoInterest]}>
                                        {formatCurrency(receipt.principal_paid)}
                                    </Text>
                                    {loan.loan_mode === 'INTEREST_ONLY' && (
                                        <Text style={[styles.tableCell, styles.interestCell]}>
                                            {formatCurrency(receipt.interest_paid)}
                                        </Text>
                                    )}
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.totalCell : styles.totalCellNoInterest]}>
                                        {formatCurrency(receipt.received_amount)}
                                    </Text>
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.modeCell : styles.modeCellNoInterest]}>
                                        {receipt.payment_mode || 'N/A'}
                                    </Text>
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.cumulativeCell : styles.cumulativeCellNoInterest]}>
                                        {formatCurrency(receipt.cumulativePrincipalPaid)}
                                    </Text>
                                    <Text style={[styles.tableCell, loan.loan_mode === 'INTEREST_ONLY' ? styles.remainingCell : styles.remainingCellNoInterest]}>
                                        {formatCurrency(receipt.remainingPrincipal)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment History</Text>
                        <Text style={{ textAlign: 'center', marginTop: 10, fontSize: 10 }}>
                            No payments recorded yet
                        </Text>
                    </View>
                )}

                <Text style={styles.footer}>
                    This is a computer-generated document. No signature is required.
                </Text>
            </Page>
        </Document>
    );
};

export default VehicleFinanceDetailsPDF;
