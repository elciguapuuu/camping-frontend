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
            :src="currentImage ? currentImage : 'https://via.placeholder.com/600x400?text=No+Image'" 
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
            <img :src="image.image_url" :alt="location.name" />
          </div>
        </div>
      </div>
      
      <div class="location-header">
        <div>
          <h2>{{ location.name }}</h2>
          <p class="location-address">{{ location.address }}</p>
          
        </div>
        <div class="location-rating" v-if="displayOverallRating">
          <div class="stars">★ {{ displayOverallRating }}</div>
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
                :locations="[{ latitude: parseFloat(location.latitude), longitude: parseFloat(location.longitude), name: location.name, location_id: location.location_id }]" 
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
              <!-- Display adjusted_price_per_night if available, else base price -->
              <span class="price-amount">
                €{{ location.adjusted_price_per_night !== null ? location.adjusted_price_per_night.toFixed(2) : parseFloat(location.price_per_night).toFixed(2) }}
              </span> night
            </div>
            
            <!-- Date Conflict Message -->
            <div v-if="dateConflictMessage" class="date-conflict-notice error-message">
              {{ dateConflictMessage }}
            </div>
            
            <div class="booking-dates">
              <label class="date-label">Select Dates:</label>
              <v-date-picker 
                v-model="dateRange" 
                is-range 
                :min-date="new Date()" 
                :masks="{ input: 'YYYY-MM-DD' }" 
                class="date-picker-full-width"
                :attributes="calendarAttributes"
                :disabled-dates="allDisabledDatesForCalendar" 
                @dayclick="onDayClick"
              >
                <template v-slot="{ inputValue, inputEvents, isDragging }">
                  <div class="date-picker-input-container">
                    <input
                      class="date-picker-input-field"
                      placeholder="Check-in"
                      :value="inputValue.start"
                      v-on="inputEvents.start"
                    />
                    <span class="date-separator">→</span>
                    <input
                      class="date-picker-input-field"
                      placeholder="Check-out"
                      :value="inputValue.end"
                      v-on="inputEvents.end"
                      :class="{ 'is-dragging': isDragging }"
                    />
                  </div>
                </template>
              </v-date-picker>
            </div>

            <!-- Number of Guests Input -->
            <div class="booking-guests">
              <label for="numberOfGuestsInput" class="guest-label">Number of Guests (Max: {{ location.max_guests || 'N/A' }}):</label>
              <input 
                type="number" 
                id="numberOfGuestsInput" 
                v-model.number="numberOfGuests" 
                min="1" 
                :max="location.max_guests || undefined" 
                @change="handleGuestOrDateChange" 
                class="guest-input-field"
              />
            </div>
            
            <button @click="startBooking" class="booking-btn" :disabled="!dateRange.start || !dateRange.end || numberOfGuests <= 0">
              Book Now
            </button>
            
            <div class="booking-disclaimer">
              You won't be charged yet
            </div>
            
            <div class="booking-breakdown" v-if="dateRange.start && dateRange.end && numberOfGuests > 0">
              <div class="breakdown-item">
                <!-- Use adjusted price for breakdown -->
                <span>€{{ location.adjusted_price_per_night ? location.adjusted_price_per_night.toFixed(2) : '0.00' }} x {{ nights }} nights</span>
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
        </div>
        
        <!-- Add/Edit Review Form -->
        <div v-if="isAuthenticated && userCanReview" class="add-review">
          <h4>{{ isEditingReview ? 'Edit Your Review' : 'Leave a review' }}</h4>
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
                :placeholder="isEditingReview ? 'Update your experience...' : 'Share your experience about this place...'"
                rows="4"
              ></textarea>
            </div>
            <button type="submit" class="submit-review-btn" :disabled="isSubmittingReview">
              {{ isSubmittingReview ? (isEditingReview ? 'Updating...' : 'Submitting...') : (isEditingReview ? 'Update Review' : 'Submit Review') }}
            </button>
            <button 
              type="button" 
              v-if="isEditingReview" 
              @click="cancelEditReview" 
              class="cancel-review-btn"
              :disabled="isSubmittingReview"
              style="margin-left: 10px; background-color: #f44336; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;"
            >
              Cancel
            </button>
          </form>
        </div>
        
        <!-- Notice: Already Reviewed (and not currently editing that review) -->
        <div v-else-if="isAuthenticated && userHasReviewed && !isEditingReview" class="review-notice">
          <p>You have already reviewed this location.</p>
        </div>
        
        <!-- Notice: Cannot review (e.g., no completed booking, and not already reviewed) -->
        <div v-else-if="isAuthenticated && !userHasReviewed" class="review-notice"> 
          <p>You need to have stayed at this location and the booking must be completed to leave a review.</p>
        </div>
        
        <!-- Notice: Not Logged In -->
        <div v-else-if="!isAuthenticated" class="review-notice">
          <p>Please <router-link to="/login">log in</router-link> to leave a review.</p>
        </div>
        
        <!-- Reviews List -->
        <div v-if="reviews.length === 0 && !isLoading" class="no-reviews">
          <p>No reviews yet for this location.</p>
        </div>
        
        <div v-else class="reviews-list">
          <div v-for="review in reviews" :key="review.review_id" class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <img v-if="review.user_profile_picture_url" :src="review.user_profile_picture_url" alt="Reviewer profile picture" class="reviewer-profile-pic">
                <img v-else src="@/assets/logo.png" alt="Default profile picture" class="reviewer-profile-pic">
                <div class="reviewer-details">
                  <div class="reviewer-name">{{ review.reviewer_name }}</div>
                  <div class="review-date">{{ formatDate(review.created_at) }}</div>
                </div>
              </div>
              <div class="review-rating">
                {{ '★'.repeat(review.overall_rating) }}
              </div>
            </div>
            <div class="review-comment">
              {{ review.review_comment }}
            </div>
            <button 
              v-if="isAuthenticated && review.user_id === userId && !isEditingReview" 
              @click="startEditReview(review)" 
              class="edit-review-btn-inline action-btn btn-small"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import MapComponent from '@/components/MapComponent.vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/src/styles/base.css';

