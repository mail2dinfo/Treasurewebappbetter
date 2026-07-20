import React from 'react'
import { useParams } from 'react-router-dom';
import {
  ProfileCard
} from '../components'
import styled from 'styled-components'


const SingleSubscriberPage = () => {
  const { id } = useParams();
  return <Wrapper>


    {/* <ProfileCardComponent /> */}
    <ProfileCard subscriberId={id} />
  </Wrapper>
}

const Wrapper = styled.main`


`
export default SingleSubscriberPage
