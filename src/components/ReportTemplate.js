import React from 'react';
import styled from 'styled-components'

const ReportTemplate = ({ items }) => {
    console.log('items');
    console.log(items);
    return (
        <ReportContainer className="report-template">
            <ReportHeaderContainer>
                <div style={{ backgroundColor: 'lightblue', padding: '20px' }}>
                    <div>

                        <h2>Invoice</h2>
                        <ul>
                            {items.map((item, index) => (
                                <li key={index}>
                                    {item.aob} - {item.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </ReportHeaderContainer>
        </ReportContainer>
    );
};

const ReportContainer = styled.div`
    width: 100%;
    .report-template {
        height: 25rem;
        // add any necessary styling for the report template content here
    }
`;

const ReportHeaderContainer = styled.nav`
    height: 25rem;
    background-color:red;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top:3rem;
  
    .nav-center {
        //background-color:red;
        width: 90vw;
        margin: 10 auto;
        max-width: var(--max-width);   
    }
`;

export default ReportTemplate;
