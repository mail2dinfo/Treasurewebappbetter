import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { formatGroupAmount, formatGroupDate, groupTypeLabel } from "./GroupListCard";

const COMMISSION_OPTIONS = [
  { value: "ONEVERYAUCTION", label: "On Every Auction" },
  { value: "LUMPSUM", label: "Lump Sum" },
];

const FREQUENCY_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
];

const toInputDate = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const normalizeCommission = (value) => {
  const v = String(value || "").toUpperCase();
  if (v === "LUMPSUM" || v === "ONETIME") return "LUMPSUM";
  return "ONEVERYAUCTION";
};

const normalizeFrequency = (value) => {
  const v = String(value || "").toUpperCase();
  if (FREQUENCY_OPTIONS.some((option) => option.value === v)) return v;
  return "MONTHLY";
};

const commissionPercentForType = (value, percent) => {
  if (normalizeCommission(value) === "LUMPSUM") return 100;
  const n = Number(percent);
  if (Number.isFinite(n) && n > 0 && n <= 100) return n;
  return 5;
};

const commissionAmountFor = (amount, commissionType, percent) =>
  Math.round((Number(amount) || 0) * commissionPercentForType(commissionType, percent) / 100);

const commissionLabel = (value) =>
  COMMISSION_OPTIONS.find((option) => option.value === normalizeCommission(value))?.label || value || "—";

const frequencyLabel = (value) =>
  FREQUENCY_OPTIONS.find((option) => option.value === normalizeFrequency(value))?.label || value || "—";

