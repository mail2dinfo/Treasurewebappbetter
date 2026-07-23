import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';



const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  companyAddress: {
    fontSize: 9,
    marginTop: 2,
  },
  registration: {
    fontSize: 8,
    marginTop: 2,
    fontStyle: 'italic',
  },
});


const PDFHeader = ({ companyData, base64Logo }) => {


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
  } = companyData || {};

  const address = [street_address, city, [state, zipcode].filter(Boolean).join(' - '), country]
    .filter((part) => part != null && String(part).trim() !== '')
    .join(', ');

  return (
    
    <View style={styles.headerContainer}>
      {logo_base64format && <Image style={styles.logo} src={logo_base64format} />}
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{name}</Text>
        {address ? <Text style={styles.companyAddress}>{address}</Text> : null}
        {(registration_no || company_since) ? (
          <Text style={styles.registration}>
            {[registration_no ? `Reg No: ${registration_no}` : null, company_since ? `Since: ${company_since}` : null]
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
