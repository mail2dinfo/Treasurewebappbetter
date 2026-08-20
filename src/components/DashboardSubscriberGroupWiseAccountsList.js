import React, { useState, useEffect, useMemo } from 'react';
import { FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import { useUserContext } from '../context/user_context';
import '../style/DashboardSubscriberGroupWiseAccounts.css';

const DashboardSubscriberGroupWiseAccountsList = ({ items = [] }) => {
    const { user } = useUserContext();
    const userCompany = user?.results?.userCompany;

    const [pdfData, setPdfData] = useState(null);
    const [subscriberFilter, setSubscriberFilter] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [filteredItems, setFilteredItems] = useState(items);

    const groupOptions = useMemo(() => {
        const map = new Map();
        items.forEach((item) => {
            const name = String(item.group_name || '').trim();
            if (!name) return;
            const key = item.group_id != null ? String(item.group_id) : name.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { key, label: name, count: 0 });
            }
            map.get(key).count += 1;
        });
        return [...map.values()].sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        );
    }, [items]);

    useEffect(() => {
        if (
            selectedGroup !== 'all'
            && !groupOptions.some((g) => g.key === selectedGroup)
        ) {
            setSelectedGroup('all');
        }
    }, [groupOptions, selectedGroup]);

    useEffect(() => {
        const subFilter = subscriberFilter.toLowerCase().trim();

        const filtered = items.filter((item) => {
            const subscriber = item.subscriber_name?.toLowerCase() || '';
            const matchesSubscriber = !subFilter || subscriber.includes(subFilter);

            let matchesGroup = true;
            if (selectedGroup !== 'all') {
                const itemKey = item.group_id != null
                    ? String(item.group_id)
                    : String(item.group_name || '').trim().toLowerCase();
                matchesGroup = itemKey === selectedGroup;
            }

            return matchesSubscriber && matchesGroup;
        });

        setFilteredItems(filtered);
    }, [subscriberFilter, selectedGroup, items]);

    const columnTotals = filteredItems.reduce(
        (acc, item) => ({
            total: acc.total + Number(item.receivable_amount || 0),
            paid: acc.paid + Number(item.received_amount || 0),
            outstanding: acc.outstanding + Number(item.outstanding_due || 0),
        }),
        { total: 0, paid: 0, outstanding: 0 }
    );

    const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN');

    const selectedGroupLabel =
        selectedGroup === 'all'
            ? 'All Groups'
            : (groupOptions.find((g) => g.key === selectedGroup)?.label || 'Selected Group');

    const handleGeneratePDF = () => {
        const formattedData = filteredItems.map((item) => ({
            subscriber_name: item.subscriber_name,
            group_name: item.group_name,
            phone: item.phone,
            receivable_amount: item.receivable_amount,
            received_amount: item.received_amount,
            outstanding_due: item.outstanding_due,
        }));
        if (formattedData.length > 0) {
            formattedData.push({
                subscriber_name: 'Total',
                group_name: '',
                phone: '',
                receivable_amount: columnTotals.total,
                received_amount: columnTotals.paid,
                outstanding_due: columnTotals.outstanding,
            });
        }
        setPdfData(formattedData);
    };

    const generateFileName = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        const groupSlug = selectedGroup === 'all'
            ? 'AllGroups'
            : selectedGroupLabel.replace(/[^\w]+/g, '_');
        return `SubscriberGroupWise_Receivable_${groupSlug}_${formatted}.pdf`;
    };

    const handleClearFilters = () => {
        setSubscriberFilter('');
        setSelectedGroup('all');
    };

    return (
        <div className="subscriber-groupwise-wrapper">
            <div className="subscriber-groupwise-header">
                <div className="filter-section">
                    <select
                        className="group-select"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        aria-label="Select group"
                    >
                        <option value="all">All Groups ({items.length})</option>
                        {groupOptions.map((group) => (
                            <option key={group.key} value={group.key}>
                                {group.label} ({group.count})
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Filter by Subscriber Name"
                        value={subscriberFilter}
                        onChange={(e) => setSubscriberFilter(e.target.value)}
                    />
                    <button className="clear-filter-btn" type="button" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                </div>

                <div className="download-section">
                    {pdfData ? (
                        <PDFDownloadLink
                            document={
                                <Mypdf
                                    tableData={pdfData}
                                    tableHeaders={[
                                        { title: 'Subscriber', value: 'subscriber_name' },
                                        { title: 'Group Name', value: 'group_name' },
                                        { title: 'Phone', value: 'phone' },
                                        { title: 'Total', value: 'receivable_amount' },
                                        { title: 'Paid', value: 'received_amount' },
                                        { title: 'Due', value: 'outstanding_due' },
                                    ]}
                                    heading={`Subscriber Groupwise Receivable — ${selectedGroupLabel}`}
                                    companyData={userCompany}
                                />
                            }
                            fileName={generateFileName()}
                        >
                            {({ loading }) =>
                                loading ? (
                                    'Loading...'
                                ) : (
                                    <button
                                        className="download-btn"
                                        type="button"
                                        onClick={() => setTimeout(() => setPdfData(null), 500)}
                                    >
                                        <FiDownload /> Download PDF
                                    </button>
                                )
                            }
                        </PDFDownloadLink>
                    ) : (
                        <button className="download-btn" type="button" onClick={handleGeneratePDF}>
                            <FiDownload /> Generate PDF
                        </button>
                    )}
                </div>
            </div>

            <div className="group-tabs-row" role="tablist" aria-label="Select group">
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedGroup === 'all'}
                    className={`group-tab ${selectedGroup === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedGroup('all')}
                >
                    All Groups
                    <span className="group-tab-count">{items.length}</span>
                </button>
                {groupOptions.map((group) => (
                    <button
                        key={group.key}
                        type="button"
                        role="tab"
                        aria-selected={selectedGroup === group.key}
                        className={`group-tab ${selectedGroup === group.key ? 'active' : ''}`}
                        onClick={() => setSelectedGroup(group.key)}
                        title={group.label}
                    >
                        {group.label}
                        <span className="group-tab-count">{group.count}</span>
                    </button>
                ))}
            </div>

            <p className="group-selection-hint">
                Showing receivables for: <strong>{selectedGroupLabel}</strong>
                {' · '}
                {filteredItems.length} record{filteredItems.length === 1 ? '' : 's'}
            </p>

            <div className="subscriber-groupwise-list">
                <div className="subscriber-groupwise-header-row recv-header-row">
                    <p>Subscriber</p>
                    <p>Total</p>
                    <p>Paid</p>
                    <p>Outstanding</p>
                </div>

                {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => {
                        const dueHigh = Number(item.outstanding_due) > 0;
                        return (
                            <article
                                className={`recv-row ${dueHigh ? '' : 'is-paid'}`}
                                key={`${item.subscriber_id || index}-${item.group_id || item.group_name || index}`}
                            >
                                <div className="recv-identity">
                                    <p className="recv-name">{item.subscriber_name || '—'}</p>
                                    <p className="recv-meta">
                                        <span>{item.group_name || '—'}</span>
                                        {item.phone ? <span>{item.phone}</span> : null}
                                    </p>
                                </div>
                                <div className="recv-amounts">
                                    <div className="recv-amt">
                                        <span>Total</span>
                                        <strong>₹{formatAmount(item.receivable_amount)}</strong>
                                    </div>
                                    <div className="recv-amt">
                                        <span>Paid</span>
                                        <strong>₹{formatAmount(item.received_amount)}</strong>
                                    </div>
                                    <div className={`recv-amt ${dueHigh ? 'is-due' : ''}`}>
                                        <span>Due</span>
                                        <strong>₹{formatAmount(item.outstanding_due)}</strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p className="no-results">No matching records found.</p>
                )}

                {filteredItems.length > 0 && (
                    <article className="recv-row recv-total">
                        <div className="recv-identity">
                            <p className="recv-name">Total</p>
                            <p className="recv-meta">{filteredItems.length} record{filteredItems.length === 1 ? '' : 's'}</p>
                        </div>
                        <div className="recv-amounts">
                            <div className="recv-amt">
                                <span>Total</span>
                                <strong>₹{formatAmount(columnTotals.total)}</strong>
                            </div>
                            <div className="recv-amt">
                                <span>Paid</span>
                                <strong>₹{formatAmount(columnTotals.paid)}</strong>
                            </div>
                            <div className="recv-amt is-due">
                                <span>Due</span>
                                <strong>₹{formatAmount(columnTotals.outstanding)}</strong>
                            </div>
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
};

export default DashboardSubscriberGroupWiseAccountsList;
