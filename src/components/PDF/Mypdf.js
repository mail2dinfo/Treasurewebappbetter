import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import PDFTable from './PDFTable';
import PDFHeader from './PDFHeader';

const styles = StyleSheet.create({
    page: {
        paddingTop: 35,
        paddingBottom: 48,
        paddingHorizontal: 48,
        boxSizing: "border-box",
    },
    heading: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    logo: {
        width: '20%',
        padding: 10,
    },
});



const Mypdf = ({ tableData, tableHeaders, heading, companyData = {} }) => {
    // Add safety checks for required props
    const safeTableData = Array.isArray(tableData) ? tableData : [];
    const safeTableHeaders = Array.isArray(tableHeaders) ? tableHeaders : [];
    const safeHeading = heading || "Report";
    const safeCompanyData = companyData || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={safeCompanyData} />
                <View>
                    <PDFTable
                        tableHeaders={safeTableHeaders}
                        data={safeTableData}
                        heading={safeHeading}
                    />
                </View>
            </Page>
        </Document>
    );
};

export default Mypdf;
