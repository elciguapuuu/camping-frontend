<template>
  <div class="location-details">
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading location details...</p>
    </div>
    
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <div v-else class="location-content">
      <!-- Image Gallery -->
      <div class="image-gallery">
        <div class="main-image">
          <img 
            :src="currentImage ? `http://localhost:3001${currentImage}` : 'https://via.placeholder.com/600x400?text=No+Image'" 
            :alt="location.name"
          />
        </div>
        <div class="thumbnail-row" v-if="images.length > 1">
          <div 
            v-for="image in images" 
            :key="image.image_id" 
            class="thumbnail"
            :class="{ active: currentImage === image.image_url }"
            @click="currentImage = image.image_url"
          >
            <img :src="`http://localhost:3001${image.image_url}`" :alt="location.name" />
          </div>
        </div>
      </div>
      
      <div class="location-header">
        <div>
          <h2>{{ location.name }}</h2>
          <p class="location-address">{{ location.address }}, {{ location.city }}, {{ location.country }}</p>
          
        </div>
        <div class="location-rating" v-if="averageRating">
          <div class="stars">★ {{ averageRating.toFixed(1) }}</div>
          <div class="reviews-count">({{ reviewsCount }} reviews)</div>
        </div>
      </div>
      
      <div class="location-badges">
        <div class="badge campsite-type" v-for="type in campsiteTypes" :key="'type-'+type.campsitetypes_id">
          {{ type.name }}
        </div>
      </div>
      
      <hr class="divider" />
      
      <div class="location-grid">
        <div class="location-main">
          <div class="description-section">
            <h3>About this location</h3>
            <p>{{ location.description }}</p>
          </div>
          
          <div class="amenities-section">
            <h3>What this place offers</h3>
            <div class="amenities-grid">
              <div class="amenity" v-for="amenity in amenities" :key="'amenity-'+amenity.amenity_id">
                <div class="amenity-icon">✓</div>
                <div class="amenity-name">{{ amenity.name }}</div>
              </div>
            </div>
          </div>
          
          <div class="map-section">
            <h3>Location</h3>
            <div class="map-container">
              <MapComponent 
                v-if="location.latitude && location.longitude"
                :latitude="parseFloat(location.latitude)" 
                :longitude="parseFloat(location.longitude)"
                map-id="location-map"
              />
              <div v-else class="no-map">
                Map location not available
              </div>
            </div>
          </div>
        </div>
        
        <div class="booking-card">
          <div class="booking-card-content">
            <div class="booking-price">
              <span class="price-amount">€{{ location.price_per_night }}</span> night
            </div>
            <div class="booking-rating" v-if="averageRating">
              <span class="stars">★ {{ averageRating.toFixed(1) }}</span>
              <span class="reviews-count">{{ reviewsCount }} reviews</span>
            </div>
            
            <div class="booking-dates">
              <div class="date-inputs">
                <div class="date-input">
                  <label for="check-in">Check in</label>
                  <input type="date" id="check-in" v-model="checkIn" />
                </div>
                <div class="date-input">
                  <label for="check-out">Check out</label>
                  <input type="date" id="check-out" v-model="checkOut" />
                </div>
              </div>
            </div>
            
            <button @click="startBooking" class="booking-btn">
              Reserve
            </button>
            
            <div class="booking-disclaimer">
              You won't be charged yet
            </div>
            
            <div class="booking-breakdown" v-if="checkIn && checkOut">
              <div class="breakdown-item">
                <span>€{{ location.price_per_night }} x {{ nights }} nights</span>
                <span>€{{ totalPrice }}</span>
              </div>
              <div class="breakdown-total">
                <span>Total</span>
                <span>€{{ totalPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <hr class="divider" />
      
      <!-- Reviews Section -->
      <div class="reviews-section">
        <div class="reviews-header">
          <h3>Reviews</h3>
          <div class="rating-summary" v-if="averageRating">
            <div class="average-rating">
              <span class="stars">★ {{ averageRating.toFixed(1) }}</span>
              <span class="reviews-count">{{ reviewsCount }} reviews</span>
            </div>
          </div>
        </div>
        
        <!-- Add Review Form -->
        <div v-if="isAuthenticated && userCanReview" class="add-review">
          <h4>Leave a review</h4>
          <form @submit.prevent="submitReview">
            <div class="rating-input">
              <label>Rating:</label>
              <div class="star-rating">
                <span 
                  v-for="n in 5" 
                  :key="n" 
                  class="star" 
                  :class="{ active: n <= newReview.rating }"
                  @click="newReview.rating = n"
                >★</span>
              </div>
            </div>
            <div class="comment-input">
              <label for="review-comment">Comment:</label>
              <textarea 
                id="review-comment" 
                v-model="newReview.comment"
                placeholder="Share your experience about this place..."
                rows="4"
              ></textarea>
            </div>
            <button type="submit" class="submit-review-btn" :disabled="isSubmittingReview">
              {{ isSubmittingReview ? 'Submitting...' : 'Submit Review' }}
            </button>
          </form>
        </div>
        
        <div v-else-if="isAuthenticated && userHasReviewed" class="review-notice">
          <p>You have already reviewed this location.</p>
        </div>
        
        <div v-else-if="isAuthenticated" class="review-notice">
          <p>You need to have stayed at this location to leave a review.</p>
        </div>
        
        <div v-else class="review-notice">
          <p>Please <router-link to="/login">log in</router-link> to leave a review.</p>
        </div>
        
        <!-- Reviews List -->
        <div v-if="reviews.length === 0" class="no-reviews">
          <p>No reviews yet for this location.</p>
        </div>
        
        <div v-else class="reviews-list">
          <div v-for="review in reviews" :key="review.review_id" class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-name">{{ review.reviewer_name }}</div>
                <div class="review-date">{{ formatDate(review.created_at) }}</div>
              </div>
              <div class="review-rating">
                {{ '★'.repeat(review.overall_rating) }}
              </div>
            </div>
            <div class="review-comment">
              {{ review.review_comment }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import MapComponent from '@/components/MapComponent.vue';

export default {
  name: 'LocationDetailsPage',
  components: {
    MapComponent
  },
  data() {
    return {
      location: {
        name: '',
        description: '',
        price_per_night: 0,
        address: '',
        city: '',
        country: '',
        latitude: 0,
        longitude: 0,
        owner_id: null,
        owner_name: ''
      },
      images: [],
      currentImage: null,
      amenities: [],
      campsiteTypes: [],
      reviews: [],
      isLoading: true,
      errorMessage: null,
      checkIn: '',
      checkOut: '',
      isAuthenticated: false,
      userId: null,
      userBookings: [],
      userCanReview: false,
      userHasReviewed: false,
      newReview: {
        rating: 0,
        comment: '',
        bookingId: null
      },
      isSubmittingReview: false,
      reviewsCount: 0,
      averageRating: 0
    }
  },
  computed: {
    nights() {
      if (!this.checkIn || !this.checkOut) return 0;
      const start = new Date(this.checkIn);
      const end = new Date(this.checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    totalPrice() {
      return (this.nights * parseFloat(this.location.price_per_night)).toFixed(2);
    }
  },
  created() {
    this.checkAuth();
    this.loadLocationDetails();
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
      if (this.isAuthenticated) {
        const userData = JSON.parse(localStorage.getItem('user'));
        this.userId = userData.id;
      }
    },
    
    async loadLocationDetails() {
      try {
        this.isLoading = true;
        const locationId = this.$route.params.id;
        
        // Load location details
        const locationResponse = await axios.get(`http://localhost:3001/locations/${locationId}`);
        this.location = locationResponse.data;
        
        // Load owner information
        if (this.location.owner_id) {
          try {
            const ownerResponse = await axios.get(`http://localhost:3001/users/${this.location.owner_id}`);
            this.location.owner_name = ownerResponse.data.name;
          } catch (ownerError) {
            console.error('Error loading owner information:', ownerError);
          }
        }
        
        // Load images
        const imagesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/images`);
        this.images = imagesResponse.data;
        if (this.images.length > 0) {
          // Use cover image if available, otherwise first image
          const coverImage = this.images.find(img => img.is_cover === 1) || this.images[0];
          this.currentImage = coverImage.image_url;
        }
        
        // Load amenities
        const amenitiesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/amenities`);
        this.amenities = amenitiesResponse.data;
        
        // Load campsite types
        const typesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/campsitetype`);
        this.campsiteTypes = typesResponse.data;
        
        // Load reviews
        await this.loadReviews();
        
        // Check if user can review
        if (this.isAuthenticated) {
          await this.checkUserCanReview();
        }
        
      } catch (error) {
        console.error('Error loading location details:', error);
        this.errorMessage = 'Failed to load location details. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadReviews() {
      try {
        const locationId = this.$route.params.id;
        const reviewsResponse = await axios.get(`http://localhost:3001/reviews/${locationId}`);
        
        // Check if there are reviews
        if (reviewsResponse.data.reviews && reviewsResponse.data.reviews.length > 0) {
          this.reviews = reviewsResponse.data.reviews;
          this.reviewsCount = this.reviews.length;
          
          // Calculate average rating
          const totalRating = this.reviews.reduce((sum, review) => sum + review.overall_rating, 0);
          this.averageRating = totalRating / this.reviews.length;
          
          // Check if user has already reviewed this location
          if (this.isAuthenticated) {
            this.userHasReviewed = this.reviews.some(review => review.user_id === this.userId);
          }
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    },
    
    async checkUserCanReview() {
      try {
        const token = localStorage.getItem('token');
        const locationId = this.$route.params.id;
        
        // Get user's bookings for this location
        const bookingsResponse = await axios.get(`http://localhost:3001/bookings/user/${this.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const completedBookings = bookingsResponse.data.filter(booking => 
          booking.location_id == locationId && 
          booking.status_id === 4  // Assuming 4 is the ID for completed bookings
        );
        
        // User can review if they have at least one completed booking for this location
        this.userCanReview = completedBookings.length > 0 && !this.userHasReviewed;
        
        if (this.userCanReview) {
          // Store the booking ID to use when submitting the review
          this.newReview.bookingId = completedBookings[0].booking_id;
          this.userBookings = completedBookings;
        }
      } catch (error) {
        console.error('Error checking review eligibility:', error);
      }
    },
    
    async submitReview() {
      if (this.newReview.rating === 0) {
        alert('Please select a rating');
        return;
      }
      
      this.isSubmittingReview = true;
      
      try {
        const token = localStorage.getItem('token');
        const locationId = this.$route.params.id;
        
        const reviewData = {
          location_id: locationId,
          booking_id: this.newReview.bookingId,
          overall_rating: this.newReview.rating,
          review_comment: this.newReview.comment
        };
        
        await axios.post('http://localhost:3001/reviews', reviewData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Reset form and reload reviews
        this.newReview.rating = 0;
        this.newReview.comment = '';
        this.userHasReviewed = true;
        this.userCanReview = false;
        
        await this.loadReviews();
        
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    startBooking() {
      if (!this.checkIn || !this.checkOut) {
        alert('Please select check-in and check-out dates');
        return;
      }
      
      // Check if user is logged in
      if (!this.isAuthenticated) {
        // Store booking details in query params to preserve them after login
        this.$router.push({
          path: '/login',
          query: { 
            redirect: `/booking/${this.$route.params.id}`,
            start_date: this.checkIn,
            end_date: this.checkOut
          }
        });
        return;
      }
      
      // Navigate to booking page with dates
      this.$router.push({
        path: `/booking/${this.$route.params.id}`,
        query: {
          start_date: this.checkIn,
          end_date: this.checkOut
        }
      });
    },
    
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
  }
}
</script>

<style scoped>
.location-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42b983;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.image-gallery {
  margin-bottom: 30px;
}

.main-image {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.thumbnail {
  width: 100px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.thumbnail.active {
  opacity: 1;
  border: 2px solid #42b983;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.location-header h2 {
  margin-bottom: 5px;
  font-size: 2rem;
}

.location-address {
  color: #666;
  margin: 0;
}

.location-host {
  font-size: 0.95rem;
  color: #555;
  margin-top: 5px;
}

.location-rating {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stars {
  color: #42b983;
  font-weight: bold;
}

.reviews-count {
  color: #666;
}

.location-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.badge {
  background-color: #e9f5f1;
  color: #42b983;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.divider {
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 30px 0;
}

.location-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 40px;
}

.description-section,
.amenities-section,
.map-section {
  margin-bottom: 30px;
}

.description-section h3,
.amenities-section h3,
.map-section h3 {
  margin-bottom: 15px;
}

.amenities-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.amenity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.amenity-icon {
  color: #42b983;
  font-weight: bold;
}

.map-container {
  border-radius: 12px;
  overflow: hidden;
  height: 300px;
  width: 100%;
}

.no-map {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f8f9fa;
  color: #666;
  font-size: 1.1rem;
}

.location-map {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.booking-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.booking-card-content {
  padding: 20px;
}

.booking-price {
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.price-amount {
  font-size: 1.5rem;
  font-weight: bold;
}

.booking-rating {
  margin-bottom: 20px;
}

.booking-dates {
  margin-bottom: 20px;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.date-input {
  padding: 10px;
}

.date-input:first-child {
  border-right: 1px solid #ddd;
}

.date-input label {
  display: block;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.date-input input {
  width: 100%;
  border: none;
  font-size: 1rem;
  background: transparent;
}

.booking-btn {
  width: 100%;
  padding: 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
}

.booking-disclaimer {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.booking-breakdown {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.breakdown-total {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

/* Reviews Section */
.reviews-section {
  margin-top: 30px;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-review {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.add-review h4 {
  margin-bottom: 15px;
}

.rating-input {
  margin-bottom: 15px;
}

.star-rating {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.star {
  font-size: 24px;
  color: #ddd;
  cursor: pointer;
}

.star.active {
  color: #ffc107;
}

.comment-input {
  margin-bottom: 15px;
}

.comment-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
}

.submit-review-btn {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.review-notice {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: center;
}

.no-reviews {
  text-align: center;
  color: #666;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.reviewer-name {
  font-weight: bold;
}

.review-date {
  font-size: 0.9rem;
  color: #666;
}

.review-rating {
  color: #ffc107;
  font-weight: bold;
}

.review-comment {
  color: #333;
  line-height: 1.5;
}

@media (max-width: 950px) {
  .location-grid {
    grid-template-columns: 1fr;
  }
  
  .booking-card {
    position: static;
  }
}

@media (max-width: 600px) {
  .main-image {
    height: 300px;
  }
  
  .location-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .location-rating {
    margin-top: 10px;
  }
  
  .amenities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
