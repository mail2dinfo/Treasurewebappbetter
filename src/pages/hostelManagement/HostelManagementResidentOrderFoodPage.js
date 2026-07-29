import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMapPin, FiPhone, FiExternalLink } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';

const HostelManagementResidentOrderFoodPage = () => {
  const { myResidentProfile, fetchNearbyShops } = useHostelManagement();
  const [shops, setShops] = useState([]);
  const [hostel, setHostel] = useState(null);
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
        setHostel(profile.data?.hostel || null);
        if (profile.data?.hostel_id) {
          const shopRes = await fetchNearbyShops(profile.data.hostel_id);
          setShops(Array.isArray(shopRes?.data) ? shopRes.data : []);
        } else setShops([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order food</h1>
        <p className="text-sm text-gray-500">Shops near your hostel — call or open maps to order.</p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (!Array.isArray(shops) || shops.length === 0) ? (
          <p className="text-sm text-gray-500">No nearby shops listed yet. Ask hostel staff to add them.</p>
        ) : (
          <ul className="divide-y border rounded-lg">
            {shops.map((s) => (
              <li key={s.id} className="p-3 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{s.shop_name}</p>
                  <p className="text-xs text-gray-500">{s.category || 'Food'}{s.address ? ` · ${s.address}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold border rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50">
                      <FiPhone className="w-3.5 h-3.5" /> {s.phone}
                    </a>
                  )}
                  {s.maps_url && (
                    <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold border rounded-lg px-2.5 py-1.5 text-red-700 hover:bg-red-50">
                      <FiMapPin className="w-3.5 h-3.5" /> Maps <FiExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {hostel?.city && (
          <a
            href={`https://www.google.com/maps/search/restaurants+near+${encodeURIComponent([hostel.address, hostel.city].filter(Boolean).join(', '))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 underline"
          >
            <FiMapPin /> Find more restaurants near hostel
          </a>
        )}
      </div>
    </div>
  );
};

export default HostelManagementResidentOrderFoodPage;
