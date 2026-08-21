import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import PDFHeader from './PDFHeader';
import { PDF_UNICODE_FONT } from './registerPdfUnicodeFont';

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontSize: 11,
    fontFamily: PDF_UNICODE_FONT,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  section: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    width: '60%',
    color: '#000',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  winnerImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
    objectFit: 'cover',
    border: '1pt solid #000',
  },
  box: {
    border: '1pt solid #000',
    padding: 10,
    marginBottom: 12,
  },
  declarationText: {
    marginTop: 10,
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  signatureRow: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
    textAlign: 'center',
    fontSize: 10,
  },
});

const AuctionWinnerReceiptPdf = ({ winnerData = {}, companyData = {} }) => {
  const {
    winnerImage,
    groupName = '',
    amount = '',
    startDate = '',
    winnerName = '',
    prizeMoney = '',
    paymentMode = '',
    auctionDate = '',
  } = winnerData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader companyData={companyData} />

        <Text style={styles.title}>Customer Receipt</Text>

        {/* Image */}
        {winnerImage && (
          <View style={styles.imageContainer}>
            <Image src={winnerImage} style={styles.winnerImage} />
          </View>
        )}

        {/* Group Details */}
        <View style={styles.box}>
          <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Group Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Group Name:</Text>
            <Text style={styles.value}>{groupName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Group Amount:</Text>
            <Text style={styles.value}>₹{amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{startDate}</Text>
          </View>
        </View>

        {/* Winner Info */}
        <View style={styles.box}>
          <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{winnerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Auction Date:</Text>
            <Text style={styles.value}>{auctionDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Prize Money:</Text>
            <Text style={styles.value}>₹{prizeMoney}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Mode:</Text>
            <Text style={styles.value}>{paymentMode || '☐ Online   ☐ Cash'}</Text>
          </View>
        </View>

        {/* Declaration */}
        <Text style={styles.declarationText}>
          I, {winnerName}, acknowledge the receipt of ₹{prizeMoney} under the group "{groupName}". The amount has been disbursed as per the auction on {auctionDate}. I agree to repay the remaining dues in accordance with the agreed chit fund schedule. I understand that non-compliance may attract legal proceedings under applicable laws.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text>__________________________</Text>
            <Text>Customer Signature</Text>
            <Text>Date: __________________</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text>__________________________</Text>
            <Text>Authorized Signatory</Text>
            <Text>Date: __________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default AuctionWinnerReceiptPdf;
