<template>
  <div class="search-results-page">
    <!-- Search bar at the top -->
    <div class="search-bar">
      <div class="search-inputs">
        <input type="text" v-model="searchLocation" placeholder="City or Country" class="search-input-field">
        <v-date-picker v-model="dateRange" is-range :min-date="new Date()" :masks="{ input: 'YYYY-MM-DD' }" class="date-picker-wrapper">
          <template v-slot="{ inputValue, inputEvents, isDragging }">
            <div class="date-picker-input-container">
              <input
                class="search-input-field date-picker-input"
                placeholder="Check-in"
                :value="inputValue.start"
                v-on="inputEvents.start"
              />
              <span class="date-separator">→</span>
              <input
                class="search-input-field date-picker-input"
                placeholder="Check-out"
                :value="inputValue.end"
                v-on="inputEvents.end"
                :class="{ 'is-dragging': isDragging }"
              />
            </div>
          </template>
        </v-date-picker>
        <button @click="searchLocations" class="search-btn">Search</button>
      </div>
    </div>
    
    <div class="results-container">
      <!-- Filters section (left side) -->
      <div class="filters-section">
        <h3>Filters</h3>
        <button @click="openMapModal" class="search-on-map-btn">View on Map</button>
        
        <!-- Price Range Filter -->
        <div class="filter-group">
          <h4>Price</h4>
          <div class="price-range">
            <input 
              type="range" 
              v-model.number="maxPriceFilter" 
              :min="minMaxPrice.min" 
              :max="minMaxPrice.max"
              step="10"
              class="price-slider"
              @input="applyFilters"
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
            <span v-if="selectedRating > 0" class="clear-rating" @click="selectedRating = 0; applyFilters();">Clear</span>
          </div>
        </div>
        
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
              <img v-if="location.coverImage" :src="location.coverImage" :alt="location.name" class="w-full h-48 object-cover rounded-t-lg">
              <div v-else class="location-image-placeholder">
                <span>No image available</span>
              </div>
            </div>
            <div class="location-info">
              <div class="location-header">
                <h3>{{ location.name }}</h3>
                <div class="location-rating">
                  <template v-if="location.reviewsCount && location.reviewsCount > 0 && typeof location.averageRating === 'number'">
                    <span class="stars">★ {{ location.averageRating.toFixed(1) }}</span>
                    <span class="reviews-count-display"> ({{ location.reviewsCount }} {{ location.reviewsCount === 1 ? 'review' : 'reviews' }})</span>
                  </template>
                  <template v-else-if="location.reviewsCount && location.reviewsCount > 0">
                    <!-- Fallback or alternative display if averageRating is not a number but reviews exist -->
                    <span class="reviews-count-display"> ({{ location.reviewsCount }} {{ location.reviewsCount === 1 ? 'review' : 'reviews' }})</span>
                  </template>
                  <template v-else>
                    <span class="no-reviews-text">No reviews yet</span>
                  </template>
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

    <!-- Map Modal -->
    <div v-if="showMapModal" class="map-modal-overlay" @click.self="closeMapModal">
      <div class="map-modal-content">
        <button @click="closeMapModal" class="close-modal-btn">&times;</button>
        <h2>Explore Locations on Map</h2>
        <div class="map-filters-ui">
          <input type="text" v-model="mapFilters.locationQuery" placeholder="Filter by City or Country" @input="applyMapFilters" class="filter-input">
          
          <div class="filter-group">
            <h4>Price</h4>
            <input 
              type="range" 
              v-model.number="mapFilters.priceRange.max" 
              :min="minMaxPriceForMapFilter.min" 
              :max="minMaxPriceForMapFilter.max" 
              step="10" 
              @input="applyMapFilters"
              class="price-slider"
            >
            <div class="price-range-labels">
              <span>€{{ minMaxPriceForMapFilter.min }}</span>
              <span>€{{ minMaxPriceForMapFilter.max }}</span>
            </div>
          </div>

          <div class="filter-group" v-if="availableCampsiteTypesForMap.length > 0">
            <h4>Campsite Types</h4>
            <div v-for="type in availableCampsiteTypesForMap" :key="'map-type-' + type.campsitetypes_id" class="filter-checkbox">
              <input 
                type="checkbox" 
                :id="'map-type-' + type.campsitetypes_id" 
                :value="type.campsitetypes_id" 
                v-model="mapFilters.selectedCampsiteTypes"
                @change="applyMapFilters"
              >
              <label :for="'map-type-' + type.campsitetypes_id">{{ type.name }}</label>
            </div>
          </div>

          <div class="filter-group" v-if="availableAmenitiesForMap.length > 0">
            <h4>Amenities</h4>
            <div v-for="amenity in availableAmenitiesForMap" :key="'map-amenity-' + amenity.amenity_id" class="filter-checkbox">
              <input 
                type="checkbox" 
                :id="'map-amenity-' + amenity.amenity_id" 
                :value="amenity.amenity_id" 
                v-model="mapFilters.selectedAmenities"
                @change="applyMapFilters"
              >
              <label :for="'map-amenity-' + amenity.amenity_id">{{ amenity.name }}</label>
            </div>
          </div>

          <div class="filter-group">
            <h4>Rating</h4>
            <div class="star-rating">
              <span 
                v-for="n in 5" 
                :key="'map-star-' + n" 
                class="star" 
                :class="{ active: n <= mapFilters.selectedRating }"
                @click="setMapRating(n)"
              >★</span>
              <span v-if="mapFilters.selectedRating > 0" class="clear-rating" @click="mapFilters.selectedRating = 0; applyMapFilters();">Clear</span>
            </div>
          </div>
        </div>
        <map-component 
          v-if="results.length > 0" 
          :locations="filteredMapDisplayLocations"
          :map-id="'searchpage-map'"
          class="searchpage-map-container"
        />
        <div v-else class="loading-map-message">
          <p>No locations to display on map.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { DatePicker } from 'v-calendar';
