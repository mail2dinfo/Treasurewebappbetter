import React, { useState, useEffect } from 'react';
import { useAobContext } from '../context/aob_context';
import { useUserContext } from '../context/user_context';
import { useCollectorAreaContext } from '../context/collectorArea_context';
import { toast, ToastContainer } from 'react-toastify';
import { API_BASE_URL } from '../utils/apiConfig';
import 'react-toastify/dist/ReactToastify.css';

const CollectorDashboardModal = ({ isOpen, onClose, collector, signedUrls = {}, initialTab = 'assign' }) => {
    console.log('CollectorDashboardModal props:', { isOpen, collector });

    const { aobs } = useAobContext();
    const { user } = useUserContext();
    const {
        assignedAreas,
        isLoading,
        error,
        fetchCollectorAreas,
        assignAreasToCollector,
        removeCollectorArea
    } = useCollectorAreaContext();

    const [activeTab, setActiveTab] = useState('assign');
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);

    // Receivables state
    const [receivables, setReceivables] = useState([]);
    const [isLoadingReceivables, setIsLoadingReceivables] = useState(false);
    const [receivablesError, setReceivablesError] = useState(null);

    useEffect(() => {
        if (isOpen) setActiveTab(initialTab);
    }, [isOpen, collector?.id, initialTab]);

    useEffect(() => {
        if (isOpen && collector?.id) {
            console.log('=== MODAL DEBUG ===');
            console.log('Modal opened for collector:', collector);
            console.log('Collector ID:', collector.id);
            console.log('Collector user_image:', collector.user_image);
            console.log('Collector keys:', Object.keys(collector));
            console.log('Fetching collector areas...');
            fetchCollectorAreas(collector.id);
        }
    }, [isOpen, collector?.id]); // Removed fetchCollectorAreas from dependencies


    // Debug state changes
    useEffect(() => {
        console.log('=== STATE DEBUG ===');
        console.log('isLoading:', isLoading);
        console.log('error:', error);
        console.log('assignedAreas:', assignedAreas);
        console.log('assignedAreas length:', assignedAreas?.length);
    }, [isLoading, error, assignedAreas]);

    // Debug receivables state
    useEffect(() => {
        console.log('🔍 Receivables state changed:', {
            receivables: receivables,
            receivablesLength: receivables?.length,
            isLoadingReceivables: isLoadingReceivables,
            receivablesError: receivablesError
        });
    }, [receivables, isLoadingReceivables, receivablesError]);

    // Fetch collector receivables
    const fetchCollectorReceivables = async () => {
        if (!collector?.id) {
            console.log('❌ No collector ID available');
            return;
        }

        console.log('🔄 Fetching receivables for collector:', collector.id);
        console.log('🔄 API URL:', `${API_BASE_URL}/collector-area/${collector.id}/receivables`);

        setIsLoadingReceivables(true);
        setReceivablesError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/collector-area/${collector.id}/receivables`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                },
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Collector receivables response:', data);
                console.log('✅ Data success:', data.success);
                console.log('✅ Data error:', data.error);
                console.log('✅ Receivables array:', data.results?.receivables);
                console.log('✅ Receivables length:', data.results?.receivables?.length);

                // Check for success (either data.success === true OR data.error === false)
                if (data.success === true || data.error === false) {
                    const receivablesData = data.results?.receivables || [];
                    console.log('✅ Setting receivables:', receivablesData);
                    setReceivables(receivablesData);
                    setReceivablesError(null);
                } else {
                    console.log('❌ API returned success: false or error: true');
                    setReceivablesError(data.message || 'Failed to fetch receivables');
                    setReceivables([]);
                }
            } else {
                console.log('❌ Response not ok, status:', response.status);
                const errorData = await response.json();
                console.log('❌ Error data:', errorData);
                setReceivablesError(errorData.message || 'Failed to fetch receivables');
                setReceivables([]);
            }
        } catch (error) {
            console.error('❌ Network error fetching collector receivables:', error);
            setReceivablesError('Network error while fetching receivables');
            setReceivables([]);
        } finally {
            setIsLoadingReceivables(false);
            console.log('🏁 Finished fetching receivables');
        }
    };

    // Fetch receivables when dashboard tab is active
    useEffect(() => {
        console.log('🔍 useEffect triggered:', {
            isOpen,
            collectorId: collector?.id,
            activeTab,
            shouldFetch: isOpen && collector?.id && activeTab === 'dashboard'
        });

        if (isOpen && collector?.id && activeTab === 'dashboard') {
            console.log('🚀 Triggering fetchCollectorReceivables');
            fetchCollectorReceivables();
        }
    }, [isOpen, collector?.id, activeTab]);

    const showToast = (type, message) => {
        switch (type) {
            case 'success':
                toast.success(message, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            case 'error':
                toast.error(message, {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            case 'warning':
                toast.warning(message, {
                    position: "top-right",
                    autoClose: 3500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            default:
                toast.info(message, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
        }
    };

    const handleAreaSelect = (areaId) => {
        setSelectedAreas(prev =>
            prev.includes(areaId)
                ? prev.filter(id => id !== areaId)
                : [...prev, areaId]
        );
    };

    const handleAssignAreas = async () => {
        if (selectedAreas.length === 0) {
            showToast('warning', 'Please select at least one area to assign');
            return;
        }

        setIsAssigning(true);
        try {
            const result = await assignAreasToCollector(collector.id, selectedAreas);

            if (result.success) {
                showToast('success', result.message);
                setSelectedAreas([]);
                // Refresh the assigned areas
                await fetchCollectorAreas(collector.id);
            } else {
                if (result.isDuplicate) {
                    showToast('warning', result.message);
                } else {
                    showToast('error', result.message);
                }
            }
        } catch (error) {
            showToast('error', 'Failed to assign areas');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveArea = async (areaId) => {
        try {
            const result = await removeCollectorArea(collector.id, areaId);
            if (result.success) {
                showToast('success', 'Area removed successfully');
                // Refresh the assigned areas
                await fetchCollectorAreas(collector.id);
            } else {
                showToast('error', result.message || 'Failed to remove area');
            }
        } catch (error) {
            showToast('error', 'Failed to remove area');
        }
    };

    const availableAreas = aobs?.filter(aob =>
        !assignedAreas?.some(assigned => assigned.area_id === aob.id)
    ) || [];

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-wrapper"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
            ></div>

            {/* Modal */}
            <div
                className="modal-content"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                    zIndex: 1001,
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    background: '#dc2626',
                    color: 'white',
                    padding: '16px 20px',
                    margin: '-20px -20px 20px -20px',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Collector Image */}
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.2)'
                        }}>
                            {signedUrls[collector?.user_image] ? (
                                <img
                                    src={signedUrls[collector.user_image]}
                                    alt={collector?.name || 'Collector'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        console.log('Image failed to load:', signedUrls[collector.user_image]);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: signedUrls[collector?.user_image] ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {collector?.name ? collector.name.charAt(0).toUpperCase() :
                                    collector?.firstname ? collector.firstname.charAt(0).toUpperCase() : 'C'}
                            </div>
                        </div>

                        {/* Collector Info */}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'white' }}>
                                Collector Dashboard
                            </h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'white', opacity: 0.9 }}>
                                {collector?.name || `${collector?.firstname || ''} ${collector?.lastname || ''}`.trim()}
                            </p>
                            {collector?.email && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'white', opacity: 0.8 }}>
                                    {collector.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
                    <div style={{ display: 'flex' }}>
                        <button
                            onClick={() => setActiveTab('assign')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                background: activeTab === 'assign' ? '#fef2f2' : 'transparent',
                                color: activeTab === 'assign' ? '#dc2626' : '#6b7280',
                                borderBottom: activeTab === 'assign' ? '2px solid #dc2626' : '2px solid transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Assign Areas
                        </button>
                        <button
                            onClick={() => setActiveTab('assigned')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                background: activeTab === 'assigned' ? '#fef2f2' : 'transparent',
                                color: activeTab === 'assigned' ? '#dc2626' : '#6b7280',
                                borderBottom: activeTab === 'assigned' ? '2px solid #dc2626' : '2px solid transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Assigned Areas
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                background: activeTab === 'dashboard' ? '#fef2f2' : 'transparent',
                                color: activeTab === 'dashboard' ? '#dc2626' : '#6b7280',
                                borderBottom: activeTab === 'dashboard' ? '2px solid #dc2626' : '2px solid transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'assign' && (
                    <div>
                        {/* Available Areas Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                                Available Areas ({availableAreas.length})
                            </h3>

                            {availableAreas.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                    <p>All areas are already assigned to this collector</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                    {availableAreas.map((area) => (
                                        <div
                                            key={area.id}
                                            onClick={() => handleAreaSelect(area.id)}
                                            style={{
                                                border: selectedAreas.includes(area.id) ? '2px solid #dc2626' : '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                cursor: 'pointer',
                                                background: selectedAreas.includes(area.id) ? '#fef2f2' : 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: selectedAreas.includes(area.id) ? '2px solid #dc2626' : '2px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    background: selectedAreas.includes(area.id) ? '#dc2626' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {selectedAreas.includes(area.id) && (
                                                        <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{area.aob}</h4>
                                                    {area.description && (
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>{area.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Areas Summary */}
                        {selectedAreas.length > 0 && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: '500', color: '#991b1b' }}>
                                            {selectedAreas.length} area(s) selected
                                        </h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#b91c1c' }}>
                                            {selectedAreas.map(id => {
                                                const area = availableAreas.find(a => a.id === id);
                                                return area?.aob;
                                            }).join(', ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAssignAreas}
                                        disabled={isAssigning}
                                        style={{
                                            background: '#dc2626',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: isAssigning ? 'not-allowed' : 'pointer',
                                            opacity: isAssigning ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isAssigning ? 'Assigning...' : 'Assign Areas'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assigned' && (
                    <div>
                        {/* Assigned Areas Section */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                    Assigned Areas ({assignedAreas?.length || 0})
                                </h3>
                                <button
                                    onClick={() => {
                                        console.log('Manual refresh clicked');
                                        fetchCollectorAreas(collector.id);
                                    }}
                                    disabled={isLoading}
                                    style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.5 : 1,
                                        fontSize: '14px'
                                    }}
                                >
                                    {isLoading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>

                            {error ? (
                                <div style={{ textAlign: 'center', padding: '32px' }}>
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
                                        <p style={{ color: '#991b1b', fontWeight: '500', margin: '0 0 8px 0' }}>Error loading areas</p>
                                        <p style={{ color: '#b91c1c', fontSize: '14px', margin: '0 0 12px 0' }}>{error}</p>
                                        <button
                                            onClick={() => fetchCollectorAreas(collector.id)}
                                            style={{
                                                background: '#dc2626',
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div style={{ textAlign: 'center', padding: '32px' }}>
                                    <p style={{ color: '#6b7280' }}>Loading assigned areas...</p>
                                </div>
                            ) : assignedAreas?.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                    <p>No areas assigned to this collector yet</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                    {assignedAreas.map((assignment) => (
                                        <div key={assignment.id} style={{
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            background: 'white'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{assignment.aob}</h4>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                                                        Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveArea(assignment.area_id)}
                                                    style={{
                                                        color: '#dc2626',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px'
                                                    }}
                                                    title="Remove area"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <div>
                        {/* Check if collector has assigned areas */}
                        {assignedAreas?.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }}>📍</div>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                    No Areas Assigned
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                    This collector doesn't have any areas assigned yet. Please assign areas first to view receivables.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Collection Summary Dashboard */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                                        Collection Summary
                                    </h3>

                                    {/* Loading State */}
                                    {isLoadingReceivables ? (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '40px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading receivables...</div>
                                        </div>
                                    ) : receivablesError ? (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '16px', color: '#dc2626', marginBottom: '8px' }}>⚠️ Error</div>
                                            <div style={{ fontSize: '14px', color: '#6b7280' }}>{receivablesError}</div>
                                        </div>
                                    ) : receivables?.length === 0 ? (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '40px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }}>💰</div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                                No Receivables Found
                                            </h3>
                                            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                                There are no pending receivables for this collector's assigned areas.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Summary Cards with Real Data */
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: '16px'
                                        }}>
                                            {(() => {
                                                const totalReceivable = receivables.reduce((sum, rec) => sum + (rec.rbtotal || 0), 0);
                                                const totalPaid = receivables.reduce((sum, rec) => sum + (rec.rbpaid || 0), 0);
                                                const totalPending = receivables.reduce((sum, rec) => sum + (rec.rbdue || 0), 0);
                                                const collectionRate = totalReceivable > 0 ? Math.round((totalPaid / totalReceivable) * 100) : 0;

                                                return (
                                                    <>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Total Amount</div>
                                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                                                                ₹{totalReceivable.toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Collected</div>
                                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                                                                ₹{totalPaid.toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Pending</div>
                                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>
                                                                ₹{totalPending.toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Collection Rate</div>
                                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>
                                                                {collectionRate}%
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Area-wise Collection Details */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                            Area-wise Collection Details
                                        </h3>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            {assignedAreas?.length || 0} areas assigned
                                        </div>
                                    </div>

                                    {receivables?.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                            <p>No receivables found for assigned areas</p>
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            maxHeight: '400px',
                                            overflowY: 'auto'
                                        }}>
                                            {/* Table Header */}
                                            <div style={{
                                                background: '#f9fafb',
                                                padding: '12px 16px',
                                                borderBottom: '1px solid #e5e7eb',
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                                gap: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 10
                                            }}>
                                                <div>Area Name</div>
                                                <div style={{ textAlign: 'center' }}>Total</div>
                                                <div style={{ textAlign: 'center' }}>Collected</div>
                                                <div style={{ textAlign: 'center' }}>Pending</div>
                                                <div style={{ textAlign: 'center' }}>Progress</div>
                                            </div>

                                            {/* Table Rows - Group receivables by area */}
                                            <div>
                                                {(() => {
                                                    // Group receivables by area
                                                    const areaGroups = receivables.reduce((groups, rec) => {
                                                        const areaName = rec.aob || 'Unknown Area';
                                                        if (!groups[areaName]) {
                                                            groups[areaName] = [];
                                                        }
                                                        groups[areaName].push(rec);
                                                        return groups;
                                                    }, {});

                                                    return Object.entries(areaGroups).map(([areaName, areaReceivables], areaIndex) => {
                                                        const totalAmount = areaReceivables.reduce((sum, rec) => sum + (rec.rbtotal || 0), 0);
                                                        const collectedAmount = areaReceivables.reduce((sum, rec) => sum + (rec.rbpaid || 0), 0);
                                                        const pendingAmount = areaReceivables.reduce((sum, rec) => sum + (rec.rbdue || 0), 0);
                                                        const progressPercentage = totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0;

                                                        return (
                                                            <div key={areaName} style={{
                                                                padding: '12px 16px',
                                                                borderBottom: areaIndex < Object.keys(areaGroups).length - 1 ? '1px solid #f3f4f6' : 'none',
                                                                display: 'grid',
                                                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                                                gap: '12px',
                                                                alignItems: 'center',
                                                                fontSize: '14px',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                            >
                                                                <div>
                                                                    <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                                                                        {areaName}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                        {areaReceivables.length} customer{areaReceivables.length !== 1 ? 's' : ''}
                                                                    </div>
                                                                </div>

                                                                <div style={{ textAlign: 'center', fontWeight: '600', color: '#dc2626' }}>
                                                                    ₹{totalAmount.toLocaleString()}
                                                                </div>

                                                                <div style={{ textAlign: 'center', fontWeight: '600', color: '#059669' }}>
                                                                    ₹{collectedAmount.toLocaleString()}
                                                                </div>

                                                                <div style={{ textAlign: 'center', fontWeight: '600', color: '#d97706' }}>
                                                                    ₹{pendingAmount.toLocaleString()}
                                                                </div>

                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{
                                                                        background: '#e5e7eb',
                                                                        height: '6px',
                                                                        borderRadius: '3px',
                                                                        overflow: 'hidden',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        <div style={{
                                                                            background: progressPercentage >= 80 ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)' :
                                                                                progressPercentage >= 60 ? 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)' :
                                                                                    'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                                                                            height: '100%',
                                                                            width: `${progressPercentage}%`,
                                                                            borderRadius: '3px'
                                                                        }}></div>
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                                        {progressPercentage}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </>
    );
};

export default CollectorDashboardModal;