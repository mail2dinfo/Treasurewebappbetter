import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiMapPin, FiX } from 'react-icons/fi';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';

const unwrapResponse = (body) => {
    let value = body;
    for (let i = 0; i < 3; i += 1) {
        if (value?.results != null) value = value.results;
        else if (value?.data != null) value = value.data;
        else break;
    }
    return value || {};
};

const normalizeRegion = (value) => String(value || '').trim();

const readEmployeeAreas = (employee) => {
    const raw = employee?.catchmentAreas || employee?.areas || [];
    if (!Array.isArray(raw)) return [];
    return [
        ...new Set(
            raw
                .map((item) => (typeof item === 'string' ? item : item?.region))
                .map(normalizeRegion)
                .filter(Boolean)
        ),
    ].sort((a, b) => a.localeCompare(b));
};

/**
 * Assign / unassign VF collector catchment regions (vf_collector_catchment_area).
 * Regions come from vf_subscriber.region.
 */
const VehicleFinanceCollectorAssignmentModal = ({
    employee,
    membershipId,
    token,
    onClose,
    onAssigned,
}) => {
    const [subscribers, setSubscribers] = useState([]);
    const [assignedRegions, setAssignedRegions] = useState(() => readEmployeeAreas(employee));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const scopeMembershipId = employee?.parent_membership_id
        ?? employee?.parentMembershipId
        ?? membershipId;

    const loadAssignments = useCallback(async () => {
        if (!employee?.id || !scopeMembershipId || !token) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ parent_membership_id: scopeMembershipId });
            const subscriberResponse = await fetch(
                `${API_BASE_URL}/vf/subscribers?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const subscriberBody = await readApiResponse(subscriberResponse);
            const subscriberPayload = unwrapResponse(subscriberBody);
            const subscriberList = Array.isArray(subscriberPayload)
                ? subscriberPayload
                : subscriberPayload.subscribers || [];
            setSubscribers(subscriberList);
            setAssignedRegions(readEmployeeAreas(employee));
        } catch (requestError) {
            setError(requestError.message || 'Unable to load areas');
        } finally {
            setLoading(false);
        }
    }, [employee, scopeMembershipId, token]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    const regionOptions = useMemo(() => {
        const counts = subscribers.reduce((map, subscriber) => {
            const region = normalizeRegion(subscriber.region);
            if (region) map.set(region, (map.get(region) || 0) + 1);
            return map;
        }, new Map());
        // Keep currently assigned regions even if no subscribers currently list them.
        assignedRegions.forEach((region) => {
            if (!counts.has(region)) counts.set(region, 0);
        });
        return Array.from(counts, ([region, count]) => ({ region, count }))
            .sort((a, b) => a.region.localeCompare(b.region));
    }, [subscribers, assignedRegions]);

    const pendingRegions = useMemo(
        () => regionOptions.filter(({ region }) => !assignedRegions.includes(region)),
        [regionOptions, assignedRegions]
    );
    const assignedOptions = useMemo(
        () => regionOptions.filter(({ region }) => assignedRegions.includes(region)),
        [regionOptions, assignedRegions]
    );

    const assignRegion = (region) => {
        const normalized = normalizeRegion(region);
        if (!normalized || assignedRegions.includes(normalized)) return;
        setAssignedRegions((current) => [...current, normalized].sort((a, b) => a.localeCompare(b)));
        setSuccess('');
        setError('');
    };

    const unassignRegion = (region) => {
        const normalized = normalizeRegion(region);
        setAssignedRegions((current) => current.filter((item) => item !== normalized));
        setSuccess('');
        setError('');
    };

    const saveAssignments = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/vf/employees/${employee.id}/assignments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    membershipId: scopeMembershipId,
                    mode: 'REGIONS',
                    regions: assignedRegions,
                }),
            });
            const body = unwrapResponse(await readApiResponse(response));
            const areaCount = body.areaCount ?? assignedRegions.length;
            setSuccess(
                areaCount
                    ? `${areaCount} area${Number(areaCount) === 1 ? '' : 's'} saved for this collector.`
                    : 'All areas unassigned for this collector.'
            );
            onAssigned?.(assignedRegions);
        } catch (requestError) {
            setError(requestError.message || 'Unable to update area assignments');
        } finally {
            setSaving(false);
        }
    };

    if (!employee) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b p-4 sm:p-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Area</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {employee.name || 'Collector'} · regions from subscribers
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b bg-red-50 px-4 py-3 text-xs text-red-800 sm:px-5">
                    Assigning an area moves that region to this collector (and their receivables).
                    Unassign removes the area from this collector.
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <FiAlertCircle className="mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            <FiCheckCircle className="mt-0.5 flex-shrink-0" /> {success}
                        </div>
                    )}

                    {loading ? (
                        <p className="py-10 text-center text-sm text-gray-500">Loading areas…</p>
                    ) : (
                        <>
                            <section>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <FiMapPin className="text-green-700" /> Assigned areas
                                        <span className="font-normal text-gray-500">({assignedOptions.length})</span>
                                    </h3>
                                    {assignedRegions.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setAssignedRegions([])}
                                            className="text-xs font-medium text-red-700 hover:underline"
                                        >
                                            Unassign all
                                        </button>
                                    )}
                                </div>
                                {assignedOptions.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        No areas assigned yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignedOptions.map(({ region, count }) => (
                                            <div
                                                key={region}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">{region}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {count} subscriber{count === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => unassignRegion(region)}
                                                    className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                                >
                                                    Unassign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                    Pending areas
                                    <span className="ml-2 font-normal text-gray-500">({pendingRegions.length})</span>
                                </h3>
                                {pendingRegions.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        {regionOptions.length
                                            ? 'All available areas are assigned.'
                                            : 'No subscriber regions found. Add a region on subscribers first.'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingRegions.map(({ region, count }) => (
                                            <div
                                                key={region}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">{region}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {count} subscriber{count === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => assignRegion(region)}
                                                    className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
                        Close
                    </button>
                    <button
                        type="button"
                        disabled={loading || saving}
                        onClick={saveAssignments}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save area assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleFinanceCollectorAssignmentModal;
