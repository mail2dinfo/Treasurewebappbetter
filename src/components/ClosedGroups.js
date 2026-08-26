import { useHistory } from "react-router-dom";
import GroupListCard, {
  formatGroupDate,
  formatGroupTimeRange,
} from "./GroupListCard";

const ClosedGroups = ({ groups, basePath = "/chit-fund/user" }) => {
  const closedGroups = groups?.filter((group) => group.Status === "Closed") || [];
  const history = useHistory();

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

  if (closedGroups.length === 0) {
    return (
      <div className="group-empty">
        <p className="text-base font-semibold text-gray-800">No closed groups</p>
        <p className="text-sm text-gray-500 mt-1">
          Finished groups will show up here for records and reports.
        </p>
      </div>
    );
  }

  return (
    <div className="group-wrapper">
      {closedGroups.map((group) => (
        <GroupListCard
          key={group.id}
          group={group}
          primaryLabel="View details"
          onPrimary={() => openGroup(group)}
          fields={[
            { label: "Start", value: formatGroupDate(group.start_date) },
            { label: "Closed", value: formatGroupDate(group.end_date) },
            { label: "Last auction", value: formatGroupDate(group.next_auct_date) },
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

export default ClosedGroups;
