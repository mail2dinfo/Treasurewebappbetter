// import React, { useState, useEffect } from 'react';
// import { FiDownload, FiPrinter } from 'react-icons/fi';
// import { PDFDownloadLink } from '@react-pdf/renderer';
// import Mypdf from '../components/PDF/Mypdf';
// import { API_BASE_URL } from '../utils/apiConfig';
// import { useUserContext } from '../context/user_context';

// const DashboardAreaWiseAccountsList = ({ items }) => {
//     const { user } = useUserContext();
//     const [previewImageUrl, setPreviewImageUrl] = useState('');
//     const [pdfData, setPdfData] = useState(null);
//     const [error, setError] = useState(null);
//     const [companyName, setCompanyName] = useState(null);
//     const userCompany = user?.results?.userCompany;



//     // New state variables for filtering
//     // New state variables for filtering
//     const [subscriberFilter, setSubscriberFilter] = useState("");
//     const [areaFilter, setAreaFilter] = useState("");

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

//             if (user.results.userCompany[0].name) {
//                 setCompanyName(user.results.userCompany[0].name);
//                 fetchCompanyLogoUrl(user.results.userCompany[0].logo);
//             }


//         }
//     }, [user]);

//     const handleGeneratePDF = () => {


//         const formattedData = filteredItems.map(item => ({
//             aob: item.aob,
//             name: item.name,
//             phone: item.phone,
//             total: item.rbtotal,
//             paid: item.rctotal,
//             due: item.rbdue
//         }));
//         setPdfData(formattedData);
//     };

//     // Function to generate file name with today's date
//     const generateFileName = () => {
//         const today = new Date();
//         const date = today.getDate().toString().padStart(2, '0');
//         const month = (today.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
//         const year = today.getFullYear();
//         const formattedDate = `${year}-${month}-${date}`;
//         return `AreawiseReceivable_${formattedDate}.pdf`;
//     };

//     // **Filter the items based on user input**
//     const filteredItems = items.filter((item) => {
//         return (
//             item.name.toLowerCase().includes(subscriberFilter.toLowerCase()) &&
//             item.aob.toLowerCase().includes(areaFilter.toLowerCase())
//         );
//     });

//     return (
//         <div >

//             <div >
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
//                     placeholder="Filter by Area"
//                     value={areaFilter}
//                     onChange={(e) => setAreaFilter(e.target.value)}
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
//                         { title: "Area", value: "aob" },
//                         { title: "Subscriber Name", value: "name" },
//                         { title: "Phone", value: "phone" },
//                         { title: "Total", value: "total" },
//                         { title: "Paid", value: "paid" },
//                         { title: "Due", value: "due" },
//                     ]}
//                     heading="Areawise Receivable" // Pass heading here

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
//                 <article className='subcriber-header' style={{ padding: "4px 16px" }}>
//                     <p >Area</p>
//                     <p >Subscriber name</p>
//                     {/* <p >Image</p> */}
//                     <p >Phone</p>
//                     <p >Total</p>
//                     <p >Paid</p>
//                     <p >Outstanding</p>

//                 </article>
//                 {filteredItems.length > 0 ? (
//                     filteredItems?.map((item, index) => {
//                         const { aob, name, user_image, phone, rbtotal, rctotal, rbdue } = item;
//                         const truncatedName = name.length > 10 ? `${name.substring(0, 10)}...` : name;

//                         return (
//                             // <Link
//                             //     to={`/groups/${group_id}/accounts/${group_id}`} // Replace with your route path
//                             //     key={index}
//                             // >
//                             <article className='subcriber-item' key={index}>
//                                 <p className='title'>{aob}</p>
//                                 <p className='title'>{truncatedName}</p>
//                                 <p className='title'>{phone}</p>
//                                 <p className='title'>{rbtotal}</p>
//                                 <p className='title'>{rctotal}</p>
//                                 <p className='title'>{rbdue}</p>
//                             </article>
//                             // </Link>
//                         );
//                     })
//                 ) : (
//                     <p className="no-results">No matching results found.</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default DashboardAreaWiseAccountsList;

import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import { useUserContext } from '../context/user_context';
import '../style/DashboardAreaWiseAccounts.css';

