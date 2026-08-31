import moment from "moment";
import { useEffect, useRef, useState } from "react";

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
  if (!t) return "Group";
  return t.charAt(0) + t.slice(1).toLowerCase();
};

const GroupListCard = ({
  group,
  fields = [],
  primaryLabel,
  onPrimary,
  secondary,
  menuItems,
}) => {
  const type = String(group?.type || "").toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [menuOpen]);

  return (
    <article className="group-list-card">
      <div className="group-list-card-main">
        <div className="group-list-card-header">
          <div className="group-list-card-identity">
            <h4 className="group-list-card-name" title={group?.group_name || "Untitled group"}>
              {group?.group_name || "Untitled group"}
            </h4>
            <span className="group-list-card-type">{groupTypeLabel(type)}</span>
            <p className="group-list-card-amount">
              {formatGroupAmount(group?.amount)}
            </p>
          </div>
          <div className="group-list-card-header-right">
            {onPrimary ? (
              <button type="button" className="group-button" onClick={onPrimary}>
                {primaryLabel}
              </button>
            ) : null}
            {secondary}
            {menuItems?.length ? (
              <div className="group-card-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="group-card-menu-trigger"
                  aria-label="Group actions"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  ⋯
                </button>
                {menuOpen ? (
                  <div className="group-card-menu">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={item.danger ? "group-card-menu-item is-danger" : "group-card-menu-item"}
                        onClick={() => {
                          setMenuOpen(false);
                          item.onClick();
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="group-list-card-grid">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {field.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

export default GroupListCard;
