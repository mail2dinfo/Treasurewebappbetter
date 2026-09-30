import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import DeepavaliCompanyCard from './DeepavaliCompanyCard';
import DeepavaliHighlights from './DeepavaliHighlights';

const DeepavaliUserDetails = ({ company, dashboard, basePath, collector = false }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Container>
            <ToggleButton type="button" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </ToggleButton>
            <Content isOpen={isOpen}>
                <InnerContent>
                    {!collector && (
                        <CardWrapper>
                            <DeepavaliCompanyCard company={company} allowManage />
                        </CardWrapper>
                    )}
                    <HighlightsWrapper>
                        <DeepavaliHighlights dashboard={dashboard} basePath={basePath} collector={collector} />
                    </HighlightsWrapper>
                </InnerContent>
            </Content>
        </Container>
    );
};

export default DeepavaliUserDetails;

const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-width: 1200px;
  margin: 1rem auto;
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);

  &:hover {
    background: #b71c1c;
  }
`;

const Content = styled.div`
  max-height: ${({ isOpen }) => (isOpen ? '4000px' : '0')};
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
  @media (min-width: 992px) {
    flex: 0 0 300px;
  }
`;

const HighlightsWrapper = styled.div`
  @media (min-width: 992px) {
    flex: 1;
  }
`;