export default {
  name: 'LocationDetailsPage',
  components: {
    MapComponent,
    VDatePicker: DatePicker,
  },
  data() {
    return {
      location: {
        name: '',
        description: '',
        price_per_night: 0,
        adjusted_price_per_night: null, 
        address: '',
        city: '',
        country: '',
        latitude: 0,
        longitude: 0,
        owner_id: null,
        owner_name: '',
        average_rating: 0,
        total_reviews: 0,
        max_guests: null // Added max_guests
      },
      images: [],
      currentImage: null,
      amenities: [],
      campsiteTypes: [],
      reviews: [],
      isLoading: true,
      errorMessage: null,
      dateRange: {
        start: null,
        end: null,
      },
      numberOfGuests: 1, // Added for number of guests
      bookedDates: [],
      calendarAttributes: [],
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
      isEditingReview: false, // To track if user is editing a review
      editingReviewId: null, // To store the ID of the review being edited
      dateConflictMessage: null, // Added for date conflict notification
    }
  },
  computed: {
    nights() {
      if (!this.dateRange.start || !this.dateRange.end) return 0;
      const start = new Date(this.dateRange.start);
      const end = new Date(this.dateRange.end);
      if (end <= start) return 0; // Ensure checkout is after checkin
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    totalPrice() {
      const adjustedPrice = this.location.adjusted_price_per_night;
      const numNights = this.nights; // nights() computed prop already handles invalid dateRange

      if (adjustedPrice === null || isNaN(adjustedPrice) || adjustedPrice < 0 || numNights <= 0) {
        // Allow adjustedPrice to be 0 if basePrice is 0
        // If nights is 0 or adjustedPrice is invalid (null, NaN, negative), total is 0.00
        return '0.00';
      }
      return (adjustedPrice * numNights).toFixed(2);
    },
    // Computed properties to use location's average_rating and total_reviews
    averageRating() {
      return this.location.average_rating ? parseFloat(this.location.average_rating) : 0;
    },
    reviewsCount() {
      // Use total_reviews from the location object if available, otherwise fallback to loaded reviews length
      if (this.location && typeof this.location.total_reviews === 'number') {
        return this.location.total_reviews;
      }
      return this.reviews ? this.reviews.length : 0;
    },
    displayOverallRating() {
      // Use the average_rating fetched with the location data for consistency
      if (this.location && typeof this.location.average_rating === 'number') {
        // Ensure it's a number and format to one decimal place
        const avgRating = parseFloat(this.location.average_rating);
        return avgRating.toFixed(1);
      }
      // Fallback if average_rating is not available on location object (should not happen if API is consistent)
      // Or if we want to calculate fresh from loaded reviews (less consistent with other pages)
      if (this.reviews && this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.overall_rating, 0);
        const average = totalRating / this.reviews.length;
        return parseFloat(average.toFixed(1));
      }
      return null; // Or a default like 'N/A' or 0.0
    },
    userReview() {
      if (!this.isAuthenticated || !this.reviews || this.reviews.length === 0) {
        return null;
      }
      return this.reviews.find(review => review.user_id === this.userId);
    },
    allDisabledDatesForCalendar() {
      // Combine booked dates for the v-calendar disabled-dates prop
      const disabledRanges = [];
      this.bookedDates.forEach(range => {
        if (range && range.start && range.end && range.end >= range.start) { // Added validation
          disabledRanges.push({ start: range.start, end: range.end });
        }
      });
      // ownerUnavailabilities.forEach removed
      // console.log('[LocationDetailsPage] allDisabledDatesForCalendar computed (booked only):', JSON.parse(JSON.stringify(disabledRanges.map(r => ({start: r.start && r.start.toISOString().split('T')[0], end: r.end && r.end.toISOString().split('T')[0]})))));
      return disabledRanges;
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
    
    initializeDatesAndGuestsFromQuery() { 
      const query = this.$route.query;
      console.log('[LDP] initializeDatesAndGuestsFromQuery: route query.guests =', query.guests);
      // Date initialization
      if (query.start_date && query.end_date) {
        const startDate = new Date(query.start_date + 'T00:00:00');
        const endDate = new Date(query.end_date + 'T00:00:00');
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
          this.dateRange = { start: startDate, end: endDate };
          console.log('[LocationDetailsPage] Dates initialized from query:', this.dateRange);
        } else {
          console.warn('[LocationDetailsPage] Invalid or inconsistent date range from query parameters:', query.start_date, query.end_date);
          this.dateRange = { start: null, end: null }; // Reset if invalid
        }
      } else {
        console.log('[LocationDetailsPage] No start_date/end_date in query for date picker initialization.');
      }

      // Guest initialization
      if (query.guests) {
        const guestsFromQuery = parseInt(query.guests, 10);
        if (!isNaN(guestsFromQuery) && guestsFromQuery > 0) {
          this.numberOfGuests = guestsFromQuery;
        } else {
          console.warn(`[LDP] initializeDatesAndGuestsFromQuery: Invalid guests in query ('${query.guests}'). Defaulting to 1.`);
          this.numberOfGuests = 1; 
        }
      } else {
        this.numberOfGuests = 1; // Default if not provided
        console.log('[LDP] initializeDatesAndGuestsFromQuery: No guests in query. Defaulting to 1.');
      }
      console.log(`[LDP] initializeDatesAndGuestsFromQuery: this.numberOfGuests set to = ${this.numberOfGuests} (type: ${typeof this.numberOfGuests})`);
    },

    checkInitialDateConflict() {
      if (!this.dateRange.start || !this.dateRange.end) {
        this.dateConflictMessage = null; // No selected range to check
        return;
      }

      const selectedStart = new Date(this.dateRange.start); 
      const selectedEnd = new Date(this.dateRange.end);     

      if (this.calendarAttributes.length === 0 && (this.bookedDates.length > 0)) {
        this.prepareCalendarAttributes();
      }

      for (const disabledPeriod of this.allDisabledDatesForCalendar) {
        const disabledStart = new Date(disabledPeriod.start);
        const disabledEnd = new Date(disabledPeriod.end);

        if (selectedStart <= disabledEnd && selectedEnd >= disabledStart) {
          const formattedQueryStart = this.formatDateToString(selectedStart);
          const formattedQueryEnd = this.formatDateToString(selectedEnd);
          this.dateConflictMessage = `The dates (${formattedQueryStart} to ${formattedQueryEnd}) you selected from your previous search are not available for this location. Please choose different dates.`;
          console.warn('[LocationDetailsPage] Date conflict detected with query dates:', this.dateRange, 'and disabled period:', disabledPeriod);
          return; 
        }
      }
      this.dateConflictMessage = null; // No conflicts found
      console.log('[LocationDetailsPage] No date conflicts found for query dates:', this.dateRange);
    },

    handleGuestOrDateChange() {
      // Ensure numberOfGuests does not exceed max_guests
      if (this.location.max_guests && this.numberOfGuests > this.location.max_guests) {
        this.numberOfGuests = this.location.max_guests;
      }
      // Ensure numberOfGuests is at least 1
      if (this.numberOfGuests < 1) {
        this.numberOfGuests = 1;
      }
      console.log(`[LDP] handleGuestOrDateChange: this.numberOfGuests BEFORE calculateAdjustedPrice = ${this.numberOfGuests} (type: ${typeof this.numberOfGuests})`);
      this.calculateAdjustedPrice();
      console.log(`[LDP] handleGuestOrDateChange: this.numberOfGuests AFTER calculateAdjustedPrice = ${this.numberOfGuests} (type: ${typeof this.numberOfGuests})`);
    },

    calculateAdjustedPrice() {
      const basePrice = parseFloat(this.location.price_per_night);
      const numGuests = parseInt(this.numberOfGuests, 10);
      let newAdjustedPrice = null;

      if (isNaN(basePrice) || basePrice < 0) { // Allow basePrice to be 0
        this.location = { ...this.location, adjusted_price_per_night: null };
        // console.log('[LDP] calculateAdjustedPrice: Invalid basePrice, adjusted_price_per_night set to null');
        return;
      }

      if (isNaN(numGuests) || numGuests <= 0) {
        // If guests are invalid or 0, calculate price for 1 guest as a default behavior
        newAdjustedPrice = basePrice;
        // console.log(`[LDP] calculateAdjustedPrice: Invalid numGuests (${this.numberOfGuests}), defaulting to basePrice for 1 guest: ${newAdjustedPrice}`);
      } else if (numGuests === 1) {
        newAdjustedPrice = basePrice;
        // console.log(`[LDP] calculateAdjustedPrice: numGuests is 1, newAdjustedPrice is basePrice: ${newAdjustedPrice}`);
      } else { // numGuests > 1
        newAdjustedPrice = basePrice + (numGuests - 1) * basePrice * 0.45;
        // console.log(`[LDP] calculateAdjustedPrice: numGuests is ${numGuests}, newAdjustedPrice with surcharge: ${newAdjustedPrice}`);
      }
      
      this.location = { 
        ...this.location, 
        adjusted_price_per_night: newAdjustedPrice !== null ? parseFloat(newAdjustedPrice.toFixed(2)) : null
      };
      // console.log('[LDP] calculateAdjustedPrice: Final this.location.adjusted_price_per_night =', this.location.adjusted_price_per_night);
    },

    async loadLocationDetails() {
      console.log('[LocationDetailsPage] loadLocationDetails started. Location ID:', this.$route.params.id);
      try {
        this.isLoading = true;
        const locationId = this.$route.params.id;
        
        this.initializeDatesAndGuestsFromQuery(); // Updated to include guests
        
        console.log('[LocationDetailsPage] Fetching location details...');
        const locationResponse = await axios.get(`http://localhost:3001/locations/${locationId}`);
        console.log('[LocationDetailsPage] Location details response:', JSON.parse(JSON.stringify(locationResponse.data)));
        this.location = locationResponse.data;
        
        this.calculateAdjustedPrice(); // Calculate adjusted price after location data is loaded

        if (this.location.owner_id) {
          try {
            console.log('[LocationDetailsPage] Fetching owner information for owner_id:', this.location.owner_id);
            const ownerResponse = await axios.get(`http://localhost:3001/users/${this.location.owner_id}`);
            console.log('[LocationDetailsPage] Owner information response:', JSON.parse(JSON.stringify(ownerResponse.data)));
            this.location.owner_name = ownerResponse.data.name;
          } catch (ownerError) {
            console.error('[LocationDetailsPage] Error loading owner information:', ownerError);
          }
        }
        
        console.log('[LocationDetailsPage] Fetching images...');
        const imagesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/images`);
        this.images = imagesResponse.data;
        if (this.images && this.images.length > 0) {
          const coverImage = this.images.find(img => img.is_cover === 1 || img.is_cover === true) || this.images[0];
          this.currentImage = coverImage.image_url;
        } else {
          this.currentImage = null;
        }
        
        console.log('[LocationDetailsPage] Fetching amenities...');
        const amenitiesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/amenities`);
        this.amenities = amenitiesResponse.data;
        
        console.log('[LocationDetailsPage] Fetching campsite types...');
        const typesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/campsitetype`);
        this.campsiteTypes = typesResponse.data;
        
        console.log('[LocationDetailsPage] Loading reviews...');
        await this.loadReviews();

        // Fetch booked dates (owner unavailabilities call removed)
        console.log('[LocationDetailsPage] Starting to load booked dates...');
        // await Promise.all([ // Promise.all removed as only one async call here now
        //   this.loadBookedDates(locationId),
        //   // this.loadOwnerUnavailabilities(locationId) // REMOVED
        // ]);
        await this.loadBookedDates(locationId);
        console.log('[LocationDetailsPage] Finished loading booked dates.');
        
        // Prepare calendar attributes AFTER all date data is loaded and processed
        this.prepareCalendarAttributes();
        
        this.checkInitialDateConflict();
        
        if (this.isAuthenticated) {
          console.log('[LocationDetailsPage] Checking if user can review...');
          await this.checkUserCanReview();
        }
        console.log('[LocationDetailsPage] loadLocationDetails successfully finished.');
        
      } catch (error) {
        console.error('[LocationDetailsPage] Error loading location details:', error);
        this.errorMessage = 'Failed to load location details. Please try again.';
      } finally {
        this.isLoading = false;
        console.log('[LocationDetailsPage] loadLocationDetails finished (finally block).');
      }
    },
    
    async loadReviews() {
      try {
        const locationId = this.$route.params.id;
        const reviewsResponse = await axios.get(`http://localhost:3001/reviews/${locationId}`);
        
        if (reviewsResponse.data.reviews && reviewsResponse.data.reviews.length > 0) {
          this.reviews = reviewsResponse.data.reviews;
          if (this.isAuthenticated) {
            this.userHasReviewed = this.reviews.some(review => review.user_id === this.userId);
          }
        } else {
          this.reviews = [];
          this.userHasReviewed = false; 
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        this.userHasReviewed = false; 
      }
    },
    
    async loadBookedDates(locationId) {
      try {
        const config = {};
        if (this.isAuthenticated) {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers = { Authorization: `Bearer ${token}` };
          } else {
            console.warn('[LocationDetailsPage] User is authenticated but token is missing for loadBookedDates.');
            // Not throwing an error here, to see if backend allows unauthenticated or if 401 is solely due to missing token
          }
        }
        // If not authenticated, or token is missing, request goes without Authorization header.
        // Backend will return 401 if it's required and not provided.

        const response = await axios.get(`http://localhost:3001/bookings/location/${locationId}/booked-dates`, config);
        this.bookedDates = response.data.map(dateRange => ({
          start: new Date(dateRange.start_date),
          end: new Date(dateRange.end_date),
        }));
      } catch (error) {
        console.error('Error loading booked dates:', error);
        this.bookedDates = []; // Reset on error
        if (error.response && error.response.status === 401) {
          console.warn('[LocationDetailsPage] Unauthorized to load booked dates. User might need to log in again or token is invalid.');
          // Consider further actions like redirecting to login or clearing auth state if this persists
        }
      }
    },

    prepareCalendarAttributes() {
      const attributes = [];
      
      this.bookedDates.forEach((range, index) => {
        if (range && range.start && range.end) {
          attributes.push({
            key: `booked-${index}`,
            highlight: {
              color: 'red',
              fillMode: 'light',
              style: {
                opacity: 0.7, 
              },
            },
            dates: { start: range.start, end: range.end },
            popover: { label: 'Booked', visibility: 'hover' },
          });
        }
      });

      // ownerUnavailabilities.forEach loop REMOVED

      this.calendarAttributes = attributes;
      // console.log('[LocationDetailsPage] Prepared calendarAttributes (booked only):', JSON.parse(JSON.stringify(this.calendarAttributes.map(attr => ({key: attr.key, dates: {start: attr.dates.start.toISOString().split('T')[0], end: attr.dates.end.toISOString().split('T')[0]}}))));
    },

    onDayClick(day) {
      // Optional: handle day click if needed, for example, to show info
      console.log('Day clicked:', day.date);
      // Note: `v-model` with `is-range` handles selection, so this is mostly for additional logic.
    },

    async checkUserCanReview() {
      try {
        const token = localStorage.getItem('token');
        const locationId = parseInt(this.$route.params.id); 

        // Ensure userHasReviewed is based on the latest reviews data
        this.userHasReviewed = this.reviews.some(review => review.user_id === this.userId);
        
        const bookingsResponse = await axios.get(`http://localhost:3001/bookings/user/${this.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const completedBookings = bookingsResponse.data.filter(booking => 
          booking.location_id === locationId && 
          booking.status_id === 3  // Assuming 3 is 'completed'
        );
        
        if (this.isEditingReview) {
          this.userCanReview = true;
        } else {
          this.userCanReview = completedBookings.length > 0 && !this.userHasReviewed;
        }
        
        if (this.userCanReview && !this.isEditingReview) { 
          const suitableBooking = completedBookings.find(b => 
            !this.reviews.some(r => r.booking_id === b.booking_id)
          );
          if (suitableBooking) {
            this.newReview.bookingId = suitableBooking.booking_id;
          } else {
            // This might happen if all completed bookings are reviewed,
            // but userHasReviewed should catch this for the location overall.
            // Or if there are completed bookings but somehow userHasReviewed is false,
            // and no specific unreviewed booking is found.
            // For safety, if no suitable booking_id is found for a NEW review, prevent showing the form.
            if (!this.userHasReviewed) this.userCanReview = false;
          }
        }
      } catch (error) {
        console.error('Error checking review eligibility:', error);
        // Do not alter userCanReview here on error, let previous state persist or rely on defaults
      }
    },

    startEditReview(reviewToEdit) {
      if (!reviewToEdit && this.userReview) { 
        reviewToEdit = this.userReview;
      }
      if (reviewToEdit) {
        this.isEditingReview = true;
        this.editingReviewId = reviewToEdit.review_id;
        this.newReview.rating = reviewToEdit.overall_rating;
        this.newReview.comment = reviewToEdit.review_comment;
        this.newReview.bookingId = reviewToEdit.booking_id; 
        this.userCanReview = true; 
        this.$nextTick(() => {
          const reviewForm = document.querySelector('.add-review');
          if (reviewForm) {
            reviewForm.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else {
        console.error("Could not find the user's review to edit.");
      }
    },

    cancelEditReview() {
      this.isEditingReview = false;
      this.editingReviewId = null;
      this.newReview.rating = 0;
      this.newReview.comment = '';
      this.newReview.bookingId = null;
      // Re-evaluate user's ability to post a new review or see "already reviewed" message
      this.checkUserCanReview(); 
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
        
        if (this.isEditingReview && this.editingReviewId) {
          await axios.put(`http://localhost:3001/reviews/${this.editingReviewId}`, {
            overall_rating: this.newReview.rating,
            review_comment: this.newReview.comment
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          await axios.post('http://localhost:3001/reviews', {
            location_id: locationId,
            booking_id: this.newReview.bookingId, 
            overall_rating: this.newReview.rating,
            review_comment: this.newReview.comment
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        this.newReview.rating = 0;
        this.newReview.comment = '';
        this.newReview.bookingId = null;
        this.isEditingReview = false;
        this.editingReviewId = null;
        
        await this.loadLocationDetails(); // This reloads reviews and re-checks eligibility

      } catch (error) {
        console.error('Error submitting/updating review:', error);
        alert('Failed to submit/update review. ' + (error.response?.data?.error || 'Please try again.'));
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    formatDateToString(date) {
      if (!date) return '';
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    startBooking() {
      if (!this.dateRange.start || !this.dateRange.end) {
        alert('Please select check-in and check-out dates.');
        return;
      }
      if (this.dateConflictMessage) {
        alert(this.dateConflictMessage); 
        return;
      }

      const numGuests = parseInt(this.numberOfGuests, 10);
      if (isNaN(numGuests) || numGuests <= 0) {
        alert('Please enter a valid number of guests.');
        return;
      }

      // Ensure adjusted_price_per_night is up-to-date before booking
      this.calculateAdjustedPrice(); 

      this.$router.push({
        name: 'PurchaseBookingPage', 
        params: { locationId: this.location.location_id },
        query: {
          start_date: this.formatDateToString(this.dateRange.start),
          end_date: this.formatDateToString(this.dateRange.end),
          guests: this.numberOfGuests, 
          price_per_night: this.location.price_per_night, // Base price per night for one guest
          total_price: this.totalPrice // Total calculated price for all guests and nights
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

.date-conflict-notice {
  /* Inherits from .error-message, but you can add specific styles if needed */
  margin-top: 0; /* Adjust if it's inside booking-card-content */
  margin-bottom: 15px; /* Space before the date picker */
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
  color: green; /* Changed to green */
  font-weight: bold;
  font-size: 20px;
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
}

.map-section .map-container {
  height: 400px; /* Explicit height for the map container */
  width: 100%;
  border-radius: 12px;
  overflow: hidden; /* Ensures content fits within rounded borders */
  position: relative; /* For potential internal absolute positioning if needed by map lib */
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

.booking-dates {
  margin-bottom: 20px;
}

.date-inputs {
  /* This class can be removed or restyled as v-date-picker now handles the layout */
  /* display: grid; */
  /* grid-template-columns: 1fr 1fr; */
  /* border: 1px solid #ddd; */
  /* border-radius: 8px; */
  /* overflow: hidden; */
  margin-bottom: 15px; /* Add some spacing if needed */
}

/* .date-input class removed as it was empty and causing a linting error */

/* .date-input:first-child {
  border-right: 1px solid #ddd;
} */

.date-label {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.date-picker-full-width {
  width: 100%;
}

.date-picker-input-container {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5em;
}

.date-picker-input-field {
  border: none;
  padding: 0.5em;
  text-align: center;
  flex-grow: 1;
  width: 100px; /* Adjust as needed */
}

.date-picker-input-field:focus {
  outline: none;
}

.date-separator {
  margin: 0 0.5em;
}

.is-dragging {
  background-color: #f0f0f0;
}

.booking-btn {
  width: 100%;
  padding: 15px;
  background-color: #009a15;
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
  color: green;
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
  border: 1px solid #ddd; /* Added border */
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
  color: green; /* Changed to green */
  font-weight: bold;
}

.review-comment {
  color: #333;
  line-height: 1.5;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between picture and text */
}

.reviewer-profile-pic {
  width: 40px; 
  height: 40px; 
  border-radius: 50%; 
  object-fit: cover; 
}

.reviewer-details {
  display: flex;
  flex-direction: column;
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

.map-container {
  height: 300px; /* Ensure map container has a defined height */
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
  margin-top: 15px;
}

.no-map {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #777;
  background-color: #f9f9f9;
}

.edit-review-btn-inline {
  margin-top: 10px; /* Adds space above the button */
  padding: 6px 12px; /* Adjust padding for a good size */
  font-size: 0.875rem; /* Slightly smaller font */
  background-color: #4CAF50; /* A pleasant green for edit actions */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.edit-review-btn-inline:hover {
  background-color: #45a049; /* Darker green on hover */
}

/* Styles for v-calendar disabled dates */
:deep(.vc-day.is-disabled) {
  background-color: #e0e0e0 !important; /* Slightly darker grey for better visibility */
  color: #a0a0a0 !important; /* Dimmer text color */
  text-decoration: line-through !important;
  pointer-events: none !important; /* Makes the day unclickable */
  border-radius: 0 !important; /* Optional: remove rounded corners if they conflict */
}

/* Ensure highlights for booked/unavailable are still visible but disabled days override */
/* This rule might be needed if highlights are somehow still showing on disabled days */
:deep(.vc-day.is-disabled .vc-highlight) {
  display: none !important; /* Hide highlights if the day itself is disabled */
}
</style>
