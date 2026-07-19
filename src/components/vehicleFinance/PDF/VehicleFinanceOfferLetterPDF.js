import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from '../../PDF/PDFHeader';

const styles = StyleSheet.create({
    page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5 },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#dc2626',
        marginBottom: 18,
        textTransform: 'uppercase',
    },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    metaLabel: { fontWeight: 'bold', color: '#374151' },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#991b1b',
        marginTop: 14,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
        paddingBottom: 4,
    },
    bullet: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
    bulletDot: { width: 12, color: '#dc2626' },
    bulletText: { flex: 1 },
    detailRow: { flexDirection: 'row', marginBottom: 6 },
    detailLabel: { width: '32%', fontWeight: 'bold', color: '#374151' },
    detailValue: { width: '68%' },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 48,
        paddingTop: 8,
    },
    signatureBox: { width: '44%' },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#111',
        marginTop: 36,
        paddingTop: 6,
    },
    signatureLabel: { fontSize: 9, fontWeight: 'bold' },
    signatureName: { fontSize: 9, marginTop: 2, color: '#374151' },
    footerNote: { marginTop: 24, fontSize: 8, color: '#6b7280', textAlign: 'center' },
});

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
        name: company.company_name || 'MyTreasure Vehicle Finance',
        logo_base64format: logo,
        phone: company.contact_no || '',
        street_address: company.address || '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        email: company.email || '',
        registration_no: company.registration_no || '',
        company_since: company.company_since || '',
    };
};

const VehicleFinanceOfferLetterPDF = ({ letterData }) => {
    const {
        employee = {},
        company,
        responsibilities = [],
        roleLabel = '',
        issueDate = '',
        joinDate = '',
        salaryText = '',
    } = letterData || {};

    const companyData = prepareCompanyData(company);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={companyData} />
                <Text style={styles.title}>Offer Letter</Text>

                <View style={styles.metaRow}>
                    <Text>
                        <Text style={styles.metaLabel}>Date: </Text>
                        {issueDate}
                    </Text>
                    <Text>
                        <Text style={styles.metaLabel}>Ref: </Text>
                        VF/OL/{employee.id?.slice(0, 8) || 'NEW'}
                    </Text>
                </View>

                <Text>Dear {employee.name},</Text>
                <Text style={{ marginTop: 10 }}>
                    We are pleased to offer you employment with {companyData.name} for the position
                    of {roleLabel || employee.role} in our Vehicle Finance division. The terms of
                    your appointment are outlined below.
                </Text>

                <Text style={styles.sectionTitle}>Appointment Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Employee Name</Text>
                    <Text style={styles.detailValue}>{employee.name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{roleLabel || employee.role}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Joining</Text>
                    <Text style={styles.detailValue}>{joinDate}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Salary</Text>
                    <Text style={styles.detailValue}>{salaryText} per month</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile</Text>
                    <Text style={styles.detailValue}>{employee.mobile || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{employee.email || 'N/A'}</Text>
                </View>

                <Text style={styles.sectionTitle}>Roles &amp; Responsibilities</Text>
                {responsibilities.length > 0 ? (
                    responsibilities.map((item, index) => (
                        <View key={index} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))
                ) : (
                    <Text>No specific responsibilities assigned.</Text>
                )}

                <Text style={{ marginTop: 14 }}>
                    We welcome you to our team and look forward to a successful association. Please
                    sign below to accept this offer.
                </Text>

                <View style={styles.signatureRow}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Employee Signature</Text>
                            <Text style={styles.signatureName}>{employee.name}</Text>
                        </View>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                            <Text style={styles.signatureName}>{companyData.name}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.footerNote}>
                    This is a system-generated offer letter from MyTreasure Vehicle Finance.
                </Text>
            </Page>
        </Document>
    );
};

export default VehicleFinanceOfferLetterPDF;
