
import React, { useEffect, useMemo, useState } from 'react';
import { useReceivablesContext } from '../context/receivables_context';
import { FiSearch, FiFilter, FiX, FiUser, FiPhone, FiCalendar, FiDollarSign, FiCreditCard, FiGrid, FiList, FiRefreshCw, FiDownload, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReceivablePayementModal from '../components/ReceivablePayementModal';
import { useAobContext } from '../context/aob_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import { useUserContext } from '../context/user_context';
import Mypdf from '../components/PDF/Mypdf';
import { formatReceivableDueNo } from '../utils/formatReceivableDueNo';
import Loading from '../components/Loading';
import LoadingBar from '../components/LoadingBar';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const Receivable = () => {
  const platform = usePlatformAccess();
  const enforceReceivableAccess = platform?.isAvailable && !platform.isOwner;
  const canPayReceivable = !enforceReceivableAccess || platform.hasPermission('chit_receivables_pay');
  const { fetchReceivables, receivables, isLoading, hasLoaded } = useReceivablesContext();
  const { user } = useUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const { aobs, fetchAobs } = useAobContext();
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Advance 360° modal state
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedAdvanceReceivable, setSelectedAdvanceReceivable] = useState(null);

  useEffect(() => {
    fetchReceivables();
    fetchAobs();
  }, []);

  // Debug: Check if total_advance_balance is coming through
  useEffect(() => {
    if (receivables.length > 0) {
      console.log('🔍 First receivable data:', receivables[0]);
      console.log('🔍 total_advance_balance value:', receivables[0]?.total_advance_balance);
      console.log('🔍 advance_transactions:', receivables[0]?.advance_transactions);
    }
  }, [receivables]);
  // Filter states
  const [groupFilter, setGroupFilter] = useState("");
  const [subscriberFilter, setSubscriberFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState(""); // if you want to implement area filter too
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');


  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isValidUserImage = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('via.placeholder.com')) return false;
    if (url === 'default-image.jpg') return false;
    return true;
  };

  const getUserImageSrc = (person) => {
    const candidates = [
      person?.user_image_base64format,
      person?.user_image_from_s3,
      person?.user_image,
      person?.customer_image,
    ];
    return candidates.find(isValidUserImage) || null;
  };

  const renderUserAvatar = (person, options = {}) => {
    const {
      sizeClass = 'w-10 h-10',
      iconClass = 'w-5 h-5',
      variant = 'default',
    } = options;
    const imageSrc = getUserImageSrc(person);
    const borderClass = variant === 'header'
      ? 'border-2 border-white/30'
      : 'border border-gray-200';
    const fallbackBg = variant === 'header' ? 'bg-white/20' : 'bg-gray-100';
    const iconColor = variant === 'header' ? 'text-white' : 'text-gray-500';

    return (
      <div className={`relative flex-shrink-0 ${sizeClass}`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={person?.name || 'User'}
            className={`${sizeClass} rounded-full object-cover ${borderClass}`}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`${sizeClass} rounded-full ${borderClass} ${fallbackBg} flex items-center justify-center ${imageSrc ? 'hidden' : 'flex'}`}
        >
          <FiUser className={`${iconClass} ${iconColor}`} />
        </div>
      </div>
    );
  };

  // Filter receivables based on group name and subscriber name (case insensitive)
  // const filteredReceivables = receivables.filter(({ group_name, name }) => {
  //   return (
  //     group_name.toLowerCase().includes(groupFilter.toLowerCase()) &&
  //     name.toLowerCase().includes(subscriberFilter.toLowerCase())
  //     // If you add area, add && area.toLowerCase().includes(areaFilter.toLowerCase())
  //   );
  // });

  const groupOptions = useMemo(() => {
    const map = new Map();
    receivables.forEach((row) => {
      const id = String(row.group_id || row.group_name || '').trim();
      if (!id) return;
      const name = row.group_name || 'Unnamed group';
      if (!map.has(id)) map.set(id, { id, name, count: 0 });
      map.get(id).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [receivables]);

  const filteredReceivables = receivables.filter(({ group_name, group_id, name, area, aob }) => {
    const groupKey = String(group_id || group_name || '');
    const groupChipMatch = !selectedGroupId || groupKey === selectedGroupId;
    const groupSearchMatch = !groupFilter || (group_name || '').toLowerCase().includes(groupFilter.toLowerCase());
    const subscriberMatch = !subscriberFilter || (name || '').toLowerCase().includes(subscriberFilter.toLowerCase());
    const areaValue = area || aob || '';
    const areaMatch = !areaFilter || areaValue.toLowerCase().includes(areaFilter.toLowerCase());

    return groupChipMatch && groupSearchMatch && subscriberMatch && areaMatch;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'auct_date' ? 'desc' : 'asc');
    }
  };

  const sortedReceivables = useMemo(() => {
    if (!sortKey) return filteredReceivables;
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...filteredReceivables].sort((a, b) => {
      if (sortKey === 'auct_date') {
        const aTime = new Date(a.auct_date || 0).getTime() || 0;
        const bTime = new Date(b.auct_date || 0).getTime() || 0;
        if (aTime === bTime) return 0;
        return aTime > bTime ? dir : -dir;
      }
      const aDue = Number(a.due_number) || 0;
      const bDue = Number(b.due_number) || 0;
      if (aDue !== bDue) return aDue > bDue ? dir : -dir;
      const aTotal = Number(a.due_total) || 0;
      const bTotal = Number(b.due_total) || 0;
      if (aTotal === bTotal) return 0;
      return aTotal > bTotal ? dir : -dir;
    });
  }, [filteredReceivables, sortKey, sortDir]);

  const renderSortHeader = (label, column) => {
    const active = sortKey === column;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-red-100"
        title={`Sort by ${label} ${active && sortDir === 'asc' ? 'descending' : 'ascending'}`}
      >
        <span>{label}</span>
        <span className="inline-flex flex-col leading-none -space-y-1" aria-hidden="true">
          <FiChevronUp className={`w-3 h-3 ${active && sortDir === 'asc' ? 'text-white' : 'text-white/40'}`} />
          <FiChevronDown className={`w-3 h-3 ${active && sortDir === 'desc' ? 'text-white' : 'text-white/40'}`} />
        </span>
      </button>
    );
  };

  const pdfHeaders = [
    { title: 'Subscriber', value: 'name' },
    { title: 'Phone', value: 'phone' },
    { title: 'Group', value: 'group_name' },
    { title: 'Date', value: 'auct_date' },
    { title: 'Area', value: 'area' },
    { title: 'Due no.', value: 'due_no' },
    { title: 'Total', value: 'total' },
    { title: 'Paid', value: 'paid' },
    { title: 'Due', value: 'due' },
  ];

  const pdfRows = useMemo(() => {
    const rows = sortedReceivables.map((item) => ({
      name: item.name || '—',
      phone: item.phone || '—',
      group_name: item.group_name || '—',
      auct_date: formatDate(item.auct_date),
      area: item.area || item.aob || '—',
      due_no: formatReceivableDueNo(item),
      total: Number(item.rbtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      paid: Number(item.rbpaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      due: Number(item.rbdue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    }));
    if (rows.length) {
      const totals = sortedReceivables.reduce(
        (acc, item) => {
          acc.total += parseFloat(item.rbtotal || 0);
          acc.paid += parseFloat(item.rbpaid || 0);
          acc.due += parseFloat(item.rbdue || 0);
          return acc;
        },
        { total: 0, paid: 0, due: 0 }
      );
      rows.push({
        name: 'TOTAL',
        phone: '',
        group_name: '',
        auct_date: '',
        area: `${rows.length} records`,
        due_no: '',
        total: totals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        paid: totals.paid.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        due: totals.due.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      });
    }
    return rows;
  }, [sortedReceivables]);

  useEffect(() => {
    setCurrentPage(1);
  }, [groupFilter, subscriberFilter, areaFilter, selectedGroupId, pageSize, sortKey, sortDir]);

  const clearFilters = () => {
    setGroupFilter("");
    setSubscriberFilter("");
    setAreaFilter("");
    setSelectedGroupId("");
    setCurrentPage(1);
  };

  const openPaymentModal = (person) => {
    if (!canPayReceivable) return;
    setSelectedReceivable(person);
    setModalOpen(true);
  };

  const getReceivableKey = (person, index) =>
    person.unique_id || person.id || `${person.group_id || 'group'}-${person.auct_date || 'date'}-${index}`;

  const getReceivablesSummary = (items) => (
    items.reduce((acc, person) => {
      acc.totalDue += parseFloat(person.rbtotal || 0);
      acc.paid += parseFloat(person.rbpaid || 0);
      acc.balance += parseFloat(person.rbdue || 0);
      return acc;
    }, { totalDue: 0, paid: 0, balance: 0 })
  );

  const renderMobileSummaryFooter = (items) => {
    if (!items.length) return null;

    const totals = getReceivablesSummary(items);

    return (
      <div className="bg-gray-100 rounded-xl border-2 border-custom-red p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg min-w-0">
            <p className="text-[10px] text-blue-600 font-medium uppercase">Total Due</p>
            <p className="text-xs sm:text-sm font-bold text-blue-800 break-words">{formatCurrency(totals.totalDue)}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg min-w-0">
            <p className="text-[10px] text-green-600 font-medium uppercase">Paid</p>
            <p className="text-xs sm:text-sm font-bold text-green-800 break-words">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg min-w-0">
            <p className="text-[10px] text-red-600 font-medium uppercase">Balance</p>
            <p className="text-xs sm:text-sm font-bold text-red-800 break-words">{formatCurrency(totals.balance)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopSummaryRow = (items) => {
    if (!items.length) return null;

    const totals = getReceivablesSummary(items);

    return (
      <tr className="bg-gray-100 border-t-2 border-custom-red">
        <td colSpan={6} className="px-4 py-4 text-sm font-semibold text-gray-900">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-gray-700">—</td>
        <td className="px-4 py-4 text-sm font-bold text-blue-700">
          {formatCurrency(totals.totalDue)}
        </td>
        <td className="px-4 py-4 text-sm font-bold text-green-700">
          {formatCurrency(totals.paid)}
        </td>
        <td className="px-4 py-4 text-sm font-bold text-red-700">
          {formatCurrency(totals.balance)}
        </td>
        <td className="px-4 py-4" />
      </tr>
    );
  };

  const renderGridSummaryFooter = (items) => {
    if (!items.length) return null;

    const totals = getReceivablesSummary(items);

    return (
      <div className="col-span-full bg-gray-100 rounded-xl border-2 border-custom-red p-4 md:p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide">Total Due</p>
            <p className="text-sm sm:text-xl font-bold text-blue-800 mt-1 break-words">{formatCurrency(totals.totalDue)}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-green-600 uppercase tracking-wide">Paid</p>
            <p className="text-sm sm:text-xl font-bold text-green-800 mt-1 break-words">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-red-600 uppercase tracking-wide">Balance</p>
            <p className="text-sm sm:text-xl font-bold text-red-800 mt-1 break-words">{formatCurrency(totals.balance)}</p>
          </div>
        </div>
      </div>
    );
  };

  const getPaginationMeta = (items) => {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      totalItems,
      totalPages,
      safePage,
      startIndex,
      endIndex,
      paginatedItems: items.slice(startIndex, endIndex),
    };
  };

  const getVisiblePageNumbers = (totalPages, current) => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  const renderViewToggle = () => (
    <div className="inline-flex w-full sm:w-auto rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid'
          ? 'bg-custom-red text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        title="Grid view"
      >
        <FiGrid className="w-4 h-4" />
        <span>Grid</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${viewMode === 'list'
          ? 'bg-custom-red text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        title="List view"
      >
        <FiList className="w-4 h-4" />
        <span>List</span>
      </button>
    </div>
  );

  const renderPagination = (items) => {
    const { totalItems, totalPages, safePage, startIndex, endIndex } = getPaginationMeta(items);

    if (totalItems === 0) return null;

    const pageNumbers = getVisiblePageNumbers(totalPages, safePage);

    return (
      <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span>
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="user-page-size" className="text-sm text-gray-600">Per page</label>
              <select
                id="user-page-size"
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
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold transition-colors ${safePage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                &lt;
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-1 text-gray-400 text-sm">…</span>
                  )}
                </>
              )}

              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${safePage === pageNum
                    ? 'bg-custom-red text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {pageNum}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-gray-400 text-sm">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold transition-colors ${safePage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReceivableGridCard = (person) => {
    const {
      name,
      phone,
      rbtotal,
      rbpaid,
      group_name,
      auct_date,
      rbdue,
      unique_id,
    } = person;

    return (
      <div key={unique_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="bg-gradient-to-r from-custom-red to-red-600 p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            {renderUserAvatar(person, { sizeClass: 'w-12 h-12 sm:w-16 sm:h-16', iconClass: 'w-6 h-6 sm:w-8 sm:h-8', variant: 'header' })}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold truncate">{name}</h3>
              <p className="text-red-100 flex items-center gap-2 text-sm">
                <FiPhone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{phone}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FiUser className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Group</span>
              </div>
              <p className="text-sm font-bold text-blue-900 truncate" title={group_name}>
                {group_name}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FiCalendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">Auction</span>
              </div>
              <p className="text-sm font-bold text-purple-900">
                {formatDate(auct_date)}
              </p>
            </div>
          </div>

          <div
            className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all duration-200"
            onClick={() => handleOpenAdvanceModal(person)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleOpenAdvanceModal(person);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl sm:text-2xl flex-shrink-0" aria-hidden>💰</span>
                <div className="min-w-0">
                  <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide">Advance Balance</p>
                  <span className="text-xs text-yellow-600">Tap for details</span>
                </div>
              </div>
              <p className="text-base sm:text-2xl font-bold text-yellow-900 whitespace-nowrap">
                {formatCurrency(person?.total_advance_balance || 0)}
              </p>
            </div>
          </div>

          <div className="mb-3 text-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Due no.</div>
            <div className="text-sm sm:text-lg font-bold text-gray-900">{formatReceivableDueNo(person)}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg min-w-0">
              <div className="text-[10px] sm:text-xs text-blue-600 font-medium mb-1">Total Due</div>
              <div className="text-xs sm:text-lg font-bold text-blue-700 break-words">{formatCurrency(rbtotal)}</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg min-w-0">
              <div className="text-[10px] sm:text-xs text-green-600 font-medium mb-1">Paid</div>
              <div className="text-xs sm:text-lg font-bold text-green-700 break-words">{formatCurrency(rbpaid)}</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg min-w-0">
              <div className="text-[10px] sm:text-xs text-red-600 font-medium mb-1">Balance</div>
              <div className="text-xs sm:text-lg font-bold text-red-700 break-words">{formatCurrency(rbdue)}</div>
            </div>
          </div>

          {canPayReceivable && (
            <button
              onClick={() => openPaymentModal(person)}
              className="w-full py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <FiDollarSign className="w-5 h-5" />
              Process Payment
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReceivableMobileListCard = (person, index) => (
    <div
      key={getReceivableKey(person, index)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 sm:p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        {renderUserAvatar(person, { sizeClass: 'w-11 h-11', iconClass: 'w-5 h-5' })}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{person.name}</p>
          <p className="text-sm text-gray-500 truncate">{person.phone}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {person.group_name} · {formatDate(person.auct_date)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-600">
        <span><span className="font-medium text-gray-700">Area:</span> {person.aob || person.area || 'N/A'}</span>
        <button
          type="button"
          onClick={() => handleOpenAdvanceModal(person)}
          className="font-semibold text-yellow-700 underline"
        >
          Advance: {formatCurrency(person?.total_advance_balance || 0)}
        </button>
      </div>

      <div className="mb-3 text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-[10px] text-gray-500 font-medium uppercase">Due no.</p>
        <p className="text-sm font-bold text-gray-900">{formatReceivableDueNo(person)}</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
        <div className="text-center p-2 bg-blue-50 rounded-lg min-w-0">
          <p className="text-[10px] text-blue-600 font-medium">Due</p>
          <p className="text-[11px] sm:text-sm font-bold text-blue-700 break-words leading-tight">{formatCurrency(person.rbtotal)}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg min-w-0">
          <p className="text-[10px] text-green-600 font-medium">Paid</p>
          <p className="text-[11px] sm:text-sm font-bold text-green-700 break-words leading-tight">{formatCurrency(person.rbpaid)}</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg min-w-0">
          <p className="text-[10px] text-red-600 font-medium">Balance</p>
          <p className="text-[11px] sm:text-sm font-bold text-red-700 break-words leading-tight">{formatCurrency(person.rbdue)}</p>
        </div>
      </div>

      {canPayReceivable && (
        <button
          type="button"
          onClick={() => openPaymentModal(person)}
          className="w-full py-2.5 sm:py-3 px-4 bg-custom-red text-white font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          Process Payment
        </button>
      )}
    </div>
  );

  const renderReceivableList = (items, summaryItems = items) => (
    <>
      <div className="md:hidden space-y-4">
        {items.map((person, index) => renderReceivableMobileListCard(person, index))}
        {renderMobileSummaryFooter(summaryItems)}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-custom-red text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Subscriber</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{renderSortHeader('Auction', 'auct_date')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Area</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Advance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{renderSortHeader('Due no.', 'due_number')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total Due</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((person, index) => (
                <tr
                  key={getReceivableKey(person, index)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-3">
                    {renderUserAvatar(person, { sizeClass: 'w-12 h-12', iconClass: 'w-6 h-6' })}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{person.name}</p>
                      <p className="text-sm text-gray-500">{person.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{person.group_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{formatDate(person.auct_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{person.aob || person.area || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleOpenAdvanceModal(person)}
                      className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 underline"
                    >
                      {formatCurrency(person?.total_advance_balance || 0)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatReceivableDueNo(person)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-700">{formatCurrency(person.rbtotal)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(person.rbpaid)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-700">{formatCurrency(person.rbdue)}</td>
                  <td className="px-4 py-3">
                    {canPayReceivable ? (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(person)}
                        className="px-3 py-2 bg-custom-red text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <FiDollarSign className="w-4 h-4" />
                        Pay
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">View only</span>
                    )}
                  </td>
                </tr>
              ))}
              {renderDesktopSummaryRow(summaryItems)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderPaginatedReceivables = (items) => {
    const { paginatedItems } = getPaginationMeta(items);

    return (
      <>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedItems.map((person) => renderReceivableGridCard(person))}
            {renderGridSummaryFooter(items)}
          </div>
        ) : (
          renderReceivableList(paginatedItems, items)
        )}
        {renderPagination(items)}
      </>
    );
  };


  const handleOpenAdvanceModal = (receivable) => {
    setSelectedAdvanceReceivable(receivable);
    setShowAdvanceModal(true);
  };

  const handleCloseAdvanceModal = () => {
    setShowAdvanceModal(false);
    setSelectedAdvanceReceivable(null);
  };

  // Calculate advance breakdown
  const calculateAdvanceBreakdown = (receivable) => {
    const transactions = receivable?.advance_transactions || [];
    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    // Debug: Log original transaction order
    console.log('🔍 Receivables - Original transactions from backend (chronological order):', transactions);

    // Backend sends data in chronological order (oldest first), so we can use it directly
    const chronologicalTransactions = [...transactions];

    console.log('🔍 Receivables - Using chronological order for calculation:', chronologicalTransactions);

    // Calculate running balance in chronological order and store with each transaction
    const transactionsWithBalance = chronologicalTransactions.map((tx, index) => {
      const amount = parseFloat(tx.amount) || 0;
      if (tx.type === 'CREDIT') {
        runningBalance += amount;
        totalCredit += amount;
      } else if (tx.type === 'DEBIT') {
        runningBalance -= amount;
        totalDebit += amount;
      }

      console.log(`🔍 Receivables - Transaction ${index + 1}: ${tx.type} ₹${amount} → Running Balance: ₹${runningBalance}`);

      return {
        ...tx,
        runningBalance: runningBalance,
        chronologicalIndex: index
      };
    });

    // Reverse for display (newest first) while preserving running balance
    const displayTransactions = transactionsWithBalance.reverse();

    console.log('🔍 Receivables - Final display transactions (newest first):', displayTransactions);

    return {
      transactions: displayTransactions,
      totalCredit,
      totalDebit,
      currentBalance: runningBalance
    };
  };

  const isInitialLoad = !hasLoaded || (isLoading && receivables.length === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-3 md:p-4 overflow-x-hidden">
      <LoadingBar isLoading={isLoading} />
      {isInitialLoad ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loading label="Loading receivables..." />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 sm:mb-6 md:mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-custom-red to-red-600 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 rounded-t-xl">
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <FiCreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
                    <span className="truncate">Receivables</span>
                  </h1>
                  <p className="text-red-100 mt-1 sm:mt-2 text-sm sm:text-base">Track and manage outstanding payments</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={fetchReceivables}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    title="Refresh Receivables"
                  >
                    <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  {filteredReceivables.length > 0 && (
                    <PDFDownloadLink
                      document={
                        <Mypdf
                          tableData={pdfRows}
                          tableHeaders={pdfHeaders}
                          heading="Receivables Outstanding"
                          companyData={user?.results?.userCompany || []}
                        />
                      }
                      fileName={`Receivables_${new Date().toISOString().slice(0, 10)}.pdf`}
                    >
                      {({ loading }) => (
                        <button
                          type="button"
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-custom-red rounded-lg hover:bg-red-50 transition-colors font-semibold"
                          title="Download PDF"
                        >
                          <FiDownload className="w-5 h-5" />
                          <span className="hidden sm:inline">{loading ? 'Preparing…' : 'Download PDF'}</span>
                        </button>
                      )}
                    </PDFDownloadLink>
                  )}
                  <div className="bg-white/20 rounded-lg px-3 sm:px-4 py-2 text-center ml-auto sm:ml-0">
                    <span className="text-white font-semibold text-base sm:text-lg">{receivables.length}</span>
                    <p className="text-red-100 text-xs sm:text-sm">Total Records</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by group name"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by subscriber name"
                    value={subscriberFilter}
                    onChange={(e) => setSubscriberFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiFilter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 appearance-none bg-white text-sm sm:text-base"
                  >
                    <option value="">All Areas</option>
                    {[...new Set(aobs.map((item) => item.aob).filter(Boolean))].map((areaName, index) => (
                      <option key={index} value={areaName}>
                        {areaName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  <FiX className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>

              {/* Results Summary */}
              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span>Showing {filteredReceivables.length} of {receivables.length} receivables</span>
                    {(groupFilter || subscriberFilter || areaFilter || selectedGroupId) && (
                      <span className="text-custom-red font-medium">Filters applied</span>
                    )}
                  </div>
                  {renderViewToggle()}
                </div>
                {groupOptions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGroupId('')}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${
                        !selectedGroupId
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:text-red-700'
                      }`}
                    >
                      All ({receivables.length})
                    </button>
                    {groupOptions.map((group) => {
                      const active = selectedGroupId === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          title={group.name}
                          onClick={() => setSelectedGroupId(active ? '' : group.id)}
                          className={`max-w-full px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors truncate ${
                            active
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:text-red-700'
                          }`}
                        >
                          {group.name} ({group.count})
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 md:hidden">
                  <span className="text-xs font-semibold text-gray-500">Sort:</span>
                  <button
                    type="button"
                    onClick={() => toggleSort('auct_date')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      sortKey === 'auct_date' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Auction
                    {sortKey === 'auct_date' && sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort('due_number')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      sortKey === 'due_number' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Due no.
                    {sortKey === 'due_number' && sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Receivables List */}
          {filteredReceivables.length > 0 ? (
            renderPaginatedReceivables(sortedReceivables)
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FiCreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Receivables Found</h3>
              <p className="text-gray-600 mb-4">
                {receivables.length === 0
                  ? "There are no receivables to display at the moment."
                  : "No receivables match your current filter criteria."
                }
              </p>
              {(groupFilter || subscriberFilter || areaFilter || selectedGroupId) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-custom-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {modalOpen && (
        <ReceivablePayementModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          receivable={selectedReceivable}
          fetchReceivables={fetchReceivables}
        />
      )}

      {/* Advance 360° Modal */}
      {showAdvanceModal && selectedAdvanceReceivable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">💰</span>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Advance 360° View</h3>
                    <p className="text-xs md:text-sm text-blue-100 mt-1">{selectedAdvanceReceivable.name}</p>
                    <div className="flex flex-col md:flex-row md:gap-4 mt-1">
                      <p className="text-xs text-blue-200 flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        Group: {selectedAdvanceReceivable.group_name}
                      </p>
                      <p className="text-xs text-blue-200 flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        Auction: {formatDate(selectedAdvanceReceivable.auct_date)}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseAdvanceModal}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {(() => {
                const breakdown = calculateAdvanceBreakdown(selectedAdvanceReceivable);
                const { transactions, totalCredit, totalDebit, currentBalance } = breakdown;

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                      <div className="bg-green-50 rounded-lg p-3 md:p-4 text-center border border-green-200">
                        <p className="text-xs md:text-sm text-green-600 font-medium mb-1">Collected</p>
                        <p className="text-base md:text-xl font-bold text-green-700">₹{totalCredit.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 md:p-4 text-center border border-red-200">
                        <p className="text-xs md:text-sm text-red-600 font-medium mb-1">Utilized</p>
                        <p className="text-base md:text-xl font-bold text-red-700">₹{totalDebit.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center border border-blue-200">
                        <p className="text-xs md:text-sm text-blue-600 font-medium mb-1">Balance</p>
                        <p className="text-base md:text-xl font-bold text-blue-700">₹{currentBalance.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center justify-between">
                        <span>Transaction History</span>
                        <span className="text-xs md:text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </h4>

                      {transactions.length > 0 ? (
                        <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                          {transactions.map((tx, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg ${tx.type === 'CREDIT'
                                ? 'bg-green-50 border-l-4 border-green-500'
                                : 'bg-red-50 border-l-4 border-red-500'
                                }`}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {tx.type === 'CREDIT' ? (
                                  <span className="text-green-600 text-lg md:text-xl">✅</span>
                                ) : (
                                  <span className="text-red-600 text-lg md:text-xl">⚡</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 mb-2">
                                  <span className="font-semibold text-gray-700 text-sm md:text-base">
                                    {new Date(tx.date).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  <span className={`font-bold text-base md:text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-xs md:text-sm mb-1 break-words">{tx.description}</p>
                                {tx.sub_category && (
                                  <span className="inline-block text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full mb-2">
                                    {tx.sub_category}
                                  </span>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                  <span className="text-xs md:text-sm text-gray-500">Running Balance:</span>
                                  <span className="text-sm md:text-base font-semibold text-blue-600">₹{tx.runningBalance.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 md:py-12">
                          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-3xl md:text-4xl">📊</span>
                          </div>
                          <p className="text-gray-500 text-sm md:text-base">No transactions yet</p>
                          <p className="text-gray-400 text-xs md:text-sm mt-1">Transactions will appear here once recorded</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
              <button
                onClick={handleCloseAdvanceModal}
                className="px-4 md:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receivable;







