import moment from "moment";

const typeStyles = {
  FIXED: "bg-slate-100 text-slate-700",
  ADAPTIVE: "bg-indigo-50 text-indigo-700",
  FLEXIBLE: "bg-teal-50 text-teal-800",
};

const statusStyles = {
  Ready: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  New: "bg-amber-50 text-amber-800 ring-amber-100",
  Closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

export const formatGroupAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const formatGroupDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY") : "—";
};

export const formatGroupTimeRange = (start, end) => {
  const from = start ? moment(start, "HH:mm:ss") : null;
  const to = end ? moment(end, "HH:mm:ss") : null;
  if (!from?.isValid() && !to?.isValid()) return "—";
  return `${from?.isValid() ? from.format("hh:mm A") : "—"} – ${
    to?.isValid() ? to.format("hh:mm A") : "—"
  }`;
};

export const groupTypeLabel = (type) => {
  const t = String(type || "").toUpperCase();
  if (t === "FIXED" || t === "ADAPTIVE" || t === "FLEXIBLE") {
    return t.charAt(0) + t.slice(1).toLowerCase();
  }
  return type || "Group";
};

const GroupListCard = ({
  group,
  fields = [],
  primaryLabel,
  onPrimary,
  secondary,
}) => {
  const type = String(group?.type || "").toUpperCase();
  const status = group?.Status || "";

  return (
    <article className="group-list-card">
      <div className="group-list-card-main">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                    statusStyles[status] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {status}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  typeStyles[type] || "bg-gray-100 text-gray-600"
                }`}
              >
                {groupTypeLabel(type)}
              </span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 truncate">
              {group?.group_name || "Untitled group"}
            </h4>
          </div>
          <p className="text-xl font-extrabold text-gray-900 whitespace-nowrap">
            {formatGroupAmount(group?.amount)}
          </p>
        </div>

        <div className="group-list-card-grid">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {field.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 break-words">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {(onPrimary || secondary) && (
      <div className="group-list-card-actions">
        {onPrimary && (
          <button type="button" className="group-button" onClick={onPrimary}>
            {primaryLabel}
          </button>
        )}
        {secondary}
      </div>
      )}
    </article>
  );
};

export default GroupListCard;
