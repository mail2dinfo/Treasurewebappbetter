import React from 'react'
import { useParams } from 'react-router-dom';
import {
  EmployeeProfilecard
} from '../components'
import styled from 'styled-components'


const SingleEmployeePage = () => {
  const { id } = useParams();

  return <Wrapper>


    {/* <ProfileCardComponent /> */}
    <EmployeeProfilecard employeeId={id} />
  </Wrapper>
}

const Wrapper = styled.main`


`

export default SingleEmployeePage
