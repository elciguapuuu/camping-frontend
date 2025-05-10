<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <h1>Welcome to Seeker</h1>
        <p class="hero-subtitle">Find your perfect camping destination</p>
        
        <div class="search-container">
          <div class="search-form">
            <h2>Find Camping Spots</h2>
            <div class="search-inputs">
              <input type="text" v-model="searchLocation" placeholder="City or Country">
              <input type="date" v-model="checkIn" placeholder="Check-in">
              <input type="date" v-model="checkOut" placeholder="Check-out">
              <button @click="searchLocations" class="search-btn">Search</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="featured-locations container" v-if="featuredLocations.length > 0">
      <h2>Featured Camping Spots</h2>
      <div class="locations-grid">
        <div v-for="location in featuredLocations" :key="location.location_id" class="location-card">
          <div class="location-image">
            <img 
              v-if="location.coverImage" 
              :src="`http://localhost:3001${location.coverImage}`" 
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
            <p class="location-price">€{{ location.price_per_night }} per night</p>
            
            <div class="campsite-types" v-if="location.campsiteTypes && location.campsiteTypes.length">
              <span><strong>Types:</strong> {{ getCampsiteTypesList(location) }}</span>
            </div>
            
            <router-link :to="`/location/${location.location_id}`" class="view-details">View Details</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomePage',
  data() {
    return {
      isAuthenticated: false,
      searchLocation: '',
      checkIn: '',
      checkOut: '',
      featuredLocations: []
    }
  },
  created() {
    this.checkAuth();
    this.loadFeaturedLocations();
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
    },
    loadFeaturedLocations() {
      axios.get('http://localhost:3001/locations')
        .then(response => {
          // Get up to 6 random locations for the homepage
          this.featuredLocations = response.data
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);
          this.loadLocationImages(this.featuredLocations);
        })
        .catch(error => {
          console.error('Error loading featured locations:', error);
        });
    },
    searchLocations() {
      // Build query params
      const queryParams = {};
      
      if (this.searchLocation) {
        // search name, city and country
        queryParams.query = this.searchLocation;
      }
      
      //if the checkin checkout dates are available, display the results
      if (this.checkIn && this.checkOut) {
        queryParams.start_date = this.checkIn;
        queryParams.end_date = this.checkOut;
      }
      
      // Navigate to search results page with query params
      this.$router.push({ 
        path: '/search', 
        query: queryParams
      });
    },
    getImageUrl(location) {
      if (location.coverImage) {
        return `http://localhost:3001${location.coverImage}`;
      } else {
        return 'https://via.placeholder.com/300x200?text=No+Image';
      }
    },
    loadLocationImages(locations) {
      // For each location, fetch its images and campsite types
      locations.forEach(async (location) => {
        try {
          // Get location images
          const imageResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/images`
          );
          
          if (imageResponse.data && imageResponse.data.length > 0) {
            // Find cover image (is_cover=1) or use first image
            const coverImage = imageResponse.data.find(img => img.is_cover === 1) || imageResponse.data[0];
            // use this special syntax to update array item property
            this.$set(location, 'coverImage', coverImage.image_url);
          }
          
          // Get campsite types
          const typesResponse = await axios.get(
            `http://localhost:3001/locations/${location.location_id}/campsitetype`
          );
          
          if (typesResponse.data && typesResponse.data.length > 0) {
            this.$set(location, 'campsiteTypes', typesResponse.data);
          }
        } catch (error) {
          console.error(`Error loading data for ${location.name}:`, error);
        }
      });
    },
    getCampsiteTypesList(location) {
      if (!location.campsiteTypes || !location.campsiteTypes.length) {
        return 'No type specified';
      }
      return location.campsiteTypes.map(type => type.name).join(', ');
    }
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

.search-inputs input {
  flex: 1;
  min-width: 120px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-btn {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
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
