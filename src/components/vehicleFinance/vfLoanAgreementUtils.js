/** Prepare subscriber object for VF loan agreement PDF */
export const prepareVfPdfSubscriber = (subscriber) => {
    if (!subscriber) return {};
    return {
        ...subscriber,
        vf_cust_photo_base64format:
            subscriber.vf_cust_photo_base64format ||
            subscriber.vf_cust_photo_s3_image ||
            subscriber.vf_cust_photo ||
            '',
        vf_cust_aadhaar_frontside_base64format:
            subscriber.vf_cust_aadhaar_frontside_base64format ||
            subscriber.vf_cust_aadhaar_frontside_s3_image ||
            subscriber.vf_cust_aadhaar_frontside ||
            '',
        vf_cust_aadhaar_backside_base64format:
            subscriber.vf_cust_aadhaar_backside_base64format ||
            subscriber.vf_cust_aadhaar_backside_s3_image ||
            subscriber.vf_cust_aadhaar_backside ||
            '',
    };
};

/** Prepare company object for VF loan agreement PDF */
export const prepareVfPdfCompany = (company) => {
    const c = company || {};
    const logo =
        c.company_logo_base64format ||
        c.company_logo_s3_image ||
        c.company_logo ||
        '';
    return {
        name: c.company_name || 'Vehicle Finance Company',
        company_name: c.company_name || 'Vehicle Finance Company',
        companyName: c.company_name || 'Vehicle Finance Company',
        logo_base64format: logo,
        company_logo_base64format: logo,
        phone: c.contact_no || '',
        contact_no: c.contact_no || '',
        street_address: c.address || '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        email: c.email || '',
        registration_no: c.registration_no || '',
        company_since: c.company_since || '',
        district: c.district || 'local jurisdiction',
    };
};

export const buildVfWhatsAppMessage = ({ loan, subscriber, emiAmount, installmentCount }) => {
    const name = subscriber?.vf_cust_name || 'Borrower';
    const phone = subscriber?.vf_cust_phone || '';
    const vehicle = [loan?.vehicle_make, loan?.vehicle_model, loan?.vehicle_number]
        .filter(Boolean)
        .join(' ');
    return `
🏦 *Vehicle Loan Agreement - MyTreasure*

👤 *Borrower:* ${name}
📱 *Phone:* ${phone}
🛵 *Vehicle:* ${vehicle || 'N/A'}
💰 *Loan Amount:* ₹${parseFloat(loan?.loan_amount || 0).toLocaleString('en-IN')}
📊 *Total Repay:* ₹${parseFloat(loan?.total_repay_amount || 0).toLocaleString('en-IN')}
💳 *EMI:* ₹${parseFloat(emiAmount || loan?.installment_amount || 0).toLocaleString('en-IN')}
📅 *Disbursement:* ${loan?.loan_disbursement_date || 'N/A'}
📆 *Installments:* ${installmentCount || loan?.total_installments || 'N/A'}

Loan ID: ${loan?.id || 'N/A'}

Please download the agreement PDF from the app, sign it, and upload the signed copy.
    `.trim();
};

export const buildVfEmailContent = ({ loan, subscriber, emiAmount, installmentCount }) => {
    const name = subscriber?.vf_cust_name || 'Borrower';
    const subject = `Vehicle Loan Agreement - ${name} - ${loan?.id || ''}`;
    const body = `
Dear ${name},

Please find your vehicle loan agreement summary:

Loan ID: ${loan?.id || 'N/A'}
Loan Amount: ₹${parseFloat(loan?.loan_amount || 0).toLocaleString('en-IN')}
Total Repay: ₹${parseFloat(loan?.total_repay_amount || 0).toLocaleString('en-IN')}
EMI: ₹${parseFloat(emiAmount || loan?.installment_amount || 0).toLocaleString('en-IN')}
Vehicle: ${[loan?.vehicle_make, loan?.vehicle_model, loan?.vehicle_number].filter(Boolean).join(' ') || 'N/A'}
Disbursement Date: ${loan?.loan_disbursement_date || 'N/A'}
Installments: ${installmentCount || loan?.total_installments || 'N/A'}

Please download the complete agreement from MyTreasure Vehicle Finance, sign it, and upload the signed document.

Best regards,
MyTreasure Vehicle Finance Team
    `.trim();
    return { subject, body };
};
