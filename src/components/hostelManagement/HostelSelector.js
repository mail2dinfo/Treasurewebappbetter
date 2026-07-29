import React, { useEffect } from 'react';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';

/** Shared hostel selector used across owner pages */
const HostelSelector = ({ className = '' }) => {
  const { hostels, selectedHostelId, setSelectedHostelId, fetchHostels } = useHostelManagement();

  useEffect(() => {
    fetchHostels();
  }, []);

  return (
    <select
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm ${className}`}
      value={selectedHostelId || ''}
      onChange={(e) => setSelectedHostelId(e.target.value || null)}
    >
      <option value="">Select hostel</option>
      {hostels.map((h) => (
        <option key={h.id} value={h.id}>{h.hostel_name}</option>
      ))}
    </select>
  );
};

export default HostelSelector;
