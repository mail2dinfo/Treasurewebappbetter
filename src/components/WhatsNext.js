import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Wrapper = styled.div`
    background-color: #f8f8f8;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
`;

const Content = styled.div`
    display: flex;
    align-items: center;
`;

const Description = styled.div` /* Change from p to div */
    font-size: 16px;
    color: #555;
    margin-bottom: 10px; /* Add margin-bottom to separate lines */
`;

const AddSubscriberButton = styled(Link)`
    display: inline-block;
    padding: 5px 5px;
    background-color: #cd3240;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 18px;
    text-decoration: none;
    margin-top: 30px;

    &:hover {
        background-color: #4d3244;
    }
`;

const WhatsNext = ({ groupId }) => {
    return (
        <Wrapper>
            <Title>What's Next?</Title>
            <Content>
                {/* <Image src="/path-to-your-image.png" alt="Next Steps" /> */}
                <Description>
                    Now that you've created your group,
                    <br /> {/* Use <br /> to create a line break */}
                    it's time to add subscribers.
                </Description>
                <AddSubscriberButton to={`/addgroupsubscriber/${groupId}`}>
                    <span>+</span> Add Subscriber
                </AddSubscriberButton>
            </Content>
        </Wrapper>
    );
};

export default WhatsNext;
