import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from '../PDF/PDFHeader';
import PDFTable from '../PDF/PDFTable';
import { PDF_UNICODE_FONT, registerPdfUnicodeFont } from '../PDF/registerPdfUnicodeFont';

registerPdfUnicodeFont();

const styles = StyleSheet.create({
    page: {
        paddingTop: 28,
        paddingBottom: 36,
        paddingHorizontal: 28,
        fontFamily: PDF_UNICODE_FONT,
    },
    subscriberBox: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    label: {
        fontSize: 9,
        color: '#616161',
        marginBottom: 2,
        fontFamily: PDF_UNICODE_FONT,
    },
    name: {
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 4,
        fontFamily: PDF_UNICODE_FONT,
    },
    line: {
        fontSize: 10,
        color: '#424242',
        marginBottom: 2,
        fontFamily: PDF_UNICODE_FONT,
    },
});

const DeepavaliSubscriberDuesPDF = ({
    companyData,
    subscriberName,
    subscriberPhone,
    groupName,
    slotCount,
    tableData,
    tableHeaders,
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <PDFHeader companyData={companyData} />
            <View style={styles.subscriberBox}>
                <Text style={styles.label}>Subscriber details</Text>
                <Text style={styles.name}>{subscriberName || '—'}</Text>
                <Text style={styles.line}>Phone: {subscriberPhone || '—'}</Text>
                {groupName ? <Text style={styles.line}>Group: {groupName}</Text> : null}
                {slotCount > 1 ? <Text style={styles.line}>Slots: {slotCount} combined</Text> : null}
            </View>
            <PDFTable
                heading="Due details"
                tableHeaders={tableHeaders}
                data={tableData}
            />
        </Page>
    </Document>
);

export default DeepavaliSubscriberDuesPDF;