import 'v-calendar/src/styles/base.css';
import MapComponent from '@/components/MapComponent.vue'; // Import MapComponent

export default {
  name: 'SearchResultsPage',
  components: {
    VDatePicker: DatePicker,
    MapComponent, // Register MapComponent
  },
  data() {
    return {
      isAuthenticated: false,
      searchLocation: '',
      dateRange: {
        start: null,
        end: null,
      },
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
      minMaxPrice: { min: 0, max: 1000 },

      showMapModal: false,
      mapFilters: {
        locationQuery: '',
        priceRange: { min: 0, max: 1000 }, // Default, will be updated
        selectedCampsiteTypes: [],
        selectedAmenities: [],
        selectedRating: 0,
      },
      availableCampsiteTypesForMap: [],
      availableAmenitiesForMap: [],
      minMaxPriceForMapFilter: { min: 0, max: 1000 }, // Default, will be updated
    }
  },
  computed: {
    // minCheckOutDate is no longer needed
    filteredMapDisplayLocations() {
      let locationsToFilter = [...this.results]; // Start with all search results

      // Filter by locationQuery (city or country)
      if (this.mapFilters.locationQuery) {
        const query = this.mapFilters.locationQuery.toLowerCase();
        locationsToFilter = locationsToFilter.filter(loc =>
          (loc.city && loc.city.toLowerCase().includes(query)) ||
          (loc.country && loc.country.toLowerCase().includes(query))
        );
      }

      // Filter by max price
      locationsToFilter = locationsToFilter.filter(loc => loc.price_per_night <= this.mapFilters.priceRange.max);
      
      // Filter by campsite types
      if (this.mapFilters.selectedCampsiteTypes.length > 0) {
        locationsToFilter = locationsToFilter.filter(loc =>
          loc.campsiteTypes && loc.campsiteTypes.some(type =>
            this.mapFilters.selectedCampsiteTypes.includes(type.campsitetypes_id)
          )
        );
      }

      // Filter by amenities
      if (this.mapFilters.selectedAmenities.length > 0) {
        locationsToFilter = locationsToFilter.filter(loc =>
          loc.amenities && this.mapFilters.selectedAmenities.every(filterAmenityId =>
            loc.amenities.some(amenity => amenity.amenity_id === filterAmenityId)
          )
        );
      }

      // Filter by rating
      if (this.mapFilters.selectedRating > 0) {
        locationsToFilter = locationsToFilter.filter(loc =>
          loc.averageRating && loc.averageRating >= this.mapFilters.selectedRating
        );
      }
      return locationsToFilter;
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
        this.availableCampsiteTypesForMap = [...this.campsiteTypes]; // Also populate for map
        
        // Load amenities
        const amenitiesResponse = await axios.get('http://localhost:3001/locations/amenities');
        this.amenities = amenitiesResponse.data || [];
        this.availableAmenitiesForMap = [...this.amenities]; // Also populate for map
      } catch (error) {
        console.error('Error loading filters data:', error);
        // Initialize as empty arrays if failed to load
        this.campsiteTypes = [];
        this.amenities = [];
        this.availableCampsiteTypesForMap = [];
        this.availableAmenitiesForMap = [];
      }
    },
    
    formatDateToString(date) {
      if (!date) return '';
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    parseDateFromString(dateString) {
      if (!dateString) return null;
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return null;
    },
    initSearchFromUrlQuery() {
      const query = this.$route.query;
      
      this.searchLocation = query.query || query.location || '';
      
      // Parse date strings from URL to Date objects for v-date-picker
      this.dateRange.start = this.parseDateFromString(query.start_date);
      this.dateRange.end = this.parseDateFromString(query.end_date);
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
        
        const formattedCheckIn = this.formatDateToString(this.dateRange.start);
        const formattedCheckOut = this.formatDateToString(this.dateRange.end);

        if (formattedCheckIn && formattedCheckOut) {
          params.append('start_date', formattedCheckIn);
          params.append('end_date', formattedCheckOut);
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

          // Update map price filter range as well
          this.updateMapPriceSliderRange();
          this.mapFilters.priceRange.max = this.minMaxPriceForMapFilter.max; // Set initial map price filter
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
      
      const formattedCheckIn = this.formatDateToString(this.dateRange.start);
      const formattedCheckOut = this.formatDateToString(this.dateRange.end);

      if (formattedCheckIn) urlParams.start_date = formattedCheckIn;
      if (formattedCheckOut) urlParams.end_date = formattedCheckOut;
      
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
            // Ensure image_url is used directly as it's an absolute path
            this.$set(location, 'coverImage', coverImage.image_url);
          } else {
            this.$set(location, 'coverImage', null); // Set to null if no image
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
          
          // Get average rating (still needed for filtering AND DISPLAY)
          const ratingsResponse = await axios.get(
            `http://localhost:3001/reviews/${location.location_id}/average`
          );
          
          if (ratingsResponse.data && typeof ratingsResponse.data.averageRating === 'number') {
            this.$set(location, 'averageRating', parseFloat(ratingsResponse.data.averageRating));
            this.$set(location, 'reviewsCount', parseInt(ratingsResponse.data.reviewCount) || 0); // Use reviewCount from average endpoint
          } else {
            this.$set(location, 'averageRating', 0); 
            this.$set(location, 'reviewsCount', 0); 
          }

          // Remove fetching all reviews just for count and first review rating, use average endpoint data
          // this.$set(location, 'firstReviewRating', null); // No longer primarily used for display rating
          // this.$set(location, 'allReviews', []); // Still can be fetched if needed for other purposes on demand

          // The block for fetching all reviews from `http://localhost:3001/reviews/${location.location_id}`
          // can be removed or modified if `allReviews` are not needed for other display purposes on this card.
          // For now, we'll assume the averageRating and reviewsCount from the /average endpoint are sufficient for the card.

        } catch (error) {
          console.error(`Error loading data for location ${location.location_id}:`, error);
          // Ensure display properties are initialized if main try fails
          if (typeof location.averageRating === 'undefined') {
            this.$set(location, 'averageRating', 0);
          }
          if (typeof location.reviewsCount === 'undefined') {
            this.$set(location, 'reviewsCount', 0);
          }
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
        
        // Rating filter (uses averageRating)
        if (this.selectedRating > 0) {
          if (typeof location.averageRating !== 'number' || location.averageRating < this.selectedRating) {
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
      this.selectedRating = rating;
      this.applyFilters();
    },
    
    resetFilters() {
      this.selectedCampsiteTypes = [];
      this.selectedAmenities = [];
      this.selectedRating = 0;
      this.maxPriceFilter = this.minMaxPrice.max; // Reset to max
      this.applyFilters(); // Apply filters after resetting
    },
    
    bookLocation(location) {
      if (this.isAuthenticated) {
        // Navigate to booking page with location and date params
        this.$router.push({
          path: `/booking/${location.location_id}`,
          query: {
            start_date: this.dateRange.start || null,
            end_date: this.dateRange.end || null
          }
        });
      } else {
        // Redirect to login with return path
        this.$router.push({
          path: '/login',
          query: { redirect: this.$route.fullPath }
        });
      }
    },
    openMapModal() {
      this.loadMapFilterData(); // Load data for map filters if not already loaded
      this.updateMapPriceSliderRange(); // Ensure price slider is relevant
      // Reset map filters to defaults or based on current main page filters if desired
      this.mapFilters.locationQuery = this.searchLocation; // Pre-fill from main search
      // this.mapFilters.priceRange.max = this.maxPriceFilter; // Sync with main price filter
      // this.mapFilters.selectedCampsiteTypes = [...this.selectedCampsiteTypes];
      // this.mapFilters.selectedAmenities = [...this.selectedAmenities];
      // this.mapFilters.selectedRating = this.selectedRating;

      this.showMapModal = true;
    },
    closeMapModal() {
      this.showMapModal = false;
    },
    applyMapFilters() {
      // This method is mainly a trigger. The computed property `filteredMapDisplayLocations` handles the logic.
      // You might call this explicitly if you need to force a re-render or some other side effect.
      console.log("Applying map filters", this.mapFilters);
    },
    async loadMapFilterData() {
      // Re-use existing loadFiltersData or create a specific one if needed
      // For now, let's assume they can share the same data sources
      if (this.availableCampsiteTypesForMap.length === 0) {
        this.availableCampsiteTypesForMap = [...this.campsiteTypes];
      }
      if (this.availableAmenitiesForMap.length === 0) {
        this.availableAmenitiesForMap = [...this.amenities];
      }
      // If campsiteTypes and amenities are already loaded by loadFiltersData in created(),
      // you can directly assign them:
      // this.availableCampsiteTypesForMap = this.campsiteTypes;
      // this.availableAmenitiesForMap = this.amenities;
    },
    updateMapPriceSliderRange() {
      if (this.results.length > 0) {
        const prices = this.results.map(loc => parseFloat(loc.price_per_night)).filter(p => !isNaN(p));
        if (prices.length > 0) {
          this.minMaxPriceForMapFilter.min = Math.floor(Math.min(...prices));
          this.minMaxPriceForMapFilter.max = Math.ceil(Math.max(...prices));
          // Ensure current map filter max price is within the new range
          this.mapFilters.priceRange.max = Math.min(this.mapFilters.priceRange.max, this.minMaxPriceForMapFilter.max);
          this.mapFilters.priceRange.max = Math.max(this.mapFilters.priceRange.max, this.minMaxPriceForMapFilter.min);

        } else {
          this.minMaxPriceForMapFilter.min = 0;
          this.minMaxPriceForMapFilter.max = 1000; // Default if no prices
        }
      } else {
        this.minMaxPriceForMapFilter.min = 0;
        this.minMaxPriceForMapFilter.max = 1000; // Default if no results
      }
       // If mapFilters.priceRange.max was not initialized or is outside new bounds, reset it
      if (this.mapFilters.priceRange.max > this.minMaxPriceForMapFilter.max || this.mapFilters.priceRange.max < this.minMaxPriceForMapFilter.min) {
        this.mapFilters.priceRange.max = this.minMaxPriceForMapFilter.max;
      }
    },
    setMapRating(rating) {
      this.mapFilters.selectedRating = this.mapFilters.selectedRating === rating ? 0 : rating;
      this.applyMapFilters();
    },
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

.search-inputs input,
.search-inputs .date-picker-wrapper .search-input-field {
  flex: 1;
  min-width: 120px; /* Ensure consistency */
  padding: 10px 12px; /* Adjusted padding */
  border: 1px solid #ccc; /* Adjusted border */
  border-radius: 4px;
  box-sizing: border-box;
  height: 40px; /* Explicit height */
}

.search-inputs .date-picker-wrapper {
  flex: 2; /* Allow wrapper to take more space for two inputs */
  min-width: 250px; /* Adjust as needed */
}

.date-picker-input-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.date-picker-input-container input {
  flex: 1;
  /* Styles are largely inherited from .search-input-field defined elsewhere */
  padding: 10px 12px; /* Adjust padding if needed */
  border: 1px solid #ccc;
  border-radius: 4px;
}

.date-separator {
  padding: 0 8px;
  color: #888;
}

.is-dragging {
  /* Optional: style for when user is dragging to select end date */
  background-color: #f0f0f0;
}

.search-btn {
  background-color: #eee;
  border: 1px solid #ddd;
  padding: 10px 18px; /* Adjusted padding */
  height: 40px; /* Match input height */
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

.star-rating .star {
  cursor: pointer;
  font-size: 24px;
  color: #ccc; /* Default color for inactive stars */
  transition: color 0.2s ease-in-out;
}

.star-rating .star.active,
.star-rating .star:hover {
  color: green; /* Ensures stars in main filter are green */
}

/* Targeting stars specifically within the map modal's filter UI */
.map-filters-ui .star-rating .star.active,
.map-filters-ui .star-rating .star:hover {
  color: green; /* Ensures stars in map filter are green */
}

/* Ensure the star display on the location card itself is also green if that's intended */
.location-rating .stars {
  color: green; /* Or ensure this class is targeted if different from filter stars */
  /* If the ★ character is directly in a span with class .stars, this will color it. */
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

.search-on-map-btn {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 15px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1rem;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 4px;
  width: 100%;
}

.map-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px; /* Add padding for smaller screens */
  box-sizing: border-box;
}

.map-modal-content {
  background-color: #fff;
  padding: 25px; /* Increased padding */
  border-radius: 8px; /* Softer corners */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); /* More pronounced shadow */
  width: 90%; /* Responsive width */
  max-width: 1000px; /* Max width */
  height: 90vh; /* Responsive height */
  max-height: 700px; /* Max height */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent content overflow issues */
}

.map-modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px; /* Spacing below title */
  font-size: 1.8em; /* Larger title */
  color: #333;
  text-align: center;
}

.close-modal-btn {
  position: absolute;
  top: 15px; /* Adjusted position */
  right: 15px; /* Adjusted position */
  background: none;
  border: none;
  font-size: 2em; /* Larger close button */
  cursor: pointer;
  color: #888; /* Softer color */
  padding: 5px;
  line-height: 1;
}
.close-modal-btn:hover {
  color: #333; /* Darker on hover */
}

.map-filters-ui {
  display: flex;
  flex-direction: column; /* Stack filters vertically */
  gap: 18px; /* Space between filter groups */
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 20px; /* Space before the map */
  overflow-y: auto; /* Allow scrolling for filters if they overflow */
  max-height: 250px; /* Limit height of filter section */
}

.map-filters-ui .filter-input,
.map-filters-ui .price-slider {
  width: 100%; /* Full width for inputs */
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}

.map-filters-ui .filter-group {
  padding: 12px; /* Add padding inside each group */
  border: 1px solid #f0f0f0; /* Light border for groups */
  border-radius: 4px;
  background-color: #f9f9f9; /* Slight background tint */
}

.map-filters-ui .filter-group h4 {
  margin-top: 0;
  margin-bottom: 10px; /* Space below group title */
  font-size: 1.1em;
  color: #555;
}

.map-filters-ui .price-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85em;
  color: #777;
  margin-top: 5px;
}

.map-filters-ui .filter-checkbox {
  display: flex;
  align-items: center;
  margin-bottom: 8px; /* Space between checkboxes */
}

.map-filters-ui .filter-checkbox input[type="checkbox"] {
  margin-right: 8px;
  height: 16px; /* Adjust size */
  width: 16px;  /* Adjust size */
  cursor: pointer;
}

.map-filters-ui .filter-checkbox label {
  font-size: 0.9em;
  color: #444;
  cursor: pointer;
}

.map-filters-ui .star-rating {
  display: flex;
  align-items: center;
  gap: 5px; /* Space between stars */
}

.map-filters-ui .star-rating .star {
  font-size: 1.8em; /* Larger stars */
  color: #ddd; /* Default star color */
  cursor: pointer;
  transition: color 0.2s;
}

.map-filters-ui .star-rating .star.active {
  color: #ffc107; /* Active star color */
}

.map-filters-ui .star-rating .clear-rating {
  margin-left: 10px;
  font-size: 0.85em;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}
.map-filters-ui .star-rating .clear-rating:hover {
  color: #0056b3;
}


.searchpage-map-container {
  flex-grow: 1; /* Allow map to take remaining space */
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 300px; /* Ensure map has a minimum height */
}

.loading-map-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Take full height of its container */
  color: #777;
  font-style: italic;
}

/* General filter group styling (can be shared if desired) */
.filter-group {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.filter-group h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1em;
  color: #333;
}
</style>
