import React, { useEffect, useState } from 'react';
import { Link, useHistory, useParams, Redirect } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import { RESERVED_STALL_SLUGS, slugifyStallName } from '../../utils/msStallSlug';

/**
 * Public stall landing: /{stall-name-slug}
 * Click → logged-in customer order app (or login first).
 */
const MuttonStallPublicLandingPage = () => {
  const { stallSlug } = useParams();
  const history = useHistory();
  const { user } = useUserContext();
  const slug = slugifyStallName(stallSlug);
  const isReserved = RESERVED_STALL_SLUGS.has(slug);

  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(!isReserved);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isReserved || !slug) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/ms/public/stall/${encodeURIComponent(slug)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || data.error) {
          setError(data.message || 'Stall not found');
          setStall(null);
        } else {
          setStall(data.results || data.data || data);
          setError('');
        }
      } catch {
        if (!cancelled) setError('Could not load stall');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, isReserved]);

  if (isReserved) return <Redirect to="/" />;

  const goOrder = () => {
    const membershipId = stall?.parent_membership_id;
    if (membershipId) {
      try {
        localStorage.setItem('ms_parent_membership_id', String(membershipId));
      } catch {
        // ignore
      }
    }
    const token = user?.results?.token || localStorage.getItem('token');
    const customerPath = stall?.customer_app_path || '/mutton-stall/customer/dashboard';
    if (token) {
      history.push(customerPath);
    } else {
      try {
        sessionStorage.setItem('ms_post_login_redirect', customerPath);
      } catch {
        // ignore
      }
      history.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center text-sm text-gray-500">
        Loading stall…
      </div>
    );
  }

  if (error || !stall) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Stall not found</h1>
          <p className="mt-2 text-sm text-gray-600">{error || 'Check the link and try again.'}</p>
          <Link to="/" className="inline-block mt-4 text-sm font-medium text-rose-800 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 via-stone-900 to-stone-100 flex flex-col">
      <header className="px-4 py-8 text-center text-white">
        <p className="text-[11px] uppercase tracking-widest text-rose-200 font-semibold">Mutton Stall</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">{stall.name}</h1>
        {stall.phone && <p className="mt-2 text-sm text-rose-100">{stall.phone}</p>}
        {stall.address && <p className="mt-1 text-sm text-rose-200/90 max-w-lg mx-auto">{stall.address}</p>}
      </header>

      <main className="flex-1 px-4 pb-10">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Order online</h2>
          <p className="text-sm text-gray-600">
            Browse products and place orders. Existing customers log in with their phone.
          </p>
          <button
            type="button"
            onClick={goOrder}
            className="w-full bg-rose-800 hover:bg-rose-900 text-white rounded-xl py-3 text-sm font-semibold"
          >
            Open customer app
          </button>
          <p className="text-xs text-gray-500">
            Not registered? Ask the stall to add your phone as a customer first.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MuttonStallPublicLandingPage;
