import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLayers, FiX } from 'react-icons/fi';
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
    const raw = employee?.dpCollectorGroups || employee?.groups || [];
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((item) => {
        if (typeof item === 'string') return item;
        return item?.groupId || item?.group_id || item?.id;
    }).filter(Boolean))];
};

const DeepavaliCollectorGroupAssignmentModal = ({
    employee,
    membershipId,
    token,
    onClose,
    onAssigned,
}) => {
    const [groups, setGroups] = useState([]);
    const [assignedIds, setAssignedIds] = useState(() => readAssignedIds(employee));
    const [occupied, setOccupied] = useState([]);
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
            const [groupsRes, assignedRes] = await Promise.all([
                fetch(`${API_BASE_URL}/dp/groups?parent_membership_id=${scopeMembershipId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/dp/employees/${employee.id}/groups?parent_membership_id=${scopeMembershipId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            const groupsBody = unwrapResponse(await readApiResponse(groupsRes));
            const assignedBody = unwrapResponse(await readApiResponse(assignedRes));
            const groupList = Array.isArray(groupsBody) ? groupsBody : groupsBody.groups || [];
            const assignedList = Array.isArray(assignedBody) ? assignedBody : assignedBody.groups || [];
            setGroups(groupList);
            setAssignedIds(assignedList.map((item) => item.groupId || item.group_id || item.id).filter(Boolean));
            setOccupied(Array.isArray(assignedBody?.occupied) ? assignedBody.occupied : []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load groups');
        } finally {
            setLoading(false);
        }
    }, [employee, scopeMembershipId, token]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    const occupiedIds = useMemo(
        () => new Set(occupied.map((item) => item.groupId || item.group_id).filter(Boolean)),
        [occupied]
    );
    const assignedGroups = useMemo(
        () => groups.filter((group) => assignedIds.includes(group.id)),
        [groups, assignedIds]
    );
    const pendingGroups = useMemo(
        () => groups.filter((group) => !assignedIds.includes(group.id) && !occupiedIds.has(group.id)),
        [assignedIds, groups, occupiedIds]
    );
    const takenGroups = useMemo(
        () => occupied.filter((item) => !assignedIds.includes(item.groupId || item.group_id)),
        [assignedIds, occupied]
    );

    const assignGroup = (groupId) => {
        if (!groupId || assignedIds.includes(groupId)) return;
        setAssignedIds((current) => [...current, groupId]);
        setSuccess('');
        setError('');
    };

    const unassignGroup = (groupId) => {
        setAssignedIds((current) => current.filter((id) => id !== groupId));
        setSuccess('');
        setError('');
    };

    const saveAssignments = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/dp/employees/${employee.id}/groups`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    membershipId: scopeMembershipId,
                    parent_membership_id: scopeMembershipId,
                    groupIds: assignedIds,
                }),
            });
            const body = unwrapResponse(await readApiResponse(response));
            const groupCount = body.groupCount ?? assignedIds.length;
            setSuccess(
                groupCount
                    ? `${groupCount} group${Number(groupCount) === 1 ? '' : 's'} saved for this collector.`
                    : 'All groups unassigned for this collector.'
            );
            onAssigned?.(assignedIds);
        } catch (requestError) {
            setError(requestError.message || 'Unable to update group assignments');
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
                        <h2 className="text-lg font-bold text-gray-900">Assign group</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {employee.name || 'Collector'} · Deepavali Chits groups
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b bg-red-50 px-4 py-3 text-xs text-red-800 sm:px-5">
                    Same as Chit Fund Area of Business: assign groups to this collector. Each group belongs to one collector. Unassign a group to free it for someone else.
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
                        <p className="py-10 text-center text-sm text-gray-500">Loading groups…</p>
                    ) : (
                        <>
                            <section>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <FiLayers className="text-green-700" /> Assigned groups
                                        <span className="font-normal text-gray-500">({assignedGroups.length})</span>
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
                                {assignedGroups.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        No groups assigned yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignedGroups.map((group) => (
                                            <div
                                                key={group.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5"
                                            >
                                                <p className="truncate text-sm font-medium text-gray-900">{group.group_name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => unassignGroup(group.id)}
                                                    className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                                >
                                                    Unassign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {takenGroups.length > 0 && (
                                <section>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                        Assigned to another collector
                                        <span className="ml-2 font-normal text-gray-500">({takenGroups.length})</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {takenGroups.map((item) => (
                                            <div
                                                key={item.groupId || item.group_id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">{item.group_name}</p>
                                                    <p className="truncate text-xs text-gray-500">{item.collectorName || 'Another collector'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                    Pending groups
                                    <span className="ml-2 font-normal text-gray-500">({pendingGroups.length})</span>
                                </h3>
                                {pendingGroups.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                                        {groups.length
                                            ? 'All available groups are assigned.'
                                            : 'No groups found. Create them in Admin Settings → Manage Groups first.'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingGroups.map((group) => (
                                            <div
                                                key={group.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                                            >
                                                <p className="truncate text-sm font-medium text-gray-900">{group.group_name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => assignGroup(group.id)}
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
                        {saving ? 'Saving…' : 'Save group assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeepavaliCollectorGroupAssignmentModal;
