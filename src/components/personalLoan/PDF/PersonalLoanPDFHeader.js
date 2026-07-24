import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    logo: {
        width: 60,
        height: 60,
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    companyAddress: {
        fontSize: 9,
        marginTop: 2,
        color: '#374151',
    },
    registration: {
        fontSize: 8,
        marginTop: 2,
        fontStyle: 'italic',
        color: '#6b7280',
    },
    reportInfo: {
        textAlign: 'right',
        fontSize: 10,
        maxWidth: 120,
    },
    reportTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#dc2626',
    },
    reportDate: {
        fontSize: 8,
        color: '#666',
    },
});

/**
 * Personal Loan PDF header — company logo, name, address, phone/email.
 * Accepts PL company fields and chit-fund / generic fallbacks.
 */
const PersonalLoanPDFHeader = ({ companyData, reportTitle, reportDate }) => {
    const c = companyData || {};

    const logo =
        c.company_logo_base64format
        || c.logo_base64format
        || c.company_logo_s3_image
        || c.company_logo
        || null;

    const companyName =
        c.company_name
        || c.name
        || 'Personal Loan Company';

    const phone = c.contact_no || c.phone || '';
    const email = c.email || '';
    const registrationNo = c.registration_no || '';
    const companySince = c.company_since || '';

    const addressFromParts = [c.street_address, c.city, [c.state, c.zipcode].filter(Boolean).join(' - '), c.country]
        .filter((part) => part != null && String(part).trim() !== '')
        .join(', ');
    const companyAddress = (c.address && String(c.address).trim()) || addressFromParts || '';

    return (
        <View style={styles.headerContainer}>
            {logo ? <Image style={styles.logo} src={logo} /> : <View style={{ width: 60 }} />}
            <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{companyName}</Text>
                {companyAddress ? <Text style={styles.companyAddress}>{companyAddress}</Text> : null}
                {(registrationNo || companySince) ? (
                    <Text style={styles.registration}>
                        {[
                            registrationNo ? `Reg No: ${registrationNo}` : null,
                            companySince ? `Since: ${companySince}` : null,
                        ].filter(Boolean).join(' | ')}
                    </Text>
                ) : null}
                {(email || phone) ? (
                    <Text style={styles.companyAddress}>
                        {[
                            email ? `Email: ${email}` : null,
                            phone ? `Phone: ${phone}` : null,
                        ].filter(Boolean).join(' | ')}
                    </Text>
                ) : null}
            </View>
            <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{reportTitle || 'Personal Loan'}</Text>
                <Text style={styles.reportDate}>
                    Generated: {reportDate || new Date().toLocaleDateString('en-IN')}
                </Text>
            </View>
        </View>
    );
};

export default PersonalLoanPDFHeader;
