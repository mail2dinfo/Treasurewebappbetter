import React, { useState, useEffect } from 'react';
import GroupSubscriberWiseResult from './GroupSubscriberWiseResult';
import GroupAccountWiseResult from './GroupAccountWiseResult';

const GroupAccountWiseOverallDue = ({ data }) => {
    const [accountWiseData, setAccountWiseData] = useState([]);
    const [subscriberWiseData, setSubscriberWiseData] = useState([]);

    useEffect(() => {
        if (data && data.results) {
            const { groupAccountWiseResult, groupSubscriberWiseResult } = data.results;
            setAccountWiseData(groupAccountWiseResult);
            setSubscriberWiseData(groupSubscriberWiseResult);
        }
    }, [data]);

    useEffect(() => {
        // Additional effect if needed
    }, [accountWiseData, subscriberWiseData]);

    if (!data || !data.results) {
        return <p>No data available.</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="min-w-0">
                <GroupAccountWiseResult accountWiseData={accountWiseData} />
            </div>
            <div className="min-w-0">
                <GroupSubscriberWiseResult subscriberWiseData={subscriberWiseData} />
            </div>
        </div>
    );
};

export default GroupAccountWiseOverallDue;