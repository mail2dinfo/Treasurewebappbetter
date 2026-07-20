// import React from 'react';
// import styled from 'styled-components';
// import DashboardAreaWiseAccountsList from './DashboardAreaWiseAccountsList'
// import { useDashboardContext } from '../context/dashboard_context';
// const DashboardAreaWiseAccounts = () => {
//   const { dashboardDetails } = useDashboardContext();
//   const {
//     userMembershipAreaWiseSubcriberDue

//   } = dashboardDetails.results || {};

//   return (
//     <Wrapper>

//       {userMembershipAreaWiseSubcriberDue?.length > 0 && ( // Use groupTransactionInfo as items
//         <div className='subcriber-container'>
//           <DashboardAreaWiseAccountsList items={userMembershipAreaWiseSubcriberDue} />
//         </div>
//       )}
//     </Wrapper>
//   );
// };

// const Wrapper = styled.article`
//   background: var(--clr-white);
//   border-top-right-radius: var(--radius);
//   border-bottom-left-radius: var(--radius);
//   border-bottom-right-radius: var(--radius);
//   position: relative;

//   &::before {
//     content: 'Areawise Receivable';
//     position: absolute;
//     top: 0;
//     left: 0;
//     transform: translateY(-100%);
//     background: var(--clr-white);
//     color: var(--clr-grey-5);
//     border-top-right-radius: var(--radius);
//     border-top-left-radius: var(--radius);
//     text-transform: capitalize;
//     padding: 0.5rem 1rem 0 1rem;
//     letter-spacing: var(--spacing);
//     font-size: 1rem;
//   }
//   .followers {
//     overflow: scroll;
//     height: 260px;
//     display: grid;
//     grid-template-rows: repeat(auto-fill, minmax(45px, 1fr));
//     gap: 1.25rem 1rem;
//     padding: 1rem 2rem;
//   }
//   article {
//     transition: var(--transition);
//     padding: 0.15rem 0.5rem;
//     border-radius: var(--radius);
//     display: grid;
//     grid-template-columns: auto 1fr;
//     align-items: center;
//     column-gap: 1rem;
//     img {
//       height: 100%;
//       width: 45px;
//       border-radius: 50%;
//       object-fit: cover;
//     }
//     h4 {
//       margin-bottom: 0;
//     }
//     a {
//       color: var(--clr-grey-5);
//     }
//   }
//   .subcriber-container {
//     display: grid;
//   grid-template-columns: auto 1fr 1fr 1fr 1fr 1fr; /* Adjust column widths as needed */
//   align-items: start; /* Ensures each row starts at the same line */
//   margin-top: 2rem;
//   background-color: #ffffff;
//   border-radius: 10px;
//   padding: 15px;
//   box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
//   text-align: center;
//   margin: 10px;
//   }
//   .subcriber-item {
//     display: grid;
//     grid-template-columns: auto 1fr 1fr 1fr 1fr 1fr; /* Adjust the number of columns as needed */
//     align-items: center;
//     margin-top: 12px; /* Adjust as needed */
//     margin-bottom: 0.5rem; /* Adjust as needed */
//     padding: 0.25rem 1rem;
//     border-radius: var(--radius);
//     text-transform: capitalize;  
//   }
//   .subcriber-item img {
//     height: 100%;
//     width: 45px;
//     border-radius: 50%;
//     object-fit: cover;
// }

//   .subcriber-item:hover {
//     color: var(--clr-grey-5);
//     background: var(--clr-grey-10);
//   }

//   .subcriber-item:hover .title {
//     color: var(--clr-grey-5);
//   }
//   .subcriber-header {

//     background-color: #cd3240;
//     color: #fff;
//     display: flex;
//     padding:4px 16px;
//     align-items: center; /* Vertical alignment */
//     justify-content: center; /* Horizontal alignment */
//     justify-content: space-between;     
// }
// .subcriber-header p {

//   color: #fff;
//   align-items: center; /* Vertical alignment */
//     justify-content: center; /* Horizontal alignment */
// }
// `;
// export default DashboardAreaWiseAccounts;


import React from 'react';
import '../style/DashboardAreaWiseAccounts.css';
import DashboardAreaWiseAccountsList from './DashboardAreaWiseAccountsList'
import { useDashboardContext } from '../context/dashboard_context';
const DashboardAreaWiseAccounts = () => {
  const { dashboardDetails } = useDashboardContext();
  const {
    userMembershipAreaWiseSubcriberDue

  } = dashboardDetails.results || {};

  return (
    <>

      {userMembershipAreaWiseSubcriberDue?.length > 0 && ( // Use groupTransactionInfo as items
        <div >
          <DashboardAreaWiseAccountsList items={userMembershipAreaWiseSubcriberDue} />
        </div>
      )}
    </>
  );
};


export default DashboardAreaWiseAccounts;


