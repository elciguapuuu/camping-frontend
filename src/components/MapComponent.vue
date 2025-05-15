<template>
  <div class="map-wrapper">
    <div :id="mapId" class="map-container"></div>
  </div>
</template>

<script>
/* eslint-disable */ 
export default {
  name: 'MapComponent',
  props: {
    locations: { // Changed from latitude/longitude to an array of locations
      type: Array,
      required: true,
      default: () => []
    },
    zoom: {
      type: Number,
      default: 6 // Default zoom, will be adjusted by fitBounds or setView for single marker
    },
    mapId: {
      type: String,
      default: 'map'
    }
  },
  data() {
    return {
      map: null,
      markerLayerGroup: null // To hold all markers
    };
  },
  mounted() {
    this.initMap();
  },
  watch: {
    locations: {
      handler(newLocations) {
        this.updateMarkers(newLocations);
      },
      deep: true // Watch for changes within the array objects
    }
  },
  methods: {
    initMap() {
      setTimeout(() => {
        try {
          if (this.map) { // If map already exists, remove it before re-initializing
            this.map.remove();
            this.map = null;
          }
          this.map = L.map(this.mapId).setView([46.603354, 1.888334], this.zoom); // Default center (e.g., France)

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);

          this.markerLayerGroup = L.layerGroup().addTo(this.map);
          this.updateMarkers(this.locations);

          setTimeout(() => {
            if (this.map) this.map.invalidateSize();
          }, 100);

        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 200); // Delay to ensure DOM is ready
    },
    updateMarkers(locationsToDisplay) {
      if (!this.map || !this.markerLayerGroup) {
        return;
      }

      this.markerLayerGroup.clearLayers(); // Clear existing markers

      if (!locationsToDisplay || locationsToDisplay.length === 0) {
        return;
      }

      const markers = [];
      locationsToDisplay.forEach(location => {
        if (location.latitude != null && location.longitude != null) {
          const marker = L.marker([location.latitude, location.longitude]);
          
          let popupContent = `<strong>${location.name || 'Unnamed Location'}</strong>`;
          if (location.city) popupContent += `<br>${location.city}`;
          if (location.country) popupContent += `, ${location.country}`;
          if (location.location_id) {
            popupContent += `<br><a href="/location/${location.location_id}" target="_blank">View Details</a>`;
          }
          marker.bindPopup(popupContent);
          markers.push(marker);
          this.markerLayerGroup.addLayer(marker);
        }
      });

      if (markers.length > 0) {
        if (markers.length === 1) {
          // For a single marker, set a specific zoom level (e.g., 14)
          this.map.setView(markers[0].getLatLng(), 14); 
        } else {
          // For multiple markers, fit bounds
          const groupBounds = L.featureGroup(markers).getBounds();
          this.map.fitBounds(groupBounds.pad(0.1)); // Add some padding
        }
      }
      
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 100);
    }
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  z-index: 1;
}

/* Add a subtle loading indicator until map is ready */
.map-wrapper::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 0;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>