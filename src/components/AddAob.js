import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiMapPin, FiPlus } from 'react-icons/fi';
import { useUserContext } from '../context/user_context';
import { useAobContext } from '../context/aob_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import loadingImage from '../images/preloader.gif';
import Alert from '../components/Alert';

function AddAob() {
  const { user } = useUserContext();
  const platform = usePlatformAccess();
  const enforceAreaAccess = platform?.isAvailable && !platform.isOwner;
  const canAddArea = !enforceAreaAccess || platform.hasPermission('chit_area_add');
  const canDeleteArea = !enforceAreaAccess || platform.hasPermission('chit_area_delete');
  const { aobs, isLoading, addAob, deleteAob, fetchAobs } = useAobContext();
  const userAccounts = user?.results?.userAccounts || [];
  const membershipId = platform?.activeContext?.parentMembershipId
    ?? userAccounts.find((account) => account?.parent_membership_id)?.parent_membership_id
    ?? userAccounts.find((account) => account?.membershipId)?.membershipId
    ?? userAccounts[0]?.membershipId;

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
  const [list] = useState([]);
  const [area, setArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.results?.token) fetchAobs();
  }, [user?.results?.token]);

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };

  const removeItem = async (id) => {
    if (!canDeleteArea) {
      showAlert(true, 'danger', 'Delete Area permission is required');
      return;
    }
    const result = await deleteAob(id);
    showAlert(true, result.success ? 'success' : 'danger', result.message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canAddArea) {
      showAlert(true, 'danger', 'Add Area permission is required');
      return;
    }
    if (!area.trim()) {
      showAlert(true, 'danger', 'Please enter an area name');
      return;
    }
    if (!membershipId) {
      showAlert(true, 'danger', 'Membership context is missing. Please re-open Chit Fund from Hub.');
      return;
    }

    setIsSaving(true);
    const result = await addAob({
      area: area.trim(),
      membershipId,
      sourceSystem: 'WEB',
    });
    setIsSaving(false);

    if (result.success) {
      showAlert(true, 'success', result.message || 'Area added successfully');
      setArea('');
      fetchAobs();
    } else {
      showAlert(true, 'danger', result.message || 'Unable to add area');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <FiMapPin /> Area Management
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Areas</h1>
        <p className="text-sm text-gray-500 mt-1">Add and manage collection areas for your chit fund.</p>
      </div>

      {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

      {canAddArea ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="new-area-input">
            + Add New Area
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="new-area-input"
              type="text"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              placeholder="e.g. Coimbatore"
              name="area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
            >
              <FiPlus className="w-5 h-5" />
              {isSaving ? 'Adding…' : '+ Add New Area'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-5">
          You can view areas, but Add Area permission is not assigned.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Existing Areas ({aobs.length})</h2>
        </div>
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <img src={loadingImage} alt="Loading areas" className="w-12 h-12" />
          </div>
        ) : aobs.length ? (
          <div className="divide-y divide-gray-100">
            {aobs.map((item) => {
              if (!item) return null;
              const { id, aob } = item;
              return (
                <article key={id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-red-50/40">
                  <p className="font-medium text-gray-800">{aob}</p>
                  {canDeleteArea && (
                    <button
                      type="button"
                      onClick={() => removeItem(id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${aob}`}
                      title="Delete area"
                    >
                      <FaTrash />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No areas yet. Use + Add New Area above to create one.
          </div>
        )}
      </div>
    </div>
  );
}

export default AddAob;
