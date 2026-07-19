import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import VehicleFinanceCompanyCard from './VehicleFinanceCompanyCard';
import VehicleFinanceHighlights from './VehicleFinanceHighlights';

const VehicleFinanceUserDetails = ({ company, stats, basePath, showCompany = true }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Container>
            <ToggleButton type="button" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </ToggleButton>

            <Content isOpen={isOpen}>
                <InnerContent>
                    {showCompany && (
                        <CardWrapper>
                            <VehicleFinanceCompanyCard company={company} />
                        </CardWrapper>
                    )}
                    <HighlightsWrapper>
                        <VehicleFinanceHighlights stats={stats} basePath={basePath} />
                    </HighlightsWrapper>
                </InnerContent>
            </Content>
        </Container>
    );
};

export default VehicleFinanceUserDetails;

const Container = styled.div`
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    max-width: 1200px;
    margin: 1rem auto 1rem auto;
    position: relative;
    padding-top: 0.5rem;
`;

const ToggleButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: #c62828;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: background 0.3s ease;

    &:hover {
        background: #b71c1c;
    }
`;

const Content = styled.div`
    max-height: ${({ isOpen }) => (isOpen ? '3000px' : '0')};
    opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
    overflow: hidden;
    transition: all 0.4s ease;
`;

const InnerContent = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    @media (min-width: 992px) {
        flex-direction: row;
        align-items: flex-start;
    }
`;

const CardWrapper = styled.div`
    margin-bottom: 1rem;

    @media (min-width: 992px) {
        flex: 0 0 300px;
        margin-bottom: 0;
    }
`;

const HighlightsWrapper = styled.div`
    @media (min-width: 992px) {
        flex: 1;
    }
`;
