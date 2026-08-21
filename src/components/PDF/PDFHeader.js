import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PDF_UNICODE_FONT, registerPdfUnicodeFont } from './registerPdfUnicodeFont';

registerPdfUnicodeFont();

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    fontFamily: PDF_UNICODE_FONT,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: PDF_UNICODE_FONT,
  },
  companyName: {
    fontFamily: PDF_UNICODE_FONT,
    fontSize: 13,
  },
  companyAddress: {
    fontFamily: PDF_UNICODE_FONT,
    fontSize: 9,
    marginTop: 2,
  },
  registration: {
    fontFamily: PDF_UNICODE_FONT,
    fontSize: 8,
    marginTop: 2,
  },
});

const formatSinceDate = (value) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const PDFHeader = ({ companyData, base64Logo }) => {
  const source = Array.isArray(companyData) ? companyData[0] : companyData;
  const {
    logo_base64format,
    name,
    registration_no,
    company_since,
    street_address,
    city,
    state,
    zipcode,
    country,
    email,
    phone,
  } = source || {};

  const address = [street_address, city, [state, zipcode].filter(Boolean).join(' - '), country]
    .filter((part) => part != null && String(part).trim() !== '')
    .join(', ');
  const sinceDate = formatSinceDate(company_since);

  return (
    <View style={styles.headerContainer}>
      {logo_base64format && <Image style={styles.logo} src={logo_base64format} />}
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{name}</Text>
        {address ? <Text style={styles.companyAddress}>{address}</Text> : null}
        {(registration_no || sinceDate) ? (
          <Text style={styles.registration}>
            {[registration_no ? `Reg No: ${registration_no}` : null, sinceDate ? `Since: ${sinceDate}` : null]
              .filter(Boolean)
              .join(' | ')}
          </Text>
        ) : null}
        {(email || phone) ? (
          <Text style={styles.companyAddress}>
            {[email ? `Email: ${email}` : null, phone ? `Phone: ${phone}` : null]
              .filter(Boolean)
              .join(' | ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default PDFHeader;
