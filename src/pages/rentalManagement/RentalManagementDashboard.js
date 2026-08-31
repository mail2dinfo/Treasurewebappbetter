import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import { RM_BASE_PATH } from '../../components/rentalManagement/rentalManagementMenuItems';
import RmPhotoGallery from '../../components/rentalManagement/RmPhotoGallery';
import Loading from '../../components/Loading';
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatMonth = (dueMonth) => {
  if (!dueMonth) return '—';
  const [y, m] = String(dueMonth).split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return dueMonth;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const statusBadgeClass = (status) => {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-700 border-gray-200';
  if (status === 'EXPIRED') return 'bg-amber-50 text-amber-900 border-amber-200';
  if (status === 'TENANT_REVIEW') return 'bg-sky-50 text-sky-800 border-sky-200';
  if (status === 'PENDING_ACCEPT') return 'bg-violet-50 text-violet-800 border-violet-200';
  if (status === 'OWNER_REVIEW') return 'bg-amber-50 text-amber-900 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const formatStatus = (status) => {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  if (status === 'TENANT_REVIEW') return 'Tenant review';
  if (status === 'PENDING_ACCEPT') return 'Ready to create';
  if (status === 'OWNER_REVIEW') return 'Owner review';
  return status;
};

const ViewRentsModal = ({ agreement, onClose, onMarkPaid }) => {
  if (!agreement) return null;
  const dues = agreement.rent_dues || [];
  const paidCount = agreement.paid_rent_count ?? dues.filter((d) => d.status === 'PAID').length;
  const pendingCount =
    agreement.pending_rent_count ?? dues.filter((d) => d.status === 'PENDING').length;
  const outstanding =
    agreement.outstanding_rent ??
    dues
      .filter((d) => d.status === 'PENDING')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rent schedule</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {agreement.tenant?.rm_cust_name || 'Tenant'} · {money(agreement.rent_amount)}/mo
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm">
            Close
          </button>
        </div>

        <div className="px-5 pt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
            <p className="text-xs text-emerald-700">Paid</p>
            <p className="text-xl font-semibold text-emerald-900">{paidCount}</p>
            <p className="text-[10px] text-emerald-700">month(s)</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
            <p className="text-xs text-amber-800">Not paid</p>
            <p className="text-xl font-semibold text-amber-900">{pendingCount}</p>
            <p className="text-[10px] text-amber-800">month(s)</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
            <p className="text-xs text-slate-600">Outstanding</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{money(outstanding)}</p>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-3 space-y-2">
          {!dues.length && (
            <p className="text-sm text-gray-500 py-6 text-center">No rent dues generated yet.</p>
          )}
          {dues.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{formatMonth(d.due_month)}</p>
                <p className="text-xs text-gray-500">Due {d.due_date} · {money(d.amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    d.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {d.status === 'PAID' ? 'Paid' : 'Not paid'}
                </span>
                {d.status === 'PENDING' && agreement.status === 'ACTIVE' && onMarkPaid && (
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-lg border border-red-700 text-red-800"
                    onClick={() => onMarkPaid(d.id)}
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CloseAgreementModal = ({ agreement, onClose, onConfirm, submitting }) => {
  const [damageDeduction, setDamageDeduction] = useState('0');
  const [damageNotes, setDamageNotes] = useState('');
  if (!agreement) return null;

  const held = Number(agreement.deposit_amount) || 0;
  const deduction = Math.max(0, Number(damageDeduction) || 0);
  const refund = Math.max(0, held - deduction);
  const outstanding = Number(agreement.outstanding_rent) || 0;
  const alreadySettled = agreement.deposit_status === 'SETTLED';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Close agreement</h2>
          <p className="text-sm text-gray-500 mt-1">
            Settle security deposit to tenant and outstanding rent to owner, then mark Closed.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">Tenant:</span>{' '}
              <span className="font-medium">{agreement.tenant?.rm_cust_name}</span>
            </p>
            <p>
              <span className="text-gray-500">Outstanding rent → Owner:</span>{' '}
              <span className="font-medium text-amber-800">{money(outstanding)}</span>
              {agreement.pending_rent_count > 0 && (
                <span className="text-xs text-gray-500"> ({agreement.pending_rent_count} month(s))</span>
              )}
            </p>
            <p>
              <span className="text-gray-500">Security deposit:</span>{' '}
              <span className="font-medium">{money(held)}</span>
              {alreadySettled && <span className="text-xs text-gray-500"> (already settled)</span>}
            </p>
          </div>

          {!alreadySettled && (
            <>
              <label className="block text-sm">
                <span className="text-gray-600">Damage deduction (from deposit)</span>
                <input
                  type="number"
                  min="0"
                  max={held}
                  step="1"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={damageDeduction}
                  onChange={(e) => setDamageDeduction(e.target.value)}
                />
              </label>
              {deduction > 0 && (
                <label className="block text-sm">
                  <span className="text-gray-600">Damage notes</span>
                  <textarea
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    placeholder="Describe damage / repairs"
                  />
                </label>
              )}
              <p className="text-sm text-red-800">
                Refund to tenant: <strong>{money(refund)}</strong>
              </p>
            </>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg border"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-60"
            disabled={submitting}
            onClick={() => {
              if (!alreadySettled && deduction > 0 && !damageNotes.trim()) {
                toast.error('Damage notes are required when deducting');
                return;
              }
              if (deduction > held) {
                toast.error('Deduction cannot exceed deposit');
                return;
              }
              onConfirm({
                damageDeduction: alreadySettled ? 0 : deduction,
                damageNotes: alreadySettled ? undefined : damageNotes,
              });
            }}
          >
            {submitting ? 'Closing…' : 'Confirm close'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RentalManagementDashboard = () => {
  const history = useHistory();
  const {
    dashboard,
    fetchDashboard,
    companies,
    fetchCompanies,
    markRentPaid,
    closeAgreement,
    activateAgreement,
  } = useRentalManagementContext();
  const [loading, setLoading] = useState(true);
  const [rentsAgreement, setRentsAgreement] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [closing, setClosing] = useState(false);
  const [activatingId, setActivatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchCompanies()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard, fetchCompanies]);

  const agreements = useMemo(() => dashboard?.agreements || [], [dashboard]);

  const downloadAgreement = (row) => {
    const url = row.signed_doc_download_url || row.signed_doc_url || row.agreement_pdf_url;
    if (!url) {
      toast.info('No uploaded agreement document yet');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onMarkPaid = async (dueId) => {
    const result = await markRentPaid(dueId);
    if (result.success) toast.success('Marked as paid');
    else toast.error(result.error || 'Failed');
  };

  // Keep View Rents modal in sync after dashboard refresh
  useEffect(() => {
    if (!rentsAgreement?.id) return;
    const updated = agreements.find((a) => a.id === rentsAgreement.id);
    if (updated) setRentsAgreement(updated);
  }, [agreements, rentsAgreement?.id]);

  const onConfirmClose = async (payload) => {
    if (!closeTarget) return;
    setClosing(true);
    const result = await closeAgreement(closeTarget.id, payload);
    setClosing(false);
    if (result.success) {
      toast.success(result.message || 'Agreement closed');
      setCloseTarget(null);
    } else {
      toast.error(result.error || 'Failed to close');
    }
  };

  const onActivate = async (row) => {
    const ok = window.confirm(
      `Create / activate agreement for ${row.tenant?.rm_cust_name || 'tenant'}? This will generate the rent schedule.`
    );
    if (!ok) return;
    setActivatingId(row.id);
    const result = await activateAgreement(row.id);
    setActivatingId(null);
    if (result.success) toast.success(result.message || 'Agreement activated');
    else toast.error(result.error || 'Failed to activate');
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rental agreements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {companies?.[0]?.company_name || 'All active and closed leases'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => history.push(`${RM_BASE_PATH}/prepare-agreement`)}
          className="px-4 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium shadow-sm hover:bg-red-800"
        >
          Create Rental Agreement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Rent outstanding</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!agreements.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No agreements yet. Create your first rental agreement.
                  </td>
                </tr>
              )}
              {agreements.map((row) => (
                <tr key={row.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[12rem]">
                      <RmPhotoGallery
                        photos={row.tenant?.rm_cust_photo_s3_image || row.tenant?.rm_cust_photo}
                        size="sm"
                        emptyLabel=""
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {row.tenant?.rm_cust_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {row.property_address_snapshot || row.property?.address || ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {row.tenant?.rm_cust_phone || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        row.outstanding_rent > 0 ? 'font-medium text-amber-800' : 'text-gray-700'
                      }
                    >
                      {money(row.outstanding_rent)}
                    </span>
                    {row.pending_rent_count > 0 && (
                      <span className="block text-xs text-gray-500">
                        {row.pending_rent_count} unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex text-xs px-2 py-1 rounded-full border ${statusBadgeClass(
                        row.status
                      )}`}
                    >
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {['DRAFT', 'TENANT_REVIEW', 'OWNER_REVIEW', 'PENDING_ACCEPT', 'ACTIVE'].includes(
                        row.status
                      ) && (
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-700 text-red-800 hover:bg-red-50"
                          onClick={() => history.push(`${RM_BASE_PATH}/agreements/${row.id}`)}
                        >
                          {['DRAFT', 'TENANT_REVIEW', 'OWNER_REVIEW'].includes(row.status)
                            ? 'Edit agreement'
                            : 'View agreement'}
                        </button>
                      )}
                      {row.status === 'PENDING_ACCEPT' && (
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
                          disabled={activatingId === row.id}
                          onClick={() => onActivate(row)}
                        >
                          {activatingId === row.id ? 'Creating…' : 'Create agreement'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                        onClick={() => downloadAgreement(row)}
                      >
                        Download agreement
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-red-700 text-red-800 hover:bg-red-50"
                        onClick={() => setRentsAgreement(row)}
                      >
                        Rent
                      </button>
                      {['ACTIVE', 'EXPIRED'].includes(row.status) && (
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-800 text-gray-900 hover:bg-gray-50"
                          onClick={() => setCloseTarget(row)}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rentsAgreement && (
        <ViewRentsModal
          agreement={rentsAgreement}
          onClose={() => setRentsAgreement(null)}
          onMarkPaid={async (dueId) => {
            await onMarkPaid(dueId);
          }}
        />
      )}

      {closeTarget && (
        <CloseAgreementModal
          agreement={closeTarget}
          onClose={() => !closing && setCloseTarget(null)}
          onConfirm={onConfirmClose}
          submitting={closing}
        />
      )}
    </div>
  );
};

export default RentalManagementDashboard;
