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
    intro: { marginBottom: 8 },
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
    detailRow: { flexDirection: 'row', marginBottom: 6 },
    detailLabel: { width: '32%', fontWeight: 'bold', color: '#374151' },
    detailValue: { width: '68%' },
    bullet: { flexDirection: 'row', marginBottom: 5, paddingLeft: 4 },
    bulletDot: { width: 12, color: '#dc2626', marginTop: 1 },
    bulletText: { flex: 1 },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
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

const ROLE_DESIGNATION = {
    MANAGER: 'Manager',
    COLLECTOR: 'Collector',
    ACCOUNTANT: 'Accountant',
};

const resolveDesignation = (letterData = {}) => {
    if (letterData.designation) return letterData.designation;
    if (letterData.roleLabel && ROLE_DESIGNATION[String(letterData.roleLabel).toUpperCase()]) {
        return ROLE_DESIGNATION[String(letterData.roleLabel).toUpperCase()];
    }
    if (letterData.roleLabel) return letterData.roleLabel;
    const roleCode = String(letterData.employee?.role || '').toUpperCase();
    if (ROLE_DESIGNATION[roleCode]) return ROLE_DESIGNATION[roleCode];
    const fromRoles = (letterData.employee?.roles || letterData.roleLabels || [])
        .map((role) => ROLE_DESIGNATION[String(role).toUpperCase()] || null)
        .find(Boolean);
    return fromRoles || 'Employee';
};

const prepareCompanyData = (company) => {
    if (!company) {
        return {
            name: 'MyTreasure Chit Fund',
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
        company.logo_base64format ||
        company.logo_s3_image ||
        company.company_logo_base64format ||
        company.company_logo_s3_image ||
        company.company_logo ||
        company.logo ||
        '';

    return {
        name: company.company_name || company.name || 'MyTreasure Chit Fund',
        logo_base64format: logo,
        phone: company.phone || company.contact_no || '',
        street_address: company.street_address || company.address || '',
        city: company.city || '',
        state: company.state || '',
        zipcode: company.zipcode || '',
        country: company.country || '',
        email: company.email || '',
        registration_no: company.registration_no || '',
        company_since: company.company_since || '',
    };
};

const ChitFundOfferLetterPDF = ({ letterData }) => {
    const {
        employee = {},
        company = {},
        responsibilities = [],
        issueDate = '',
        joinDate = '',
        salaryText = '',
    } = letterData || {};
    const companyData = prepareCompanyData(company);
    const companyName = companyData.name;
    const displayRole = resolveDesignation(letterData);
    const dutyList = responsibilities.length
        ? responsibilities
        : ['Perform assigned Chit Fund duties as directed by company management.'];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PDFHeader companyData={companyData} />
                <Text style={styles.title}>Offer Letter</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{issueDate}</Text>
                </View>
                <Text style={{ marginVertical: 10 }}>Dear {employee.name || 'Employee'},</Text>
                <Text style={styles.intro}>
                    We are pleased to offer you the position of{' '}
                    <Text style={{ fontWeight: 'bold' }}>{displayRole}</Text> in our Chit Fund division
                    at {companyName}. Your appointment and duties are detailed below.
                </Text>

                <Text style={styles.sectionTitle}>Appointment Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Designation</Text>
                    <Text style={styles.detailValue}>{displayRole}</Text>
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
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.detailValue}>
                        {employee.mobile || 'N/A'} | {employee.email || 'N/A'}
                    </Text>
                </View>
                {employee.employee_code ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employee Code</Text>
                        <Text style={styles.detailValue}>{employee.employee_code}</Text>
                    </View>
                ) : null}

                <Text style={styles.sectionTitle}>Roles & Responsibilities</Text>
                <Text style={{ marginBottom: 8, color: '#374151' }}>
                    As {displayRole}, you shall be responsible for the following duties:
                </Text>
                {dutyList.map((item, index) => (
                    <View key={`${index}-${String(item).slice(0, 24)}`} style={styles.bullet}>
                        <Text style={styles.bulletDot}>{index + 1}.</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                    </View>
                ))}

                <Text style={{ marginTop: 12 }}>
                    You are expected to follow company policies, maintain confidentiality of customer and business information,
                    and report regularly to the reporting authority.
                </Text>
                <Text style={{ marginTop: 8 }}>We look forward to your contribution to our team.</Text>

                <View style={styles.signatureRow}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Employee Signature</Text>
                            <Text style={styles.signatureName}>{employee.name || ''}</Text>
                        </View>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                            <Text style={styles.signatureName}>{companyName}</Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.footerNote}>
                    This is a system-generated offer letter from {companyName}.
                </Text>
            </Page>
        </Document>
    );
};

export default ChitFundOfferLetterPDF;
