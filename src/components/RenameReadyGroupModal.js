import { useEffect, useMemo, useState } from "react";
import { groupTypeLabel } from "./GroupListCard";

const RenameReadyGroupModal = ({ group, onClose, onSave, saving, error }) => {
  const type = String(group?.type || "").toUpperCase();
  const originalName = group?.group_name || "";
  const [step, setStep] = useState("form");
  const [groupName, setGroupName] = useState(originalName);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nextName = groupName.trim();
  const hasChange = nextName.toUpperCase() !== String(originalName).trim().toUpperCase();

  const previewRows = useMemo(
    () =>
      hasChange
        ? [{ label: "Group name", from: originalName || "—", to: nextName || "—" }]
        : [],
    [hasChange, originalName, nextName]
  );

  const goToPreview = () => {
    if (!nextName) {
      window.alert("Enter a group name.");
      return;
    }
    if (!hasChange) {
      window.alert("No changes to save.");
      return;
    }
    setStep("preview");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-ready-group-title"
      >
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h3 id="rename-ready-group-title" className="text-lg font-bold text-white">
            {step === "preview" ? "Confirm name change" : "Rename group"}
          </h3>
          <p className="text-sm text-red-100">
            Only the group name can be changed for Ready groups.
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === "form" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Group type</span>
                <input
                  value={groupTypeLabel(type)}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Group name</span>
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:border-red-500"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {previewRows.map((row) => (
                <div key={row.label} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {row.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="line-through mr-2">{row.from}</span>
                    <span className="font-semibold text-gray-900">{row.to}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
          {error ? <p className="text-sm font-medium text-red-600 mt-4">{error}</p> : null}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "preview" ? (
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {step === "form" ? (
            <button
              type="button"
              onClick={goToPreview}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            >
              Preview change
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSave({ groupName: nextName })}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Confirm"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenameReadyGroupModal;
