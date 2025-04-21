<template>
  <div class="search-results-page">
    <!-- Search bar at the top -->
    <div class="search-bar">
      <div class="search-inputs">
        <input type="text" v-model="searchLocation" placeholder="City or Country">
        <input type="date" v-model="checkIn" placeholder="Check-in">
        <input type="date" v-model="checkOut" placeholder="Check-out">
        <button @click="searchLocations" class="search-btn">Search</button>
      </div>
    </div>
    
    <div class="results-container">
      <!-- Filters section (left side) -->
      <div class="filters-section">
        <h3>Filters</h3>
        
        <!-- Price Range Filter -->
        <div class="filter-group">
          <h4>Maximum Price: €{{ maxPriceFilter }}</h4>
          <div class="price-range">
            <input 
              type="range" 
              v-model.number="maxPriceFilter" 
              :min="minMaxPrice.min" 
              :max="minMaxPrice.max"
              step="10"
              class="price-slider"
            >
            <div class="price-range-labels">
              <span>€{{ minMaxPrice.min }}</span>
              <span>€{{ minMaxPrice.max }}</span>
            </div>
          </div>
        </div>
        
        <!-- Campsite Types Filter -->
        <div class="filter-group" v-if="campsiteTypes.length > 0">
          <h4>Campsite Types</h4>
          <div v-for="type in campsiteTypes" :key="'type-' + type.campsitetypes_id" class="filter-checkbox">
            <input 
              type="checkbox" 
              :id="'type-' + type.campsitetypes_id" 
              :value="type.campsitetypes_id" 
              v-model="selectedCampsiteTypes"
              @change="applyFilters"
            >
            <label :for="'type-' + type.campsitetypes_id">{{ type.name }}</label>
          </div>
        </div>
        
        <!-- Amenities Filter -->
        <div class="filter-group" v-if="amenities.length > 0">
          <h4>Amenities</h4>
          <div v-for="amenity in amenities" :key="'amenity-' + amenity.amenity_id" class="filter-checkbox">
            <input 
              type="checkbox" 
              :id="'amenity-' + amenity.amenity_id" 
              :value="amenity.amenity_id" 
              v-model="selectedAmenities"
              @change="applyFilters"
            >
            <label :for="'amenity-' + amenity.amenity_id">{{ amenity.name }}</label>
          </div>
        </div>
        
        <!-- Rating Filter -->
        <div class="filter-group">
          <h4>Rating</h4>
          <div class="star-rating">
            <span 
              v-for="n in 5" 
              :key="n" 
              class="star" 
              :class="{ active: n <= selectedRating }"
              @click="setRating(n)"
            >★</span>
            <span v-if="selectedRating > 0" class="clear-rating" @click="selectedRating = 0">Clear</span>
          </div>
        </div>
        
        <button @click="applyFilters" class="filter-btn">Apply Filters</button>
        <button @click="resetFilters" class="reset-btn">Reset All</button>
      </div>
      
      <!-- Results section (right side) -->
      <div class="results-section">
        <h2>Search Results <span v-if="filteredResults.length">({{ filteredResults.length }})</span></h2>
        
        <div v-if="loading" class="loading">
          <div class="loader"></div>
          <p>Loading results...</p>
        </div>
        
        <div v-else-if="filteredResults.length === 0" class="no-results">
          <p>No locations found matching your criteria.</p>
          <p>Try adjusting your filters or search parameters.</p>
        </div>
        
        <div v-else class="results-list">
          <div 
            v-for="location in filteredResults" 
            :key="location.location_id" 
            class="location-card"
          >
            <div class="location-image">
              <div class="campsite-types-badge" v-if="location.campsiteTypes && location.campsiteTypes.length">
                <span>{{ getCampsiteTypesList(location) }}</span>
              </div>
              <img 
                v-if="location.coverImage" 
                :src="`http://localhost:3001${location.coverImage}`" 
                :alt="location.name"
              />
              <div v-else class="location-image-placeholder">
                <span>No image available</span>
              </div>
            </div>
            <div class="location-info">
              <div class="location-header">
                <h3>{{ location.name }}</h3>
                <div class="location-rating" v-if="location.averageRating">
                  <span class="stars">{{ '★'.repeat(Math.round(location.averageRating)) }}</span>
                  <span class="rating-value">({{ location.averageRating.toFixed(1) }})</span>
                </div>
              </div>
              <p class="location-area">{{ location.city }}, {{ location.country }}</p>
              <p class="location-price">€{{ location.price_per_night }} per night</p>
              
              <div class="campsite-types" v-if="location.campsiteTypes && location.campsiteTypes.length">
                <span>Types: {{ location.campsiteTypes.map(type => type.name).join(', ') }}</span>
              </div>
              
              <div class="location-amenities" v-if="location.amenities && location.amenities.length">
                <span>{{ getAmenitiesList(location) }}</span>
              </div>
              
              <div class="location-actions">
                <router-link :to="`/location/${location.location_id}`" class="view-details">
                  View Details
                </router-link>
                <button 
                  @click="bookLocation(location)" 
                  class="book-btn" 
                  :disabled="!isAuthenticated"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SearchResultsPage',
  data() {
    return {
      isAuthenticated: false,
      searchLocation: '',
      checkIn: '',
      checkOut: '',
      loading: true,
      results: [],
      filteredResults: [],
      campsiteTypes: [],
      amenities: [],
      
      // Filters
      selectedCampsiteTypes: [],
      selectedAmenities: [],
      selectedRating: 0,
      maxPriceFilter: 1000,
      minMaxPrice: { min: 0, max: 1000 }
    }
  },
  created() {
    this.checkAuth();
    this.loadInitialData();
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
    },
    
    async loadInitialData() {
      try {
        // First load filter data (amenities and campsite types)
        await this.loadFiltersData();
        
        // Then initialize search parameters from URL query
        this.initSearchFromUrlQuery();
        
        // Finally perform the search
        await this.performSearch();
      } catch (error) {
        console.error('Error during initial data loading:', error);
      }
    },
    
    async loadFiltersData() {
      try {
        // Load campsite types
        const typesResponse = await axios.get('http://localhost:3001/locations/campsitetypes');
        this.campsiteTypes = typesResponse.data || [];
        
        // Load amenities
        const amenitiesResponse = await axios.get('http://localhost:3001/locations/amenities');
        this.amenities = amenitiesResponse.data || [];
      } catch (error) {
        console.error('Error loading filters data:', error);
        // Initialize as empty arrays if failed to load
        this.campsiteTypes = [];
        this.amenities = [];
      }
    },
    
    initSearchFromUrlQuery() {
      const query = this.$route.query;
      
      // Get search query - could be location name, city, or country
      this.searchLocation = query.query || query.location || '';
      
      // Get dates
      this.checkIn = query.start_date || '';
      this.checkOut = query.end_date || '';
    },
    
    async performSearch() {
      this.loading = true;
      
      try {
        // Reset results
        this.results = [];
        this.filteredResults = [];
        
        // Build API endpoint with query parameters
        const params = new URLSearchParams();
        
        if (this.searchLocation) {
          // Send as general query parameter to search in name, city and country
          params.append('query', this.searchLocation);
        }
        
        if (this.checkIn && this.checkOut) {
          params.append('start_date', this.checkIn);
          params.append('end_date', this.checkOut);
        }
        
        const queryString = params.toString();
        const endpoint = `http://localhost:3001/locations/search${queryString ? '?' + queryString : ''}`;
        
        console.log('Search endpoint:', endpoint);
        
        // Fetch locations
        const response = await axios.get(endpoint);
        this.results = response.data || [];
        
        console.log('Search results:', this.results);
        
        // Load additional data for each location
        await this.loadLocationsData(this.results);
        
        // Calculate min/max price from results for the price slider
        if (this.results.length > 0) {
          const prices = this.results.map(loc => parseFloat(loc.price_per_night));
          this.minMaxPrice.min = Math.floor(Math.min(...prices));
          this.minMaxPrice.max = Math.ceil(Math.max(...prices));
          this.maxPriceFilter = this.minMaxPrice.max; // Set slider to max initially
        }
        
        // Apply any existing filters to the results
        this.applyFilters();
      } catch (error) {
        console.error('Error fetching locations:', error);
        this.results = [];
        this.filteredResults = [];
      } finally {
        this.loading = false;
      }
    },
    
    searchLocations() {
      // Update URL
      const urlParams = {};
      if (this.searchLocation) urlParams.query = this.searchLocation;
      if (this.checkIn) urlParams.start_date = this.checkIn;
      if (this.checkOut) urlParams.end_date = this.checkOut;
      
      this.$router.replace({ 
        path: '/search', 
        query: urlParams
      }).catch(err => {
        // ignore redundant navigation errors
        if (err.name !== 'NavigationDuplicated') {
          console.error('Navigation error:', err);
        }
      });
      
      // Perform the search
      this.performSearch();
    },
    
    async loadLocationsData(locations) {
      // Process all locations in parallel
      await Promise.all(locations.map(async (location) => {
        try {
          // Get location images
          const imageResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/images`
          );
          
          if (imageResponse.data && imageResponse.data.length > 0) {
            const coverImage = imageResponse.data.find(img => img.is_cover === 1) || imageResponse.data[0];
            this.$set(location, 'coverImage', coverImage.image_url);
          }
          
          // Get campsite types
          const typesResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/campsitetype`
          );
          
          if (typesResponse.data && typesResponse.data.length > 0) {
            this.$set(location, 'campsiteTypes', typesResponse.data);
          } else {
            this.$set(location, 'campsiteTypes', []);
          }
          
          // Get amenities
          const amenitiesResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/amenities`
          );
          
          if (amenitiesResponse.data && amenitiesResponse.data.length > 0) {
            this.$set(location, 'amenities', amenitiesResponse.data);
          } else {
            this.$set(location, 'amenities', []);
          }
          
          // Get average rating
          const ratingsResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/reviews/average`
          );
          
          if (ratingsResponse.data && ratingsResponse.data.averageRating) {
            this.$set(location, 'averageRating', ratingsResponse.data.averageRating);
          }
        } catch (error) {
          console.error(`Error loading data for location ${location.location_id}:`, error);
        }
      }));
    },
    
    applyFilters() {
      this.filteredResults = this.results.filter(location => {
        // Price filter
        const price = parseFloat(location.price_per_night);
        if (price > this.maxPriceFilter) {
          return false;
        }
        
        // Campsite types filter
        if (this.selectedCampsiteTypes.length > 0) {
          // Location should have campsite types data
          if (!location.campsiteTypes || location.campsiteTypes.length === 0) {
            return false;
          }
          
          // Check if any selected type is in this location
          const locationTypeIds = location.campsiteTypes.map(type => 
            parseInt(type.campsitetypes_id)
          );
          
          // Location should have at least one of the selected types
          if (!this.selectedCampsiteTypes.some(id => locationTypeIds.includes(id))) {
            return false;
          }
        }
        
        // Amenities filter
        if (this.selectedAmenities.length > 0) {
          // Location should have amenities data
          if (!location.amenities || location.amenities.length === 0) {
            return false;
          }
          
          // Check if any selected amenity is in this location
          const locationAmenityIds = location.amenities.map(amenity => 
            parseInt(amenity.amenity_id)
          );
          
          // Location should have at least one of the selected amenities
          if (!this.selectedAmenities.some(id => locationAmenityIds.includes(id))) {
            return false;
          }
        }
        
        // Rating filter
        if (this.selectedRating > 0) {
          if (!location.averageRating || location.averageRating < this.selectedRating) {
            return false;
          }
        }
        
        return true;
      });
    },
    
    getCampsiteTypesList(location) {
      if (!location.campsiteTypes || !location.campsiteTypes.length) {
        return 'No type specified';
      }
      
      // default 2 campsitetypes, and add "... more" if there are more
      const types = location.campsiteTypes.map(type => type.name);
      if (types.length <= 2) {
        return types.join(', ');
      } else {
        return `${types[0]}, ${types[1]} +${types.length - 2} more`;
      }
    },
    
    getAmenitiesList(location) {
      if (!location.amenities || !location.amenities.length) {
        return 'No amenities listed';
      }
      
      //if amenities > 3 add "... more" if there are more
      const amenities = location.amenities.map(a => a.name);
      if (amenities.length <= 3) {
        return amenities.join(' • ');
      } else {
        return `${amenities[0]} • ${amenities[1]} • ${amenities[2]} +${amenities.length - 3} more`;
      }
    },
    
    setRating(rating) {
      this.selectedRating = this.selectedRating === rating ? rating - 1 : rating;
      this.applyFilters();
    },
    
    resetFilters() {
      this.selectedCampsiteTypes = [];
      this.selectedAmenities = [];
      this.selectedRating = 0;
      this.maxPriceFilter = this.minMaxPrice.max;
      this.filteredResults = [...this.results];
    },
    
    bookLocation(location) {
      if (this.isAuthenticated) {
        // Navigate to booking page with location and date params
        this.$router.push({
          path: `/booking/${location.location_id}`,
          query: {
            start_date: this.checkIn || null,
            end_date: this.checkOut || null
          }
        });
      } else {
        // Redirect to login with return path
        this.$router.push({
          path: '/login',
          query: { redirect: this.$route.fullPath }
        });
      }
    }
  }
}
</script>

