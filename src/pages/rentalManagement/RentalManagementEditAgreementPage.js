import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import AgreementSevenStepReview from '../../components/rentalManagement/AgreementSevenStepReview';
import { RM_BASE_PATH } from '../../components/rentalManagement/rentalManagementMenuItems';

const RentalManagementEditAgreementPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const { agreements, companies, fetchAgreements, updateAgreement } = useRentalManagementContext();
  const [agreement, setAgreement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAgreements?.();
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const found = (agreements || []).find((a) => String(a.id) === String(id));
    if (found) setAgreement(found);
  }, [agreements, id]);

  const onSave = async (payload) => {
    setSaving(true);
    try {
      const result = await updateAgreement(id, payload);
      if (!result.success) {
        toast.error(result.error || 'Failed to save');
        return false;
      }
      toast.success(result.message || 'Saved');
      if (result.data) setAgreement(result.data);
      await fetchAgreements?.();
      return true;
    } finally {
      setSaving(false);
    }
  };

  if (loading && !agreement) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }
  if (!agreement) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-gray-500">Agreement not found</p>
        <button
          type="button"
          className="text-sm text-red-800"
          onClick={() => history.push(`${RM_BASE_PATH}/dashboard`)}
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <AgreementSevenStepReview
        role="owner"
        agreement={agreement}
        company={companies?.[0]}
        saving={saving}
        onSave={onSave}
        backLabel="← Home"
        onBack={() => history.push(`${RM_BASE_PATH}/dashboard`)}
      />
    </div>
  );
};

export default RentalManagementEditAgreementPage;
