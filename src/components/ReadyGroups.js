import { useState } from "react";
import { useHistory } from "react-router-dom";
import moment from "moment";
import { API_BASE_URL } from "../utils/apiConfig";
import { useUserContext } from "../context/user_context";
import GroupListCard, {
  formatGroupDate,
  formatGroupTimeRange,
} from "./GroupListCard";
import RenameReadyGroupModal from "./RenameReadyGroupModal";

const ReadyGroups = ({
  groups,
  selectedTab,
  refreshGroups,
  basePath = "/chit-fund/user",
}) => {
  const readyGroups = groups?.filter((group) => group.Status === "Ready") || [];
  const history = useHistory();
  const { user } = useUserContext();
  const [groupToRename, setGroupToRename] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMessage, setEditMessage] = useState(null);

  const remainingLabel = (nextAuctDate) => {
    const days = moment(nextAuctDate).diff(moment(), "days");
    if (!Number.isFinite(days)) return "—";
    if (days > 1) return `${days} days to go`;
    if (days === 1) return "Tomorrow";
    if (days === 0) return "Today";
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  };

  const openGroup = (group) => {
    const type = String(group?.type || "").toUpperCase();
    if (type === "ADAPTIVE") {
      history.push(`${basePath}/adaptive-groups/${group.id}`);
      return;
    }
    if (type === "FLEXIBLE") {
      history.push(`${basePath}/flexible-groups/${group.id}`);
      return;
    }
    history.push(`${basePath}/groups/${group.id}`);
  };

  const saveGroupName = async ({ groupName }) => {
    if (!groupToRename?.id) return;
    setIsSaving(true);
    setEditMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupToRename.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupName }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.error === false) {
        if (typeof refreshGroups === "function") {
          await refreshGroups();
        }
        setGroupToRename(null);
        setEditMessage(null);
      } else {
        setEditMessage(result.message || result.errors || "Failed to rename group");
      }
    } catch (error) {
      console.error("An error occurred while renaming the group:", error);
      setEditMessage("Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedTab !== "ready") return null;

  if (readyGroups.length === 0) {
    return (
      <div className="group-empty">
        <p className="text-base font-semibold text-gray-800">No ready groups</p>
        <p className="text-sm text-gray-500 mt-1">
          Groups appear here once they have enough members to run.
        </p>
      </div>
    );
  }

  return (
    <div className="group-wrapper">
      {readyGroups.map((group) => (
        <GroupListCard
          key={group.id}
          group={group}
          primaryLabel="Open group"
          onPrimary={() => openGroup(group)}
          menuItems={[
            {
              label: "Edit",
              onClick: () => {
                setEditMessage(null);
                setGroupToRename(group);
              },
            },
          ]}
          fields={[
            { label: "Start", value: formatGroupDate(group.start_date) },
            { label: "Closes", value: formatGroupDate(group.end_date) },
            { label: "Next auction", value: remainingLabel(group.next_auct_date) },
            {
              label: "Auction time",
              value: formatGroupTimeRange(group.auct_start_time, group.auct_end_time),
            },
          ]}
        />
      ))}

      {groupToRename && (
        <RenameReadyGroupModal
          group={groupToRename}
          saving={isSaving}
          error={editMessage}
          onClose={() => {
            if (isSaving) return;
            setGroupToRename(null);
            setEditMessage(null);
          }}
          onSave={saveGroupName}
        />
      )}
    </div>
  );
};

export default ReadyGroups;
