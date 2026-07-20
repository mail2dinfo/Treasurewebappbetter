import React, { useEffect } from 'react';
import { useUserContext } from '../context/user_context';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AuctionWinnerReceiptPdf from '../components/PDF/AuctionWinnerReceiptPdf';
import { useGroupDetailsContext } from '../context/group_context';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const GroupAccountWiseDataUserList = ({ items }) => {
  const { user } = useUserContext();
  const userCompany = user?.results?.userCompany;
 
  const { state } = useGroupDetailsContext();
  const groupData = state?.data;
 
  useEffect(() => {
    console.log("📦 Group Data:", groupData);
  }, [groupData]);
  


 


  return (
    <div className="subcriber-list">
      <article className="subcriber-header">
        <p>AuctDate</p>
        <p>User</p>
        <p>Total Amount</p>
        <p>Paid</p>
        <p>Outstanding</p>
      </article>

      {items?.map((item) => {
        const {
          auct_date,
          id,
          user_image_from_s3,
          user_image_base64format,
          name,
          total_supposed_to_pay,
          total_paid_amount,
          total_outstanding_balance,
          payment_mode
        } = item;

        const formattedAuctionDate = formatDate(auct_date);
        const formattedTotalPay = total_supposed_to_pay ?? 0;
        const formattedPaid = total_paid_amount ?? 0;
        const formattedOutstanding = total_outstanding_balance ?? 0;

        return (
          <article key={id} className="subcriber-item">
            <p>{formattedAuctionDate}</p>
            <p>
            <img src={user_image_from_s3} alt={name} />
            </p>
            <p>{name}</p>
            <p>{formattedTotalPay}</p>
            <p>{formattedPaid}</p>
            <p>{formattedOutstanding}</p>

            <PDFDownloadLink
              document={
                <AuctionWinnerReceiptPdf
                  winnerData={{
                    winnerImage:user_image_base64format,
                    winnerName: name,
                    auctionDate: formattedAuctionDate,
                    amountTaken: formattedTotalPay,
                    prizeMoney: formattedTotalPay,
                    balance: formattedOutstanding,
                    paymentMode: payment_mode ?? 'Online',
                    groupName: groupData?.results?.groupName ?? '',
                    amount: groupData?.results?.amount ?? '',
                    startDate: formatDate(groupData?.results?.startDate) ?? ''
                  }}
                  companyData={userCompany}
                />
              }
              fileName={`Auction_Receipt_${name}_${formattedAuctionDate}.pdf`}
              style={{
                marginTop: '10px',
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: '#28a745',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF')}
            </PDFDownloadLink>
          </article>
        );
      })}
    </div>
  );
};

export default GroupAccountWiseDataUserList;