<style scoped>
.search-results-page {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.search-bar {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.search-inputs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-inputs input {
  flex: 1;
  min-width: 150px;
  padding: 10px;
  border: 1px solid #ddd;
}

.search-btn {
  background-color: #eee;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.results-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
}

.filters-section {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  align-self: flex-start;
  position: sticky;
  top: 90px;
  border: 1px solid #ddd;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.filter-group {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.filter-group h4 {
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 1rem;
}

.price-range {
  padding: 5px 0;
}

.price-slider {
  width: 100%;
  margin: 10px 0;
}

.price-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.filter-checkbox {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.filter-checkbox input {
  margin-right: 8px;
}

.star {
  cursor: pointer;
  font-size: 24px;
}

.filter-btn, .reset-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
  font-weight: 600;
  background-color: #f7f7f7;
}

.results-section {
  flex-grow: 1;
}

.results-section h2 {
  margin-bottom: 20px;
}

.no-results {
  background-color: #f8f8f8;
  padding: 30px;
  text-align: center;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.results-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.location-card {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.location-image {
  height: 200px;
  position: relative;
}

.location-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campsite-types-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  max-width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid #ddd;
}

.location-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eee;
}

.location-info {
  padding: 15px;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.location-header h3 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
}

.campsite-types {
  margin: 8px 0;
  font-size: 0.9rem;
  padding: 5px 0;
  border-top: 1px solid #eee;
}

.location-amenities {
  font-size: 0.85rem;
  margin-bottom: 15px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.location-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.view-details, .book-btn {
  flex: 1;
  padding: 8px 12px;
  text-align: center;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid #ddd;
  background-color: #f7f7f7;
  text-decoration: none;
}

.view-details {
  margin-right: 10px;
}

.book-btn:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .results-container {
    grid-template-columns: 1fr;
  }
  
  .filters-section {
    position: static;
    max-height: none;
    margin-bottom: 20px;
  }
}

@media (max-width: 600px) {
  .search-inputs {
    flex-direction: column;
  }
  
  .results-list {
    grid-template-columns: 1fr;
  }
}
</style>