const EditNewGroupModal = ({ group, onClose, onSave, saving, error }) => {
  const type = String(group?.type || "").toUpperCase();
  const isFixed = type === "FIXED";
  const isAdaptive = type === "ADAPTIVE";
  const memberCount = Number(group?.num_subscribers) || 0;
  const subscriberLabel = isAdaptive ? "No of shares" : "No of subscribers";

  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    groupName: group?.group_name || "",
    amount: String(group?.amount ?? ""),
    noOfSubscribers: String(isFixed ? group?.tenure ?? "" : group?.no_of_subscribers ?? ""),
    commissionType: normalizeCommission(group?.commission_type),
    commissionPercent: String(
      normalizeCommission(group?.commission_type) === "LUMPSUM"
        ? 100
        : (Number(group?.commission_percentage) > 0 ? Number(group.commission_percentage) : 5)
    ),
    auctionMode: normalizeFrequency(group?.auction_mode),
    auctDate: toInputDate(group?.auct_date || group?.next_auct_date),
  });

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const original = useMemo(
    () => ({
      groupName: group?.group_name || "",
      amount: String(group?.amount ?? ""),
      noOfSubscribers: String(isFixed ? group?.tenure ?? "" : group?.no_of_subscribers ?? ""),
      commissionType: normalizeCommission(group?.commission_type),
      commissionPercent: String(
        normalizeCommission(group?.commission_type) === "LUMPSUM"
          ? 100
          : (Number(group?.commission_percentage) > 0 ? Number(group.commission_percentage) : 5)
      ),
      auctionMode: normalizeFrequency(group?.auction_mode),
      auctDate: toInputDate(group?.auct_date || group?.next_auct_date),
    }),
    [group, isFixed]
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const changes = useMemo(() => {
    const rows = [];
    if (form.groupName.trim() !== original.groupName) {
      rows.push({ label: "Group name", from: original.groupName || "—", to: form.groupName.trim() || "—" });
    }
    if (!isFixed && String(form.amount) !== String(original.amount)) {
      rows.push({
        label: "Amount",
        from: formatGroupAmount(original.amount),
        to: formatGroupAmount(form.amount),
      });
    }
    if (!isFixed && String(form.noOfSubscribers) !== String(original.noOfSubscribers)) {
      rows.push({
        label: subscriberLabel,
        from: original.noOfSubscribers || "—",
        to: form.noOfSubscribers || "—",
      });
    }
    if (form.commissionType !== original.commissionType) {
      rows.push({
        label: "Commission type",
        from: commissionLabel(original.commissionType),
        to: commissionLabel(form.commissionType),
      });
    }
    const originalPercent = commissionPercentForType(original.commissionType, original.commissionPercent);
    const nextPercent = commissionPercentForType(form.commissionType, form.commissionPercent);
    const originalCommissionAmount =
      Number(group?.commission_amount) || commissionAmountFor(original.amount, original.commissionType, originalPercent);
    const nextCommissionAmount = commissionAmountFor(form.amount, form.commissionType, nextPercent);
    if (
      Number(originalCommissionAmount) !== Number(nextCommissionAmount) ||
      form.commissionType !== original.commissionType ||
      String(originalPercent) !== String(nextPercent)
    ) {
      rows.push({
        label: "Commission amount",
        from: `${formatGroupAmount(originalCommissionAmount)} (${originalPercent}%)`,
        to: `${formatGroupAmount(nextCommissionAmount)} (${nextPercent}%)`,
      });
    }
    if (form.auctionMode !== original.auctionMode) {
      rows.push({
        label: "Auction frequency",
        from: frequencyLabel(original.auctionMode),
        to: frequencyLabel(form.auctionMode),
      });
    }
    if (form.auctDate !== original.auctDate) {
      rows.push({
        label: "Auction date",
        from: formatGroupDate(original.auctDate),
        to: formatGroupDate(form.auctDate),
      });
    }
    return rows;
  }, [form, original, isFixed, subscriberLabel, group?.commission_amount]);

  const validate = () => {
    if (!form.groupName.trim()) return "Enter a group name.";
    if (!isFixed) {
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid amount.";
      const count = Number(form.noOfSubscribers);
      if (!Number.isFinite(count) || count < 1 || Math.floor(count) !== count) {
        return `Enter a valid ${subscriberLabel.toLowerCase()}.`;
      }
      if (count < memberCount) {
        return `Cannot go below ${memberCount} member${memberCount === 1 ? "" : "s"} already added.`;
      }
    }
    if (!form.auctDate) return "Choose an auction date.";
    return null;
  };

  const goToPreview = () => {
    const message = validate();
    if (message) {
      window.alert(message);
      return;
    }
    if (changes.length === 0) {
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
        aria-labelledby="edit-group-title"
      >
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h3 id="edit-group-title" className="text-lg font-bold text-white">
            {step === "preview" ? "Confirm group changes" : "Edit group"}
          </h3>
          <p className="text-sm text-red-100">
            Group type stays {groupTypeLabel(type)}. Auction flow is not changed.
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
                  value={form.groupName}
                  onChange={(event) => setField("groupName", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:border-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Amount</span>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  readOnly={isFixed}
                  onChange={(event) => setField("amount", event.target.value)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 ${
                    isFixed ? "border-gray-200 bg-gray-100 text-gray-600" : "border-gray-300 focus:outline-none focus:border-red-500"
                  }`}
                />
                {isFixed ? (
                  <span className="text-xs text-gray-500 mt-1 block">Locked for Fixed groups so the auction table stays in sync.</span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  {isFixed ? "No of months" : subscriberLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.noOfSubscribers}
                  readOnly={isFixed}
                  onChange={(event) => setField("noOfSubscribers", event.target.value)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 ${
                    isFixed ? "border-gray-200 bg-gray-100 text-gray-600" : "border-gray-300 focus:outline-none focus:border-red-500"
                  }`}
                />
                {isFixed ? (
                  <span className="text-xs text-gray-500 mt-1 block">Locked for Fixed groups. This is months, not subscribers.</span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Commission type</span>
                <select
                  value={form.commissionType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      commissionType: nextType,
                      commissionPercent:
                        nextType === "LUMPSUM"
                          ? "100"
                          : prev.commissionType === "ONEVERYAUCTION"
                            ? prev.commissionPercent
                            : "5",
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:outline-none focus:border-red-500"
                >
                  {COMMISSION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Commission %</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.commissionPercent}
                  readOnly={form.commissionType === "LUMPSUM"}
                  onChange={(event) => setField("commissionPercent", event.target.value)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 ${
                    form.commissionType === "LUMPSUM"
                      ? "border-gray-200 bg-gray-50 text-gray-600"
                      : "border-gray-300 focus:outline-none focus:border-red-500"
                  }`}
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  {form.commissionType === "LUMPSUM"
                    ? "Lump sum is always 100% of group amount."
                    : "On every auction: enter the % of group amount taken at each auction."}
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Commission amount</span>
                <input
                  readOnly
                  value={formatGroupAmount(commissionAmountFor(form.amount, form.commissionType, form.commissionPercent))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Auction frequency</span>
                <select
                  value={form.auctionMode}
                  onChange={(event) => setField("auctionMode", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:outline-none focus:border-red-500"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Auction date</span>
                <input
                  type="date"
                  value={form.auctDate}
                  onChange={(event) => setField("auctDate", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:border-red-500"
                />
              </label>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Review these changes, then confirm. Group type and auction flow stay the same.
              </p>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {changes.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-2 px-3 py-2.5 text-sm border-b border-gray-100 last:border-b-0">
                    <span className="font-semibold text-gray-700">{row.label}</span>
                    <span className="text-gray-500 line-through">{row.from}</span>
                    <span className="font-medium text-gray-900">{row.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error ? <p className="text-sm font-medium text-red-600 mt-4">{error}</p> : null}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "form" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToPreview}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Preview changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(form)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm update"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditNewGroupModal;
