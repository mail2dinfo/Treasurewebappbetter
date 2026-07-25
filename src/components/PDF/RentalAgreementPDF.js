import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.4 },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  section: { marginTop: 12, marginBottom: 4 },
  heading: { fontSize: 11, marginBottom: 6, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  row: { marginBottom: 3 },
  muted: { color: '#444', marginBottom: 8 },
  label: { color: '#555' },
  partiesRow: { flexDirection: 'row' },
  partiesText: { flex: 1, paddingRight: 10 },
  photoThumb: {
    width: 72,
    height: 86,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  photoCard: { width: '48%', marginRight: '2%', marginBottom: 10 },
  photoLarge: {
    width: '100%',
    height: 130,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
  },
  photoCaption: { fontSize: 8, color: '#555', marginTop: 3 },
  docPair: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  docHalf: { width: '48%' },
  docLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#374151' },
  docImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
  },
  footer: { marginTop: 20, fontSize: 8, color: '#555' },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  signatureBox: { width: '45%' },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#111',
    marginTop: 40,
    paddingTop: 4,
    fontSize: 8,
    color: '#555',
  },
});

const money = (n) => `INR ${Number(n || 0).toLocaleString('en-IN')}`;

const DEFAULT_TERMS = [
  'Security deposit / advance should be given back on the end of tenancy',
  'Property should be given back at the same condition back to house owner without any damage',
];

/** Prefer base64 (works offline in PDF), then signed URL / http. Skip PDFs and placeholder defaults. */
const pickImageSrc = (...candidates) => {
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    const lower = v.toLowerCase();
    if (lower.startsWith('default-')) continue;
    if (lower.includes('.pdf') && !lower.startsWith('data:')) continue;
    if (
      lower.startsWith('data:image') ||
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('blob:')
    ) {
      return v;
    }
  }
  return null;
};

const PdfImage = ({ src, style, label }) => {
  if (!src) {
    return label ? <Text style={styles.row}>{label}: not attached</Text> : null;
  }
  return <Image src={src} style={style} />;
};

