import { useState } from "react";
import { useHistory } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiConfig";
import { useUserContext } from "../context/user_context";
import GroupListCard, {
  formatGroupDate,
  formatGroupTimeRange,
} from "./GroupListCard";
import EditNewGroupModal from "./EditNewGroupModal";

const NewGroups = ({
  groups,
  selectedTab,
  refreshGroups,
  basePath = "/chit-fund/user",
  canAddSubscriber = true,
  canDeleteGroup = true,
}) => {
  const { user } = useUserContext();
  const history = useHistory();
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [editMessage, setEditMessage] = useState(null);

  const newGroups = Array.isArray(groups)
    ? groups.filter((group) => group.Status === "New")
    : [];

  const subscriberValue = (group) => {
    const added = Number(group.num_subscribers) || 0;
    if (String(group.type || "").toUpperCase() === "FLEXIBLE") {
      return `${added} joined`;
    }
    const required = group.no_of_subscribers_required;
    if (required == null || required === "") return String(added);
    return `${added} / ${required}`;
  };

  const addSubscriberLabel = (group) => {
    if (String(group.type || "").toUpperCase() === "FLEXIBLE") {
      return "Add";
    }
    const pending = Number(group.PendingSubscribers);
    if (Number.isFinite(pending) && pending > 0) {
      const count = Number.isInteger(pending) ? pending : Math.max(1, Math.round(pending));
      return `Add ${count}`;
    }
    return "Add";
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setGroupToDelete(null);
    setDeleteMessage(null);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete?.id) return;
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        await refreshGroups();
        setGroupToDelete(null);
        setDeleteMessage(null);
      } else {
        setDeleteMessage({
          ok: false,
          text: result.message || "Failed to delete group",
        });
      }
    } catch (error) {
      console.error("An error occurred while deleting the group:", error);
      setDeleteMessage({ ok: false, text: "Something went wrong while deleting." });
    } finally {
      setIsDeleting(false);
    }
  };

  const saveEditedGroup = async (form) => {
    if (!groupToEdit?.id) return;
    setIsSaving(true);
    setEditMessage(null);
    const isFixed = String(groupToEdit.type || "").toUpperCase() === "FIXED";
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupToEdit.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: form.groupName,
          amount: isFixed ? undefined : Number(form.amount),
          noOfSubscribers: isFixed ? undefined : Number(form.noOfSubscribers),
          commissionType: form.commissionType,
          commissionPercentage: Number(form.commissionPercent),
          auctionMode: form.auctionMode,
          auctDate: form.auctDate,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.error === false) {
        await refreshGroups();
        setGroupToEdit(null);
        setEditMessage(null);
      } else {
        setEditMessage(result.message || result.errors || "Failed to update group");
      }
    } catch (error) {
      console.error("An error occurred while updating the group:", error);
      setEditMessage("Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedTab !== "new") return null;

  if (newGroups.length === 0) {
    return (
      <div className="group-empty">
        <p className="text-base font-semibold text-gray-800">No new groups</p>
        <p className="text-sm text-gray-500 mt-1">
          New groups stay here until members are added and the group is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="group-wrapper">
      {newGroups.map((group) => (
        <GroupListCard
          key={group.id}
          group={group}
          primaryLabel={canAddSubscriber ? addSubscriberLabel(group) : null}
          onPrimary={
            canAddSubscriber
              ? () => history.push(`${basePath}/addgroupsubscriber/${group.id}`)
              : undefined
          }
          menuItems={[
            {
              label: "Edit",
              onClick: () => {
                setEditMessage(null);
                setGroupToEdit(group);
              },
            },
            ...(canDeleteGroup
              ? [{
                  label: "Delete",
                  danger: true,
                  onClick: () => {
                    setDeleteMessage(null);
                    setGroupToDelete(group);
                  },
                }]
              : []),
          ]}
          fields={[
            { label: "Subscribers", value: subscriberValue(group) },
            { label: "Next auction", value: formatGroupDate(group.next_auct_date) },
            {
              label: "Auction time",
              value: formatGroupTimeRange(group.auct_start_time, group.auct_end_time),
            },
            { label: "Start", value: formatGroupDate(group.start_date) },
            { label: "Closes", value: formatGroupDate(group.end_date) },
          ]}
        />
      ))}

      {groupToEdit && (
        <EditNewGroupModal
          group={groupToEdit}
          saving={isSaving}
          error={editMessage}
          onClose={() => {
            if (isSaving) return;
            setGroupToEdit(null);
            setEditMessage(null);
          }}
          onSave={saveEditedGroup}
        />
      )}

      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-group-title"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 id="delete-group-title" className="text-lg font-bold text-white">
                Delete group
              </h3>
              <p className="text-sm text-red-100">This cannot be undone</p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete this group?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-red-800">
                  {groupToDelete.group_name || "Untitled group"}
                </p>
              </div>
              {deleteMessage ? (
                <p
                  className={`text-sm font-medium mb-4 ${
                    deleteMessage.ok ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {deleteMessage.text}
                </p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteGroup}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewGroups;
