import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { FiPlus, FiFileText, FiTrash2, FiEdit2, FiRefreshCw, FiDownload, FiX, FiUsers, FiMapPin, FiBarChart2 } from 'react-icons/fi';
import VehicleFinanceOfferLetterPDF from '../../components/vehicleFinance/PDF/VehicleFinanceOfferLetterPDF';
import VehicleFinanceCollectorAssignmentModal from '../../components/vehicleFinance/VehicleFinanceCollectorAssignmentModal';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';
import { VF_MANAGER_DEFAULT_FEATURES } from '../../utils/vfPermissionCatalog';

const FALLBACK_ROLE_DEFAULTS = {
    MANAGER: VF_MANAGER_DEFAULT_FEATURES,
    COLLECTOR: ['vf_subscriber_view', 'vf_collections_view', 'vf_collections_collect'],
    ACCOUNTANT: [
        'vf_subscriber_view',
        'vf_ledger_view_account',
        'vf_ledger_view_entry',
        'vf_ledger_add_entry',
        'vf_report_loan_summary',
        'vf_report_outstanding_due',
        'vf_report_outstanding_loan_wise',
        'vf_report_todays_demand',
        'vf_report_collection',
        'vf_report_financial_summary',
    ],
};

const getDefaultsForRole = (role, roleDefaults) =>
    roleDefaults[role] || FALLBACK_ROLE_DEFAULTS[role] || [];

const todayIso = () => new Date().toISOString().split('T')[0];

const formatSalary = (value) => {
    if (value == null || value === '') return '';
    const num = parseFloat(value);
    return Number.isNaN(num) ? '' : num;
};

const formatJoinDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const unwrapResponse = (body) => {
    let value = body;
    for (let i = 0; i < 3; i += 1) {
        if (value?.results != null) value = value.results;
        else if (value?.data != null) value = value.data;
        else break;
    }
    return value || {};
};

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const summaryValue = (summary, ...keys) => {
    const key = keys.find(candidate => summary?.[candidate] != null);
    return key ? summary[key] : 0;
};

