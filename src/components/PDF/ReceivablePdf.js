import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from './PDFHeader'; // Keep this as your existing header component
import { PDF_UNICODE_FONT } from './registerPdfUnicodeFont';


const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: PDF_UNICODE_FONT,
        lineHeight: 1.4,
    },
    headerSpacing: {
        marginBottom: 12,
    },
    billDateContainer: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        border: '1pt solid #444',
        borderRadius: 4,
        backgroundColor: '#f4f4f4',
    },
    billDateLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    billDateValue: {
        fontSize: 10,
        fontWeight: 500,
    },
    sectionTitleContainer: {
        backgroundColor: '#003366',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 12,
        borderRadius: 4,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
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
        fontSize: 10,
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        color: '#000',
    },
});

const Field = ({ label, value }) => (
    <View style={styles.fieldBox}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
);

const ReceivablePdf = ({ receivableData = {}, companyData = {} }) => {
    const today = new Date().toLocaleDateString();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <PDFHeader companyData={companyData} />



                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Receivable Details</Text>
                    <View style={styles.rightAlignedText}>
                        <Text style={styles.billDateInline}>Bill Date: {today}</Text>
                    </View>
                </View>



                {/* Data Fields */}
                <View style={styles.fieldGrid}>
                    <Field label="Name" value={receivableData.name} />
                    <Field label="Phone" value={receivableData.phone} />
                    <Field label="Group Name" value={receivableData.group_name} />
                    <Field label="Auction Date" value={receivableData.auct_date} />
                    <Field label="Total Bill" value={receivableData.rbtotal} />
                    <Field label="Amount Paid" value={receivableData.rbpaid} />
                    <Field label="Due Amount" value={receivableData.rbdue} />
                </View>
            </Page>
        </Document>
    );
};

export default ReceivablePdf;
