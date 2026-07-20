import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const FixedMapPicker = ({ latitude, longitude, onLocationSelect, isOpen, onClose }) => {
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const isMountedRef = useRef(true);
    const timeoutRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (latitude && longitude) {
            setSelectedPosition([latitude, longitude]);
        }
    }, [latitude, longitude]);

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

    useEffect(() => {
        isMountedRef.current = true;

        if (isOpen && mapRef.current && !mapLoaded && !isLoading) {
            loadMap();
        }

        // Cleanup when modal closes
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (mapInstanceRef.current) {
                if (mapInstanceRef.current.map) {
                    mapInstanceRef.current.map.off();
                    mapInstanceRef.current.map.remove();
                }
                mapInstanceRef.current = null;
            }
            setMapLoaded(false);
            setIsLoading(false);
        };
    }, [isOpen]);

    const loadMap = () => {
        if (!isMountedRef.current) return;
        setIsLoading(true);

        timeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            import('leaflet').then((L) => {
                if (!isMountedRef.current) return;
                try {
                    // Fix for default markers
                    delete L.Icon.Default.prototype._getIconUrl;
                    L.Icon.Default.mergeOptions({
                        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
                        iconUrl: require('leaflet/dist/images/marker-icon.png'),
                        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
                    });

                    // Create map with fixed size configuration
                    const map = L.map(mapRef.current, {
                        preferCanvas: true, // Use Canvas for better performance
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
                        // Disable all animations
                        zoomAnimation: false,
                        fadeAnimation: false,
                        markerZoomAnimation: false,
                    }).setView([latitude || 12.9716, longitude || 77.5946], 13);

                    // Use a stable tile layer
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
                            setMapLoaded(true);
                            setIsLoading(false);
                        }
                    });

                    // Add click event listener
                    map.on('click', (e) => {
                        const { lat, lng } = e.latlng;
                        setSelectedPosition([lat, lng]);

                        // Remove existing marker
                        if (mapInstanceRef.current.marker) {
                            map.removeLayer(mapInstanceRef.current.marker);
                        }

                        // Add new marker
                        const marker = L.marker([lat, lng]).addTo(map);
                        marker.bindPopup(`
                            <div style="text-align: center; font-family: Arial, sans-serif; min-width: 150px;">
                                <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Selected Location</p>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Lat: ${lat.toFixed(6)}</p>
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Lng: ${lng.toFixed(6)}</p>
                                <button onclick="window.selectLocation(${lat}, ${lng})" 
                                        style="margin: 0; padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    Select This Location
                                </button>
                            </div>
                        `).openPopup();

                        mapInstanceRef.current.marker = marker;
                    });

                    // Prevent any resize events
                    map.off('resize');

                    // Force fixed size
                    const container = mapRef.current;
                    if (container) {
                        container.style.height = '400px';
                        container.style.width = '100%';
                        container.style.maxHeight = '400px';
                        container.style.minHeight = '400px';
                    }

                    mapInstanceRef.current = { map, marker: null, tileLayer, zoomControl };

                } catch (error) {
                    console.error('Error loading map:', error);
                    if (isMountedRef.current) {
                        setIsLoading(false);
                    }
                }
            }).catch((error) => {
                console.error('Error importing Leaflet:', error);
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            });
        }, 300);
    };

    // Global function for popup button
    useEffect(() => {
        window.selectLocation = (lat, lng) => {
            onLocationSelect(lat, lng);
            onClose();
        };

        return () => {
            delete window.selectLocation;
        };
    }, [onLocationSelect, onClose]);

    const handleConfirmLocation = () => {
        if (selectedPosition) {
            onLocationSelect(selectedPosition[0], selectedPosition[1]);
            onClose();
        }
    };

    const handleSearchAddress = async () => {
        if (!searchQuery.trim()) {
            alert('Please enter an address to search');
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'TreasureApp/1.0'
                    }
                }
            );

            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);

                setSelectedPosition([latNum, lonNum]);

                // Move map to location
                if (mapInstanceRef.current && mapInstanceRef.current.map) {
                    mapInstanceRef.current.map.setView([latNum, lonNum], 15);

                    // Remove existing marker
                    if (mapInstanceRef.current.marker) {
                        mapInstanceRef.current.map.removeLayer(mapInstanceRef.current.marker);
                    }

                    // Add new marker
                    import('leaflet').then((L) => {
                        const marker = L.marker([latNum, lonNum]).addTo(mapInstanceRef.current.map);
                        marker.bindPopup(`
                            <div style="text-align: center; font-family: Arial, sans-serif; min-width: 150px;">
                                <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Found Location</p>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Lat: ${latNum.toFixed(6)}</p>
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Lng: ${lonNum.toFixed(6)}</p>
                            </div>
                        `).openPopup();
                        mapInstanceRef.current.marker = marker;
                    });
                }

                alert(`✅ Location found: ${data[0].display_name}`);
            } else {
                alert('❌ Location not found. Try a different address.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('❌ Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    if (!isOpen) return null;

    // Render modal using Portal to escape parent container constraints
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onMouseMove={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-xl">📍</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Select Location</h2>
                                <p className="text-red-100 text-sm">Search address or click on the map</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <span className="text-white text-lg">×</span>
                        </button>
                    </div>

                    {/* Address Search Bar */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                            placeholder="Enter address to search (e.g., MG Road, Bangalore)"
                            className="flex-1 px-4 py-2 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                        />
                        <button
                            onClick={handleSearchAddress}
                            disabled={isSearching}
                            className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2"
                        >
                            {isSearching ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    🔍 Search
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Map Container - Fixed Size */}
                <div className="relative" style={{ height: '400px', width: '100%' }}>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-b-2xl z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading map...</p>
                            </div>
                        </div>
                    )}
                    <div
                        ref={mapRef}
                        style={{
                            height: '400px',
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '0 0 1rem 1rem',
                            maxHeight: '400px',
                            minHeight: '400px'
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {selectedPosition ? (
                                <div>
                                    <p className="font-semibold">Selected Coordinates:</p>
                                    <p>Latitude: {parseFloat(selectedPosition[0]).toFixed(6)}</p>
                                    <p>Longitude: {parseFloat(selectedPosition[1]).toFixed(6)}</p>
                                </div>
                            ) : (
                                <p>Click on the map to select a location</p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLocation}
                                disabled={!selectedPosition}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default React.memo(FixedMapPicker);

