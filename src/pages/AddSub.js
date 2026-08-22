import { useEffect, useMemo, useState } from "react";
import { useGroupDetailsContext } from "../context/group_context";
import { useCompanySubscriberContext } from "../context/companysubscriber_context";
import { useParams, useHistory, useLocation } from "react-router-dom";
import {
  FiTrash2,
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddSub = () => {
  const history = useHistory();
  const location = useLocation();
  const { groupId } = useParams();
  const basePath = location.pathname.startsWith("/chit-fund/manager")
    ? "/chit-fund/manager"
    : "/chit-fund/user";
  const { data, isLoading, fetchGroups, deleteGroupSubscriber } =
    useGroupDetailsContext();
  const { companySubscribers } = useCompanySubscriberContext();

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [query, setQuery] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [confirmSub, setConfirmSub] = useState(null);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColor = (name) =>
    `hsl(${((name || "?").charCodeAt(0) * 137.5) % 360}, 62%, 46%)`;

  useEffect(() => {
    fetchGroups(groupId);
  }, [groupId]);

  const group = data?.results || {};
  const subscribers = group.groupSubcriberResult || [];
  const groupName = group.groupName || "Group";
  const groupType = String(group.type || "").toUpperCase();
  const groupAmount = Number(group.amount || 0);

  const totalSubscribers =
    groupType === "FIXED"
      ? group.totalTenture ?? group.tenure ?? 0
      : group.noOfSubcribers ?? group.noOfSubscribers ?? 0;

  const addedSubscribers = subscribers.length;
  const outstandingSubscribers = Math.max(
    0,
    Number(totalSubscribers) - addedSubscribers
  );
  const fillPercent =
    Number(totalSubscribers) > 0
      ? Math.min(100, Math.round((addedSubscribers / Number(totalSubscribers)) * 100))
      : 0;
  const rosterComplete = outstandingSubscribers === 0 && Number(totalSubscribers) > 0;
  const actualCompanySubscriberCount = companySubscribers?.length ?? 0;

  const filteredSubscribers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((sub) => {
      const name = String(sub.name || "").toLowerCase();
      const phone = String(sub.phone || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [subscribers, query]);

  const handleOpenPopup = () => setOpen(true);
  const handleAddNewClick = () => {
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addnew`);
    setOpen(false);
  };
  const handleCompanySubscriberClick = () => {
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addcompanysubcriber`);
    setOpen(false);
  };

  const handleRemove = async (sub) => {
    setRemovingId(sub.group_subscriber_id);
    const result = await deleteGroupSubscriber(sub.group_subscriber_id, groupId);
    setRemovingId(null);
    setConfirmSub(null);
    if (result.success) {
      toast.success(result.message);
      await fetchGroups(groupId);
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading group subscribers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={() => history.goBack()}
              className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700"
            >
              <FiArrowLeft />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{groupName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {groupType && (
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {groupType.charAt(0) + groupType.slice(1).toLowerCase()}
                </span>
              )}
              {groupAmount > 0 && (
                <span>₹{groupAmount.toLocaleString("en-IN")}</span>
              )}
              <span>
                {addedSubscribers} of {totalSubscribers || "—"} members
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPopup}
            disabled={rosterComplete}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus className="w-5 h-5" />
            {rosterComplete
              ? "Roster complete"
              : `Add ${outstandingSubscribers} subscriber${outstandingSubscribers === 1 ? "" : "s"}`}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Fill progress</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                rosterComplete ? "bg-emerald-500" : "bg-gray-700"
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Capacity", value: totalSubscribers, tone: "text-slate-800" },
            { label: "Added", value: addedSubscribers, tone: "text-emerald-600" },
            {
              label: rosterComplete ? "Complete" : "Still needed",
              value: outstandingSubscribers,
              tone: rosterComplete ? "text-emerald-600" : "text-red-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className={`text-3xl font-bold ${card.tone}`}>{card.value}</div>
              <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current subscribers</h2>
              <p className="text-sm text-gray-500">
                {filteredSubscribers.length} shown
                {query ? ` for “${query}”` : ""}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or phone"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>
              <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50 self-start">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  <FiGrid /> Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1.5 ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  <FiList /> List
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {filteredSubscribers.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-3"
                }
              >
                {filteredSubscribers.map((sub) => (
                  <div
                    key={sub.group_subscriber_id}
                    className={`group rounded-2xl border border-gray-100 bg-gray-50/80 hover:bg-white hover:shadow-md hover:border-red-100 transition-all duration-200 ${
                      viewMode === "grid"
                        ? "p-5 text-center"
                        : "p-4 flex items-center gap-4"
                    }`}
                  >
                    <div
                      className={
                        viewMode === "grid"
                          ? "flex justify-center mb-3"
                          : "flex-shrink-0"
                      }
                    >
                      {sub?.user_image_from_s3 ? (
                        <img
                          src={sub.user_image_from_s3}
                          alt={sub.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-14 h-14 rounded-full border-2 border-white shadow-sm items-center justify-center text-white font-semibold ${
                          sub?.user_image_from_s3 ? "hidden" : "flex"
                        }`}
                        style={{ backgroundColor: avatarColor(sub.name) }}
                      >
                        {getInitials(sub.name)}
                      </div>
                    </div>

                    <div className={viewMode === "grid" ? "" : "flex-1 min-w-0"}>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {sub.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {sub.phone || "No phone"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfirmSub(sub)}
                      disabled={removingId === sub.group_subscriber_id}
                      className={`text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ${
                        viewMode === "grid" ? "mt-3 mx-auto" : "flex-shrink-0"
                      }`}
                      title="Remove subscriber"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <FiUsers className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {query ? "No matching subscribers" : "No subscribers yet"}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {query
                    ? "Try a different name or phone number."
                    : "Add people to this group to start collections and auctions."}
                </p>
                {!query && (
                  <button
                    type="button"
                    onClick={handleOpenPopup}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                  >
                    <FiUserPlus />
                    Add subscriber
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Add subscribers</h3>
                <p className="text-sm text-red-100">
                  {outstandingSubscribers} seat
                  {outstandingSubscribers === 1 ? "" : "s"} remaining
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid gap-3">
              <button
                type="button"
                onClick={handleAddNewClick}
                className="text-left rounded-2xl border border-gray-200 p-4 hover:border-red-300 hover:bg-red-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                    <FiUserPlus />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">New subscriber</div>
                    <div className="text-sm text-gray-500">
                      Create a person and add them to this group
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleCompanySubscriberClick}
                className="text-left rounded-2xl border border-gray-200 p-4 hover:border-red-300 hover:bg-red-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                    <FiUsers />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Company directory
                    </div>
                    <div className="text-sm text-gray-500">
                      Pick from {actualCompanySubscriberCount} existing subscriber
                      {actualCompanySubscriberCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remove subscriber?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmSub.name} will be removed from {groupName}. This does not
              delete their company profile.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmSub(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemove(confirmSub)}
                disabled={removingId === confirmSub.group_subscriber_id}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {removingId === confirmSub.group_subscriber_id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSub;