const VehicleFinanceEmployeesPage = () => {
    const { user } = useUserContext();
    const { canAccess, enforceAccess } = useVfPermission();
    const canAddEmployee = canAccess('vf_employee_add') || canAccess('vf_employee_manage');
    const canViewCollectors = canAccess('vf_collector_view') || canAccess('vf_employee_manage');
    const canAddCollector = canAccess('vf_collector_add') || canAccess('vf_employee_manage');
    const canEditCollector = canAccess('vf_collector_edit') || canAccess('vf_employee_manage');
    const canViewAccountants = canAccess('vf_accountant_view') || canAccess('vf_employee_manage');
    const canAddAccountant = canAccess('vf_accountant_add') || canAccess('vf_employee_manage');
    const canEditAccountant = canAccess('vf_accountant_edit') || canAccess('vf_employee_manage');
    const canOfferLetter = canAccess('vf_offer_letter');
    // Managers cannot create another Manager from the VF employees page.
    const canManageManagers = !enforceAccess;
    const [employees, setEmployees] = useState([]);
    const [features, setFeatures] = useState([]);
    const [roleDefaults, setRoleDefaults] = useState(FALLBACK_ROLE_DEFAULTS);
    const [roleDescriptions, setRoleDescriptions] = useState({});
    const [roles, setRoles] = useState(['MANAGER', 'COLLECTOR', 'ACCOUNTANT']);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [roleManuallyChanged, setRoleManuallyChanged] = useState(false);
    const [offerLetterData, setOfferLetterData] = useState(null);
    const [offerLetterLoading, setOfferLetterLoading] = useState(false);
    const [assignmentEmployee, setAssignmentEmployee] = useState(null);
    const [selectedCollectorId, setSelectedCollectorId] = useState('');
    const [performanceDates, setPerformanceDates] = useState({ startDate: '', endDate: '' });
    const [performance, setPerformance] = useState(null);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [performanceError, setPerformanceError] = useState('');
    const [dashboardEmployee, setDashboardEmployee] = useState(null);
    const [dashboardListType, setDashboardListType] = useState('DUE');
    const performanceDashboardRef = useRef(null);

    const defaultRole = 'COLLECTOR';
    const [form, setForm] = useState({
        name: '',
        mobile: '',
        email: '',
        role: defaultRole,
        dateOfJoining: todayIso(),
        salary: '',
        loginPassword: '',
        responsibilities: getDefaultsForRole(defaultRole, FALLBACK_ROLE_DEFAULTS),
        areas: '',
    });

    const userAccounts = user?.results?.userAccounts || [];
    const account =
        userAccounts.find(item => item?.parent_membership_id != null) ||
        userAccounts[0];
    const membershipId = account?.parent_membership_id ?? account?.membershipId ?? account?.membership_id;
    const token = user?.results?.token;
    const headers = { Authorization: `Bearer ${user?.results?.token}`, 'Content-Type': 'application/json' };

    const featureLabel = (key) => features.find(f => f.key === key)?.label || key;

    const fetchEmployees = useCallback(async () => {
        if (!membershipId) return;
        const res = await fetch(`${API_BASE_URL}/vf/employees?parent_membership_id=${membershipId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEmployees(data.results?.employees || data.results || []);
    }, [membershipId, token]);

    const visibleEmployees = employees.filter((employee) => {
        if (employee.role === 'MANAGER') return canManageManagers;
        if (employee.role === 'COLLECTOR') {
            return canViewCollectors || canAddCollector || canEditCollector;
        }
        if (employee.role === 'ACCOUNTANT') {
            return canViewAccountants || canAddAccountant || canEditAccountant;
        }
        return true;
    });
    const assignableRoles = roles.filter((role) => {
        if (role === 'MANAGER') return canManageManagers;
        if (role === 'COLLECTOR') return canAddCollector || (editId && canEditCollector);
        if (role === 'ACCOUNTANT') return canAddAccountant || (editId && canEditAccountant);
        return false;
    });
    const collectors = employees.filter(employee => employee.role === 'COLLECTOR');
    const selectedCollectorMembershipId =
        collectors.find(employee => String(employee.id) === String(selectedCollectorId))
            ?.parent_membership_id ??
        membershipId;

    const fetchPerformance = useCallback(async () => {
        if (!selectedCollectorId || !selectedCollectorMembershipId || !token) {
            setPerformance(null);
            return;
        }
        setPerformanceLoading(true);
        setPerformanceError('');
        try {
            const params = new URLSearchParams({
                parent_membership_id: selectedCollectorMembershipId,
            });
            if (performanceDates.startDate) params.set('start_date', performanceDates.startDate);
            if (performanceDates.endDate) params.set('end_date', performanceDates.endDate);
            const response = await fetch(
                `${API_BASE_URL}/vf/employees/${selectedCollectorId}/performance?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPerformance(unwrapResponse(await readApiResponse(response)));
        } catch (error) {
            setPerformance(null);
            setPerformanceError(error.message || 'Unable to load collector performance');
        } finally {
            setPerformanceLoading(false);
        }
    }, [
        selectedCollectorId,
        selectedCollectorMembershipId,
        token,
        performanceDates.startDate,
        performanceDates.endDate,
    ]);

    useEffect(() => {
        fetchEmployees();
        fetch(`${API_BASE_URL}/vf/employees/features`, { headers })
            .then(r => r.json())
            .then(d => {
                const results = d.results || {};
                setFeatures(results.features || []);
                if (results.roleDefaults) setRoleDefaults(results.roleDefaults);
                if (results.roleDescriptions) setRoleDescriptions(results.roleDescriptions);
                if (results.roles?.length) setRoles(results.roles);
            });
    }, [fetchEmployees]);

    useEffect(() => {
        if (!selectedCollectorId && collectors.length) {
            setSelectedCollectorId(String(collectors[0].id));
        } else if (selectedCollectorId && !collectors.some(item => String(item.id) === String(selectedCollectorId))) {
            setSelectedCollectorId(collectors[0] ? String(collectors[0].id) : '');
        }
    }, [collectors, selectedCollectorId]);

    useEffect(() => {
        fetchPerformance();
    }, [fetchPerformance]);

    const applyRoleDefaults = (role, preserveCustom = false) => {
        const defaults = getDefaultsForRole(role, roleDefaults);
        setForm(prev => ({
            ...prev,
            role,
            responsibilities: preserveCustom && editId ? prev.responsibilities : [...defaults],
        }));
    };

    const handleRoleChange = (role) => {
        setRoleManuallyChanged(true);
        applyRoleDefaults(role);
    };

    const openAddForm = () => {
        const initialRole = (
            canAddCollector ? 'COLLECTOR'
                : canAddAccountant ? 'ACCOUNTANT'
                    : canManageManagers ? 'MANAGER'
                        : null
        );
        if (!initialRole) {
            alert('You do not have permission to add employees.');
            return;
        }
        setEditId(null);
        setRoleManuallyChanged(false);
        setForm({
            name: '',
            mobile: '',
            email: '',
            role: initialRole,
            dateOfJoining: todayIso(),
            salary: '',
            loginPassword: '',
            responsibilities: getDefaultsForRole(initialRole, roleDefaults),
            areas: '',
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditId(null);
        setRoleManuallyChanged(false);
        setShowForm(false);
    };

    const save = async () => {
        if (!form.name.trim()) {
            alert('Employee name is required');
            return;
        }
        if (!form.responsibilities.length) {
            alert('Select at least one responsibility for this role');
            return;
        }
        if (['MANAGER', 'COLLECTOR'].includes(form.role) && !form.mobile.trim()) {
            alert(`Mobile number is required for ${form.role.toLowerCase()} login`);
            return;
        }

        const payload = {
            membershipId,
            name: form.name,
            mobile: form.mobile,
            email: form.email,
            role: form.role,
            dateOfJoining: form.dateOfJoining || null,
            salary: formatSalary(form.salary),
            responsibilities: form.responsibilities,
            areas: form.areas ? form.areas.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        if (['MANAGER', 'COLLECTOR'].includes(form.role)) {
            payload.loginPassword = form.loginPassword || undefined;
            payload.createLoginAccount = true;
        }
        const url = editId ? `${API_BASE_URL}/vf/employees/${editId}` : `${API_BASE_URL}/vf/employees`;
        const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers, body: JSON.stringify(payload) });
        const data = await res.json();
        if (res.ok) {
            const hint = data.results?.employeeLoginHint || data.results?.collectorLoginHint;
            if (!editId && hint) {
                const pwdNote = hint.defaultPassword
                    ? `Default password: last 4 digits of mobile (${hint.defaultPassword})`
                    : 'Use the password you set';
                alert(
                    `${hint.role === 'MANAGER' ? 'Manager' : 'Collector'} login created.\n\nURL: ${window.location.origin}${hint.loginUrl}\nPhone: ${hint.phone}\n${pwdNote}`
                );
            }
            resetForm();
            fetchEmployees();
        } else {
            alert(data.message || 'Failed to save employee');
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete employee?')) return;
        await fetch(`${API_BASE_URL}/vf/employees/${id}`, { method: 'DELETE', headers });
        fetchEmployees();
    };

    const openOfferLetter = async (id) => {
        setOfferLetterLoading(true);
        setOfferLetterData(null);
        try {
            const res = await fetch(`${API_BASE_URL}/vf/employees/${id}/offer-letter`, { headers });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate offer letter');
            }
            setOfferLetterData(data.results || data);
        } catch (err) {
            alert(err.message || 'Failed to load offer letter');
        } finally {
            setOfferLetterLoading(false);
        }
    };

    const startEdit = (emp) => {
        setEditId(emp.id);
        setRoleManuallyChanged(false);
        setForm({
            name: emp.name,
            mobile: emp.mobile || '',
            email: emp.email || '',
            role: emp.role,
            dateOfJoining: emp.date_of_joining ? emp.date_of_joining.split('T')[0] : todayIso(),
            salary: emp.salary != null ? String(emp.salary) : '',
            loginPassword: '',
            responsibilities: (emp.responsibilities || []).filter(r => r.is_granted).map(r => r.feature_key),
            areas: (emp.areas || []).map(a => a.region).join(', '),
        });
        setShowForm(true);
    };

    const openPerformanceDashboard = (employee) => {
        setDashboardEmployee(employee);
        setDashboardListType('DUE');
        if (String(employee.id) === String(selectedCollectorId)) {
            fetchPerformance();
        } else {
            setPerformance(null);
            setSelectedCollectorId(String(employee.id));
        }
        performanceDashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const roleDefaultSet = new Set(getDefaultsForRole(form.role, roleDefaults));

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <p className="text-sm text-gray-500 mt-1">Assign role first — responsibilities are set automatically and can be adjusted.</p>
                </div>
                {canAddEmployee && (canAddCollector || canAddAccountant || canManageManagers) && (
                    <button onClick={openAddForm} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg w-fit">
                        <FiPlus /> Add Employee
                    </button>
                )}
            </div>

            <section ref={performanceDashboardRef} className="mb-6 scroll-mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-4 border-b bg-gray-50 p-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Collector performance dashboard</h2>
                        <p className="mt-1 text-sm text-gray-500">Review assignments, dues and collections by date range.</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchPerformance}
                        disabled={!selectedCollectorId || performanceLoading}
                        className="flex w-fit items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                        <FiRefreshCw className={performanceLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                <div className="grid gap-3 border-b p-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Collector</label>
                        <select
                            value={selectedCollectorId}
                            onChange={event => setSelectedCollectorId(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            {!collectors.length && <option value="">No collectors</option>}
                            {collectors.map(collector => <option key={collector.id} value={collector.id}>{collector.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Start date (optional)</label>
                        <input
                            type="date"
                            value={performanceDates.startDate}
                            onChange={event => setPerformanceDates(value => ({ ...value, startDate: event.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">End date (optional)</label>
                        <input
                            type="date"
                            value={performanceDates.endDate}
                            min={performanceDates.startDate || undefined}
                            onChange={event => setPerformanceDates(value => ({ ...value, endDate: event.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {performanceError && (
                    <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{performanceError}</p>
                )}
                {performanceLoading ? (
                    <p className="p-10 text-center text-sm text-gray-500">Loading collector performance...</p>
                ) : performance ? (
                    <div className="space-y-5 p-4">
                        {(() => {
                            const summary = performance.summary || {};
                            const assignedCount = summaryValue(
                                summary,
                                'subscriberCount',
                                'assignedSubscribers',
                                'assignedSubscriberCount',
                                'assigned_subscribers'
                            ) || performance.assignedSubscriberIds?.length || performance.assignedSubscribers?.length || 0;
                            const rate = summaryValue(summary, 'collectionRate', 'collection_rate', 'collectionRatePercent');
                            const metrics = [
                                { label: 'Assigned subscribers', value: assignedCount, money: false },
                                { label: 'Pending due', value: summaryValue(summary, 'pendingDue', 'pendingDueAmount', 'pending_due'), money: true },
                                { label: 'Collected', value: summaryValue(summary, 'collected', 'collectedAmount', 'totalCollected'), money: true },
                                { label: "Today's due", value: summaryValue(summary, 'todayDue', 'todayDueAmount', 'today_due'), money: true },
                                { label: 'Overdue', value: summaryValue(summary, 'overdue', 'overdueAmount', 'overdue_amount'), money: true },
                            ];
                            return (
                                <>
                                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                                        {metrics.map(metric => (
                                            <div key={metric.label} className="rounded-lg border p-3">
                                                <p className="text-xs text-gray-500">{metric.label}</p>
                                                <p className="mt-1 text-lg font-bold text-gray-900">
                                                    {metric.money ? formatMoney(metric.value) : Number(metric.value || 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">Collection rate</span>
                                            <span className="font-bold text-red-700">{Number(rate || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                            <div className="h-full rounded-full bg-red-600" style={{ width: `${Math.min(100, Math.max(0, Number(rate || 0)))}%` }} />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-gray-900">Region breakdown</h3>
                                <div className="space-y-2">
                                    {(performance.regionBreakdown || []).map((region, index) => (
                                        <div key={region.region || region.name || index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                            <span className="flex min-w-0 items-center gap-2 truncate"><FiMapPin className="text-red-600" /> {region.region || region.name || 'Unspecified'}</span>
                                            <span className="ml-2 text-right text-xs text-gray-600">
                                                {region.subscriberCount ?? region.count ?? 0} subscribers
                                                {(region.collectedAmount ?? region.collected) != null && ` · ${formatMoney(region.collectedAmount ?? region.collected)}`}
                                            </span>
                                        </div>
                                    ))}
                                    {!performance.regionBreakdown?.length && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No region data.</p>}
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent collections</h3>
                                <div className="space-y-2">
                                    {(performance.recentCollections || []).map((collection, index) => (
                                        <div key={collection.id || index} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">
                                                    {collection.subscriber_name ||
                                                        collection.subscriberName ||
                                                        collection.subscriber?.vf_cust_name ||
                                                        collection.subscriber?.name ||
                                                        'Subscriber'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatJoinDate(
                                                        collection.paymentDate ||
                                                        collection.payment_date ||
                                                        collection.collection_date ||
                                                        collection.created_at
                                                    )}
                                                </span>
                                            </span>
                                            <span className="ml-3 font-semibold text-green-700">
                                                {formatMoney(
                                                    collection.paidAmount ||
                                                    collection.amount ||
                                                    collection.paid_amount
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                    {!performance.recentCollections?.length && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No recent collections.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="p-8 text-center text-sm text-gray-500">Select a collector to view performance.</p>
                )}
            </section>

            <div className="grid gap-4">
                {visibleEmployees.map(emp => {
                    const canEditThis = emp.role === 'MANAGER'
                        ? canManageManagers
                        : emp.role === 'COLLECTOR'
                            ? canEditCollector
                            : emp.role === 'ACCOUNTANT'
                                ? canEditAccountant
                                : false;
                    return (
                    <div key={emp.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-semibold">
                                {emp.name}
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-2">{emp.role}</span>
                            </p>
                            <p className="text-sm text-gray-500">{emp.mobile} · {emp.email}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Joining: {formatJoinDate(emp.date_of_joining)}
                                {emp.salary != null && (
                                    <> · Salary: ₹{parseFloat(emp.salary).toLocaleString('en-IN')}</>
                                )}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {(emp.responsibilities || []).filter(r => r.is_granted).map(r => (
                                    <span key={r.feature_key} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                        {featureLabel(r.feature_key)}
                                    </span>
                                ))}
                                {emp.role === 'COLLECTOR' && (emp.areas || []).map(area => (
                                    <span key={area.id || area.region} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                                        <FiMapPin /> {area.region}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {emp.role === 'COLLECTOR' && canEditCollector && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => openPerformanceDashboard(emp)}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <FiBarChart2 /> Dashboard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAssignmentEmployee(emp)}
                                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                        <FiUsers /> Assign Subscribers/Regions
                                    </button>
                                </>
                            )}
                            {canOfferLetter && (
                                <button onClick={() => openOfferLetter(emp.id)} className="p-2 border rounded-lg" title="Offer letter PDF"><FiFileText /></button>
                            )}
                            {canEditThis && (
                                <button onClick={() => startEdit(emp)} className="p-2 border rounded-lg"><FiEdit2 /></button>
                            )}
                            {canManageManagers && (
                                <button onClick={() => remove(emp.id)} className="p-2 border rounded-lg text-red-600"><FiTrash2 /></button>
                            )}
                        </div>
                    </div>
                    );
                })}
                {!employees.length && (
                    <p className="text-center text-gray-500 py-12 bg-white border rounded-xl">No employees yet. Add manager, collector, or accountant.</p>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
                        <h3 className="text-lg font-bold">{editId ? 'Edit' : 'Add'} Employee</h3>

                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Name *"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Mobile"
                            value={form.mobile}
                            onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                        />
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of joining</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={form.dateOfJoining}
                                    onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹ / month)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="e.g. 15000"
                                    value={form.salary}
                                    onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.role}
                                onChange={e => handleRoleChange(e.target.value)}
                            >
                                {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {roleDescriptions[form.role] && (
                                <p className="text-xs text-gray-500 mt-1">{roleDescriptions[form.role]}</p>
                            )}
                            {roleManuallyChanged && !editId && (
                                <p className="text-xs text-green-600 mt-1">Responsibilities updated for {form.role} role.</p>
                            )}
                        </div>

                        {(form.role === 'COLLECTOR' || form.role === 'MANAGER') && (
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Areas / regions (comma separated) — for collectors"
                                value={form.areas}
                                onChange={e => setForm(f => ({ ...f, areas: e.target.value }))}
                            />
                        )}

                        {['MANAGER', 'COLLECTOR'].includes(form.role) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {form.role === 'MANAGER' ? 'Manager' : 'Collector'} login password
                                </label>
                                <input
                                    type="password"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="Leave blank to use last 4 digits of mobile"
                                    value={form.loginPassword}
                                    onChange={e => setForm(f => ({ ...f, loginPassword: e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {editId
                                        ? 'Leave blank to keep the current password. If login was not enabled earlier, the last 4 digits of mobile will be used.'
                                        : form.role === 'MANAGER'
                                            ? 'Manager signs in on the main login page with mobile and this password.'
                                            : 'Collector signs in at /vehicle-finance/collector/login with mobile and this password.'}
                                </p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Responsibilities</p>
                                <button
                                    type="button"
                                    onClick={() => applyRoleDefaults(form.role)}
                                    className="text-xs text-red-600 flex items-center gap-1 hover:underline"
                                >
                                    <FiRefreshCw className="w-3 h-3" /> Reset to {form.role} defaults
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Pre-selected based on role. Check or uncheck to grant or revoke features.
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                                {features.map(f => {
                                    const isDefault = roleDefaultSet.has(f.key);
                                    const checked = form.responsibilities.includes(f.key);
                                    return (
                                        <label
                                            key={f.key}
                                            className={`flex items-start gap-2 text-sm p-2 rounded-lg cursor-pointer ${checked ? 'bg-white border border-red-200' : 'hover:bg-white'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5"
                                                checked={checked}
                                                onChange={e => {
                                                    setForm(prev => ({
                                                        ...prev,
                                                        responsibilities: e.target.checked
                                                            ? [...prev.responsibilities, f.key]
                                                            : prev.responsibilities.filter(k => k !== f.key),
                                                    }));
                                                }}
                                            />
                                            <span>
                                                {f.label}
                                                {isDefault && (
                                                    <span className="ml-1 text-xs text-red-600">(default for {form.role})</span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={save} className="px-4 py-2 bg-red-600 text-white rounded-lg">Save Employee</button>
                        </div>
                    </div>
                </div>
            )}

            {(offerLetterLoading || offerLetterData) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Offer Letter</h3>
                            <button
                                type="button"
                                onClick={() => setOfferLetterData(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {offerLetterLoading ? (
                            <div className="py-8 text-center text-gray-500">Preparing offer letter...</div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-4">
                                    PDF includes company header, date of joining, salary, roles &amp; responsibilities,
                                    and signature blocks for employee and authorized signatory.
                                </p>
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4 text-sm space-y-1">
                                    <p><strong>{offerLetterData.employee?.name}</strong> — {offerLetterData.roleLabel}</p>
                                    <p>Joining: {offerLetterData.joinDate}</p>
                                    <p>Salary: {offerLetterData.salaryText}/month</p>
                                </div>
                                <PDFDownloadLink
                                    document={<VehicleFinanceOfferLetterPDF letterData={offerLetterData} />}
                                    fileName={`offer-letter-${offerLetterData.employee?.name?.replace(/\s+/g, '-') || 'employee'}.pdf`}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                                >
                                    {({ loading }) => (
                                        <>
                                            <FiDownload className="w-4 h-4" />
                                            {loading ? 'Generating PDF...' : 'Download Offer Letter PDF'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const w = window.open('', '_blank');
                                        w.document.write(offerLetterData.html || '<p>No preview</p>');
                                        w.document.close();
                                    }}
                                    className="mt-2 w-full px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Open HTML preview
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {assignmentEmployee && (
                <VehicleFinanceCollectorAssignmentModal
                    employee={assignmentEmployee}
                    membershipId={membershipId}
                    token={token}
                    onClose={() => setAssignmentEmployee(null)}
                    onAssigned={() => {
                        fetchEmployees();
                        if (String(assignmentEmployee.id) === String(selectedCollectorId)) fetchPerformance();
                    }}
                />
            )}

            {dashboardEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
                    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b p-4 sm:p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Collector dashboard</h2>
                                <p className="mt-1 text-sm text-gray-500">{dashboardEmployee.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDashboardEmployee(null)}
                                className="rounded-lg p-2 hover:bg-gray-100"
                                aria-label="Close dashboard"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>

                        {performanceLoading ? (
                            <p className="p-12 text-center text-sm text-gray-500">Loading dashboard...</p>
                        ) : performanceError ? (
                            <p className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {performanceError}
                            </p>
                        ) : performance ? (
                            <>
                                <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3">
                                    {[
                                        {
                                            label: 'Due',
                                            value: performance.summary?.dueAmount,
                                            count: performance.summary?.dueCount,
                                            color: 'text-red-700',
                                        },
                                        {
                                            label: 'Collected',
                                            value: performance.summary?.totalCollected,
                                            count: performance.summary?.receiptCount,
                                            color: 'text-green-700',
                                        },
                                        {
                                            label: 'Pending',
                                            value: performance.summary?.futurePendingAmount,
                                            count: performance.summary?.futurePendingCount,
                                            color: 'text-amber-700',
                                        },
                                    ].map(card => (
                                        <div key={card.label} className="rounded-xl border bg-gray-50 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                                            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{formatMoney(card.value)}</p>
                                            <p className="mt-1 text-xs text-gray-500">{Number(card.count || 0)} record(s)</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex border-b">
                                    {[
                                        { id: 'DUE', label: `Due (${performance.dueReceivables?.length || 0})` },
                                        { id: 'COLLECTED', label: `Collected (${performance.recentCollections?.length || 0})` },
                                        { id: 'PENDING', label: `Pending (${performance.pendingReceivables?.length || 0})` },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setDashboardListType(tab.id)}
                                            className={`flex-1 px-3 py-3 text-sm font-medium ${
                                                dashboardListType === tab.id
                                                    ? 'border-b-2 border-red-600 text-red-700'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                                    {dashboardListType === 'COLLECTED' ? (
                                        <div className="space-y-2">
                                            {(performance.recentCollections || []).map((collection, index) => (
                                                <div key={collection.id || index} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {collection.subscriber?.name || 'Subscriber'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatJoinDate(collection.paymentDate)} · {collection.paymentMethod || 'Payment'}
                                                        </p>
                                                    </div>
                                                    <p className="whitespace-nowrap font-bold text-green-700">{formatMoney(collection.paidAmount)}</p>
                                                </div>
                                            ))}
                                            {!performance.recentCollections?.length && (
                                                <p className="py-10 text-center text-sm text-gray-500">No collections found for this period.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {((dashboardListType === 'DUE'
                                                ? performance.dueReceivables
                                                : performance.pendingReceivables
                                            ) || []).map(receivable => (
                                                <div key={receivable.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {receivable.subscriber?.name || 'Subscriber'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Due {formatJoinDate(receivable.dueDate)}
                                                            {receivable.subscriber?.region ? ` · ${receivable.subscriber.region}` : ''}
                                                            {receivable.status === 'OVERDUE' ? ' · Overdue' : ''}
                                                        </p>
                                                    </div>
                                                    <p className={`whitespace-nowrap font-bold ${
                                                        dashboardListType === 'DUE' ? 'text-red-700' : 'text-amber-700'
                                                    }`}>
                                                        {formatMoney(receivable.dueAmount)}
                                                    </p>
                                                </div>
                                            ))}
                                            {!(dashboardListType === 'DUE'
                                                ? performance.dueReceivables
                                                : performance.pendingReceivables
                                            )?.length && (
                                                <p className="py-10 text-center text-sm text-gray-500">
                                                    No {dashboardListType.toLowerCase()} receivables found.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="p-12 text-center text-sm text-gray-500">No dashboard data available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleFinanceEmployeesPage;
