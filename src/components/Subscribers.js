

// const Subscribers = () => {
//   const history = useHistory();
//   const { state } = useCompanySubscriberContext();
//   const { companySubscribers } = state;
//   const { user } = useUserContext();

//   const [nameFilter, setNameFilter] = useState('');

//   const handleBackButtonClick = () => {
//     history.goBack();
//   };

//   const handleMultiStepSubscriber = () => {
//     history.push(`/chit-fund/user/addcompanymultisubscriber/${user.results.userAccounts[0].parent_membership_id}`);
//   };

//   const filteredSubscribers = companySubscribers.filter((subscriber) =>
//     subscriber.name.toLowerCase().includes(nameFilter.toLowerCase())
//   );

//   if (!companySubscribers) {
//     return (
//       <>
//         <img src={loadingImage} className="loading-img" alt="loading" />
//         <div className="placeholder" style={{ height: '50vh' }}></div>
//       </>
//     );
//   }

//   return (
//     <Wrapper>
//       <div className="section-center">
//         <div className="header">
//           <h2 className="section-title">Company Subscribers ({filteredSubscribers.length})</h2>
//         </div>
//         <div className="smallheader">
//           <input
//             type="text"
//             placeholder="Filter by name"
//             value={nameFilter}
//             onChange={(e) => setNameFilter(e.target.value)}
//           />
//           <div className="button-group">
//             <button onClick={handleMultiStepSubscriber}>Add Subscriber Multistep</button>
//             <button onClick={handleBackButtonClick}>Back</button>
//           </div>
//         </div>
//         <div className="cocktails-center">
//           {filteredSubscribers.map((item) => (
//             <Subcriber key={item.id} {...item} />
//           ))}
//         </div>
//       </div>
//     </Wrapper>
//   );
// };

// const Wrapper = styled.section`
//   padding: 2rem 0;
//   background: var(--clr-white);

//   .header {
//     margin-bottom: 1rem;
//     text-align: center;
//   }

//   .section-title {
//     font-size: 1.75rem;
//     text-transform: capitalize;
//     letter-spacing: var(--mainSpacing);
//     margin-bottom: 2rem;
//     margin-top: 1rem;
//   }

//   .smallheader {
//     display: flex;
//     flex-direction: column;
//     gap: 1rem;
//     margin-bottom: 1.5rem;
//     padding: 0 1rem;
//   }

//   .smallheader input[type='text'] {
//     width: 100%;
//     height: 2.5rem;
//     padding: 0.5rem 1rem;
//     background: var(--clr-grey-10);
//     border-radius: 8px;
//     border: 1px solid transparent;
//     font-size: 1rem;
//     color: var(--clr-grey-5);
//   }

//   .smallheader input[type='text']::placeholder {
//     color: var(--clr-grey-5);
//   }

//   .button-group {
//     display: flex;
//     flex-direction: column;
//     gap: 0.5rem;
//   }

//   .button-group button {
//     background-color: var(--clr-primary-1);
//     color: var(--clr-white);
//     padding: 0.6rem 1rem;
//     border: none;
//     cursor: pointer;
//     font-size: 1rem;
//     border-radius: 8px;
//     width: 100%;
//   }
//   @media screen and (min-width: 768px) {
//     .smallheader {
//       flex-direction: row;
//       align-items: center;
//       justify-content: space-between;
//     }

//     .smallheader input[type='text'] {
//       width: 60%;
//     }

//     .button-group {
//       flex-direction: row;
//       gap: 1rem;
//       width: auto;
//     }

//     .button-group button {
//       width: auto;
//     }
//   }

//   .cocktails-center {
//     display: grid;
//     gap: 1.5rem;
//     padding: 0 1rem;
//   }

//   @media screen and (min-width: 576px) {
//     .cocktails-center {
//       grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//     }
//   }

//   @media screen and (min-width: 992px) {
//     .section-title {
//       font-size: 2rem;
//     }
//   }
// `;

import { useState } from 'react';
import Subcriber from './Subcriber';
import { useHistory } from 'react-router-dom';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import loadingImage from '../images/preloader.gif';
import { useUserContext } from '../context/user_context';
import { Grid, List } from 'lucide-react';

const Subscribers = ({
  addSubscriberPath,
  canAddSubscriber = true,
}) => {
  const history = useHistory();
  const { companySubscribers, isLoading, error } = useCompanySubscriberContext();

  const { user } = useUserContext();

  const [nameFilter, setNameFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const handleBackButtonClick = () => {
    history.goBack();
  };

  const handleMultiStepSubscriber = () => {
    history.push(
      addSubscriberPath
      || `/chit-fund/user/addcompanymultisubscriber/${user.results.userAccounts[0].parent_membership_id}`
    );
  };

  const searchTerm = (nameFilter || "").toLowerCase();

  const filteredSubscribers = companySubscribers?.filter((subscriber) =>
    (subscriber?.name || "").toLowerCase().includes(searchTerm)
  );

  if (isLoading) {
    return (
      <>
        <img src={loadingImage} className="loading-img" alt="loading" />
        <div className="placeholder" style={{ height: '50vh' }}></div>
      </>
    );
  }

  return (
    <section className="pb-8 px-4 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
          <h2 className="text-3xl font-bold text-gray-800">
            Company Subscribers ({filteredSubscribers.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all duration-300 ${viewMode === 'grid'
                ? 'bg-custom-red border-custom-red text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-all duration-300 ${viewMode === 'list'
                ? 'bg-custom-red border-custom-red text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 my-6 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-base w-full md:flex-1 placeholder-gray-500 focus:border-custom-red focus:ring-1 focus:ring-custom-red transition-all duration-300"
          />
          <div className="flex gap-4 flex-wrap">
            {canAddSubscriber && (
              <button
                onClick={handleMultiStepSubscriber}
                className="px-4 py-3 bg-custom-red border border-custom-red rounded-lg text-white font-semibold cursor-pointer transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:scale-105"
              >
                + Add Subscriber
              </button>
            )}
            <button
              onClick={handleBackButtonClick}
              className="px-4 py-3 bg-custom-red border border-custom-red rounded-lg text-white font-semibold cursor-pointer transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:scale-105"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className={`${viewMode === 'grid'
          ? 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col gap-4'
          }`}>
          {filteredSubscribers.map((item) => (
            <Subcriber key={item.id} {...item} view={viewMode} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Subscribers;


