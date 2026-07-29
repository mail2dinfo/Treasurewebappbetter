import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_BASE_URL } from '../utils/apiConfig';
import { useHistory } from 'react-router-dom'; // Import useHistory hook
import loadingImage from '../images/preloader.gif';
import CollectorDashboardModal from './CollectorDashboardModal';

const EmployeeList = ({ items, removeItem, editItem, toggleList }) => {
    const [signedUrls, setSignedUrls] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCollectorModal, setShowCollectorModal] = useState(false);
    const [selectedCollector, setSelectedCollector] = useState(null);
    const history = useHistory();

    useEffect(() => {
        const fetchSignedUrls = async () => {
            setLoading(true);
            setError(null);

            try {
                if (Array.isArray(items)) {
                    const promises = items.map(async (item) => {
                        const { user_image } = item;

                        // Fetch the signed URL for each user_image using a GET request
                        const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(user_image)}`, {
                            method: 'GET',
                            headers: {
                                // Include any headers if needed
                                // 'Authorization': 'Bearer YourAccessToken',
                            },
                        });

                        console.log(response.json);

                        if (response.ok) {
                            const responseBody = await response.json();
                            const signedUrl = responseBody.results;
                            setSignedUrls(prevUrls => ({ ...prevUrls, [user_image]: signedUrl }));

                        } else {
                            // Handle error if needed
                            console.error(`Failed to fetch signed URL for user_image: ${user_image}`);
                        }
                    });

                    await Promise.all(promises);
                }
            } catch (error) {
                // Handle fetch error
                console.error('Error fetching signed URLs:', error);
                setError('Error fetching signed URLs');
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrls();
    }, [items]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    const handleViewEmployee = (employee) => {
        console.log('=== EMPLOYEE DEBUG ===');
        console.log('Full employee object:', employee);
        console.log('Employee keys:', Object.keys(employee));
        console.log('Employee role:', employee.role);
        console.log('Employee name:', employee.name);
        console.log('Employee firstname:', employee.firstname);
        console.log('Employee lastname:', employee.lastname);
        console.log('Role check result:', employee.role && employee.role.toLowerCase().includes('collector'));
        console.log('====================');

        // Simple collector check
        const isCollector = employee.role && employee.role.toLowerCase().includes('collector');

        console.log('Simple role check:', {
            role: employee.role,
            isCollector: isCollector
        });

        if (isCollector) {
            console.log('✅ Opening collector modal for:', employee);
            setSelectedCollector(employee);
            setShowCollectorModal(true);
        } else {
            console.log('❌ Redirecting to employee page for:', employee);
            // Redirect to the employee page with the userId as a route parameter
            history.push(`/employee/${employee.id}`);
        }
    };

    const handleCloseCollectorModal = () => {
        setShowCollectorModal(false);
        setSelectedCollector(null);
    };

    if (loading) {
        return (
            <>
                <img src={loadingImage} className='loading-img' alt='loding' />
                <div className="placeholder" style={{ height: '50vh' }}></div>
            </>
        );
    }

    return (
        <>
            <h3 className='listheader'>Employee Details ({items.length})</h3>
            <span className='underline' ></span>
            <div className='employer-list'>

                {items?.map((item) => {
                    const { id, user_image, name, phone, role, roleid } = item;

                    return (


                        <article className='employer-item' key={id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {signedUrls[user_image] ? (
                                <img src={signedUrls[user_image]} alt={name} />
                            ) : (
                                <img src="default-image.jpg" alt={name} />
                            )}
                            <p className='title' style={{ flex: '1 1 140px', minWidth: 0 }}>{name}</p>
                            <p className='title' style={{ flex: '1 1 100px', minWidth: 0 }}>{role}</p>
                            <p className='title' style={{ flex: '1 1 100px', minWidth: 0 }}>{phone}</p>

                            <div className='btn-container' style={{ display: "flex", flexWrap: 'wrap', gap: '8px' }}>
                                <button
                                    type='button'
                                    className='view-btn'
                                    onClick={() => handleViewEmployee(item)}
                                    style={{ width: "60px" }} >
                                    View
                                </button>
                                <button
                                    type='button'
                                    className='edit-btn'
                                    onClick={() => editItem(user_image)}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    type='button'
                                    className='delete-btn'
                                    onClick={() => removeItem(id, roleid)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </article>

                    );
                })}
            </div>

            {/* Collector Dashboard Modal */}
            {console.log('Modal render check:', { showCollectorModal, selectedCollector })}
            {showCollectorModal && selectedCollector && (
                <CollectorDashboardModal
                    isOpen={showCollectorModal}
                    onClose={handleCloseCollectorModal}
                    collector={selectedCollector}
                />
            )}
        </>
    );
};

export default EmployeeList;
