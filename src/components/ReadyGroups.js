import { useHistory } from "react-router-dom";
import moment from "moment";
import GroupListCard, {
  formatGroupDate,
  formatGroupTimeRange,
} from "./GroupListCard";

const ReadyGroups = ({ groups, selectedTab, basePath = "/chit-fund/user" }) => {
  const readyGroups = groups?.filter((group) => group.Status === "Ready") || [];
  const history = useHistory();

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
    </div>
  );
};

export default ReadyGroups;
