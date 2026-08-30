import React, { useEffect, useState } from 'react';
import { Switch, Route, Redirect, useHistory, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import PrivateRoute from '../../pages/PrivateRoute';
import MyTreasureBrand from '../MyTreasureBrand';
import AndroidAppNavButton from '../AndroidAppNavButton';
import RmPhotoGallery from './RmPhotoGallery';
import TenantAgreementDetail from './TenantAgreementDetail';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatMonth = (dueMonth) => {
  if (!dueMonth) return '—';
  const [y, m] = String(dueMonth).split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return dueMonth;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const statusLabel = (status) => {
  if (status === 'TENANT_REVIEW') return 'Awaiting your review';
  if (status === 'PENDING_ACCEPT') return 'Approved — waiting for owner to create';
  if (status === 'OWNER_REVIEW') return 'With owner for review';
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  return status;
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/** Shared rent schedule modal — paid / not paid months */
const TenantViewRentsModal = ({ agreement, onClose }) => {
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
            <h2 className="text-lg font-semibold text-gray-900">Rent status</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {agreement.property_address_snapshot || 'Property'} · {money(agreement.rent_amount)}/mo
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
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  d.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {d.status === 'PAID' ? 'Paid' : 'Not paid'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TenantHome = () => {
  const { user } = useUserContext();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rentsAgreement, setRentsAgreement] = useState(null);
  const token = user?.results?.token;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/rm/agreements/tenant/mine`, {
          headers: authHeaders(token),
        });
        const data = await res.json();
        if (!cancelled) setAgreements(data.results || data.data || []);
      } catch (e) {
        toast.error(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Rental agreements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review agreements shared with you. Check rent paid / not paid months anytime.
        </p>
      </div>

      {!agreements.length && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-sm text-gray-500">
          No rental agreements yet.
        </div>
      )}

      {(agreements || []).map((a) => {
        const paid = a.paid_rent_count ?? 0;
        const pending = a.pending_rent_count ?? 0;
        return (
          <div
            key={a.id}
            className="bg-white border border-gray-100 rounded-xl p-4 space-y-3"
          >
            <Link
              to={`/rental-management/customer/agreements/${a.id}`}
              className="flex gap-3 hover:opacity-90"
            >
              <RmPhotoGallery
                photos={a.property?.photos || a.tenant?.rm_cust_photo_s3_image}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {a.property_address_snapshot || a.property?.address || 'Property'}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {money(a.rent_amount)}/mo · deposit {money(a.deposit_amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {a.rent_start_date} → {a.rent_end_date}
                </p>
                <span className="inline-flex mt-2 text-xs px-2 py-1 rounded-full bg-red-50 text-red-800 border border-red-100">
                  {statusLabel(a.status)}
                </span>
              </div>
              <span className="text-red-700 text-sm self-center shrink-0">Details →</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-50">
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white"
                onClick={() => setRentsAgreement(a)}
              >
                Rent
              </button>
              {(paid > 0 || pending > 0) && (
                <span className="text-xs text-gray-600">
                  <span className="text-emerald-700 font-medium">{paid} paid</span>
                  {' · '}
                  <span className="text-amber-800 font-medium">{pending} not paid</span>
                </span>
              )}
              {a.status === 'ACTIVE' && Number(a.outstanding_rent) > 0 && (
                <span className="text-xs text-amber-800">
                  Outstanding {money(a.outstanding_rent)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {rentsAgreement && (
        <TenantViewRentsModal
          agreement={rentsAgreement}
          onClose={() => setRentsAgreement(null)}
        />
      )}
    </div>
  );
};

const RentalManagementCustomerLayout = () => {
  const history = useHistory();
  const { logout } = useUserContext();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <MyTreasureBrand to="/rental-management/customer/dashboard" subtitle="Rental Agreement" inverse />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-red-100 hover:text-white"
              onClick={() => history.push('/app-selection')}
            >
              Financial hub
            </button>
            <AndroidAppNavButton className="text-sm text-red-100 hover:text-white flex items-center gap-1" iconClassName="w-4 h-4" />
            <button
              type="button"
              className="text-sm text-red-100 hover:text-white"
              onClick={() => {
                logout();
                history.push('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <Switch>
        <PrivateRoute exact path="/rental-management/customer" component={TenantHome} />
        <PrivateRoute exact path="/rental-management/customer/dashboard" component={TenantHome} />
        <PrivateRoute
          exact
          path="/rental-management/customer/agreements/:id"
          component={TenantAgreementDetail}
        />
        <Route path="/rental-management/customer">
          <Redirect to="/rental-management/customer/dashboard" />
        </Route>
      </Switch>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default RentalManagementCustomerLayout;
