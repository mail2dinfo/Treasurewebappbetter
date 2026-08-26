import { useHistory } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiConfig";
import { useUserContext } from "../context/user_context";
import GroupListCard, {
  formatGroupDate,
  formatGroupTimeRange,
} from "./GroupListCard";

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

  const newGroups = Array.isArray(groups)
    ? groups.filter((group) => group.Status === "New")
    : [];

  const subscriberValue = (group) => {
    if (String(group.type || "").toUpperCase() === "FLEXIBLE") {
      return `${group.num_subscribers || 0} (no limit)`;
    }
    const pending = group.PendingSubscribers;
    const required = group.no_of_subscribers_required;
    if (pending == null && required == null) return "—";
    return `${pending ?? 0} of ${required ?? "—"} still needed`;
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Group deleted successfully");
        refreshGroups();
      } else {
        alert(result.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("An error occurred while deleting the group:", error);
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
          primaryLabel={canAddSubscriber ? "Add subscribers" : null}
          onPrimary={
            canAddSubscriber
              ? () => history.push(`${basePath}/addgroupsubscriber/${group.id}`)
              : undefined
          }
          secondary={
            canDeleteGroup ? (
              <button
                type="button"
                className="delete-button"
                title="Delete group"
                onClick={() => handleDeleteGroup(group.id)}
              >
                Delete
              </button>
            ) : null
          }
          fields={[
            { label: "Members", value: subscriberValue(group) },
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
    </div>
  );
};

export default NewGroups;
