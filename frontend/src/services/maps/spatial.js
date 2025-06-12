// frontend/src/services/maps/spatial.js

class SpatialService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.defaultCenter = { lat: 33.9157, lng: -84.8401 }; // Dallas, GA coordinates
    }

    map_load = async (containerId = 'map', options = {}) => {
        try {
            // Ensure Google Maps is loaded
            if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                console.error('Google Maps not loaded');
                return;
            }

            // Get map container
            const mapContainer = document.getElementById(containerId);
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }

            // Default map options
            const defaultOptions = {
                zoom: 12,
                center: this.defaultCenter,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                ...options
            };

            // Initialize map
            this.map = new google.maps.Map(mapContainer, defaultOptions);

            // Initialize any markers if data exists
            if (window.mapData && Array.isArray(window.mapData) && window.mapData.length > 0) {
                this.addMarkers(window.mapData);
            }

            return this.map;

        } catch (error) {
            console.error('Error initializing map:', error);
            throw error;
        }
    };

    addMarkers = (locations) => {
        if (!this.map) return;

        // Clear existing markers
        this.clearMarkers();

        // Add new markers
        locations.forEach(location => {
            if (location && location.lat && location.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: location.lat, lng: location.lng },
                    map: this.map,
                    title: location.title || ''
                });
                this.markers.push(marker);
            }
        });
    };

    clearMarkers = () => {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    };

    setCenter = (lat, lng) => {
        if (this.map) {
            this.map.setCenter({ lat, lng });
        }
    };

    setZoom = (zoom) => {
        if (this.map) {
            this.map.setZoom(zoom);
        }
    };
}

// Create and export singleton instance
const spatial = new SpatialService();
export default spatial;

// For legacy support (window.spatial)
if (typeof window !== 'undefined') {
    window.spatial = spatial;
}
