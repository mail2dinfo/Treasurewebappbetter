import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMapPin, FiPhone } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Resident venue listing page (Turfs or Shuttle courts).
 * @param {{ venueType: 'TURF' | 'SHUTTLE_COURT', title: string, subtitle: string }} props
 */
const HostelManagementResidentVenuesPage = ({ venueType, title, subtitle }) => {
  const { myResidentProfile, fetchVenues } = useHostelManagement();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await myResidentProfile();
        if (!profile.success) {
          toast.error(profile.error || 'Profile not found');
          return;
        }
        if (profile.data?.hostel_id) {
          const result = await fetchVenues({
            venueType,
            hostelId: profile.data.hostel_id,
            membershipScoped: false,
          });
          setRows(Array.isArray(result?.data) ? result.data : []);
        } else setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [venueType]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="bg-white border rounded-xl p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((v) => (
              <div key={v.id} className="border rounded-lg overflow-hidden">
                {(v.image_url_s3_image || v.image_url) && (
                  <img src={v.image_url_s3_image || v.image_url} alt={v.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-3 space-y-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold">{v.name}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full h-fit ${Number(v.available) !== 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {Number(v.available) !== 0 ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 font-semibold">
                    {v.price_label ? `${v.price_label}: ` : ''}{rs(v.price_amount)}
                  </p>
                  {v.description && <p className="text-xs text-gray-600">{v.description}</p>}
                  {v.address && <p className="text-xs text-gray-500">{v.address}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {v.contact_phone && (
                      <a href={`tel:${v.contact_phone}`} className="inline-flex items-center gap-1 text-xs font-semibold border rounded-lg px-2 py-1">
                        <FiPhone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                    {v.maps_url && (
                      <a href={v.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold border rounded-lg px-2 py-1 text-red-700">
                        <FiMapPin className="w-3.5 h-3.5" /> Book / Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const HostelManagementResidentTurfsPage = () => (
  <HostelManagementResidentVenuesPage
    venueType="TURF"
    title="Turfs"
    subtitle="Book or enquire — listed for selling by your hostel."
  />
);

export const HostelManagementResidentShuttleCourtsPage = () => (
  <HostelManagementResidentVenuesPage
    venueType="SHUTTLE_COURT"
    title="Shuttle courts"
    subtitle="Book or enquire — listed for selling by your hostel."
  />
);

export default HostelManagementResidentVenuesPage;
