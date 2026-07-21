import React, { useEffect, useState } from 'react';
import { usePayablesContext } from '../context/payables_context';
import { useAobContext } from '../context/aob_context';
import { useUserContext } from '../context/user_context';
import PayablePaymentModal from '../components/PayablePaymentModal';
import ReceivableReceitPdf from '../components/PDF/ReceivableReceitPdf';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  FiSearch, FiFilter, FiX, FiUser, FiPhone, FiCalendar, FiDollarSign,
  FiCreditCard, FiTrendingUp, FiDownload, FiPlus, FiMinus, FiGrid, FiList,
} from 'react-icons/fi';
import { usePlatformAccess } from '../context/platformAccess_context';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getPaymentsList = (person) => {
  if (!person?.payments) return [];
  if (Array.isArray(person.payments)) return person.payments;
  if (typeof person.payments === 'string') {
    try {
      return JSON.parse(person.payments);
    } catch {
      return [];
    }
  }
  return [];
};

const Payables = () => {
  const platform = usePlatformAccess();
  const enforcePayableAccess = platform?.isAvailable && !platform.isOwner;
  const canPayPayable = !enforcePayableAccess || platform.hasPermission('chit_payables_pay');
  const { fetchPayables, payables, isLoading } = usePayablesContext();
  const { user } = useUserContext();
  const userCompany = user?.results?.userCompany;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [expandedPayableId, setExpandedPayableId] = useState(null);
  const { aobs, fetchAobs } = useAobContext();
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [groupFilter, setGroupFilter] = useState("");
  const [subscriberFilter, setSubscriberFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  useEffect(() => {
    fetchPayables();
    fetchAobs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [groupFilter, subscriberFilter, areaFilter, pageSize]);

  const formatCurrency = (amount) => `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;

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

  const filteredPayables = payables.filter(({ group_name, name, area, aob }) => {
    const groupMatch = !groupFilter || group_name.toLowerCase().includes(groupFilter.toLowerCase());
    const subscriberMatch = !subscriberFilter || name.toLowerCase().includes(subscriberFilter.toLowerCase());
    const areaValue = area || aob || '';
    const areaMatch = !areaFilter || areaValue.toLowerCase().includes(areaFilter.toLowerCase());
    return groupMatch && subscriberMatch && areaMatch;
  });

  const clearFilters = () => {
    setGroupFilter("");
    setSubscriberFilter("");
    setAreaFilter("");
    setCurrentPage(1);
  };

  const openPaymentModal = (person) => {
    if (!canPayPayable) return;
    setSelectedPayable(person);
    setModalOpen(true);
  };

  const getPayableKey = (person, index) =>
    person.unique_id || person.id || `${person.group_id || 'group'}-${person.auct_date || 'date'}-${index}`;

  const togglePayments = (payableId) => {
    setExpandedPayableId((current) => (current === payableId ? null : payableId));
  };

  const getPayablesSummary = (items) => (
    items.reduce((acc, person) => {
      acc.totalDue += parseFloat(person.pytotal || 0);
      acc.paid += parseFloat(person.pbpaid || 0);
      acc.balance += parseFloat(person.pbdue || 0);
      return acc;
    }, { totalDue: 0, paid: 0, balance: 0 })
  );

  const renderPaymentsTable = (person) => {
    const paymentsList = getPaymentsList(person);
    if (!paymentsList.length) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Billno</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Download</th>
            </tr>
          </thead>
          <tbody>
            {paymentsList.map((payment) => (
              <tr key={payment.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-sm font-semibold text-gray-800">{payment.id}</td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {payment.created_at ? formatDate(payment.created_at) : '-'}
                </td>
                <td className="px-3 py-2 text-sm text-gray-800">{formatCurrency(payment.payment_amount || 0)}</td>
                <td className="px-3 py-2">
                  <PDFDownloadLink
                    key={`payable-payment-${payment.id}`}
                    document={
                      <ReceivableReceitPdf
                        receivableData={{
                          subscriberName: person.name,
                          billNumber: payment.id,
                          paymentId: payment.id,
                          paymentType: payment.payment_type,
                          paymentMethod: payment.payment_method,
                          groupName: person.group_name,
                          auctionDate: formatDate(person.auct_date),
                          createdAt: payment.created_at ? formatDate(payment.created_at) : null,
                          created_at: payment.created_at,
                          paymentAmount: payment.payment_amount,
                        }}
                        companyData={userCompany}
                      />
                    }
                    fileName={`Receipt-${payment.id}-${person.name}-${Date.now()}.pdf`}
                  >
                    {({ loading }) => (
                      <button type="button" className="px-2 py-1 bg-custom-red text-white text-xs rounded-md flex items-center gap-1 hover:bg-red-700">
                        <FiDownload className="w-3 h-3" />
                        {loading ? 'Preparing...' : 'PDF'}
                      </button>
                    )}
                  </PDFDownloadLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMobileSummaryFooter = (items) => {
    if (!items.length) return null;
    const totals = getPayablesSummary(items);

    return (
      <div className="bg-gray-100 rounded-xl border-2 border-custom-red p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-[10px] text-blue-600 font-medium uppercase">Total Due</p>
            <p className="text-sm font-bold text-blue-800">{formatCurrency(totals.totalDue)}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-[10px] text-green-600 font-medium uppercase">Paid</p>
            <p className="text-sm font-bold text-green-800">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-[10px] text-red-600 font-medium uppercase">Balance</p>
            <p className="text-sm font-bold text-red-800">{formatCurrency(totals.balance)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopSummaryRow = (items) => {
    if (!items.length) return null;
    const totals = getPayablesSummary(items);

    return (
      <tr className="bg-gray-100 border-t-2 border-custom-red">
        <td colSpan={6} className="px-4 py-4 text-sm font-semibold text-gray-900">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </td>
        <td className="px-4 py-4 text-sm font-bold text-blue-700">{formatCurrency(totals.totalDue)}</td>
        <td className="px-4 py-4 text-sm font-bold text-green-700">{formatCurrency(totals.paid)}</td>
        <td className="px-4 py-4 text-sm font-bold text-red-700">{formatCurrency(totals.balance)}</td>
        <td colSpan={2} className="px-4 py-4" />
      </tr>
    );
  };

  const renderGridSummaryFooter = (items) => {
    if (!items.length) return null;
    const totals = getPayablesSummary(items);

    return (
      <div className="col-span-full bg-gray-100 rounded-xl border-2 border-custom-red p-4 md:p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Due</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(totals.totalDue)}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Paid</p>
            <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Balance</p>
            <p className="text-xl font-bold text-red-800 mt-1">{formatCurrency(totals.balance)}</p>
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

  const getVisiblePageNumbers = (totalPages) => (
    Array.from({ length: totalPages }, (_, index) => index + 1)
  );

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

    const pageNumbers = getVisiblePageNumbers(totalPages);

    return (
      <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span>
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="payables-page-size" className="text-sm text-gray-600">Per page</label>
              <select
                id="payables-page-size"
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
            <div className="flex items-center justify-center sm:justify-end gap-1 overflow-x-auto">
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

  const renderPayableGridCard = (person) => {
    const { name, phone, group_name, auct_date, pytotal, pbpaid, pbdue, payment_for, unique_id } = person;
    const paymentsList = getPaymentsList(person);
    const isExpanded = expandedPayableId === unique_id;

    return (
      <div key={unique_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="bg-gradient-to-r from-custom-red to-red-600 p-6 text-white">
          <div className="flex items-center gap-4">
            {renderUserAvatar(person, { sizeClass: 'w-16 h-16', iconClass: 'w-8 h-8', variant: 'header' })}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold truncate">{name}</h3>
              <p className="text-red-100 flex items-center gap-1">
                <FiPhone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{phone}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm font-medium">Group Information</span>
            </div>
            <p className="text-gray-800 font-semibold">{group_name}</p>
            <p className="text-gray-600 text-sm">Auction: {formatDate(auct_date)}</p>
          </div>

          {payment_for && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <FiTrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Payment Purpose</span>
              </div>
              <p className="text-yellow-800 font-medium text-sm">{payment_for}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(pytotal || 0)}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 font-medium mb-1">Paid</div>
              <div className="text-lg font-bold text-green-700">{formatCurrency(pbpaid || 0)}</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xs text-red-600 font-medium mb-1">Due</div>
              <div className="text-lg font-bold text-red-700">{formatCurrency(pbdue || 0)}</div>
            </div>
          </div>

          {paymentsList.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => togglePayments(unique_id)}
                className="w-full py-2 px-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isExpanded ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                {isExpanded ? 'Hide Payments' : `View Payments (${paymentsList.length})`}
              </button>
              {isExpanded && (
                <div className="mt-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden p-2">
                  {renderPaymentsTable(person)}
                </div>
              )}
            </div>
          )}

          {canPayPayable && (
            <button
              type="button"
              onClick={() => openPaymentModal(person)}
              className="w-full py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <FiDollarSign className="w-5 h-5" />
              Process Payment
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPayableMobileListCard = (person, index) => {
    const paymentsList = getPaymentsList(person);
    const payableKey = getPayableKey(person, index);
    const isExpanded = expandedPayableId === person.unique_id;

    return (
      <div key={payableKey} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          {renderUserAvatar(person, { sizeClass: 'w-12 h-12', iconClass: 'w-6 h-6' })}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{person.name}</p>
            <p className="text-sm text-gray-500 truncate">{person.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-3 text-sm text-gray-700">
          <div><span className="font-medium">Group:</span> {person.group_name}</div>
          <div><span className="font-medium">Auction:</span> {formatDate(person.auct_date)}</div>
          <div><span className="font-medium">Area:</span> {person.aob || person.area || 'N/A'}</div>
          {person.payment_for && (
            <div><span className="font-medium">Purpose:</span> {person.payment_for}</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-[10px] text-blue-600 font-medium">Total</p>
            <p className="text-sm font-bold text-blue-700">{formatCurrency(person.pytotal || 0)}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-[10px] text-green-600 font-medium">Paid</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(person.pbpaid || 0)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-[10px] text-red-600 font-medium">Due</p>
            <p className="text-sm font-bold text-red-700">{formatCurrency(person.pbdue || 0)}</p>
          </div>
        </div>

        {paymentsList.length > 0 && (
          <button
            type="button"
            onClick={() => togglePayments(person.unique_id)}
            className="w-full mb-3 py-2 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            {isExpanded ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
            {isExpanded ? 'Hide Payments' : `View Payments (${paymentsList.length})`}
          </button>
        )}

        {isExpanded && paymentsList.length > 0 && (
          <div className="mb-3 bg-gray-50 rounded-lg border border-gray-200 p-2">
            {renderPaymentsTable(person)}
          </div>
        )}

        {canPayPayable && (
          <button
            type="button"
            onClick={() => openPaymentModal(person)}
            className="w-full py-3 px-4 bg-custom-red text-white font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiDollarSign className="w-5 h-5" />
            Process Payment
          </button>
        )}
      </div>
    );
  };

  const renderPayableList = (items, summaryItems = items) => (
    <>
      <div className="md:hidden space-y-4">
        {items.map((person, index) => renderPayableMobileListCard(person, index))}
        {renderMobileSummaryFooter(summaryItems)}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-custom-red text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Subscriber</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Auction</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Area</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Purpose</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Due</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Payments</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((person, index) => {
                const paymentsList = getPaymentsList(person);
                const isExpanded = expandedPayableId === person.unique_id;

                return (
                  <React.Fragment key={getPayableKey(person, index)}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3">
                        {renderUserAvatar(person, { sizeClass: 'w-12 h-12', iconClass: 'w-6 h-6' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{person.group_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatDate(person.auct_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{person.aob || person.area || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{person.payment_for || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700">{formatCurrency(person.pytotal || 0)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(person.pbpaid || 0)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-700">{formatCurrency(person.pbdue || 0)}</td>
                      <td className="px-4 py-3">
                        {paymentsList.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => togglePayments(person.unique_id)}
                            className="text-sm font-medium text-gray-700 hover:text-custom-red underline"
                          >
                            {isExpanded ? 'Hide' : `View (${paymentsList.length})`}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canPayPayable ? (
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
                    {isExpanded && paymentsList.length > 0 && (
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <td colSpan={11} className="px-4 py-3">
                          {renderPaymentsTable(person)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {renderDesktopSummaryRow(summaryItems)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderPaginatedPayables = (items) => {
    const { paginatedItems } = getPaginationMeta(items);

    return (
      <>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedItems.map((person) => renderPayableGridCard(person))}
            {renderGridSummaryFooter(items)}
          </div>
        ) : (
          renderPayableList(paginatedItems, items)
        )}
        {renderPagination(items)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-custom-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading payables...</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
            <div className="bg-gradient-to-r from-custom-red to-red-600 px-6 py-4 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiCreditCard className="w-8 h-8" />
                  <div>
                    <h1 className="text-2xl font-bold">Payables Management</h1>
                    <p className="text-red-100">Manage and process payable disbursements</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{payables.length}</div>
                  <div className="text-red-100 text-sm">Total Records</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by group name"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by subscriber name"
                    value={subscriberFilter}
                    onChange={(e) => setSubscriberFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent appearance-none bg-white"
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
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <FiX className="w-5 h-5" />
                  Clear Filters
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span>Showing {filteredPayables.length} of {payables.length} payables</span>
                  {(groupFilter || subscriberFilter || areaFilter) && (
                    <span className="text-custom-red font-medium">Filters applied</span>
                  )}
                </div>
                {renderViewToggle()}
              </div>
            </div>
          </div>

          {filteredPayables.length > 0 ? (
            renderPaginatedPayables(filteredPayables)
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FiCreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payables Found</h3>
              <p className="text-gray-500">
                {payables.length === 0
                  ? "There are no payables to process at the moment."
                  : "No payables match your current filter criteria."}
              </p>
              {payables.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-custom-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <PayablePaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          payable={selectedPayable}
          fetchPayables={fetchPayables}
        />
      )}
    </div>
  );
};

export default Payables;
