import { useState, useEffect } from 'react';
import { useUserContext } from '../context/user_context';
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import { usePayablesContext } from '../context/payables_context';
import { useHistory, Link } from 'react-router-dom';
import { useReceivablesContext } from '../context/receivables_context';
import { Users, UserPlus, ArrowRight, Plus, Calendar, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const Highlights = ({ groups, premium }) => {
  const history = useHistory();
  const { user } = useUserContext();
  const { ledgerAccounts } = useLedgerAccountContext();
  const { companySubscribers } = useCompanySubscriberContext();

  const [membershipId, setMembershipId] = useState('');
  const { receivables } = useReceivablesContext();
  const { payables } = usePayablesContext();

  useEffect(() => {
    if (user.results.userAccounts && user.results.userAccounts.length > 0) {
      const membership = user.results.userAccounts[0];
      setMembershipId(membership.parent_membership_id);
    }
  }, [user]);

  const handleMultiStepSubscriber = (membershipId) => {
    history.push(`/chit-fund/user/addcompanymultisubscriber/${membershipId}`);
  };

  const handleStartGroup = () => {
    history.push('/chit-fund/user/startagroup');
  };

  const goToLedger = () => history.push('/chit-fund/user/ledger');
  const goToReceivables = () => history.push('/chit-fund/user/receivables');
  const goToPayables = () => history.push('/chit-fund/user/payables');

  const totalCurrentBalance = Array.isArray(ledgerAccounts)
    ? ledgerAccounts.reduce((sum, acc) => sum + (parseFloat(acc.current_balance) || 0), 0)
    : 0;

  // ✅ Sum of rbdue values from receivables
  const totalRbDue = Array.isArray(receivables)
    ? receivables.reduce((sum, item) => sum + (parseFloat(item.rbdue) || 0), 0)
    : 0;

  // ✅ Sum of rbdue values from payables
  const totalPyDue = Array.isArray(payables)
    ? payables.reduce((sum, item) => sum + (parseFloat(item.pbdue) || 0), 0)
    : 0;

  const formatCurrency = (value) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Calculate net balance
  const netBalance = totalRbDue - totalPyDue;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative">
      {/* Header */}
      <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Dashboard Highlights
      </div>

      <div className="p-6 pt-8">
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Groups */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users size={20} className="text-blue-600" />
                <span className="text-2xl font-bold text-gray-800">{groups.length}</span>
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg"
                onClick={handleStartGroup}
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">Active Groups</p>
          </div>

          {/* Subscribers */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 shadow-sm">
              <Link to={{ pathname: '/subscribers', state: { companySubscribers } }} className="flex items-center gap-2 mb-1 hover:text-purple-600 transition-colors duration-200">
                <UserPlus size={20} className="text-purple-600" />
                <span className="text-2xl font-bold text-gray-800">{companySubscribers.length}</span>
              </Link>
              <button
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg"
                onClick={() => handleMultiStepSubscriber(membershipId)}
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">Subscribers</p>
          </div>

          {/* Ledger Balance */}
          <div className="text-center cursor-pointer" onClick={goToLedger}>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={20} className="text-indigo-600" />
                <span className="text-lg font-bold text-gray-800">{formatCurrency(totalCurrentBalance)}</span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">Ledger Balance</p>
          </div>

          {/* Receivable */}
          <div className="text-center cursor-pointer" onClick={goToReceivables}>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={20} className="text-green-600" />
                <span className="text-lg font-bold text-gray-800">{formatCurrency(totalRbDue)}</span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">Receivable</p>
          </div>

          {/* Payable */}
          <div className="text-center cursor-pointer" onClick={goToPayables}>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-red-100 hover:to-red-200 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={20} className="text-red-600" />
                <span className="text-lg font-bold text-gray-800">{formatCurrency(totalPyDue)}</span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">Payable</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRbDue)}</div>
              <div className="text-sm text-gray-600">Total Receivable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPyDue)}</div>
              <div className="text-sm text-gray-600">Total Payable</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </div>
              <div className="text-sm text-gray-600">Net Balance</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="bg-custom-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
            onClick={handleStartGroup}
          >
            <Plus size={16} />
            Start a Group
          </button>
          <button
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
            onClick={goToLedger}
          >
            <Wallet size={16} />
            View Ledger
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
            onClick={() => history.push('/chit-fund/user/dashboard')}
          >
            <Calendar size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Highlights;
