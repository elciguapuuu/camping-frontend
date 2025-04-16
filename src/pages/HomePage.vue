<template>
  <div class="home">
    <div class="auth-buttons" v-if="!isAuthenticated">
      <router-link to="/login" class="auth-btn login">Log In</router-link>
      <router-link to="/register" class="auth-btn register">Register</router-link>
    </div>
    
    <h1>Welcome to Seeker</h1>
    <p>Find your perfect camping destination</p>
    
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
    
    <div class="featured-locations" v-if="featuredLocations.length > 0">
      <h2>Featured Camping Spots</h2>
      <div class="locations-grid">
        <div v-for="location in featuredLocations" :key="location.location_id" class="location-card">
          <div class="location-image">
            <img :src="location.image_url || 'https://via.placeholder.com/300x200?text=No+Image'" alt="Location image">
          </div>
          <div class="location-info">
            <h3>{{ location.name }}</h3>
            <p class="location-area">{{ location.city }}, {{ location.country }}</p>
            <p class="location-price">€{{ location.price_per_night }} per night</p>
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
        })
        .catch(error => {
          console.error('Error loading featured locations:', error);
        });
    },
    searchLocations() {
      // Build query params
      const queryParams = new URLSearchParams();
      
      if (this.searchLocation) {
        // Try to determine if input is a city or country
        queryParams.append('city', this.searchLocation);
        queryParams.append('country', this.searchLocation);
      }
      
      if (this.checkIn && this.checkOut) {
        queryParams.append('start_date', this.checkIn);
        queryParams.append('end_date', this.checkOut);
      }
      
      // Navigate to search results page with query params
      this.$router.push({ 
        path: '/search', 
        query: queryParams
      });
    }
  }
}
</script>

<style scoped>
.home {
  position: relative;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.auth-buttons {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
}

.auth-btn {
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
}

.login {
  background-color: #2c3e50;
  color: white;
}

.register {
  background-color: #42b983;
  color: white;
}

.auth-btn:hover {
  opacity: 0.9;
}

.search-container {
  margin: 40px 0;
  background-color: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.search-form h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.search-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.search-inputs input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1 1 200px;
}

.search-btn {
  padding: 12px 24px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  flex: 0 0 auto;
}

.featured-locations {
  margin-top: 60px;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.location-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.location-card:hover {
  transform: translateY(-5px);
}

.location-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.location-info {
  padding: 15px;
  text-align: left;
}

.location-area {
  color: #666;
  margin: 5px 0;
}

.location-price {
  font-weight: bold;
  color: #42b983;
  margin: 10px 0;
}

.view-details {
  display: inline-block;
  padding: 8px 16px;
  background-color: #2c3e50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
