import React, { useCallback, useEffect, useState } from 'react';
import { FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useDcLiveEvents } from '../../context/dailyCollection/dcLiveEvents_context';
import Loading from '../../components/Loading';

const unwrapList = (body) => {
    let value = body;
    for (let i = 0; i < 3; i += 1) {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.results)) return value.results;
        if (Array.isArray(value?.data)) return value.data;
        if (value?.results != null) value = value.results;
        else if (value?.data != null) value = value.data;
        else break;
    }
    return [];
};

const DailyCollectionCollectorCustomersPage = () => {
    const { user } = useUserContext();
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    const token = user?.results?.token;

    const fetchCustomers = useCallback(async ({ silent = false } = {}) => {
        if (!token || !membershipId) return;
        if (!silent) {
            setIsLoading(true);
            setError('');
        }
        try {
            const res = await fetch(
                `${API_BASE_URL}/dc/subscribers?parent_membership_id=${encodeURIComponent(membershipId)}&collector_scope=1`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const body = await readApiResponse(res);
            setCustomers(unwrapList(body));
        } catch (requestError) {
            if (!silent) {
                setError(requestError.message || 'Unable to load customers');
                setCustomers([]);
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useDcLiveEvents(() => {
        fetchCustomers({ silent: true });
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Customers</h1>
                <p className="text-gray-600 mb-6">Subscribers in your assigned areas</p>

                {isLoading ? (
                    <div className="py-16 text-center">
                        <Loading />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
                ) : customers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                        No customers in your assigned areas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {customers.map((customer) => (
                            <div key={customer.dc_cust_id} className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                        <FiUser className="text-red-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {customer.dc_cust_name || 'Customer'}
                                        </p>
                                        {customer.dc_cust_phone ? (
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <FiPhone className="w-3.5 h-3.5" />
                                                {customer.dc_cust_phone}
                                            </p>
                                        ) : null}
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <FiMapPin className="w-3.5 h-3.5" />
                                            {customer.area_name || 'No area'}
                                        </p>
                                        {customer.dc_cust_address ? (
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                                {customer.dc_cust_address}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyCollectionCollectorCustomersPage;
