// import React, { useState, useEffect } from 'react';
// import { FiDownload, FiPrinter } from 'react-icons/fi';
// import { PDFDownloadLink } from '@react-pdf/renderer';
// import Mypdf from '../components/PDF/Mypdf';
// import { API_BASE_URL } from '../utils/apiConfig';
// import { useUserContext } from '../context/user_context';

// const DashboardSubscriberGroupWiseAccountsList = ({ items }) => {
//     const { user } = useUserContext();
//     console.log(user);

//     const [previewImageUrl, setPreviewImageUrl] = useState('');
//     const [pdfData, setPdfData] = useState(null);
//     const [error, setError] = useState(null);
//     const [companyName, setCompanyName] = useState(null);
//     // New state variables for filtering
//     const [subscriberFilter, setSubscriberFilter] = useState("");
//     const [groupFilter, setGroupFilter] = useState("");
//     const userCompany = user?.results?.userCompany;


//     const fetchCompanyLogoUrl = async (logoKey) => {

//         console.log('logoKey');
//         console.log(logoKey);
//         // setLoading(true);
//         setError(null);

//         try {
//             // Fetch the signed URL for the company logo using a GET request
//             const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(logoKey)}`, {

//                 method: 'GET',
//                 headers: {
//                     // Include any headers if needed
//                     // 'Authorization': 'Bearer YourAccessToken',
//                 },
//             });
//             if (response.ok) {
//                 const responseBody = await response.json();
//                 const signedUrl = responseBody.results;
//                 console.log('moody');
//                 console.log(responseBody.results);


//                 setPreviewImageUrl(signedUrl);


//             } else {
//                 // Handle error if needed based on the HTTP status code
//                 console.error(`Failed to fetch signed URL for company logo: ${logoKey}`);

//             }
//         } catch (error) {
//             // Handle fetch error
//             console.error('Error fetching signed URL for company logo:', error);
//             setError('Error fetching signed URL for company logo');
//         } finally {
//             //   setLoading(false);
//         }
//     };


//     useEffect(() => {
//         if (user.results.userCompany.length > 0) {
//             console.log(user.results.userCompany);
//             if (user.results.userCompany[0].name) {
//                 setCompanyName(user.results.userCompany[0].name);
//                 fetchCompanyLogoUrl(user.results.userCompany[0].logo);
//             }


//         }
//     }, [user]);

//     const handleGeneratePDF = () => {

//         const formattedData = filteredItems.map(item => ({
//             subscriber_name: item.subscriber_name,
//             group_name: item.group_name,
//             phone: item.phone,
//             receivable_amount: item.receivable_amount,
//             received_amount: item.received_amount,
//             outstanding_due: item.outstanding_due
//         }));
//         setPdfData(formattedData);
//     };

//     // Function to generate file name with today's date
//     const generateFileName = () => {
//         const today = new Date();
//         const date = today.getDate().toString().padStart(2, '0');
//         const month = (today.getMonth() + 1).toString().padStart(2, '0');
//         const year = today.getFullYear();
//         return `SubscriberGroupWise_Receivable_${year}-${month}-${date}.pdf`;
//     };

//     // **Filter the items based on user input**
//     const filteredItems = items.filter((item) => {
//         return (
//             item.subscriber_name.toLowerCase().includes(subscriberFilter.toLowerCase()) &&
//             item.group_name.toLowerCase().includes(groupFilter.toLowerCase())
//         );
//     });
//     return (
//         <div>

