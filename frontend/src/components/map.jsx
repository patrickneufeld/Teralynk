// frontend/src/components/Map.jsx

import React, { useEffect, useState } from 'react';
import spatial from '../services/maps/spatial';

const Map = ({ containerId = 'map', options = {} }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const initializeMap = async () => {
            try {
                setIsLoading(true);
                
                // Check if Google Maps is loaded
                if (!window.google || !window.google.maps) {
                    throw new Error('Google Maps not loaded');
                }

                await spatial.map_load(containerId, options);
                
                if (mounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Map initialization error:', err);
                if (mounted) {
                    setError(err.message);
                    setIsLoading(false);
                }
            }
        };

        // Wait for Google Maps to load
        if (window.google && window.google.maps) {
            initializeMap();
        } else {
            // Add listener for Google Maps loading
            window.initMap = initializeMap;
        }

        return () => {
            mounted = false;
            if (spatial.map) {
                spatial.clearMarkers();
            }
        };
    }, [containerId, options]);

    if (error) {
        return (
            <div className="map-error" style={{ padding: '20px', textAlign: 'center' }}>
                Error loading map: {error}
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div className="map-loading" style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                }}>
                    Loading map...
                </div>
            )}
            <div 
                id={containerId} 
                style={{ 
                    width: '100%', 
                    height: '400px',
                    position: 'relative'
                }} 
            />
        </>
    );
};

export default Map;
