import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';

const HhSpecializationMaster = ({ canManage = false, embedded = false }) => {
  const {
    specializations,
    fetchSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization,
  } = useHospitalManagement();
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  const reset = () => {
    setName('');
    setEditId(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return toast.error('Specialization name required');
    setSaving(true);
    const result = editId
      ? await updateSpecialization(editId, { name: name.trim() })
      : await createSpecialization({ name: name.trim() });
    setSaving(false);
    if (result.success) {
      toast.success(editId ? 'Specialization updated' : 'Specialization added');
      reset();
    } else toast.error(result.error || 'Failed');
  };

  const onEdit = (item) => {
    setEditId(item.id);
    setName(item.name || '');
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Remove specialization "${item.name}"?`)) return;
    const result = await deleteSpecialization(item.id);
    if (result.success) {
      toast.success('Specialization removed');
      if (editId === item.id) reset();
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className={embedded ? 'space-y-4' : 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4'}>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Specialization master</h2>
        <p className="text-xs text-gray-500">Add specializations once, then search and choose them when adding a doctor.</p>
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Cardiology"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
              {saving ? 'Saving…' : editId ? 'Update' : 'Add specialization'}
            </button>
            {editId && (
              <button type="button" onClick={reset} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!(specializations || []).length ? (
        <p className="text-sm text-gray-500">No specializations yet. Add one to use it in the doctor form.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {(specializations || []).map((item) => (
            <li key={item.id} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-900">{item.name}</span>
              {canManage && (
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => onEdit(item)} className="text-xs px-2 py-1 rounded-md bg-cyan-50 text-cyan-800">Edit</button>
                  <button type="button" onClick={() => onDelete(item)} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700">Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HhSpecializationMaster;
