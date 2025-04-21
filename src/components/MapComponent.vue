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
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    zoom: {
      type: Number,
      default: 13
    },
    mapId: {
      type: String,
      default: 'map'
    }
  },
  data() {
    return {
      map: null,
      marker: null
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      // Use a timeout to ensure the DOM is ready
      setTimeout(() => {
        try {
          // Initialize map
          this.map = L.map(this.mapId).setView([this.latitude, this.longitude], this.zoom);
          
          // Add the OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);
          
          // Add a marker at the location
          this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
          
          // Force map to refresh its size
          setTimeout(() => {
            this.map.invalidateSize();
          }, 100);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 200);
    }
  },
  beforeDestroy() {
    // Clean up map resources when component is destroyed
    if (this.map) {
      this.map.remove();
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
