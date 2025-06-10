<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <h1>Welcome to Seeker<span v-if="userName">, {{ userName }}</span>!</h1>
        <p class="hero-subtitle">Find your perfect camping destination</p>
        
        <div class="search-container">
          <div class="search-form">
            <h2>Find Camping Spots</h2>
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
              <input type="number" v-model.number="numberOfGuests" placeholder="Guests" class="search-input-field" min="1">
              <button @click="searchLocations" class="search-btn">Search</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map and Filters Section Removed -->
    
    <div class="featured-locations container" v-if="featuredLocations.length > 0">
      <h2>Featured Camping Spots</h2>
      <div class="locations-grid">
        <div v-for="location in featuredLocations" :key="location.location_id" class="location-card">
          <div class="location-image">
            <img 
              v-if="location.coverImage" 
              :src="location.coverImage" 
              :alt="location.name"
              class="location-image"
            />
            <div v-else class="location-image-placeholder">
              <span>No image available</span>
            </div>
          </div>
          <div class="location-info">
            <h3>{{ location.name }}</h3>
            <p class="location-area">{{ location.city }}, {{ location.country }}</p>
            <p class="location-rating">
              <template v-if="location.review_count && location.review_count > 0 && typeof location.average_rating === 'number'">
                <span class="stars">★ {{ Math.round(location.average_rating) }}</span>
                <span class="reviews-count-display"> ({{ location.review_count }} {{ location.review_count === 1 ? 'review' : 'reviews' }})</span>
              </template>
              <template v-else>
                <span class="no-reviews-text">No reviews yet</span>
              </template>
            </p>
            <p class="location-price">€{{ location.price_per_night }} per night</p>
            
            <div class="campsite-types" v-if="location.campsiteTypes && location.campsiteTypes.length">
              <span><strong>Types:</strong> {{ getCampsiteTypesList(location) }}</span>
            </div>
            
            <router-link :to="{ path: `/location/${location.location_id}`, query: getCurrentSearchParams() }" class="view-details">View Details</router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="recently-added-locations container" v-if="recentlyAddedLocations.length > 0">
      <h2>Recently Added Camping Spots</h2>
      <div class="locations-grid">
        <div v-for="location in recentlyAddedLocations" :key="location.location_id" class="location-card">
          <div class="location-image">
            <img 
              v-if="location.coverImage" 
              :src="location.coverImage" 
              :alt="location.name"
              class="location-image"
            />
            <div v-else class="location-image-placeholder">
              <span>No image available</span>
            </div>
          </div>
          <div class="location-info">
            <h3>{{ location.name }}</h3>
            <p class="location-area">{{ location.city }}, {{ location.country }}</p>
            <p class="location-rating">
              <template v-if="location.review_count && location.review_count > 0 && typeof location.average_rating === 'number'">
                <span class="stars">★ {{ Math.round(location.average_rating) }}</span>
                <span class="reviews-count-display"> ({{ location.review_count }} {{ location.review_count === 1 ? 'review' : 'reviews' }})</span>
              </template>
              <template v-else>
                <span class="no-reviews-text">No reviews yet</span>
              </template>
            </p>
            <p class="location-price">€{{ location.price_per_night }} per night</p>
            <div class="campsite-types" v-if="location.campsiteTypes && location.campsiteTypes.length">
              <span><strong>Types:</strong> {{ getCampsiteTypesList(location) }}</span>
            </div>
            <router-link :to="{ path: `/location/${location.location_id}`, query: getCurrentSearchParams() }" class="view-details">View Details</router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="unique-experiences container" v-if="uniqueExperiences.length > 0">
      <h2>Unique Camping Experiences</h2>
      <div class="locations-grid">
        <div v-for="location in uniqueExperiences" :key="location.location_id" class="location-card">
          <div class="location-image">
            <img 
              v-if="location.coverImage" 
              :src="location.coverImage" 
              :alt="location.name"
              class="location-image"
            />
            <div v-else class="location-image-placeholder">
              <span>No image available</span>
            </div>
          </div>
          <div class="location-info">
            <h3>{{ location.name }}</h3>
            <p class="location-area">{{ location.city }}, {{ location.country }}</p>
            <p class="location-rating">
              <template v-if="location.review_count && location.review_count > 0 && typeof location.average_rating === 'number'">
                <span class="stars">★ {{ Math.round(location.average_rating) }}</span>
                <span class="reviews-count-display"> ({{ location.review_count }} {{ location.review_count === 1 ? 'review' : 'reviews' }})</span>
              </template>
              <template v-else>
                <span class="no-reviews-text">No reviews yet</span>
              </template>
            </p>
            <p class="location-price">€{{ location.price_per_night }} per night</p>
            <div class="campsite-types" v-if="location.campsiteTypes && location.campsiteTypes.length">
              <span><strong>Types:</strong> {{ getCampsiteTypesList(location) }}</span>
            </div>
            <router-link :to="{ path: `/location/${location.location_id}`, query: getCurrentSearchParams() }" class="view-details">View Details</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { DatePicker } from 'v-calendar';
