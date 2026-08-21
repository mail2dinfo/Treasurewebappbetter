import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import PDFHeader from './PDFHeader';
import { PDF_UNICODE_FONT } from './registerPdfUnicodeFont';


const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: PDF_UNICODE_FONT,
  },
  sectionHeadingContainer: {
    backgroundColor: '#000000',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  personalSectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personalFields: {
    flex: 1,
    marginRight: 10,
  },
  imageContainer: {
    width: 100,
    alignItems: 'flex-end',
  },
  profileImage: {
    width: 100,
    height: 120,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1pt solid #000',
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldBox: {
    width: '48%',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  declarationText: {
    marginTop: 12,
    lineHeight: 1.2,
  },
  signatureRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const Field = ({ label, value }) => (
  <View style={styles.fieldBox}>
    <Text>
      <Text style={styles.label}>{label}:</Text> {value}
    </Text>
  </View>
);

const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};
const SubscriberProfilePdf = ({ subcriberData = {}, companyData = {}, base64Logo }) => {
  const {
    imageDetails ={},
    personalDetails = {},
    addressDetails = {},
    bankDetails = {},
    financeDetails = {},
    financials = {},
    nomineeDetails = {},
    businessDetails = {},
    dependents = {},
  } = subcriberData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader companyData={companyData} base64Logo={base64Logo} />

        {/* Personal Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Personal Details</Text>
        </View>

        <View style={styles.personalSectionContainer}>
          <View style={styles.personalFields}>
            <View style={styles.fieldGrid}>
              <Field label="Name" value={personalDetails.name} />
              <Field label="First Name" value={personalDetails.firstname} />
              <Field label="Last Name" value={personalDetails.lastname} />
              <Field label="Email" value={personalDetails.email} />
              <Field label="Phone" value={personalDetails.phone} />
              <Field label="DOB" value={formatDate(personalDetails.dob)} />
              <Field label="Age" value={personalDetails.age} />
              <Field label="Gender" value={personalDetails.gender} />
              <Field label="Date of Joining" value={formatDate(personalDetails.dateofjoining)} />
          <Field label="Source System" value={personalDetails.source_system} />
          <Field label="Marital Status" value={personalDetails.maritalStatus} />
          <Field label="Education" value={personalDetails.education} />
          <Field label="Nationality" value={personalDetails.nationality} />
          <Field label="Region (AOB)" value={personalDetails.region} />
            </View>
          </View>
          {imageDetails.image && (
            <View style={styles.imageContainer}>
              <Image style={styles.profileImage} src={imageDetails.image} />
            </View>
          )}
        </View>

     
       

        {/* Address Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Address Details</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Street" value={addressDetails.street} />
          <Field label="Village" value={addressDetails.village} />
          <Field label="Taluk" value={addressDetails.taluk} />
          <Field label="District" value={addressDetails.district} />
          <Field label="Pincode" value={addressDetails.pincode} />
        </View>

        {/* Bank Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Bank Details</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Bank Name" value={bankDetails.bankName} />
          <Field label="Branch" value={bankDetails.branch} />
          <Field label="Account Number" value={bankDetails.accountNumber} />
          <Field label="IFSC Code" value={bankDetails.ifsc} />
        </View>

        {/* Finance Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Finance Details</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Occupation" value={financeDetails.occupation} />
          <Field label="Annual Income" value={financeDetails.annualIncome} />
          <Field label="Aadhar Number" value={financeDetails.adhar} />
          <Field label="PAN Number" value={financeDetails.pan} />
          <Field label="Total Paid" value={financials.totalPaid} />
          <Field label="Total Due" value={financials.totalDue} />
          <Field label="Total Advance" value={financials.totalAdvance} />
        </View>

        {/* Nominee Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Nominee Details</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Nominee" value={nomineeDetails.nominee} />
          <Field label="Relationship" value={nomineeDetails.relationship} />
        </View>

        {/* Business Details */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Business Details</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Business Type" value={businessDetails.businessType} />
          <Field label="Annual Turnover" value={businessDetails.annualTurnover} />
        </View>

        {/* Dependents */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Dependents</Text>
        </View>
        <View style={styles.fieldGrid}>
          <Field label="Spouse Name" value={dependents.spouse_name} />
          <Field label="Spouse DOB" value={dependents.spouse_dob} />
          <Field label="Spouse Age" value={dependents.spouse_age} />
        </View>

        {/* Declaration */}
        <View style={styles.sectionHeadingContainer}>
          <Text style={styles.sectionHeading}>Declaration</Text>
        </View>
        <Text style={styles.declarationText}>
          I hereby declare that the information provided above is true to the best of my knowledge. I understand and accept all the terms and conditions of this chit group.
        </Text>

        <View style={styles.signatureRow}>
          <Text>Customer Signature: ______________________</Text>
          <Text>Date: ________________</Text>
        </View>
      </Page>
    </Document>
  );
};
// const styles = StyleSheet.create({
//   page: {
//     paddingTop: 30,
//     paddingBottom: 30,
//     paddingHorizontal: 30,
//     fontSize: 9,
//   },
//   sectionHeadingContainer: {
//     backgroundColor: '#000000',
//     paddingVertical: 4,
//     paddingHorizontal: 6,
//     marginTop: 12,
//     marginBottom: 6,
//   },
//   imageContainer: {
//     alignItems: 'flex-end', // align photo to the right
//     marginBottom: 10,
//   },
//   profileImage: {
//     width: 100,       // passport-size ~35mm x 45mm scaled to px
//     height: 120,
//     objectFit: 'cover',
//     borderRadius: 4,
//     border: '1pt solid #000',
//   },
//   sectionHeading: {
//     color: '#FFFFFF',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   fieldGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   fieldBox: {
//     width: '48%',
//     marginBottom: 4,
//   },
//   label: {
//     fontWeight: 'bold',
//   },
//   declarationText: {
//     marginTop: 12,
//     lineHeight: 1.2,
//   },
//   signatureRow: {
//     marginTop: 20,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
// });



// const Field = ({ label, value }) => (
//   <View style={styles.fieldBox}>
//     <Text><Text style={styles.label}>{label}:</Text> {value}</Text>
//   </View>
// );

// const SubscriberProfilePdf = ({ subcriberData = {}, companyData = {}, base64Logo }) => {
//   const {
//     personalDetails = {},
//     addressDetails = {},
//     bankDetails = {},
//     financeDetails = {},
//     financials = {},
//     nomineeDetails = {},
//     businessDetails = {},
//     dependents = {},
//   } = subcriberData;

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <PDFHeader companyData={companyData} base64Logo={base64Logo} />

//         <View style={styles.sectionHeadingContainer}>
//   <Text style={styles.sectionHeading}>Personal Details</Text>
// </View>
// {/* Profile Image */}
// {personalDetails.image && (
//   <View style={styles.imageContainer}>
//     <Image style={styles.profileImage} src={personalDetails.image} />
//   </View>
// )}
//         <View style={styles.fieldGrid}>
//           <Field label="Name" value={personalDetails.name} />
//           <Field label="First Name" value={personalDetails.firstname} />
//           <Field label="Last Name" value={personalDetails.lastname} />
//           <Field label="Email" value={personalDetails.email} />
//           <Field label="Phone" value={personalDetails.phone} />
//           <Field label="DOB" value={personalDetails.dob} />
//           <Field label="Age" value={personalDetails.age} />
//           <Field label="Gender" value={personalDetails.gender} />
//           <Field label="Marital Status" value={personalDetails.maritalStatus} />
//           <Field label="Education" value={personalDetails.education} />
//           <Field label="Nationality" value={personalDetails.nationality} />
//           <Field label="Region (AOB)" value={personalDetails.region} />
//           <Field label="Date of Joining" value={personalDetails.dateofjoining} />
//           <Field label="Source System" value={personalDetails.source_system} />
//           <Field label="Full Address" value={personalDetails.address} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Address Details</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Street" value={addressDetails.street} />
//           <Field label="Village" value={addressDetails.village} />
//           <Field label="Taluk" value={addressDetails.taluk} />
//           <Field label="District" value={addressDetails.district} />
//           <Field label="Pincode" value={addressDetails.pincode} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Bank Details</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Bank Name" value={bankDetails.bankName} />
//           <Field label="Branch" value={bankDetails.branch} />
//           <Field label="Account Number" value={bankDetails.accountNumber} />
//           <Field label="IFSC Code" value={bankDetails.ifsc} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Finance Details</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Occupation" value={financeDetails.occupation} />
//           <Field label="Annual Income" value={financeDetails.annualIncome} />
//           <Field label="Aadhar Number" value={financeDetails.adhar} />
//           <Field label="PAN Number" value={financeDetails.pan} />
//           <Field label="Total Paid" value={financials.totalPaid} />
//           <Field label="Total Due" value={financials.totalDue} />
//           <Field label="Total Advance" value={financials.totalAdvance} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Nominee Details</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Nominee" value={nomineeDetails.nominee} />
//           <Field label="Relationship" value={nomineeDetails.relationship} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Business Details</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Business Type" value={businessDetails.businessType} />
//           <Field label="Annual Turnover" value={businessDetails.annualTurnover} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Dependents</Text>
//         </View>
//         <View style={styles.fieldGrid}>
//           <Field label="Spouse Name" value={dependents.spouse_name} />
//           <Field label="Spouse DOB" value={dependents.spouse_dob} />
//           <Field label="Spouse Age" value={dependents.spouse_age} />
//         </View>
//         <View style={styles.sectionHeadingContainer}>
//         <Text style={styles.sectionHeading}>Declaration</Text>
//         </View>
//         <Text style={styles.declarationText}>
//           I hereby declare that the information provided above is true to the best of my knowledge. I understand and accept all the terms and conditions of this chit group.
//         </Text>

//         <View style={styles.signatureRow}>
//           <Text>Customer Signature: ______________________</Text>
//           <Text>Date: ________________</Text>
//         </View>
//       </Page>
//     </Document>
//   );
// };

export default SubscriberProfilePdf;

// const styles = StyleSheet.create({
//   page: {
//     paddingTop: 35,
//     paddingBottom: 60,
//     paddingHorizontal: 48,
//     boxSizing: 'border-box',
//   },
//   sectionHeading: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginTop: 20,
//     marginBottom: 8,
//     textDecoration: 'underline',
//   },
//   fieldRow: {
//     flexDirection: 'row',
//     marginBottom: 6,
//   },
//   label: {
//     width: 150,
//     fontWeight: 'bold',
//     fontSize: 11,
//   },
//   value: {
//     fontSize: 11,
//   },
//   photo: {
//     width: 100,
//     height: 100,
//     borderRadius: 5,
//     marginRight: 20,
//   },
//   personalRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   declarationText: {
//     fontSize: 11,
//     marginTop: 30,
//     lineHeight: 1.5,
//   },
//   signatureRow: {
//     marginTop: 40,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
// });

// const Field = ({ label, value }) => (
//   <View style={styles.fieldRow}>
//     <Text style={styles.label}>{label}:</Text>
//     <Text style={styles.value}>{value}</Text>
//   </View>
// );

// const SubscriberProfilePdf = ({ subcriberData = {}, companyData = {}, base64Logo }) => {
//   const {
//     personalDetails = {},
//     addressDetails = {},
//     bankDetails = {},
//     financeDetails = {},
//     financials = {},
//     nomineeDetails = {},
//     businessDetails = {},
//     dependents = {},
//   } = subcriberData;

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <PDFHeader companyData={companyData} base64Logo={base64Logo} />

//         {/* Personal Details */}
//         <Text style={styles.sectionHeading}>Personal Details</Text>
       
//             <Field label="Name" value={personalDetails.name} />
//             <Field label="First Name" value={personalDetails.firstname} />
//             <Field label="Last Name" value={personalDetails.lastname} />
//             <Field label="Email" value={personalDetails.email} />
//             <Field label="Phone" value={personalDetails.phone} />
//             <Field label="DOB" value={personalDetails.dob} />
//             <Field label="Age" value={personalDetails.age} />
//             <Field label="Gender" value={personalDetails.gender} />
//             <Field label="Marital Status" value={personalDetails.maritalStatus} />
//             <Field label="Education" value={personalDetails.education} />
//             <Field label="Nationality" value={personalDetails.nationality} />
//             <Field label="Region (AOB)" value={personalDetails.region} />
//             <Field label="Date of Joining" value={personalDetails.dateofjoining} />
//             <Field label="Source System" value={personalDetails.source_system} />
//             <Field label="Full Address" value={personalDetails.address} />
         

//         {/* Address Details */}
//         <Text style={styles.sectionHeading}>Address Details</Text>
//         <Field label="Street" value={addressDetails.street} />
//         <Field label="Village" value={addressDetails.village} />
//         <Field label="Taluk" value={addressDetails.taluk} />
//         <Field label="District" value={addressDetails.district} />
//         <Field label="Pincode" value={addressDetails.pincode} />

//         {/* Bank Details */}
//         <Text style={styles.sectionHeading}>Bank Details</Text>
//         <Field label="Bank Name" value={bankDetails.bankName} />
//         <Field label="Branch" value={bankDetails.branch} />
//         <Field label="Account Number" value={bankDetails.accountNumber} />
//         <Field label="IFSC Code" value={bankDetails.ifsc} />

//         {/* Finance Details */}
//         <Text style={styles.sectionHeading}>Finance Details</Text>
//         <Field label="Occupation" value={financeDetails.occupation} />
//         <Field label="Annual Income" value={financeDetails.annualIncome} />
//         <Field label="Aadhar Number" value={financeDetails.adhar} />
//         <Field label="PAN Number" value={financeDetails.pan} />
//         <Field label="Total Paid" value={financials.totalPaid} />
//         <Field label="Total Due" value={financials.totalDue} />
//         <Field label="Total Advance" value={financials.totalAdvance} />

//         {/* Nominee Details */}
//         <Text style={styles.sectionHeading}>Nominee Details</Text>
//         <Field label="Nominee" value={nomineeDetails.nominee} />
//         <Field label="Relationship" value={nomineeDetails.relationship} />

//         {/* Business Details */}
//         <Text style={styles.sectionHeading}>Business Details</Text>
//         <Field label="Business Type" value={businessDetails.businessType} />
//         <Field label="Annual Turnover" value={businessDetails.annualTurnover} />

//         {/* Dependents */}
//         <Text style={styles.sectionHeading}>Dependents</Text>
//         <Field label="Spouse Name" value={dependents.spouse_name} />
//         <Field label="Spouse DOB" value={dependents.spouse_dob} />
//         <Field label="Spouse Age" value={dependents.spouse_age} />

//         {/* Declaration */}
//         <Text style={styles.sectionHeading}>Declaration</Text>
//         <Text style={styles.declarationText}>
//           I hereby declare that the information provided above is true to the best of my knowledge. I understand and accept all the terms and conditions of this chit group.
//         </Text>

//         {/* Signature */}
//         <View style={styles.signatureRow}>
//           <Text>Customer Signature: ______________________</Text>
//           <Text>Date: ________________</Text>
//         </View>
//       </Page>
//     </Document>
//   );
// };


