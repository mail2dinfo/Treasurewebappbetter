import React from 'react'
import styled from 'styled-components'
import logo from '../assets/logo.png'


const GroupsHeader = ({ data }) => {
    // Check if data exists before destructuring
    if (!data || !data.results) {
        return null; // or you can return some default content or message
    }

    // Destructure data.results
    const { groupName, amount, commisionType, commissionAmount, type, nextAuctionDate
    } = data.results;

    return (
        <NavContainer>
            <div className="nav-center">
                <div className="nav-header">
                    <div className="group">
                        <span className="companytext"></span>
                        <img src={logo} alt="Logo" />
                        <div className="groupinfo">
                            <div> {groupName}</div>
                            <div>{amount}</div>
                            <div> {commisionType}</div>
                            <div>{commissionAmount}</div>
                            <div>{type}</div>
                            <div>{nextAuctionDate}</div>
                        </div>
                    </div>
                </div>
            </div>
        </NavContainer>
    );
};



const NavContainer = styled.nav`
  height: 5rem;
  background-color:var(--clr-red-dark);
  //background-color:blue;
  display: flex;
  align-items: center;
  justify-content: center;

  .nav-center {
    //background-color:red;
    width: 90vw;
    margin: 10 auto;
    max-width: var(--max-width);
  }
  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    img {
      width: 175px;
      // margin-left: -15px;//
    }
  }

  @media (min-width: 992px) {
    .nav-center {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
    }
  }
`;


export default GroupsHeader