import 'v-calendar/src/styles/base.css';
// import MapComponent from '@/components/MapComponent.vue'; // Removed

export default {
  name: 'HomePage',
  components: {
    VDatePicker: DatePicker,
    // MapComponent, // Removed
  },
  data() {
    return {
      isAuthenticated: false,
      userName: '', // Added for user's name
      searchLocation: '',
      dateRange: {
        start: null,
        end: null,
      },
      numberOfGuests: 1, // Added for number of guests
      featuredLocations: [],
      recentlyAddedLocations: [],
      uniqueExperiences: [],
      // allLocations: [], // Removed
      // mapLocations: [], // Removed
      // filters: { // Removed
      //   country: '',
      //   city: '',
      //   campsiteType: '', 
      //   amenities: [], 
      //   minRating: 0,
      // },
      // availableCampsiteTypes: [], // Removed
      // availableAmenities: [], // Removed
    };
  },
  computed: {
    // filteredMapLocations() { // Removed
    //   ...
    // },
  },
  created() {
    this.checkAuth();
    this.loadUserName(); // Added call
    this.loadFeaturedLocations();
    this.loadRecentlyAddedLocations();
    this.loadUniqueExperiences();
    // Initialize search fields from route query parameters if they exist
    if (this.$route.query.search_query) {
      this.searchLocation = this.$route.query.search_query;
    }
    if (this.$route.query.start_date && this.$route.query.end_date) {
      // Ensure dates are parsed correctly for v-date-picker
      // The dates from query are strings, convert them to Date objects
      // Adding 'T00:00:00Z' ensures they are parsed as UTC midnight,
      // or handle timezone consistently based on application needs.
      const startDate = new Date(this.$route.query.start_date + 'T00:00:00Z');
      const endDate = new Date(this.$route.query.end_date + 'T00:00:00Z');

      // Basic validation for dates
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
        this.dateRange = { start: startDate, end: endDate };
      } else {
        // If dates are invalid or end is before start, reset to default or handle error
        this.dateRange = { start: null, end: null };
        // Optionally, notify user or log this situation
        console.warn('Invalid date range from query parameters.');
      }
    }
    if (this.$route.query.guests) {
      const guests = parseInt(this.$route.query.guests);
      if (!isNaN(guests) && guests > 0) {
        this.numberOfGuests = guests;
      }
    }
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
    },
    loadUserName() {
      if (this.isAuthenticated) {
        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const user = JSON.parse(userString);
            if (user && user.firstName) {
              this.userName = user.firstName;
            } else if (user && user.name) { // Fallback to name if firstName is not available
              this.userName = user.name;
            }
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
            this.userName = ''; // Reset on error
          }
        }
      }
    },
    loadFeaturedLocations() {
      axios.get('http://localhost:3001/locations?limit=6&featured=true') 
        .then(response => {
          this.featuredLocations = response.data;
          this.loadSubDetailsForLocations(this.featuredLocations); 
        })
        .catch(error => {
          console.error('Error loading featured locations:', error);
        });
    },
    async loadRecentlyAddedLocations() {
      try {
        const response = await axios.get('http://localhost:3001/locations?sort=date_added&order=desc&limit=6');
        this.recentlyAddedLocations = response.data.filter(location => !this.featuredLocations.some(featured => featured.location_id === location.location_id));
        await this.loadSubDetailsForLocations(this.recentlyAddedLocations);
      } catch (error) {
        console.error('Error loading recently added locations:', error);
      }
    },
    async loadUniqueExperiences() {
      try {
        const response = await axios.get('http://localhost:3001/locations?filter=unique&limit=6');
        this.uniqueExperiences = response.data.filter(location => !this.featuredLocations.some(featured => featured.location_id === location.location_id));
        await this.loadSubDetailsForLocations(this.uniqueExperiences);
      } catch (error) {
        console.error('Error loading unique experiences:', error);
      }
    },
    // loadAllLocationsForMap() { // Removed
    //   ...
    // },
    async loadSubDetailsForLocations(locations) {
      for (const location of locations) {
        try {
          const imageResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/images`
          );
          if (imageResponse.data && imageResponse.data.length > 0) {
            const coverImage = imageResponse.data.find(img => img.is_cover === 1 || img.is_cover === true) || imageResponse.data[0];
            this.$set(location, 'coverImage', coverImage.image_url);
          }

          const typesResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/campsitetype`
          );
          if (typesResponse.data && typesResponse.data.length > 0) {
            this.$set(location, 'campsiteTypes', typesResponse.data);
          }

          const ratingsResponse = await axios.get(
            `http://localhost:3001/reviews/${location.location_id}/average`
          );
          if (ratingsResponse.data && typeof ratingsResponse.data.averageRating === 'number') {
            this.$set(location, 'average_rating', parseFloat(ratingsResponse.data.averageRating));
            this.$set(location, 'review_count', parseInt(ratingsResponse.data.reviewCount) || 0);
          } else {
            this.$set(location, 'average_rating', 0);
            this.$set(location, 'review_count', 0);
          }

        } catch (error) {
          console.error(`Error loading sub-details for ${location.name}:`, error);
          this.$set(location, 'average_rating', 0);
          this.$set(location, 'review_count', 0);
        }
      }
    },
    // loadFilterData() { // Removed
    //   ...
    // },
    getCampsiteTypesList(location) {
      if (!location.campsiteTypes || !location.campsiteTypes.length) {
        return 'No type specified';
      }
      return location.campsiteTypes.map(type => type.name).join(', ');
    },
    // applyMapFilters() { // Removed
    //   ...
    // },
    searchLocations() {
      const queryParams = {};
      if (this.searchLocation) {
        queryParams.query = this.searchLocation; // For SearchResultsPage
        queryParams.search_query = this.searchLocation; // For persisting back to HomePage
      }
      const formattedCheckIn = this.formatDateToString(this.dateRange.start);
      const formattedCheckOut = this.formatDateToString(this.dateRange.end);

      if (formattedCheckIn && formattedCheckOut) {
        queryParams.start_date = formattedCheckIn;
        queryParams.end_date = formattedCheckOut;
      }
      if (this.numberOfGuests && this.numberOfGuests > 0) {
        queryParams.guests = this.numberOfGuests;
      }
      this.$router.push({ 
        path: '/search', 
        query: queryParams
      });
    },
    getCurrentSearchParams() {
      const query = {};
      if (this.searchLocation) {
        query.search_query = this.searchLocation;
      }
      if (this.dateRange && this.dateRange.start && this.dateRange.end) {
        query.start_date = this.formatDateToString(this.dateRange.start);
        query.end_date = this.formatDateToString(this.dateRange.end);
      }
      if (this.numberOfGuests && this.numberOfGuests > 0) {
        query.guests = this.numberOfGuests;
      }
      return query;
    },
    formatDateToString(date) {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
  },
  watch: {
    // Removed filters watcher
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.hero {
  background: linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.8)), 
              url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80') center/cover no-repeat;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  width: 100%;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.search-container {
  margin: 0 auto;
  max-width: 700px;
  background-color: white;
  border-radius: 4px;
  padding: 20px;
  border: 1px solid #ddd;
}

