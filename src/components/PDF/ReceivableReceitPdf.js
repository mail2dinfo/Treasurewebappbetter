import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from './PDFHeader'; // Your existing header component
import { PDF_UNICODE_FONT } from './registerPdfUnicodeFont';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: PDF_UNICODE_FONT,
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
    rightAlignedText: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    billDateInline: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerMetaColumn: {
        alignItems: 'flex-end',
    },
    fieldGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    lineTable: {
        marginTop: 8,
        marginBottom: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    lineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    lineRowLast: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#f3f4f6',
    },
    lineLabel: {
        fontSize: 10,
        color: '#111',
    },
    lineAmount: {
        fontSize: 10,
        color: '#111',
        fontWeight: 'bold',
    },
    fieldBox: {
        width: '48%',
        marginBottom: 12,
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 10,
        marginBottom: 4,
    },
    value: {
        fontSize: 10,
        color: '#000',
    },
    footer: {
        marginTop: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#777',
    },
});

const Field = ({ label, value }) => {
    const displayValue =
        value !== undefined && value !== null && value !== ''
            ? String(value)
            : '-';

    return (
        <View style={styles.fieldBox}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{displayValue}</Text>
        </View>
    );
};

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '-';
    return `Rs. ${Number(amount).toLocaleString('en-IN')}`;
};




const ReceivableReceitPdf = ({ receivableData = {}, companyData = {} }) => {
    const today = new Date().toLocaleDateString();
    const billNumberRaw = receivableData.billNumber ?? receivableData.receiptId;
    const billNumber =
        billNumberRaw !== undefined && billNumberRaw !== null && billNumberRaw !== ''
            ? String(billNumberRaw)
            : '-';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <PDFHeader companyData={companyData} />

                {/* Section Title with Date */}
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Receivable Details</Text>
                    <View style={styles.headerMetaColumn}>
                        <Text style={styles.billDateInline}>Billno: {billNumber}</Text>
                        <Text style={styles.billDateInline}>Bill Date: {today}</Text>
                    </View>
                </View>

                {/* Data Fields */}
                <View style={styles.fieldGrid}>
                    <Field label="Name" value={receivableData.subscriberName} />
                    <Field label="Payment Type" value={receivableData.paymentType} />
                    <Field label="Payment Method" value={receivableData.paymentMethod} />
                    <Field label="Group Name" value={receivableData.groupName} />
                    {receivableData.dueNo && receivableData.dueNo !== '—' && !receivableData.lineItems?.length ? (
                        <Field label="Due no." value={receivableData.dueNo} />
                    ) : null}
                    <Field label="Auction Date" value={receivableData.auctionDate} />
                    <Field label="Transacted Date" value={receivableData.transactedDate || receivableData.transacted_date || '-'} />
                    <Field label="Created At" value={receivableData.createdAt || receivableData.created_at || '-'} />
                    {!receivableData.lineItems?.length ? (
                    <Field
                        label="Total Bill"
                        value={formatCurrency(receivableData.paymentAmount)}
                    />
                    ) : null}
                </View>

                {Array.isArray(receivableData.lineItems) && receivableData.lineItems.length > 0 ? (
                    <View style={styles.lineTable}>
                        {receivableData.lineItems.map((line) => (
                            <View key={line.key || line.label} style={styles.lineRow}>
                                <Text style={styles.lineLabel}>{line.label}</Text>
                                <Text style={styles.lineAmount}>{formatCurrency(line.amount)}</Text>
                            </View>
                        ))}
                        <View style={styles.lineRowLast}>
                            <Text style={styles.lineLabel}>Total</Text>
                            <Text style={styles.lineAmount}>
                                {formatCurrency(receivableData.lineTotal ?? receivableData.paymentAmount)}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {/* Footer Note */}
                <Text style={styles.footer}>Thank you for your payment!</Text>
            </Page>
        </Document>
    );
};

export default ReceivableReceitPdf;