const DashboardAreaWiseAccountsList = ({ items }) => {
    const { user } = useUserContext();
    const [pdfData, setPdfData] = useState(null);
    const userCompany = user?.results?.userCompany || [];
    const [subscriberFilter, setSubscriberFilter] = useState('');
    const [areaFilter, setAreaFilter] = useState('');





    const filteredItems = items.filter(
        (item) =>
            item.name.toLowerCase().includes(subscriberFilter.toLowerCase()) &&
            item.aob.toLowerCase().includes(areaFilter.toLowerCase())
    );

    const columnTotals = filteredItems.reduce(
        (acc, item) => ({
            total: acc.total + Number(item.rbtotal || 0),
            paid: acc.paid + Number(item.rctotal || 0),
            due: acc.due + Number(item.rbdue || 0),
        }),
        { total: 0, paid: 0, due: 0 }
    );

    const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN');

    const handleGeneratePDF = () => {
        const formattedData = filteredItems.map((item) => ({
            aob: item.aob,
            name: item.name,
            phone: item.phone,
            total: item.rbtotal,
            paid: item.rctotal,
            due: item.rbdue,
        }));
        if (formattedData.length > 0) {
            formattedData.push({
                aob: '',
                name: 'Total',
                phone: '',
                total: columnTotals.total,
                paid: columnTotals.paid,
                due: columnTotals.due,
            });
        }
        setPdfData(formattedData);
    };

    const generateFileName = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        return `AreawiseReceivable_${formatted}.pdf`;
    };

    return (
        <div className="area-wise-wrapper">
            {/* HEADER + FILTERS */}
            <div className="area-wise-header">
                <div className="area-wise-filter-section">
                    <input
                        type="text"
                        placeholder="Filter by Subscriber Name"
                        value={subscriberFilter}
                        onChange={(e) => setSubscriberFilter(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Filter by Area"
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                    />
                    <button
                        className="area-wise-clear-filter-btn"
                        onClick={() => {
                            setSubscriberFilter('');
                            setAreaFilter('');
                        }}
                    >
                        Clear Filters
                    </button>
                </div>

                {/* PDF DOWNLOAD */}
                <div className="area-wise-download-section">
                    {pdfData ? (
                        <PDFDownloadLink
                            document={
                                <Mypdf
                                    tableData={pdfData}
                                    tableHeaders={[
                                        { title: 'Area', value: 'aob' },
                                        { title: 'Subscriber Name', value: 'name' },
                                        { title: 'Phone', value: 'phone' },
                                        { title: 'Total', value: 'total' },
                                        { title: 'Paid', value: 'paid' },
                                        { title: 'Due', value: 'due' },
                                    ]}
                                    heading="Areawise Receivable"
                                    companyData={userCompany}
                                />
                            }
                            fileName={generateFileName()}
                        >
                            {({ loading }) => (
                                <button
                                    className="area-wise-download-btn"
                                    onClick={() => setTimeout(() => setPdfData(null), 500)}
                                >
                                    <FiDownload /> {loading ? 'Loading PDF...' : 'Download PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    ) : (
                        <button className="area-wise-download-btn" onClick={handleGeneratePDF}>
                            <FiDownload /> Generate PDF
                        </button>
                    )}
                </div>
            </div>

            {/* DATA ROWS */}
            <div className="area-wise-list">
                <div className="area-wise-header-row recv-header-row">
                    <p>Subscriber</p>
                    <p>Total</p>
                    <p>Paid</p>
                    <p>Due</p>
                </div>
                {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => {
                        const { aob, name, phone, rbtotal, rctotal, rbdue } = item;
                        const isPaid = Number(rbdue) === 0;
                        const dueHigh = Number(rbdue) > 0;

                        return (
                            <article
                                className={`recv-row ${isPaid ? 'is-paid' : ''}`}
                                key={index}
                            >
                                <div className="recv-identity">
                                    <p className="recv-name">{name || '—'}</p>
                                    <p className="recv-meta">
                                        <span>{aob || '—'}</span>
                                        {phone ? <span>{phone}</span> : null}
                                    </p>
                                </div>
                                <div className="recv-amounts">
                                    <div className="recv-amt">
                                        <span>Total</span>
                                        <strong>₹{formatAmount(rbtotal)}</strong>
                                    </div>
                                    <div className="recv-amt">
                                        <span>Paid</span>
                                        <strong>₹{formatAmount(rctotal)}</strong>
                                    </div>
                                    <div className={`recv-amt ${dueHigh ? 'is-due' : ''}`}>
                                        <span>Due</span>
                                        <strong>₹{formatAmount(rbdue)}</strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p className="no-results">No matching results found.</p>
                )}
                {filteredItems.length > 0 && (
                    <article className="recv-row recv-total">
                        <div className="recv-identity">
                            <p className="recv-name">Total</p>
                            <p className="recv-meta">{filteredItems.length} subscriber{filteredItems.length === 1 ? '' : 's'}</p>
                        </div>
                        <div className="recv-amounts">
                            <div className="recv-amt">
                                <span>Total</span>
                                <strong>₹{formatAmount(columnTotals.total)}</strong>
                            </div>
                            <div className="recv-amt">
                                <span>Paid</span>
                                <strong>₹{formatAmount(columnTotals.paid)}</strong>
                            </div>
                            <div className="recv-amt is-due">
                                <span>Due</span>
                                <strong>₹{formatAmount(columnTotals.due)}</strong>
                            </div>
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
};

export default DashboardAreaWiseAccountsList;

