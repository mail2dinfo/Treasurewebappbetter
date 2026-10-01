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

const readAssignedIds = (employee) => {
    const raw = employee?.dcCollectorAreas || employee?.areas || [];
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((item) => {
        if (typeof item === 'string') return item;
        return item?.dcAobId || item?.dc_aob_id || item?.id;
    }).filter(Boolean))];
};

const DailyCollectionCollectorAssignmentModal = ({
    employee,
    membershipId,
    token,
    onClose,
    onAssigned,
}) => {
    const [areas, setAreas] = useState([]);
    const [assignedIds, setAssignedIds] = useState(() => readAssignedIds(employee));
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
            const [areasRes, assignedRes] = await Promise.all([
                fetch(`${API_BASE_URL}/dc/aob?parent_membership_id=${scopeMembershipId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/dc/employees/${employee.id}/areas?parent_membership_id=${scopeMembershipId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            const areasBody = unwrapResponse(await readApiResponse(areasRes));
            const assignedBody = unwrapResponse(await readApiResponse(assignedRes));
            const areaList = Array.isArray(areasBody) ? areasBody : areasBody.areas || [];
            const assignedList = Array.isArray(assignedBody) ? assignedBody : assignedBody.areas || [];
            setAreas(areaList);
            setAssignedIds(assignedList.map((item) => item.dcAobId || item.dc_aob_id || item.id).filter(Boolean));
        } catch (requestError) {
            setError(requestError.message || 'Unable to load areas');
        } finally {
            setLoading(false);
        }
    }, [employee, scopeMembershipId, token]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    const assignedAreas = useMemo(
        () => areas.filter((area) => assignedIds.includes(area.id)),
        [areas, assignedIds]
    );
    const pendingAreas = useMemo(
        () => areas.filter((area) => !assignedIds.includes(area.id)),
        [areas, assignedIds]
    );

    const assignArea = (areaId) => {
        if (!areaId || assignedIds.includes(areaId)) return;
        setAssignedIds((current) => [...current, areaId]);
        setSuccess('');
        setError('');
    };

    const unassignArea = (areaId) => {
        setAssignedIds((current) => current.filter((id) => id !== areaId));
        setSuccess('');
        setError('');
    };

    const saveAssignments = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/dc/employees/${employee.id}/areas`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    membershipId: scopeMembershipId,
                    areaIds: assignedIds,
                }),
            });
            const body = unwrapResponse(await readApiResponse(response));
            const areaCount = body.areaCount ?? assignedIds.length;
            setSuccess(
                areaCount
                    ? `${areaCount} area${Number(areaCount) === 1 ? '' : 's'} saved for this collector.`
                    : 'All areas unassigned for this collector.'
            );
            onAssigned?.(assignedIds);
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
                            {employee.name || 'Collector'} · Daily Collection areas
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b bg-red-50 px-4 py-3 text-xs text-red-800 sm:px-5">
                    Assign collection areas to this collector. Subscribers tagged to those areas will appear in their collections.
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
                                        <span className="font-normal text-gray-500">({assignedAreas.length})</span>
                                    </h3>
                                    {assignedIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setAssignedIds([])}
                                            className="text-xs font-medium text-red-700 hover:underline"
                                        >
                                            Unassign all
                                        </button>
                                    )}
                                </div>
                                {assignedAreas.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        No areas assigned yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignedAreas.map((area) => (
                                            <div
                                                key={area.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5"
                                            >
                                                <p className="truncate text-sm font-medium text-gray-900 capitalize">{area.aob}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => unassignArea(area.id)}
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
                                    <span className="ml-2 font-normal text-gray-500">({pendingAreas.length})</span>
                                </h3>
                                {pendingAreas.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        {areas.length
                                            ? 'All available areas are assigned.'
                                            : 'No areas found. Add them in Admin Settings → Area of Business first.'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingAreas.map((area) => (
                                            <div
                                                key={area.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                                            >
                                                <p className="truncate text-sm font-medium text-gray-900 capitalize">{area.aob}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => assignArea(area.id)}
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

export default DailyCollectionCollectorAssignmentModal;