//             {/* Filter Inputs */}
//             <div className="filter-section">
//                 <input
//                     type="text"
//                     placeholder="Filter by Subscriber Name"
//                     value={subscriberFilter}
//                     onChange={(e) => setSubscriberFilter(e.target.value)}
//                     style={{
//                         height: '40px', // Adjust the height value as needed
//                         padding: '0.25rem',
//                         paddingLeft: '1rem',
//                         background: 'var(--clr-grey-10)',
//                         borderTopLeftRadius: 'var(--radius)',
//                         borderBottomLeftRadius: 'var(--radius)',
//                         borderTopRightRadius: 'var(--radius)',
//                         borderBottomRightRadius: 'var(--radius)',
//                         borderColor: 'transparent',
//                         fontSize: '1rem',
//                         flex: '1 0 auto',
//                         color: 'var(--clr-grey-5)',
//                         marginBottom: '1rem'
//                     }}
//                 />
//                 <input
//                     type="text"
//                     placeholder="Filter by Group Name"
//                     value={groupFilter}
//                     onChange={(e) => setGroupFilter(e.target.value)}
//                     style={{
//                         height: '40px', // Adjust the height value as needed
//                         padding: '0.25rem',
//                         paddingLeft: '1rem',
//                         background: 'var(--clr-grey-10)',
//                         borderTopLeftRadius: 'var(--radius)',
//                         borderBottomLeftRadius: 'var(--radius)',
//                         borderTopRightRadius: 'var(--radius)',
//                         borderBottomRightRadius: 'var(--radius)',
//                         borderColor: 'transparent',
//                         fontSize: '1rem',
//                         flex: '1 0 auto',
//                         color: 'var(--clr-grey-5)',
//                         marginBottom: '1rem'
//                     }}
//                 />
//             </div>

//             {pdfData ? (
//                 <PDFDownloadLink document={<Mypdf tableData={pdfData}

//                     tableHeaders={[
//                         { title: "Subscriber Name", value: "subscriber_name" },
//                         { title: "Group Name", value: "group_name" },
//                         { title: "Phone", value: "phone" },
//                         { title: "Total", value: "receivable_amount" },
//                         { title: "Paid", value: "received_amount" },
//                         { title: "Due", value: "outstanding_due" },
//                     ]}
//                     heading="SubcriberGroupWise Receivable :" // Pass heading here

//                     companyData={userCompany}

//                 />} fileName={generateFileName()}>
//                     {({ loading }) => (loading ? 'Loading document...' : <button onClick={() => {
//                         setTimeout(() => {
//                             setPdfData(null); // Reset pdfData after download
//                         }, 500);
//                     }}><FiDownload /> Download PDF</button>)}
//                 </PDFDownloadLink>
//             ) : (
//                 <button onClick={handleGeneratePDF}><FiDownload /> Generate PDF</button>
//             )}

//             <div className='subcriber-list'>
//                 <article className='subcriber-header' >

//                     <p >Subscriber name</p>
//                     <p >Group name</p>
//                     {/* <p >Image</p> */}
//                     <p >Phone</p>

//                     <p >Total</p>
//                     <p >Paid</p>
//                     <p >Outstanding</p>

//                 </article>
//                 {filteredItems.length > 0 ? (
//                     filteredItems?.map((item, index) => {
//                         const { subscriber_id, subscriber_name, user_image, phone, group_name, group_id, receivable_amount, received_amount, outstanding_due, receipts } = item;
//                         const truncatedName = subscriber_name.length > 10 ? `${subscriber_name.substring(0, 10)}...` : subscriber_name;

//                         return (
//                             // <Link
//                             //     to={/groups/${group_id}/accounts/${group_id}} // Replace with your route path
//                             //     key={index}
//                             // >
//                             <article className='subcriber-item' key={index}
//                             >                        <p className='title'>{subscriber_name}</p>
//                                 <p className='title'>{group_name}</p>
//                                 <p className='title'>{phone}</p>
//                                 <p className='title'>{receivable_amount}</p>
//                                 <p className='title'>       {received_amount}</p>
//                                 <p className='title'>                           {outstanding_due}</p>
//                             </article>
//                             // </Link>
//                         );
//                     })) : (
//                     <p className="no-results">No matching results found.</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default DashboardSubscriberGroupWiseAccountsList;

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import { useUserContext } from '../context/user_context';
import '../style/DashboardSubscriberGroupWiseAccounts.css';

const DashboardSubscriberGroupWiseAccountsList = ({ items = [] }) => {
    const { user } = useUserContext();
    const userCompany = user?.results?.userCompany;

    //const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [pdfData, setPdfData] = useState(null);
    //const [companyName, setCompanyName] = useState(null);
    const [subscriberFilter, setSubscriberFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [filteredItems, setFilteredItems] = useState(items);



    // useEffect(() => {
    //     if (userCompany?.length > 0) {
    //         setCompanyName(userCompany[0].name);
    //         fetchCompanyLogoUrl(userCompany[0].logo);
    //     }
    // }, [userCompany]);

    // const fetchCompanyLogoUrl = async (logoKey) => {
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(logoKey)}`);
    //         if (response.ok) {
    //             const result = await response.json();
    //             setPreviewImageUrl(result.results);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching signed URL:', error);
    //     }
    // };

    useEffect(() => {
        const filtered = items.filter((item) => {
            const subscriber = item.subscriber_name?.toLowerCase() || '';
            const group = item.group_name?.toLowerCase() || '';
            const subFilter = subscriberFilter.toLowerCase().trim();
            const grpFilter = groupFilter.toLowerCase().trim();

            const matchesSubscriber = !subFilter || subscriber.includes(subFilter);
            const matchesGroup = !grpFilter || group.includes(grpFilter);

            return matchesSubscriber && matchesGroup;
        });

        setFilteredItems(filtered);
    }, [subscriberFilter, groupFilter, items]);


    const handleGeneratePDF = () => {
        const formattedData = filteredItems.map(item => ({
            subscriber_name: item.subscriber_name,
            group_name: item.group_name,
            phone: item.phone,
            receivable_amount: item.receivable_amount,
            received_amount: item.received_amount,
            outstanding_due: item.outstanding_due
        }));
        setPdfData(formattedData);
    };

    const generateFileName = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        return `SubscriberGroupWise_Receivable_${formatted}.pdf`;
    };

    const handleClearFilters = () => {
        setSubscriberFilter('');
        setGroupFilter('');
    };

    return (
        <div className="subscriber-groupwise-wrapper">
            {/* Header with filters and download */}
            <div className="subscriber-groupwise-header">
                <div className="filter-section">
                    <input
                        type="text"
                        placeholder="Filter by Subscriber Name"
                        value={subscriberFilter}
                        onChange={(e) => setSubscriberFilter(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Filter by Group Name"
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                    />
                    <button className="clear-filter-btn" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                </div>

                <div className="download-section">
                    {pdfData ? (
                        <PDFDownloadLink
                            document={
                                <Mypdf
                                    tableData={pdfData}
                                    tableHeaders={[
                                        { title: 'Subscriber', value: 'subscriber_name' },
                                        { title: 'Group Name', value: 'group_name' },
                                        { title: 'Phone', value: 'phone' },
                                        { title: 'Total', value: 'receivable_amount' },
                                        { title: 'Paid', value: 'received_amount' },
                                        { title: 'Due', value: 'outstanding_due' },
                                    ]}
                                    heading="Subscriber Groupwise Receivable"
                                    companyData={userCompany}
                                />
                            }
                            fileName={generateFileName()}
                        >
                            {({ loading }) =>
                                loading ? (
                                    'Loading...'
                                ) : (
                                    <button
                                        className="download-btn"
                                        onClick={() => setTimeout(() => setPdfData(null), 500)}
                                    >
                                        <FiDownload /> Download PDF
                                    </button>
                                )
                            }
                        </PDFDownloadLink>
                    ) : (
                        <button className="download-btn" onClick={handleGeneratePDF}>
                            <FiDownload /> Generate PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Subscriber list */}
            <div className="subscriber-list">
                <article className="account-grid-header">
                    <p>Subscriber</p>
                    <p>Group</p>
                    <p>Phone</p>
                    <p>Total</p>
                    <p>Paid</p>
                    <p>Outstanding</p>
                </article>

                {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => (
                        <article
                            className={`account-grid-row ${item.outstanding_due > 0 ? '' : 'paid-row'}`}
                            key={index}
                        >
                            <span data-label="Subscriber">{item.subscriber_name}</span>
                            <span data-label="Group">{item.group_name}</span>
                            <span data-label="Phone">{item.phone}</span>
                            <span data-label="Total">{item.receivable_amount}</span>
                            <span data-label="Paid">{item.received_amount}</span>
                            <span data-label="Outstanding">{item.outstanding_due}</span>
                        </article>
                    ))
                ) : (
                    <p className="no-results">No matching records found.</p>
                )}

            </div>
        </div>
    );
};

export default DashboardSubscriberGroupWiseAccountsList;




