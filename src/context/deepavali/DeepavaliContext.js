import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';
import { usePlatformAccess } from '../platformAccess_context';
import { useCollectorReceivablesStream } from '../../components/collector/useCollectorReceivablesStream';

const DeepavaliContext = createContext(null);

const unwrap = (payload) => payload?.results ?? payload ?? null;

export const DeepavaliProvider = ({ children }) => {
    const { user } = useUserContext();
    const platform = usePlatformAccess();
    const token = user?.results?.token;
    const membershipId = platform?.activeContext?.parentMembershipId
        || user?.results?.userAccounts?.[0]?.parent_membership_id
        || localStorage.getItem('dp_parent_membership_id');

    useEffect(() => {
        if (membershipId) {
            localStorage.setItem('dp_parent_membership_id', String(membershipId));
        }
    }, [membershipId]);

    const [companies, setCompanies] = useState([]);
    const company = companies[0] || null;
    const [roles, setRoles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [entries, setEntries] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [payables, setPayables] = useState([]);
    const [reports, setReports] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    const qs = membershipId ? `parent_membership_id=${membershipId}` : '';

    const request = useCallback(async (path, options = {}) => {
        if (!token || !membershipId) {
            throw new Error('Membership ID not found');
        }
        const method = options.method || 'GET';
        const hasQuery = path.includes('?');
        const url = method === 'GET'
            ? `${API_BASE_URL}${path}${hasQuery ? '&' : '?'}${qs}`
            : `${API_BASE_URL}${path}`;
        const body = method === 'GET'
            ? undefined
            : JSON.stringify({ parent_membership_id: membershipId, ...(options.body || {}) });
        const res = await fetch(url, { method, headers, body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
            throw new Error(data.message || 'Request failed');
        }
        return unwrap(data);
    }, [headers, membershipId, qs, token]);

    const applyLiveSnapshot = useCallback((payload) => {
        const [
            dash, subscriberRows, receivableRows, receiptRows, groupRows, payableRows, reportPayload,
        ] = payload;
        setDashboard(dash);
        setSubscribers((subscriberRows || []).filter((row) => (
            !row.deleted_at && String(row.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'
        )));
        setReceivables(receivableRows || []);
        setReceipts(receiptRows || []);
        setGroups((groupRows || []).filter((row) => String(row.status || '').toUpperCase() !== 'CLOSED'));
        setPayables(payableRows || []);
        setReports(reportPayload);
    }, []);

    const refreshLive = useCallback(async () => {
        if (!token || !membershipId) return;
        try {
            const snapshot = await Promise.all([
                request('/dp/dashboard'),
                request('/dp/subscribers'),
                request('/dp/receivables'),
                request('/dp/receipts'),
                request('/dp/groups'),
                request('/dp/payables'),
                request('/dp/reports'),
            ]);
            applyLiveSnapshot(snapshot);
        } catch (err) {
            console.error('Deepavali live refresh', err);
        }
    }, [applyLiveSnapshot, membershipId, request, token]);

    const refreshAll = useCallback(async () => {
        if (!token || !membershipId) return;
        setLoading(true);
        setError(null);
        try {
            await request('/dp/bootstrap', { method: 'POST', body: {} });
            const [
                companyRow, roleRows, employeeRows, categoryRows, accountRows, entryRows, dash,
                subscriberRows, receivableRows, receiptRows, groupRows, payableRows, reportPayload,
            ] = await Promise.all([
                request('/dp/company'),
                request('/dp/roles'),
                request('/dp/employees'),
                request('/dp/ledger/categories'),
                request('/dp/ledger/accounts'),
                request('/dp/ledger/entries'),
                request('/dp/dashboard'),
                request('/dp/subscribers'),
                request('/dp/receivables'),
                request('/dp/receipts'),
                request('/dp/groups'),
                request('/dp/payables'),
                request('/dp/reports'),
            ]);
            const companyList = Array.isArray(companyRow) ? companyRow : (companyRow ? [companyRow] : []);
            setCompanies(companyList.filter((row) => String(row.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'));
            setRoles(roleRows || []);
            setEmployees(employeeRows || []);
            setCategories(categoryRows || []);
            setAccounts(accountRows || []);
            setEntries(entryRows || []);
            applyLiveSnapshot([
                dash, subscriberRows, receivableRows, receiptRows, groupRows, payableRows, reportPayload,
            ]);
        } catch (err) {
            setError(err.message || 'Failed to load Deepavali Chits');
        } finally {
            setLoading(false);
        }
    }, [applyLiveSnapshot, membershipId, request, token]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const refreshLiveRef = useRef(refreshLive);
    refreshLiveRef.current = refreshLive;

    useCollectorReceivablesStream({
        enabled: Boolean(token && membershipId),
        token,
        parentMembershipId: membershipId,
        onEvent: () => {
            refreshLiveRef.current?.();
        },
    });

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                refreshLiveRef.current?.();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const paymentMethods = useMemo(
        () => (accounts || []).filter((row) => String(row.status || 'ACTIVE').toUpperCase() === 'ACTIVE'),
        [accounts]
    );

    const saveCompany = useCallback(async (payload) => {
        const saved = await request('/dp/company', { method: 'POST', body: payload });
        setCompanies((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            return [saved, ...rest];
        });
        return saved;
    }, [request]);

    const deleteCompany = useCallback(async (rowOrId) => {
        const row = rowOrId && typeof rowOrId === 'object' ? rowOrId : null;
        const id = row?.id || rowOrId;
        if (!id) throw new Error('Company id is required');
        try {
            await request('/dp/company/delete', { method: 'POST', body: { id } });
        } catch (err) {
            if (!row?.company_name) throw err;
            await request('/dp/company', {
                method: 'POST',
                body: {
                    id,
                    company_name: row.company_name,
                    address: row.address || null,
                    phone: row.phone || null,
                    email: row.email || null,
                    gst_details: row.gst_details || null,
                    company_logo: row.company_logo || null,
                    status: 'INACTIVE',
                },
            });
        }
        setCompanies((prev) => prev.filter((item) => String(item.id) !== String(id)));
    }, [request]);

    const saveEmployee = useCallback(async (payload) => {
        const saved = await request('/dp/employees', { method: 'POST', body: payload });
        setEmployees((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            return [saved, ...rest].sort((a, b) => String(a.employee_name).localeCompare(String(b.employee_name)));
        });
        return saved;
    }, [request]);

    const disableEmployee = useCallback(async (id) => {
        const saved = await request('/dp/employees/disable', { method: 'POST', body: { id } });
        setEmployees((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'INACTIVE' } : row)));
        return saved;
    }, [request]);

    const saveRole = useCallback(async (payload) => {
        const saved = await request('/dp/roles', { method: 'POST', body: payload });
        setRoles((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            return [...rest, saved].sort((a, b) => String(a.role_name).localeCompare(String(b.role_name)));
        });
        return saved;
    }, [request]);

    const saveCategory = useCallback(async (payload) => {
        const saved = await request('/dp/ledger/categories', { method: 'POST', body: payload });
        setCategories((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            return [...rest, saved].sort((a, b) => String(a.category_name).localeCompare(String(b.category_name)));
        });
        return saved;
    }, [request]);

    const saveAccount = useCallback(async (payload) => {
        const saved = await request('/dp/ledger/accounts', { method: 'POST', body: payload });
        setAccounts((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            return [...rest, saved].sort((a, b) => String(a.account_name).localeCompare(String(b.account_name)));
        });
        return saved;
    }, [request]);

    const deleteAccount = useCallback(async (id) => {
        await request('/dp/ledger/accounts/delete', { method: 'POST', body: { id } });
        setAccounts((prev) => prev.filter((row) => row.id !== id));
    }, [request]);

    const fetchEntries = useCallback(async (filters = {}) => {
        if (!token || !membershipId) return [];
        const params = new URLSearchParams();
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (filters.category) params.set('category', filters.category);
        if (filters.entryType) params.set('entryType', filters.entryType);
        if (filters.ledger_account_id) params.set('ledger_account_id', filters.ledger_account_id);
        const q = params.toString();
        const rows = await request(`/dp/ledger/entries${q ? `?${q}` : ''}`);
        setEntries(rows || []);
        return rows || [];
    }, [membershipId, request, token]);

    const saveEntry = useCallback(async (payload) => {
        const saved = await request('/dp/ledger/entries', { method: 'POST', body: payload });
        const accountRows = await request('/dp/ledger/accounts');
        setAccounts(accountRows || []);
        setEntries((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)]);
        return saved;
    }, [request]);

    const saveSubscriber = useCallback(async (payload) => {
        const saved = await request('/dp/subscribers', { method: 'POST', body: payload });
        setSubscribers((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            if (String(saved.status || 'ACTIVE').toUpperCase() === 'INACTIVE' || saved.deleted_at) {
                return rest;
            }
            return [...rest, saved].sort((a, b) => String(a.subscriber_name).localeCompare(String(b.subscriber_name)));
        });
        return saved;
    }, [request]);

    const saveReceivable = useCallback(async (payload) => {
        const saved = await request('/dp/receivables', { method: 'POST', body: payload });
        setReceivables((prev) => [saved, ...prev]);
        return saved;
    }, [request]);

    const payReceivable = useCallback(async (payload) => {
        const saved = await request('/dp/collections/pay', { method: 'POST', body: payload });
        await refreshAll();
        return saved;
    }, [refreshAll, request]);

    const deleteReceipt = useCallback(async (id) => {
        await request('/dp/receipts/delete', { method: 'POST', body: { id } });
        await refreshAll();
    }, [refreshAll, request]);

    const deleteSubscriber = useCallback(async (rowOrId) => {
        const row = rowOrId && typeof rowOrId === 'object' ? rowOrId : null;
        const id = row?.id || rowOrId;
        if (!id) throw new Error('Subscriber id is required');
        try {
            await request('/dp/subscribers/delete', { method: 'POST', body: { id } });
        } catch (err) {
            if (!row?.subscriber_name) throw err;
            await request('/dp/subscribers', {
                method: 'POST',
                body: {
                    id,
                    subscriber_name: row.subscriber_name,
                    phone: row.phone || null,
                    address: row.address || null,
                    photo: row.photo || null,
                    status: 'INACTIVE',
                },
            });
        }
        setSubscribers((prev) => prev.filter((item) => String(item.id) !== String(id)));
    }, [request]);

    const saveGroup = useCallback(async (payload) => {
        const saved = await request('/dp/groups', { method: 'POST', body: payload });
        setGroups((prev) => {
            const rest = prev.filter((row) => row.id !== saved.id);
            if (String(saved.status || '').toUpperCase() === 'CLOSED') return rest;
            return [saved, ...rest];
        });
        return saved;
    }, [request]);

    const deleteGroup = useCallback(async (rowOrId) => {
        const row = rowOrId && typeof rowOrId === 'object' ? rowOrId : null;
        const id = row?.id || rowOrId;
        if (!id) throw new Error('Group id is required');
        await request('/dp/groups/delete', { method: 'POST', body: { id } });
        await refreshAll();
    }, [refreshAll, request]);

    const enrolSlot = useCallback(async (payload) => {
        const saved = await request('/dp/groups/enrol', { method: 'POST', body: payload });
        await refreshAll();
        return saved;
    }, [refreshAll, request]);

    const activateGroup = useCallback(async (id) => {
        const saved = await request('/dp/groups/activate', { method: 'POST', body: { id } });
        await refreshAll();
        return saved;
    }, [refreshAll, request]);

    const payPayable = useCallback(async (payload) => {
        const saved = await request('/dp/payables/pay', { method: 'POST', body: payload });
        await refreshAll();
        return saved;
    }, [refreshAll, request]);

    const settleSubscriber = useCallback(async (payload) => {
        const saved = await request('/dp/payables/settle-subscriber', { method: 'POST', body: payload });
        await refreshAll();
        return saved;
    }, [refreshAll, request]);

    const value = {
        membershipId,
        company,
        companies,
        roles,
        employees,
        categories,
        accounts,
        entries,
        subscribers,
        receivables,
        receipts,
        paymentMethods,
        groups,
        payables,
        reports,
        dashboard,
        loading,
        error,
        refreshAll,
        saveCompany,
        deleteCompany,
        saveEmployee,
        disableEmployee,
        saveRole,
        saveCategory,
        saveAccount,
        deleteAccount,
        fetchEntries,
        saveEntry,
        saveSubscriber,
        deleteSubscriber,
        saveReceivable,
        payReceivable,
        deleteReceipt,
        saveGroup,
        deleteGroup,
        enrolSlot,
        activateGroup,
        payPayable,
        settleSubscriber,
    };

    return (
        <DeepavaliContext.Provider value={value}>
            {children}
        </DeepavaliContext.Provider>
    );
};

export const useDeepavali = () => {
    const ctx = useContext(DeepavaliContext);
    if (!ctx) {
        throw new Error('useDeepavali must be used inside DeepavaliProvider');
    }
    return ctx;
};