const RentalAgreementPDF = ({ agreement = {}, company = {} }) => {
  const tenant = agreement.tenant || {};
  const property = agreement.property || {};
  const materials = agreement.materials || [];
  const terms = (Array.isArray(agreement.terms) ? agreement.terms : [])
    .map((t) => String(t || '').trim())
    .filter(Boolean);
  const displayTerms = terms.length ? terms : DEFAULT_TERMS;

  const tenantPhoto = pickImageSrc(
    tenant.rm_cust_photo_base64format,
    tenant.rm_cust_photo_s3_image,
    tenant.rm_cust_photo
  );

  const propertyPhotos = (property.photos || [])
    .map((ph, index) => ({
      key: ph.id || ph.photo_url || index,
      caption: ph.caption || `Property photo ${index + 1}`,
      src: pickImageSrc(ph.photo_url_base64format, ph.photo_url_s3_image, ph.photo_url, ph.photoUrl),
    }))
    .filter((p) => p.src);

  const lessorAadhaarFront = pickImageSrc(
    agreement.lessor_aadhaar_frontside_base64format,
    agreement.lessor_aadhaar_frontside_s3_image,
    agreement.lessor_aadhaar_frontside
  );
  const lessorAadhaarBack = pickImageSrc(
    agreement.lessor_aadhaar_backside_base64format,
    agreement.lessor_aadhaar_backside_s3_image,
    agreement.lessor_aadhaar_backside
  );

  const lesseeAadhaarFront = pickImageSrc(
    tenant.rm_cust_aadhaar_frontside_base64format,
    tenant.rm_cust_aadhaar_frontside_s3_image,
    tenant.rm_cust_aadhaar_frontside
  );
  const lesseeAadhaarBack = pickImageSrc(
    tenant.rm_cust_aadhaar_backside_base64format,
    tenant.rm_cust_aadhaar_backside_s3_image,
    tenant.rm_cust_aadhaar_backside
  );

  const panCard = pickImageSrc(
    tenant.rm_cust_pan_base64format,
    tenant.rm_cust_pan_s3_image,
    tenant.rm_cust_pan
  );
  const salarySlip = pickImageSrc(
    tenant.rm_cust_salary_slip_base64format,
    tenant.rm_cust_salary_slip_s3_image,
    tenant.rm_cust_salary_slip
  );
  const bankStatement = pickImageSrc(
    tenant.rm_cust_bank_statement_base64format,
    tenant.rm_cust_bank_statement_s3_image,
    tenant.rm_cust_bank_statement
  );

  const propertyAddress =
    agreement.property_address_snapshot ||
    [property.title, property.address, property.city, property.state, property.pincode]
      .filter(Boolean)
      .join(', ') ||
    '—';

  const hasIdentityDocs =
    lessorAadhaarFront || lessorAadhaarBack || lesseeAadhaarFront || lesseeAadhaarBack;
  const hasIncomeDocs = panCard || salarySlip || bankStatement;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>RENTAL / LEASE AGREEMENT</Text>
        <Text style={styles.muted}>
          (India — for residential premises; parties should also comply with applicable state rent laws)
        </Text>
        {company?.company_name ? (
          <Text style={styles.row}>Managed by: {company.company_name}</Text>
        ) : null}
        {agreement.id ? <Text style={[styles.row, styles.muted]}>Agreement ID: {agreement.id}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.heading}>1. Parties</Text>
          <View style={styles.partiesRow}>
            <View style={styles.partiesText}>
              <Text style={styles.row}>
                <Text style={styles.label}>Lessor (Owner): </Text>
                {agreement.lessor_name || company.company_name || '—'}
                {agreement.lessor_phone ? ` | Phone: ${agreement.lessor_phone}` : ''}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>Lessor address: </Text>
                {agreement.lessor_address || company.address || '—'}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>Lessee (Tenant): </Text>
                {agreement.lessee_name_snapshot || tenant.rm_cust_name || '—'}
                {agreement.lessee_phone_snapshot || tenant.rm_cust_phone
                  ? ` | Phone: ${agreement.lessee_phone_snapshot || tenant.rm_cust_phone}`
                  : ''}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>Lessee address: </Text>
                {tenant.rm_cust_address || '—'}
              </Text>
            </View>
            {tenantPhoto ? <PdfImage src={tenantPhoto} style={styles.photoThumb} /> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. Property</Text>
          {property.title ? (
            <Text style={styles.row}>
              <Text style={styles.label}>Title: </Text>
              {property.title}
            </Text>
          ) : null}
          <Text style={styles.row}>
            <Text style={styles.label}>Address: </Text>
            {propertyAddress}
          </Text>
          {(property.city || property.state || property.pincode) && (
            <Text style={styles.row}>
              {[property.city, property.state, property.pincode].filter(Boolean).join(', ')}
            </Text>
          )}
          {propertyPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {propertyPhotos.map((ph) => (
                <View key={ph.key} style={styles.photoCard} wrap={false}>
                  <PdfImage src={ph.src} style={styles.photoLarge} />
                  <Text style={styles.photoCaption}>{ph.caption}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.row}>No property photos attached.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. Rent & security deposit / rental advance</Text>
          <Text style={styles.row}>Monthly rent: {money(agreement.rent_amount)}</Text>
          <Text style={styles.row}>Security deposit / rental advance: {money(agreement.deposit_amount)}</Text>
          <Text style={styles.row}>
            The deposit shall be refunded on vacant peaceful handover without damage. If damage is found,
            the Lessor may estimate repair cost, deduct the same from the deposit, and refund the balance to the Lessee.
          </Text>
          <Text style={styles.row}>Rent due day of each month: {agreement.rent_due_day || 1}</Text>
          <Text style={styles.row}>
            Period: {agreement.rent_start_date || '—'} to {agreement.rent_end_date || '—'}
          </Text>
          {agreement.deposit_status === 'SETTLED' && (
            <Text style={styles.row}>
              Deposit settled — deducted {money(agreement.deposit_damage_deduction)}, refunded{' '}
              {money(agreement.deposit_refund_amount)}
              {agreement.deposit_damage_notes ? ` (${agreement.deposit_damage_notes})` : ''}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Materials / fittings in property</Text>
          {materials.length === 0 ? (
            <Text style={styles.row}>None listed.</Text>
          ) : (
            materials.map((m) => (
              <Text key={m.id || m.item_name} style={styles.row}>
                • {m.item_name} (qty {m.quantity})
                {m.condition_note ? ` — ${m.condition_note}` : ''}
              </Text>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. Nominee</Text>
          <Text style={styles.row}>
            Nominee: {tenant.rm_nominee_name || '—'}
            {tenant.rm_nominee_phone ? ` | Phone: ${tenant.rm_nominee_phone}` : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>6. Details / general points</Text>
          {displayTerms.map((term, index) => (
            <Text key={`term-${index}`} style={styles.row}>
              {index + 1}. {term}
            </Text>
          ))}
        </View>

        {hasIdentityDocs ? (
          <View style={styles.section} break={propertyPhotos.length > 2}>
            <Text style={styles.heading}>7. Identity documents</Text>
            {(lessorAadhaarFront || lessorAadhaarBack) && (
              <>
                <Text style={[styles.row, styles.docLabel]}>Lessor Aadhaar</Text>
                <View style={styles.docPair}>
                  <View style={styles.docHalf}>
                    <Text style={styles.docLabel}>Front</Text>
                    <PdfImage src={lessorAadhaarFront} style={styles.docImage} label="Front" />
                  </View>
                  <View style={styles.docHalf}>
                    <Text style={styles.docLabel}>Back</Text>
                    <PdfImage src={lessorAadhaarBack} style={styles.docImage} label="Back" />
                  </View>
                </View>
              </>
            )}
            {(lesseeAadhaarFront || lesseeAadhaarBack) && (
              <>
                <Text style={[styles.row, styles.docLabel, { marginTop: 8 }]}>Lessee Aadhaar</Text>
                <View style={styles.docPair}>
                  <View style={styles.docHalf}>
                    <Text style={styles.docLabel}>Front</Text>
                    <PdfImage src={lesseeAadhaarFront} style={styles.docImage} label="Front" />
                  </View>
                  <View style={styles.docHalf}>
                    <Text style={styles.docLabel}>Back</Text>
                    <PdfImage src={lesseeAadhaarBack} style={styles.docImage} label="Back" />
                  </View>
                </View>
              </>
            )}
          </View>
        ) : null}

        {hasIncomeDocs ? (
          <View style={styles.section}>
            <Text style={styles.heading}>{hasIdentityDocs ? '8' : '7'}. Lessee income / KYC documents</Text>
            <View style={styles.photoGrid}>
              {panCard ? (
                <View style={styles.photoCard} wrap={false}>
                  <Text style={styles.docLabel}>PAN card</Text>
                  <PdfImage src={panCard} style={styles.photoLarge} />
                </View>
              ) : null}
              {salarySlip ? (
                <View style={styles.photoCard} wrap={false}>
                  <Text style={styles.docLabel}>Salary slip</Text>
                  <PdfImage src={salarySlip} style={styles.photoLarge} />
                </View>
              ) : null}
              {bankStatement ? (
                <View style={styles.photoCard} wrap={false}>
                  <Text style={styles.docLabel}>Bank statement</Text>
                  <PdfImage src={bankStatement} style={styles.photoLarge} />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>
            {7 + (hasIdentityDocs ? 1 : 0) + (hasIncomeDocs ? 1 : 0)}. Acceptance
          </Text>
          <Text style={styles.row}>
            Owner accepted at: {agreement.owner_accepted_at ? String(agreement.owner_accepted_at) : 'Pending'}
          </Text>
          <Text style={styles.row}>
            Tenant accepted at: {agreement.tenant_accepted_at ? String(agreement.tenant_accepted_at) : 'Pending'}
          </Text>
          <Text style={styles.row}>Status: {agreement.status || '—'}</Text>
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Lessor / Owner signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Lessee / Tenant signature</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by MyTreasure Rental Management. Not a substitute for stamp paper / registration where required by
          law.
        </Text>
      </Page>
    </Document>
  );
};

export default RentalAgreementPDF;
