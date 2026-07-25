import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import AgreementSevenStepReview from './AgreementSevenStepReview';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const TenantViewRentsModal = ({ agreement, onClose }) => {
  if (!agreement) return null;
  const dues = agreement.rent_dues || [];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Rent status</h2>
          <button type="button" className="text-sm text-gray-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2">
          {!dues.length && <p className="text-sm text-gray-500">No dues yet</p>}
          {dues.map((d) => (
            <div key={d.id} className="flex justify-between text-sm border-b border-gray-50 py-2">
              <span>
                {d.due_month} · due {d.due_date}
              </span>
              <span className={d.status === 'PAID' ? 'text-emerald-700' : 'text-amber-800'}>
                {money(d.amount)} · {d.status === 'PAID' ? 'Paid' : 'Not paid'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TenantAgreementDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const { user } = useUserContext();
  const token = user?.results?.token;
  const [agreement, setAgreement] = useState(null);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rentsAgreement, setRentsAgreement] = useState(null);

  const load = async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const headers = authHeaders(token);
      const [aRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/rm/agreements/tenant/mine`, { headers }),
        fetch(`${API_BASE_URL}/rm/rent-dues/tenant/mine`, { headers }),
      ]);
      const aData = await aRes.json();
      const dData = await dRes.json();
      const list = aData.results || aData.data || [];
      const found = list.find((x) => String(x.id) === String(id));
      if (!found) {
        toast.error('Agreement not found');
        history.push('/rental-management/customer/dashboard');
        return;
      }
      setAgreement(found);
      setDues((dData.results || dData.data || []).filter((d) => d.agreement_id === found.id));
    } catch (e) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const saveEdits = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}/tenant-corrections`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.message || 'Failed to save');
        return false;
      }
      toast.success(data.message || 'Saved');
      if (data.results || data.data) setAgreement(data.results || data.data);
      else await load();
      return true;
    } catch (e) {
      toast.error(e.message || 'Failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const approve = async (opts = {}) => {
    if (opts.error) {
      toast.error(opts.error);
      return;
    }
    const ok = window.confirm(
      'Digitally approve this rental agreement? After approval, details can no longer be edited.'
    );
    if (!ok) return;
    setApproving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}/tenant-approve`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ agreed: true }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.message || 'Failed to approve');
      } else {
        toast.success(data.message || 'Approved');
        if (data.results || data.data) setAgreement(data.results || data.data);
        else await load();
      }
    } catch (e) {
      toast.error(e.message || 'Failed');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }
  if (!agreement) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <AgreementSevenStepReview
        role="tenant"
        agreement={agreement}
        saving={saving}
        approving={approving}
        onSave={saveEdits}
        onApprove={approve}
        backLabel="← All agreements"
        onBack={() => history.push('/rental-management/customer/dashboard')}
      />

      {agreement.status === 'ACTIVE' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Rent status</h2>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white"
              onClick={() =>
                setRentsAgreement({
                  ...agreement,
                  rent_dues: dues,
                })
              }
            >
              Rent
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs text-emerald-700">Paid months</p>
              <p className="text-lg font-semibold text-emerald-900">
                {dues.filter((d) => d.status === 'PAID').length}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs text-amber-800">Not paid months</p>
              <p className="text-lg font-semibold text-amber-900">
                {dues.filter((d) => d.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {rentsAgreement && (
        <TenantViewRentsModal agreement={rentsAgreement} onClose={() => setRentsAgreement(null)} />
      )}
    </div>
  );
};

export default TenantAgreementDetail;
