import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from '../../PDF/PDFHeader';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#003366',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerMetaColumn: {
        alignItems: 'flex-end',
    },
    billDateInline: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    blockTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 10,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 4,
    },
    fieldGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    fieldBox: {
        width: '48%',
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 9,
        marginBottom: 3,
    },
    value: {
        fontSize: 10,
        color: '#000',
    },
    footer: {
        marginTop: 28,
        textAlign: 'center',
        fontSize: 10,
        color: '#777',
        fontStyle: 'italic',
    },
});

const Field = ({ label, value }) => (
    <View style={styles.fieldBox}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
            {value !== undefined && value !== null && value !== '' ? String(value) : '-'}
        </Text>
    </View>
);

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '-';
    const num = Number(amount);
    if (Number.isNaN(num)) return '-';
    return `Rs. ${num.toLocaleString('en-IN')}`;
};

const prepareCompanyData = (company) => {
    if (!company) {
        return {
            name: 'MyTreasure Vehicle Finance',
            logo_base64format: '',
            phone: '',
            street_address: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            email: '',
            registration_no: '',
            company_since: '',
        };
    }
    const logo =
        company.company_logo_base64format ||
        company.company_logo_s3_image ||
        company.company_logo ||
        '';
    return {
        name: company.company_name || company.name || 'MyTreasure Vehicle Finance',
        logo_base64format: logo,
        phone: company.contact_no || company.phone || '',
        street_address: company.address || company.street_address || '',
        city: company.city || '',
        state: company.state || '',
        zipcode: company.zipcode || '',
        country: company.country || '',
        email: company.email || '',
        registration_no: company.registration_no || '',
        company_since: company.company_since || '',
    };
};

const VehicleFinanceCollectionReceiptPDF = ({ receiptData = {}, companyData = {} }) => {
    const company = prepareCompanyData(companyData);
    const billDate = receiptData.paymentDate
        ? new Date(receiptData.paymentDate).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');
    const billNumber = receiptData.billNumber || receiptData.receiptId || '-';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={company} />

                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Payment Receipt</Text>
                    <View style={styles.headerMetaColumn}>
                        <Text style={styles.billDateInline}>Bill No: {billNumber}</Text>
                        <Text style={styles.billDateInline}>Bill Date: {billDate}</Text>
                    </View>
                </View>

                <Text style={styles.blockTitle}>Subscriber & Loan Details</Text>
                <View style={styles.fieldGrid}>
                    <Field label="Subscriber Name" value={receiptData.subscriberName} />
                    <Field label="Phone" value={receiptData.subscriberPhone} />
                    <Field label="Vehicle" value={receiptData.vehicleLabel} />
                    <Field label="Vehicle Number" value={receiptData.vehicleNumber} />
                    <Field label="Loan Amount" value={formatCurrency(receiptData.loanAmount)} />
                    <Field label="Interest" value={formatCurrency(receiptData.interestAmount)} />
                    <Field label="Total Due (Principal + Interest)" value={formatCurrency(receiptData.totalRepayAmount)} />
                    <Field label="Repayment Mode" value={receiptData.repaymentMode} />
                    <Field label="Disbursed Date" value={receiptData.disbursedDate} />
                    <Field label="Outstanding After Payment" value={formatCurrency(receiptData.outstandingAfter)} />
                </View>

                <Text style={styles.blockTitle}>Due & Payment Details</Text>
                <View style={styles.fieldGrid}>
                    <Field label="Due Date" value={receiptData.dueDate} />
                    <Field label="Due Amount" value={formatCurrency(receiptData.dueAmount)} />
                    <Field label="Amount Paid" value={formatCurrency(receiptData.amountPaid)} />
                    <Field label="Payment Type" value={receiptData.paymentType} />
                    <Field label="Payment Method" value={receiptData.paymentMethod} />
                    <Field label="Payment Date" value={receiptData.paymentDateFormatted || billDate} />
                    {receiptData.remainingAmount > 0 && (
                        <Field label="Remaining / Carry Forward" value={formatCurrency(receiptData.remainingAmount)} />
                    )}
                    <Field label="Notes" value={receiptData.notes || '-'} />
                </View>

                <Text style={styles.footer}>Thank you for your payment!</Text>
            </Page>
        </Document>
    );
};

export default VehicleFinanceCollectionReceiptPDF;
