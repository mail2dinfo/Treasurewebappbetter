import React from 'react';

const GroupDetailsModal = ({ group, onClose }) => {
    if (!group) return null;

    const {
        groupId,
        amount,
        isGovApproved,
        auctionDate,
        groupProgress,
        groupType,
        groupSubscriberId,
        firstauctionDate
    } = group;

    const getGroupTypeColor = (type) => {
        switch (type) {
            case 'FIXED': return '#4CAF50';
            case 'ACCUMULATIVE': return '#2196F3';
            case 'DEDUCTIVE': return '#FF9800';
            case 'ADAPTIVE': return '#7C3AED';
            case 'FLEXIBLE': return '#0D9488';
            default: return '#666';
        }
    };

    const getProgressColor = (progress) => {
        switch (progress) {
            case 'INPROGRESS': return '#4CAF50';
            case 'FUTURE': return '#2196F3';
            case 'CLOSED': return '#FF9800';
            default: return '#666';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content group-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Group Details</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="group-details-content">
                        {/* Group Header */}
                        <div className="group-header-section">
                            <div className="group-title-row">
                                <h3 className="group-name">Group - ₹{amount.toLocaleString()}</h3>
                                <span
                                    className="group-type-badge"
                                    style={{ backgroundColor: getGroupTypeColor(groupType) }}
                                >
                                    {groupType}
                                </span>
                            </div>

                            {isGovApproved && (
                                <div className="gov-approved-badge">
                                    ✓ Government Approved
                                </div>
                            )}
                        </div>

                        {/* Group Information Grid */}
                        <div className="group-info-grid">
                            <div className="info-item">
                                <div className="info-label">Group ID</div>
                                <div className="info-value">{groupId}</div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Group Amount</div>
                                <div className="info-value">₹{amount.toLocaleString()}</div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Group Type</div>
                                <div className="info-value">{groupType}</div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Status</div>
                                <div
                                    className="info-value status-value"
                                    style={{ color: getProgressColor(groupProgress) }}
                                >
                                    {groupProgress}
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">First Auction Date</div>
                                <div className="info-value">
                                    {new Date(firstauctionDate).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Next Auction Date</div>
                                <div className="info-value">
                                    {new Date(auctionDate).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Subscriber ID</div>
                                <div className="info-value">{groupSubscriberId}</div>
                            </div>

                            <div className="info-item">
                                <div className="info-label">Group ID</div>
                                <div className="info-value">{groupId}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="modal-actions">
                            <button
                                className="action-btn primary-btn"
                                onClick={() => {
                                    // Navigate to full group details page
                                    window.location.href = `/chit-fund/subscriber/groups/${groupId}/${groupSubscriberId}`;
                                }}
                            >
                                View Full Details
                            </button>
                            <button
                                className="action-btn secondary-btn"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
