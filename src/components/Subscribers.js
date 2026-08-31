

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

import { useState, useEffect, useMemo } from 'react';
import Subcriber from './Subcriber';
import { useHistory, useParams } from 'react-router-dom';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import loadingImage from '../images/preloader.gif';
import { useUserContext } from '../context/user_context';
import { useGroupDetailsContext } from '../context/group_context';
import { getRosterFill, sortByTicketId } from '../utils/groupTicketCapacity';
import { FiPlus, FiSearch, FiGrid, FiList, FiUsers, FiX, FiArrowLeft } from 'react-icons/fi';
import '../style/home.css';

const formatSharePct = (value) => {
  let pct = Number(value);
  if (!Number.isFinite(pct) || pct <= 0) pct = 100;
  if (pct > 0 && pct <= 1) pct *= 100;
  const rounded = Math.round(pct * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}%`;
};

const formatTicketLabel = (raw) => {
  const id = String(raw || '').trim();
  if (!id) return 'Ticket —';
  const match = id.toUpperCase().match(/^(\d+)([A-Z]+)$/);
  if (match) return `Ticket ${match[1]}${match[2]}`;
  return `Ticket ${id}`;
};

const formatGroupMemberLine = (member) => {
  const name = member?.name || member?.firstname || '—';
  return `${name} - ${formatSharePct(member?.accountshare_percentage)} - ${formatTicketLabel(member?.accountshare_id)}`;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const Subscribers = ({
  addSubscriberPath,
  canAddSubscriber = true,
}) => {
  const history = useHistory();
  const { groupId } = useParams();
  const { companySubscribers, isLoading } = useCompanySubscriberContext();
  const { fetchGroups, data: groupData } = useGroupDetailsContext();
  const { user } = useUserContext();

  const [nameFilter, setNameFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const subscribers = companySubscribers || [];
  const isAddToGroup = Boolean(groupId);

  useEffect(() => {
    if (groupId && fetchGroups) {
      fetchGroups(groupId, { silent: true });
    }
  }, [groupId, fetchGroups]);

  const handleMultiStepSubscriber = () => {
    history.push(
      addSubscriberPath
      || `/chit-fund/user/addcompanymultisubscriber/${user.results.userAccounts[0].parent_membership_id}`
    );
  };

  const searchTerm = (nameFilter || '').trim().toLowerCase();
  const groupMembers = useMemo(() => {
    const list = isAddToGroup ? (groupData?.results?.groupSubcriberResult || []) : [];
    return sortByTicketId(list);
  }, [isAddToGroup, groupData?.results?.groupSubcriberResult]);
  const group = groupData?.results || {};
  const groupName = group.groupName || '';
  const groupType = String(group.type || '').toUpperCase();
  const groupCapacity =
    groupType === 'FIXED'
      ? group.totalTenture ?? group.tenure ?? 0
      : group.noOfSubcribers ?? group.noOfSubscribers ?? 0;
  const roster = getRosterFill({
    groupType,
    subscribers: groupMembers,
    groupAmount: Number(group.amount || 0),
    capacity: groupCapacity,
  });
  const addedCount = groupMembers.length;
  const capacityLabel = roster.unlimited ? 'Open' : (Number(groupCapacity) > 0 ? groupCapacity : '—');

  const uniqueGroupMembers = useMemo(() => {
    const map = new Map();
    groupMembers.forEach((member) => {
      const id = String(member.subscriber_id || member.subscriberUserId || '');
      if (!id) return;
      if (!map.has(id)) map.set(id, { ...member, ticketCount: 1 });
      else map.get(id).ticketCount += 1;
    });
    return Array.from(map.values());
  }, [groupMembers]);

  const inGroupIds = useMemo(
    () => new Set(uniqueGroupMembers.map((m) => String(m.subscriber_id || m.subscriberUserId))),
    [uniqueGroupMembers]
  );

  const isAlreadyInGroup = (subscriber) =>
    inGroupIds.has(String(subscriber?.id || subscriber?.subscriberUserId || subscriber?.subscriberId || ''));

  const filteredSubscribers = useMemo(() => {
    let list = subscribers;
    if (searchTerm) {
      list = list.filter((subscriber) => {
        const name = (subscriber?.name || '').toLowerCase();
        const phone = String(subscriber?.phone || '').toLowerCase();
        const email = (subscriber?.email || '').toLowerCase();
        return name.includes(searchTerm) || phone.includes(searchTerm) || email.includes(searchTerm);
      });
    }
    return list;
  }, [subscribers, searchTerm]);

  const totalItems = filteredSubscribers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

  const getVisiblePageNumbers = (pages, current) => {
    if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > pages) {
      end = pages;
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  const pageNumbers = getVisiblePageNumbers(totalPages, currentPage);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, pageSize]);

  if (isLoading && subscribers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <img src={loadingImage} alt="" className="w-20 h-20 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading subscribers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="group-container">
          {isAddToGroup ? (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => history.goBack()}
                className="inline-flex items-center justify-center gap-2 h-12 px-4 bg-black border border-black rounded-xl text-white text-sm font-semibold hover:bg-gray-900"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-4">
                Add to group ({subscribers.length})
              </h1>
            </div>
          ) : (
            <div className="groups-page-header">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Subscribers ({subscribers.length})
              </h1>
              {canAddSubscriber && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                  onClick={handleMultiStepSubscriber}
                >
                  <FiPlus className="w-4 h-4" />
                  Add subscriber
                </button>
              )}
            </div>
          )}

          {subscribers.length === 0 ? (
            <div className="group-empty mt-6">
              <p className="text-base font-semibold text-gray-800">No subscribers yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Add a subscriber to start assigning groups and collecting dues.
              </p>
              {canAddSubscriber && !isAddToGroup && (
                <button type="button" className="start-group-button" onClick={handleMultiStepSubscriber}>
                  Add subscriber
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`flex gap-4 items-start ${isAddToGroup ? 'flex-col md:flex-row' : 'flex-col'}`}>
              {isAddToGroup && (
                <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 space-y-2.5">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Group Name</p>
                      <p className="text-sm font-bold text-gray-900 truncate mt-0.5" title={groupName || undefined}>
                        {groupName || 'Group'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Subscribers</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">
                        {addedCount} / {capacityLabel}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {groupMembers.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No one has been added yet.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {groupMembers.map((member, index) => (
                          <li
                            key={String(member.group_subscriber_id || `${member.subscriber_id}-${index}`)}
                            className="px-4 py-2.5 text-sm font-medium text-gray-900 leading-snug"
                            title={formatGroupMemberLine(member)}
                          >
                            {formatGroupMemberLine(member)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </aside>
              )}

              <div className="min-w-0 flex-1 w-full">
              <div className="flex items-stretch gap-3 mb-4 w-full">
                <div className="groups-search flex-1 min-w-0">
                  <FiSearch className="groups-search-icon" />
                  <input
                    type="search"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Search by name, phone, or email"
                    className="groups-search-input"
                  />
                  {nameFilter ? (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setNameFilter('')}
                      aria-label="Clear search"
                    >
                      <FiX />
                    </button>
                  ) : null}
                </div>
                <div className="inline-flex h-12 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex items-center justify-center gap-2 h-12 px-4 text-sm font-semibold ${
                      viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiGrid className="w-4 h-4" /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center justify-center gap-2 h-12 px-4 text-sm font-semibold border-l border-gray-200 ${
                      viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiList className="w-4 h-4" /> List
                  </button>
                </div>
              </div>
              {pagedSubscribers.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2'
                      : 'flex flex-col gap-3'
                  }
                >
                  {pagedSubscribers.map((item) => (
                    <Subcriber
                      key={item.id}
                      {...item}
                      view={viewMode}
                      alreadyInGroup={isAddToGroup && isAlreadyInGroup(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="group-empty">
                  <FiUsers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-semibold text-gray-800">No matching subscribers</p>
                  <p className="text-sm text-gray-500 mt-1">Try a different name or phone.</p>
                </div>
              )}

              {totalItems > 0 && (
                <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-600">
                      <span>
                        Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                        <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
                        <span className="font-semibold text-gray-900">{totalItems}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <label htmlFor="subscribers-page-size">Per page</label>
                        <select
                          id="subscribers-page-size"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-custom-red focus:border-transparent bg-white"
                        >
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          &lt;
                        </button>
                        {pageNumbers.map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold ${
                              currentPage === pageNum ? 'bg-custom-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscribers;


