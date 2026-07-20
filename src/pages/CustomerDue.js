import React, { useState, useEffect } from 'react';
import { GroupWiseOverallDue, GroupAccountWiseOverallDue } from '../components';
import { useHistory, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { FiArrowLeft } from 'react-icons/fi';
import loadingImage from '../images/preloader.gif';

const CustomerDue = () => {

    const history = useHistory();
    const { groupId } = useParams();
    const { user, isLoading, setIsLoading } = useUserContext();
    const [data, setData] = useState([]);

    const [GroupWiseOverallDuedata, setGroupWiseOverallDue] = useState({
        group_id: "",
        total_supposed_to_pay: "",
        total_paid_amount: "",
        total_outstanding_balance: "",
    });

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);
                // const apiUrl = `${API_BASE_URL}/users/groups/${groupId}`;
                const apiUrl = `${API_BASE_URL}/groups/${groupId}/customer-due`;


                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${user?.results?.token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch groups');
                }

                const fetchedData = await response.json();
                console.log('Salem');
                console.log(fetchedData);
                const firstGroup = fetchedData.results.groupsWiseResult[0];

                if (firstGroup) {
                    setGroupWiseOverallDue({
                        group_id: firstGroup.group_id || "",
                        total_supposed_to_pay: firstGroup.total_supposed_to_pay || "",
                        total_paid_amount: firstGroup.total_paid_amount || "",
                        total_outstanding_balance: firstGroup.total_outstanding_balance || "",
                    });
                }

                const groupAccountWiseResult = fetchedData.results.groupAccountWiseResult;

                if (groupAccountWiseResult) {
                    setData(fetchedData);
                }

            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroups();
    }, [groupId, setIsLoading]); // Fetch data whenever the groupId changes
    useEffect(() => {
        console.log(GroupWiseOverallDuedata); // This will log the updated state
    }, [GroupWiseOverallDuedata]);
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <img src={loadingImage} className='w-16 h-16 mx-auto mb-4' alt='loading' />
                    <p className="text-gray-600 font-medium">Loading customer due information...</p>
                </div>
            </div>
        );
    }

    const handleBackClick = () => {
        history.goBack();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                    {/* Back Button and Title */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleBackClick}
                                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 backdrop-blur-sm hover:scale-105"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                            <h1 className="text-3xl font-bold text-white text-center flex-1">Customer Due</h1>
                            <div className="w-24"></div> {/* Spacer for centering */}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    <GroupWiseOverallDue GroupWiseOverallDuedata={GroupWiseOverallDuedata} />
                    <GroupAccountWiseOverallDue data={data} />
                </div>
            </div>
        </div>
    );


}
export default CustomerDue