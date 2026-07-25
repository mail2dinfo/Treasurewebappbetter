import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PrepareRentalAgreementWizard from '../../components/rentalManagement/PrepareRentalAgreementWizard';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import { RM_BASE_PATH } from '../../components/rentalManagement/rentalManagementMenuItems';

const RentalManagementPrepareAgreementPage = () => {
  const history = useHistory();
  const { fetchCompanies, fetchProperties } = useRentalManagementContext();

  useEffect(() => {
    fetchCompanies();
    fetchProperties();
  }, [fetchCompanies, fetchProperties]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create rental agreement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-step form — property, lessor, lessee, rent, nominee, then activate.
          </p>
        </div>
        <button
          type="button"
          onClick={() => history.push(`${RM_BASE_PATH}/dashboard`)}
          className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ← Back to home
        </button>
      </div>
      <PrepareRentalAgreementWizard />
    </div>
  );
};

export default RentalManagementPrepareAgreementPage;
