import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import RmPhotoGallery from '../../components/rentalManagement/RmPhotoGallery';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const RentalManagementCollectionsPage = () => {
  const { rentDues, fetchRentDues, markRentPaid } = useRentalManagementContext();

  useEffect(() => { fetchRentDues(); }, [fetchRentDues]);

  const onMarkPaid = async (id) => {
    const result = await markRentPaid(id, 'Marked paid by owner');
    if (result.success) toast.success('Marked paid');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Rent collections</h1>
      <p className="text-sm text-gray-500">
        Monthly dues for each rental. Owner marks paid after receiving rent.
      </p>
      <div className="space-y-3">
        {(rentDues || []).map((d) => (
          <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex flex-wrap gap-4 justify-between">
              <div className="flex gap-3 min-w-0 flex-1">
                <RmPhotoGallery
                  photos={d.tenant?.rm_cust_photo_s3_image || d.tenant?.rm_cust_photo}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {d.due_month} · {money(d.amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {d.tenant?.rm_cust_name} · due {d.due_date}
                  </p>
                  <p className="text-sm text-gray-500">
                    {d.property?.title || d.property?.address}
                  </p>
                  <div className="mt-2">
                    <RmPhotoGallery photos={d.property?.photos} size="sm" />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{d.status}</span>
                {d.status === 'PENDING' && (
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white"
                    onClick={() => onMarkPaid(d.id)}
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!rentDues?.length && (
          <p className="text-sm text-gray-500 text-center py-8">No rent dues yet</p>
        )}
      </div>
    </div>
  );
};

export default RentalManagementCollectionsPage;
