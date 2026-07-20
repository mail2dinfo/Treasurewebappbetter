import React from 'react';
import { GoRepo, GoArrowBoth } from 'react-icons/go';
import { FiUserPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useDashboardContext } from '../context/dashboard_context';
const DashboardMasterInfo = () => {

  const { dashboardDetails } = useDashboardContext();
  // Destructure nested data from dashboardDetails object
  const {
    userMembershipTotalDue,
    userMembershipTotalGroups,
    userMembershipNoofSubscribers,
  } = dashboardDetails.results || {};

  // Extract specific properties from nested objects
  const total = userMembershipTotalDue?.[0]?.total;
  const paid = userMembershipTotalDue?.[0]?.paid;
  const due = userMembershipTotalDue?.[0]?.due;
  const totalGroups = userMembershipTotalGroups?.[0]?.no_of_groups;
  const totalNoOfSubscribers = userMembershipNoofSubscribers?.[0]?.no_of_subscribers

  console.log(dashboardDetails);

  const items = [
    {
      id: 1, icon: <GoRepo className='icon' />, label: 'Total Groups', value: totalGroups, color: 'pink',
    },
    {
      id: 2, icon: <FiUserPlus className='icon' />, label: 'Total Subscribers', value: totalNoOfSubscribers, color: 'purple',
    },
    {
      id: 3, icon: <GoArrowBoth className='icon' />, label: 'Total Outstanding', value: total, color: 'pink',
    },

    {
      id: 4, icon: <FiArrowUp className='icon' />, label: 'Paid', value: paid, color: 'green',
    },
    //value: data.type
    {
      id: 5, icon: <FiArrowDown className='icon' />, label: 'Due', value: due, color: 'purple',
    },


  ]


  const ModernItem = ({ icon, label, value, color }) => {
    const getColorClasses = (color) => {
      switch (color) {
        case 'pink':
          return {
            bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
            text: 'text-pink-600',
            bgLight: 'bg-pink-50',
            border: 'border-pink-200'
          };
        case 'purple':
          return {
            bg: 'bg-gradient-to-br from-purple-500 to-violet-500',
            text: 'text-purple-600',
            bgLight: 'bg-purple-50',
            border: 'border-purple-200'
          };
        case 'green':
          return {
            bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
            text: 'text-green-600',
            bgLight: 'bg-green-50',
            border: 'border-green-200'
          };
        default:
          return {
            bg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
            text: 'text-blue-600',
            bgLight: 'bg-blue-50',
            border: 'border-blue-200'
          };
      }
    };

    const colors = getColorClasses(color);

    return (
      <div className={`bg-white rounded-xl shadow-sm border ${colors.border} p-6 hover:shadow-md transition-shadow duration-200`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          <div className={`w-3 h-3 ${colors.bg} rounded-full`}></div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{value || 0}</h3>
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Key Metrics</h2>
        <p className="text-gray-600">Overview of your chit fund performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {items.map((item) => {
          return <ModernItem key={item.id} {...item}></ModernItem>
        })}
      </div>
    </div>
  );
};

export default DashboardMasterInfo;
