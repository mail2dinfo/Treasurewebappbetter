import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import GroupAccountWiseUserResult from './GroupAccountWiseUserResult';

const GroupAccountWiseOverallUserDue = ({ data }) => {
    console.log('Received data:', data);

    const [accountWiseData, setAccountWiseData] = useState([]);

    useEffect(() => {
     
        if (data && data.results) {
            const { groupsAccountWiseResult } = data.results;
            setAccountWiseData(groupsAccountWiseResult);

          
        }
    }, [data]);

    useEffect(() => {
        console.log('Effect 2 - accountWiseData changed:', accountWiseData);
    }, [accountWiseData]);

    if (!data || !data.results) {
        return <p>No data available.</p>;
    }

    return (
        <section className='section'>
            <Wrapper className='section-center'>
                <GroupAccountWiseUserResult accountWiseData={accountWiseData} />
            </Wrapper>
        </section>
    );
};

const Wrapper = styled.div`
    padding-top: 2rem;
    display: grid;
    gap: 3rem 2rem;
    @media (min-width: 992px) {
        grid-template-columns: 1fr 1fr;
    }
`;

export default GroupAccountWiseOverallUserDue;
