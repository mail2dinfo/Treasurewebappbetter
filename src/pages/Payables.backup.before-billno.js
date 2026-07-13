import React, { useEffect, useState } from 'react';
import { usePayablesContext } from '../context/payables_context';
import { useAobContext } from '../context/aob_context';
import PayablePaymentModal from '../components/PayablePaymentModal';
import { FiSearch, FiFilter, FiX, FiUser, FiPhone, FiCalendar, FiDollarSign, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

const Payables = () => {
  const { fetchPayables, payables, isLoading } = usePayablesContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const { aobs, fetchAobs } = useAobContext();

  useEffect(() => {
    fetchPayables();
    fetchAobs();
  }, []);

  const [groupFilter, setGroupFilter] = useState("");
  const [subscriberFilter, setSubscriberFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

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

  const filteredPayables = payables.filter(({ group_name, name, area }) => {
    const groupMatch = !groupFilter || group_name.toLowerCase().includes(groupFilter.toLowerCase());
    const subscriberMatch = !subscriberFilter || name.toLowerCase().includes(subscriberFilter.toLowerCase());
    const areaMatch = !areaFilter || (area || "").toLowerCase().includes(areaFilter.toLowerCase());

    return groupMatch && subscriberMatch && areaMatch;
  });

  const clearFilters = () => {
    setGroupFilter("");
    setSubscriberFilter("");
    setAreaFilter("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-custom-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading payables...</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Header Card */}
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

            {/* Filter Section */}
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

              {filteredPayables.length !== payables.length && (
                <p className="text-gray-600 text-sm">
                  Showing {filteredPayables.length} of {payables.length} payables
                </p>
              )}
            </div>
          </div>

          {/* Payables List */}
          {filteredPayables.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPayables.map((person) => {
                const {
                  name,
                  phone,
                  user_image_from_s3,
                  pbtotal,
                  id,
                  pytotal,
                  pbpaid,
                  payments,
                  group_id,
                  group_name,
                  auct_date,
                  pbdue,
                  rbdue,
                  unique_id,
                  payment_for,
                } = person;

                return (
                  <div key={unique_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-custom-red to-red-600 p-6 text-white">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user_image_from_s3 ? (
                            <img
                              src={user_image_from_s3}
                              alt={name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${user_image_from_s3 ? 'hidden' : 'flex'}`}
                          >
                            <FiUser className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{name}</h3>
                          <p className="text-red-100 flex items-center gap-1">
                            <FiPhone className="w-4 h-4" />
                            {phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      {/* Group Info */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <FiCalendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Group Information</span>
                        </div>
                        <p className="text-gray-800 font-semibold">{group_name}</p>
                        <p className="text-gray-600 text-sm">Auction: {formatDate(auct_date)}</p>
                      </div>

                      {/* Payment Purpose */}
                      {payment_for && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <div className="flex items-center gap-2 text-yellow-700 mb-1">
                            <FiTrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Payment Purpose</span>
                          </div>
                          <p className="text-yellow-800 font-medium text-sm">{payment_for}</p>
                        </div>
                      )}

                      {/* Financial Summary */}
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

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedPayable(person);
                          setModalOpen(true);
                        }}
                        className="w-full py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <FiDollarSign className="w-5 h-5" />
                        Process Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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

      {/* Payment Modal */}
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