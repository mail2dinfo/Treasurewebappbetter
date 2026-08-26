import React, { useState, useEffect, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { useGroupDetailsContext } from "../context/group_context";
import { useUserContext } from "../context/user_context";
import { API_BASE_URL } from "../utils/apiConfig";
import "../style/AssignGroupAmountPopup.css";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const groupWord = (count) => (Number(count) === 1 ? "group" : "Groups");

const AssignGroupAmountPopup = ({
  confirmAddSubscriber,
  cancelAddSubscriber,
  subscriberName = "",
  subscriberId,
}) => {
  const { data } = useGroupDetailsContext();
  const { user } = useUserContext();
  const groupData = data;
  const currentGroupName = groupData?.results?.groupName || "";

  const [groupAmount, setGroupAmount] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionPercentage, setContributionPercentage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [groupDues, setGroupDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [groupStatus, setGroupStatus] = useState({
    inprogress: 0,
    next: 0,
    closed: 0,
  });

  useEffect(() => {
    const amount = groupData?.results?.amount || "";
    setGroupAmount(amount);
    setContributionAmount(amount);
    setContributionPercentage(100);
  }, [groupData?.results?.amount]);

  useEffect(() => {
    if (contributionAmount && groupAmount) {
      const amt = parseFloat(contributionAmount);
      const grp = parseFloat(groupAmount);
      if (!isNaN(amt) && !isNaN(grp) && grp !== 0) {
        setContributionPercentage(((amt / grp) * 100).toFixed(2));
      }
    }
  }, [contributionAmount, groupAmount]);

  useEffect(() => {
    if (!subscriberId || !user?.results?.token) return undefined;
    let cancelled = false;
    const loadDues = async () => {
      setDuesLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/subscribers/${subscriberId}`, {
          headers: { Authorization: `Bearer ${user.results.token}` },
        });
        const payload = await response.json().catch(() => ({}));
        const rows = payload?.results?.subscriberGroupDueResult || [];
        const countOf = (list) => Number(list?.[0]?.group_count || 0);
        if (!cancelled) {
          setGroupDues(Array.isArray(rows) ? rows : []);
          setGroupStatus({
            inprogress: countOf(payload?.results?.subscriberInprogressGroupResult),
            next: countOf(payload?.results?.subscriberFutureGroupResult),
            closed: countOf(payload?.results?.subscriberClosedGroupResult),
          });
        }
      } catch (error) {
        if (!cancelled) setGroupDues([]);
      } finally {
        if (!cancelled) setDuesLoading(false);
      }
    };
    loadDues();
    return () => {
      cancelled = true;
    };
  }, [subscriberId, user?.results?.token]);

  const visibleDues = useMemo(
    () => groupDues.filter((row) => Number(row.receivable_amount || 0) > 0),
    [groupDues]
  );

  const totals = useMemo(
    () =>
      visibleDues.reduce(
        (acc, row) => ({
          receivable: acc.receivable + Number(row.receivable_amount || 0),
          paid: acc.paid + Number(row.received_amount || 0),
          outstanding: acc.outstanding + Number(row.outstanding_due || 0),
        }),
        { receivable: 0, paid: 0, outstanding: 0 }
      ),
    [visibleDues]
  );

  const showDashboard =
    duesLoading ||
    visibleDues.length > 0 ||
    groupStatus.inprogress + groupStatus.next + groupStatus.closed > 0;

  const handleConfirm = async () => {
    if (!groupAmount || isNaN(groupAmount)) {
      setStatus({ ok: false, message: "Please enter a valid group amount." });
      return;
    }

    if (!contributionAmount || isNaN(contributionAmount)) {
      setStatus({ ok: false, message: "Please enter a valid contribution amount." });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      const result = await confirmAddSubscriber(contributionAmount, contributionPercentage);
      if (result && typeof result === "object" && "ok" in result) {
        setStatus(result);
      } else {
        setStatus({ ok: true, message: "Subscriber added to the group." });
      }
    } catch (error) {
      setStatus({ ok: false, message: error?.message || "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  const success = status?.ok === true;

  return (
    <div className="assign-popup-overlay">
      <div className="assign-popup-box assign-popup-wide">
        <div className="assign-popup-header">
          <div>
            <h2 className="popup-title">Assign Group Amount</h2>
            {currentGroupName ? (
              <p className="popup-header-sub">Adding to {currentGroupName}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="popup-close-x"
            onClick={cancelAddSubscriber}
            disabled={isLoading}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className="assign-popup-body">
          {status?.message ? (
            <div className={`popup-status ${success ? "success" : "error"}`} role="alert">
              {status.message}
            </div>
          ) : null}

          <div className="assign-popup-split">
            {showDashboard && (
              <div className="assign-popup-dashboard">
                {duesLoading ? (
                  <p className="popup-dues-empty">Loading payment details...</p>
                ) : (
                  <>
                    {visibleDues.length > 0 && (
                      <>
                        <p className="popup-dues-heading">
                          How this subscriber {subscriberName || "—"} is paying in past groups
                        </p>
                        <div className="popup-dues-table-wrap">
                          <table className="popup-dues-table">
                            <thead>
                              <tr>
                                <th>Group name</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Outstanding</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleDues.map((row) => (
                                <tr key={String(row.group_id || row.group_name)}>
                                  <td className="popup-dues-name">{row.group_name || "—"}</td>
                                  <td>{formatMoney(row.receivable_amount)}</td>
                                  <td className="popup-dues-paid">{formatMoney(row.received_amount)}</td>
                                  <td
                                    className={
                                      Number(row.outstanding_due || 0) > 0
                                        ? "popup-dues-due"
                                        : ""
                                    }
                                  >
                                    {formatMoney(row.outstanding_due)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td>Total</td>
                                <td>{formatMoney(totals.receivable)}</td>
                                <td>{formatMoney(totals.paid)}</td>
                                <td
                                  className={
                                    totals.outstanding > 0 ? "popup-dues-due" : ""
                                  }
                                >
                                  {formatMoney(totals.outstanding)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    )}
                    <div className="popup-status-cards">
                      <div className="popup-status-card is-progress">
                        <p className="popup-status-label">Inprogress</p>
                        <p className="popup-status-value">{groupStatus.inprogress}</p>
                        <p className="popup-status-hint">{groupWord(groupStatus.inprogress)}</p>
                      </div>
                      <div className="popup-status-card is-new">
                        <p className="popup-status-label">New</p>
                        <p className="popup-status-value">{groupStatus.next}</p>
                        <p className="popup-status-hint">{groupWord(groupStatus.next)}</p>
                      </div>
                      <div className="popup-status-card is-closed">
                        <p className="popup-status-label">Closed</p>
                        <p className="popup-status-value">{groupStatus.closed}</p>
                        <p className="popup-status-hint">{groupWord(groupStatus.closed)}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="assign-popup-form">
              {!success && (
                <>
                  <p className="popup-form-heading">Share for this group</p>
                  <div className="popup-field">
                    <label>Group Amount</label>
                    <input type="number" value={groupAmount} readOnly />
                  </div>
                  <div className="popup-field">
                    <label>Contribution Amount</label>
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                    />
                  </div>
                  <div className="popup-field">
                    <label>Contribution %</label>
                    <input type="text" value={contributionPercentage} readOnly />
                  </div>
                </>
              )}
              <div className="popup-buttons">
                {!success && (
                  <button
                    className="popup-btn confirm-btn"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Confirm"}
                  </button>
                )}
                <button
                  className="popup-btn cancel-btn"
                  onClick={cancelAddSubscriber}
                  disabled={isLoading}
                >
                  {success ? "Close" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignGroupAmountPopup;