.search-form h2 {
  margin-bottom: 1rem;
  font-size: 1.4rem;
}

.search-inputs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-inputs input,
.search-inputs .date-picker-wrapper .search-input-field, /* Target input inside v-date-picker */
.search-inputs .date-picker-input-container input {
  flex: 1;
  min-width: 120px; /* Ensure consistency */
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Add for better layout control */
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
  /* Styles are largely inherited from .search-input-field */
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
  background-color: #009a15;
  border: 1px solid #009a15;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  min-width: 120px;
}

.featured-locations {
  padding: 40px 20px;
  width: 100%;
  max-width: 100%;
}

.featured-locations h2 {
  text-align: center;
  margin-bottom: 30px;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 100%;
}

.location-card {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.location-image {
  height: 180px;
  position: relative;
}

.location-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.location-info h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.location-area {
  margin-bottom: 10px;
}

.location-price {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.campsite-types {
  margin-bottom: 15px;
  font-size: 0.9rem;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.location-rating {
  margin-top: 5px;
  font-size: 1.1rem; /* Increase font size */
  color: green; /* Green color for ratings */
  font-weight: bold; /* Make it bold to grab attention */
}

.stars {
  color: green; /* Green color for stars */
}

.reviews-count-display {
  margin-left: 5px;
}

.no-reviews-text {
  color: #999;
  font-weight: bold; /* Make "No reviews yet" bold */
}

.view-details {
  display: inline-block;
  background-color: #f7f7f7;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid #ddd;
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

@media (max-width: 768px) {
  .search-inputs {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>
