import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoRepo } from 'react-icons/go';
import { FiUsers, FiUserPlus } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';



const GroupWiseOverallUserDue = ({ GroupWiseOverallUserDuedata }) => {
  const history = useHistory();
  const [total_supposed_to_pay, setTotal_supposed_to_pay] = useState('');
  const [total_paid_amount, setTotal_paid_amount] = useState('');
  const [total_outstanding_balance, setTotal_outstanding_balance] = useState('');

  useEffect(() => {
    // console.log('GroupWiseOverallDue:', GroupWiseOverallDuedata);

    if (GroupWiseOverallUserDuedata) {
      const {
        group_id,
        total_supposed_to_pay,
        total_paid_amount,
        total_outstanding_balance,
      } = GroupWiseOverallUserDuedata;

      // console.log('Received data:', {
      //     group_id,
      //     total_supposed_to_pay,
      //     total_paid_amount,
      //     total_outstanding_balance,
      // });

      if (
        group_id !== undefined &&
        total_supposed_to_pay !== undefined &&
        total_paid_amount !== undefined &&
        total_outstanding_balance !== undefined
      ) {
        // console.log('Setting state:', {
        //     group_id,
        //     total_supposed_to_pay,
        //     total_paid_amount,
        //     total_outstanding_balance,
        // });

        setTotal_supposed_to_pay(total_supposed_to_pay);
        setTotal_paid_amount(total_paid_amount);
        setTotal_outstanding_balance(total_outstanding_balance);
      }
    }
  }, [GroupWiseOverallUserDuedata]);

  const items = [

    {
      id: 1,
      icon: <GoRepo className='icon' />,
      label: 'Total Amount',
      value: total_supposed_to_pay,
      color: 'pink',
    },
    {
      id: 2,
      icon: <FiUsers className='icon' />,
      label: 'Total Paid',
      value: total_paid_amount,
      color: 'green',
    },
    {
      id: 3,
      icon: <FiUserPlus className='icon' />,
      label: 'Total Outstanding',
      value: total_outstanding_balance,
      color: 'purple',
    },
  ];

  console.log('Rendered with state:', {
    total_supposed_to_pay,
    total_paid_amount,
    total_outstanding_balance,
  });
  const handleBackButtonClick = () => {
    history.goBack(); // Use history.goBack() to navigate back
    
  };
  return (
    <section className='section'>
      <Wrapper className='section-center'>
        {items.map((item) => {
          return <Item key={item.id} {...item} />;
        })}
        <button className='button' onClick={handleBackButtonClick}>Back</button>
      </Wrapper>
    </section>
  );
};

const Item = ({ icon, label, value, color }) => {
  return (
    <article className='item'>
      <span className={color}>{icon}</span>
      <div>
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </article>
  );
};

const Wrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem 2rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  .item {
    border-radius: var(--radius);
    padding: 0.5rem 1rem;
    background: var(--clr-white);

    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 3rem;
    align-items: center;
    span {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
    }
    .icon {
      font-size: 1.5rem;
    }
    h3 {
      margin-bottom: 0;
      letter-spacing: 0;
    }
    p {
      margin-bottom: 0;
      text-transform: capitalize;
    }
    .pink {
      background: #ffe0f0;
      color: #da4a91;
    }
    .green {
      background: var(--clr-primary-10);
      color: var(--clr-primary-5);
    }
    .purple {
      background: #e6e6ff;
      color: #5d55fa;
    }
    .yellow {
      background: #fffbea;
      color: #f0b429;
    }
  }
  .button {
    background-color: var(--clr-primary-1);
    color: var(--clr-white);
    padding: 0.5rem 1rem;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    width: 100%; /* Set a fixed width */
    box-sizing: border-box; /* Include padding and border in the width calculation */
    margin-bottom: 1.5rem;
    margin-top: 2rem;
  }
`;

export default GroupWiseOverallUserDue;
