import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiNavigation, FiMapPin, FiMap } from 'react-icons/fi';

const RouteMapModal = ({ isOpen, onClose, subscriberData }) => {
    console.log('🎨 RouteMapModal rendered:', { isOpen, subscriberData });

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMapType, setSelectedMapType] = useState(null); // null means show choice
    const [, setIsLoading] = useState(false);
    const isMountedRef = useRef(true);
    const timeoutRef = useRef(null);

    // Get current location
    useEffect(() => {
        console.log('📍 Location effect triggered:', { isOpen, currentLocation });

        if (isOpen && !currentLocation) {
            setIsLoadingLocation(true);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        setCurrentLocation(location);
                        setIsLoadingLocation(false);
                        setError(null);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        setError('Unable to get your current location. Please enable location services.');
                        setIsLoadingLocation(false);
                        // Use a default location (center of India)
                        setCurrentLocation({ lat: 20.5937, lng: 78.9629 });
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                setError('Geolocation is not supported by your browser');
                setIsLoadingLocation(false);
                setCurrentLocation({ lat: 20.5937, lng: 78.9629 });
            }
        }
    }, [isOpen]);

    // Load map when location is available and map type is selected
    useEffect(() => {
        isMountedRef.current = true;

        if (isOpen && currentLocation && !mapLoaded && mapRef.current && selectedMapType === 'osm') {
            loadMap();
        }

        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.off();
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                } catch (e) {
                    console.error('Error removing map:', e);
                }
            }
            setMapLoaded(false);
            setIsLoading(false);
        };
    }, [isOpen, currentLocation, selectedMapType]);

    const loadMap = () => {
        if (!isMountedRef.current || !mapRef.current || !currentLocation) {
            console.log('⚠️ Cannot load map:', {
                isMounted: isMountedRef.current,
                hasMapRef: !!mapRef.current,
                hasLocation: !!currentLocation
            });
            return;
        }

        console.log('🗺️ Starting map load...');
        setIsLoading(true);

        timeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;

            import('leaflet').then((L) => {
                if (!isMountedRef.current) return;

                try {
                    console.log('📦 Leaflet imported successfully');

                    // Fix for default markers
                    delete L.Icon.Default.prototype._getIconUrl;
                    L.Icon.Default.mergeOptions({
                        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
                        iconUrl: require('leaflet/dist/images/marker-icon.png'),
                        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
                    });

                    // Initialize map with working configuration from FixedMapPicker
                    const map = L.map(mapRef.current, {
                        preferCanvas: true,
                        zoomControl: false,
                        attributionControl: false,
                        zoomSnap: 1,
                        zoomDelta: 1,
                        wheelPxPerZoomLevel: 60,
                        doubleClickZoom: false,
                        boxZoom: false,
                        keyboard: false,
                        scrollWheelZoom: true,
                        dragging: true,
                        touchZoom: true,
                        tap: false,
                        bounceAtZoomLimits: false,
                        maxBounds: [[-90, -180], [90, 180]],
                        maxBoundsViscosity: 1.0,
                        zoomAnimation: false,
                        fadeAnimation: false,
                        markerZoomAnimation: false,
                    }).setView([currentLocation.lat, currentLocation.lng], 13);

                    // Use stable tile layer
                    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 16,
                        minZoom: 2,
                        tileSize: 256,
                        zoomOffset: 0,
                        updateWhenIdle: true,
                        updateWhenZooming: false,
                        keepBuffer: 2,
                        maxNativeZoom: 16,
                        subdomains: ['a', 'b', 'c']
                    });

                    tileLayer.addTo(map);

                    // Add custom zoom controls
                    const zoomControl = L.control.zoom({
                        position: 'topright'
                    });
                    zoomControl.addTo(map);

                    // Wait for tiles to load
                    tileLayer.on('load', () => {
                        if (isMountedRef.current) {
                            console.log('✅ Tiles loaded successfully');
                            setMapLoaded(true);
                            setIsLoading(false);
                        }
                    });

                    // Force invalidate size after a delay
                    setTimeout(() => {
                        if (map && isMountedRef.current) {
                            map.invalidateSize();
                            console.log('✅ Map size invalidated');
                        }
                    }, 200);

                    // Create custom icons
                    const createCustomIcon = (color, emoji) => {
                        return L.divIcon({
                            html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
                                <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
                            </div>`,
                            className: 'custom-map-marker',
                            iconSize: [36, 36],
                            iconAnchor: [18, 36],
                            popupAnchor: [0, -36]
                        });
                    };

                    // Add current location marker (blue)
                    const currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
                        icon: createCustomIcon('#3b82f6', '📍')
                    }).addTo(map);

                    currentMarker.bindPopup(`
                        <div style="padding: 8px;">
                            <strong style="color: #3b82f6;">📍 Your Location</strong><br/>
                            <span style="font-size: 12px; color: #666;">
                                ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}
                            </span>
                        </div>
                    `).openPopup();

                    // Add subscriber location marker (red)
                    const subscriberMarker = L.marker(
                        [subscriberData.latitude, subscriberData.longitude],
                        {
                            icon: createCustomIcon('#ef4444', '🎯')
                        }
                    ).addTo(map);

                    subscriberMarker.bindPopup(`
                        <div style="padding: 8px;">
                            <strong style="color: #ef4444;">🎯 ${subscriberData.name}</strong><br/>
                            ${subscriberData.phone ? `<span style="font-size: 12px;">📞 ${subscriberData.phone}</span><br/>` : ''}
                            <span style="font-size: 12px; color: #666;">
                                ${subscriberData.latitude.toFixed(6)}, ${subscriberData.longitude.toFixed(6)}
                            </span>
                        </div>
                    `);

                    // Draw a line between current location and subscriber
                    L.polyline(
                        [
                            [currentLocation.lat, currentLocation.lng],
                            [subscriberData.latitude, subscriberData.longitude]
                        ],
                        {
                            color: '#3b82f6',
                            weight: 3,
                            opacity: 0.7,
                            dashArray: '10, 10'
                        }
                    ).addTo(map);

                    // Fit map to show both markers
                    const bounds = L.latLngBounds([
                        [currentLocation.lat, currentLocation.lng],
                        [subscriberData.latitude, subscriberData.longitude]
                    ]);
                    map.fitBounds(bounds, { padding: [50, 50] });

                    // Calculate distance (approximate)
                    const distance = map.distance(
                        [currentLocation.lat, currentLocation.lng],
                        [subscriberData.latitude, subscriberData.longitude]
                    );
                    const distanceKm = (distance / 1000).toFixed(2);

                    // Add distance label
                    const midpoint = [
                        (currentLocation.lat + subscriberData.latitude) / 2,
                        (currentLocation.lng + subscriberData.longitude) / 2
                    ];

                    L.marker(midpoint, {
                        icon: L.divIcon({
                            html: `<div style="background: white; padding: 4px 8px; border-radius: 12px; border: 2px solid #3b82f6; font-weight: bold; color: #3b82f6; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                📏 ~${distanceKm} km
                            </div>`,
                            className: 'distance-label',
                            iconSize: [100, 30],
                            iconAnchor: [50, 15]
                        })
                    }).addTo(map);

                    mapInstanceRef.current = map;
                    console.log('✅ Map setup complete');

                } catch (error) {
                    console.error('❌ Error loading map:', error);
                    setError('Failed to load map. Please try again.');
                    setIsLoading(false);
                }
            }).catch((error) => {
                console.error('❌ Failed to import Leaflet:', error);
                setError('Failed to load map library. Please refresh and try again.');
                setIsLoading(false);
            });
        }, 300); // Small delay like FixedMapPicker
    };

    // Open in Google Maps for turn-by-turn navigation
    const openInGoogleMaps = () => {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${subscriberData.latitude},${subscriberData.longitude}`;
        window.open(mapsUrl, '_blank');
    };

    // Calculate distance
    const calculateDistance = () => {
        if (!currentLocation) return 'Calculating...';

        const R = 6371; // Earth's radius in km
        const dLat = (subscriberData.latitude - currentLocation.lat) * Math.PI / 180;
        const dLon = (subscriberData.longitude - currentLocation.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(subscriberData.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(2);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) {
        console.log('⚠️ Modal not open, returning null');
        return null;
    }

    console.log('✅ Rendering modal portal');
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <FiNavigation className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Route to Subscriber</h2>
                                <p className="text-sm text-blue-100">
                                    {subscriberData.name} {subscriberData.phone ? `• ${subscriberData.phone}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-gray-100 overflow-hidden">
                    {isLoadingLocation && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-800 font-semibold text-lg">Getting your location...</p>
                                <p className="text-sm text-gray-600 mt-2">Please allow location access in your browser</p>
                            </div>
                        </div>
                    )}

                    {error && !isLoadingLocation && (
                        <div className="absolute top-4 left-4 right-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg z-20">
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-600 text-xl">⚠️</span>
                                <p className="text-sm text-yellow-900 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Map Type Selection */}
                    {!isLoadingLocation && !selectedMapType && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white z-20 p-8 overflow-y-auto">
                            <div className="max-w-4xl w-full">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FiMap className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                                        Choose Your Navigation Map
                                    </h3>
                                    <p className="text-gray-600">Select your preferred map for navigation</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* OpenStreetMap Option */}
                                    <button
                                        onClick={() => {
                                            console.log('📍 OpenStreetMap selected');
                                            setSelectedMapType('osm');
                                        }}
                                        className="bg-white border-3 border-blue-500 rounded-2xl p-8 hover:bg-blue-50 hover:border-blue-600 transition-all hover:shadow-2xl transform hover:-translate-y-1 group"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                                <FiMap className="w-10 h-10 text-white" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-gray-900 mb-3">OpenStreetMap</h4>
                                            <p className="text-base text-gray-600 mb-4 font-medium">Interactive route preview with distance</p>
                                            <div className="space-y-3 text-sm text-left w-full bg-blue-50 rounded-lg p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Visual route overview</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Distance calculation</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Free & open-source</span>
                                                </div>
                                            </div>
                                            <div className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg group-hover:from-blue-600 group-hover:to-blue-700 transition-all shadow-md">
                                                🗺️ View Route
                                            </div>
                                        </div>
                                    </button>

                                    {/* Google Maps Option */}
                                    <button
                                        onClick={() => {
                                            console.log('🧭 Google Maps selected');
                                            setSelectedMapType('google');
                                            openInGoogleMaps();
                                        }}
                                        className="bg-white border-3 border-green-500 rounded-2xl p-8 hover:bg-green-50 hover:border-green-600 transition-all hover:shadow-2xl transform hover:-translate-y-1 group"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                                <FiNavigation className="w-10 h-10 text-white" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-gray-900 mb-3">Google Maps</h4>
                                            <p className="text-base text-gray-600 mb-4 font-medium">Full turn-by-turn navigation</p>
                                            <div className="space-y-3 text-sm text-left w-full bg-green-50 rounded-lg p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Voice navigation</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Real-time traffic</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                                                    <span className="text-gray-700 font-medium">Multiple routes</span>
                                                </div>
                                            </div>
                                            <div className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg group-hover:from-green-600 group-hover:to-green-700 transition-all shadow-md">
                                                🧭 Navigate Now
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Info Box */}
                                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <FiMapPin className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-900 mb-3 text-lg">📍 Route Information:</p>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-800">
                                                    <strong className="text-blue-700">From:</strong> Your Location {currentLocation ? `(${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})` : ''}
                                                </p>
                                                <p className="text-gray-800">
                                                    <strong className="text-green-700">To:</strong> {subscriberData.name} ({subscriberData.latitude.toFixed(4)}, {subscriberData.longitude.toFixed(4)})
                                                </p>
                                                <p className="text-gray-800">
                                                    <strong className="text-purple-700">Distance:</strong> <span className="text-xl font-bold text-purple-900">~{calculateDistance()} km</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OpenStreetMap Display */}
                    {selectedMapType === 'osm' && (
                        <div
                            ref={mapRef}
                            className="w-full h-full"
                            style={{
                                minHeight: '500px',
                                height: '100%',
                                width: '100%'
                            }}
                        />
                    )}

                    {/* Google Maps opened in new tab message */}
                    {selectedMapType === 'google' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiNavigation className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Google Maps Opened!</h3>
                                <p className="text-gray-600 mb-4">
                                    Google Maps should open in a new tab with turn-by-turn directions.
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    If it didn't open, please check your popup blocker.
                                </p>
                                <button
                                    onClick={openInGoogleMaps}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                                >
                                    <FiNavigation className="w-5 h-5" />
                                    Open Google Maps Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex-shrink-0">
                    {!selectedMapType ? (
                        // Initial state - only close button
                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <FiX className="w-5 h-5" />
                                Close
                            </button>
                        </div>
                    ) : selectedMapType === 'osm' ? (
                        // OpenStreetMap selected
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={openInGoogleMaps}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    <FiNavigation className="w-5 h-5" />
                                    Switch to Google Maps Navigation
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedMapType(null);
                                        setMapLoaded(false);
                                        if (mapInstanceRef.current) {
                                            try {
                                                mapInstanceRef.current.remove();
                                                mapInstanceRef.current = null;
                                            } catch (e) {
                                                console.error('Error removing map:', e);
                                            }
                                        }
                                    }}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <FiMap className="w-5 h-5" />
                                    Change Map
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <FiX className="w-5 h-5" />
                                    Close
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 text-center">
                                💡 Tip: Use Google Maps for turn-by-turn voice navigation
                            </p>
                        </div>
                    ) : (
                        // Google Maps selected
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setSelectedMapType(null);
                                }}
                                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <FiMap className="w-5 h-5" />
                                Back to Map Selection
                            </button>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <FiX className="w-5 h-5" />
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RouteMapModal;

