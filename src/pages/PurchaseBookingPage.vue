<template>
  <div class="purchase-booking">
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading booking information...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="booking-container">
      <h2>Complete Your Booking</h2>

      <div class="booking-grid">
        <!-- Booking Form Section -->
        <div class="booking-form-section">
          <div class="location-preview">
            <img 
              v-if="location.coverImage" 
              :src="`http://localhost:3001${location.coverImage}`" 
              :alt="location.name"
              class="location-image"
            />
            <div class="location-details">
              <h3>{{ location.name }}</h3>
              <p>{{ location.city }}, {{ location.country }}</p>
              <div class="campsite-type" v-if="location.campsiteTypes && location.campsiteTypes.length">
                {{ location.campsiteTypes.map(type => type.name).join(', ') }}
              </div>
            </div>
          </div>

          <form @submit.prevent="handleBooking">
            <div class="form-section">
              <h3 class="section-title">Booking Dates</h3>
              <div class="date-inputs">
                <div class="form-group">
                  <label for="check-in">Check-in</label>
                  <input 
                    type="date" 
                    id="check-in" 
                    v-model="booking.startDate" 
                    :min="minDate"
                    @change="updateEndDate"
                    required
                  >
                </div>
                <div class="form-group">
                  <label for="check-out">Check-out</label>
                  <input 
                    type="date" 
                    id="check-out" 
                    v-model="booking.endDate" 
                    :min="minEndDate"
                    required
                  >
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Payment Method</h3>
              <div class="payment-options">
                <div class="payment-option">
                  <input 
                    type="radio" 
                    id="pay-later" 
                    value="pay-later" 
                    v-model="booking.paymentMethod"
                    @change="destroyCardElement" 
                    checked
                  >
                  <label for="pay-later">Pay on arrival</label>
                </div>
                <div class="payment-option">
                  <input 
                    type="radio" 
                    id="pay-now" 
                    value="pay-now" 
                    v-model="booking.paymentMethod"
                    @change="initializeStripeAndElements" 
                  >
                  <label for="pay-now">Pay now</label>
                </div>
              </div>
              
              <div v-if="booking.paymentMethod === 'pay-now'" class="payment-details">
                <!-- Stripe Card Element will be mounted here -->
                <div id="card-element" class="stripe-card-element"></div>
                <!-- Used to display form errors from Stripe -->
                <div id="card-errors" role="alert" class="stripe-error-message">{{ stripeError }}</div>
                <div v-if="isStripeLoading" class="loading-inline">
                  <div class="loader-small"></div>
                  <span>Loading payment form...</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="submit-btn" 
                :disabled="isSubmitting || invalidDates || (booking.paymentMethod === 'pay-now' && !isStripeReady)"
              >
                {{ isSubmitting ? 'Processing...' : (booking.paymentMethod === 'pay-now' ? 'Confirm and Pay' : 'Confirm Booking') }}
              </button>
            </div>
          </form>
        </div>
        
        <!-- Booking Summary Section -->
        <div class="booking-summary">
          <h3 class="summary-title">Booking Summary</h3>
          
          <div class="price-breakdown">
            <div class="price-item">
              <span>€{{ location.price_per_night }} × {{ nights }} nights</span>
              <span>€{{ totalPrice.toFixed(2) }}</span>
            </div>
            
            <div class="service-fee">
              <span>Service fee</span>
              <span>€{{ serviceFee.toFixed(2) }}</span>
            </div>
            
            <div class="total-price">
              <span>Total</span>
              <span>€{{ finalTotal.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="booking-policy">
            <h4>Booking Policy</h4>
            <ul>
              <li>Free cancellation up to 48 hours before check-in</li>
              <li>Check-in time is from 2:00 PM to 8:00 PM</li>
              <li>Check-out time is 10:00 AM</li>
              <li>We'll confirm your booking within 24 hours</li>
            </ul>
          </div>
          
          <div v-if="invalidDates" class="date-warning">
            <p>Please select a valid date range to continue</p>
          </div>
        </div>
      </div>
      
      <!-- Success Modal -->
      <div v-if="showSuccessModal" class="modal">
        <div class="modal-content success-modal">
          <div class="success-icon">✓</div>
          <h3>Booking Confirmed!</h3>
          <p>Your booking at {{ location.name }} has been successfully confirmed.</p>
          <p class="booking-reference">Booking Reference: {{ bookingReference }}</p>
          <p>You'll receive a confirmation shortly.</p>
          <div class="modal-actions">
            <router-link to="/" class="home-btn">Return to Home</router-link>
            <router-link to="/profile" class="view-bookings-btn">View My Bookings</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

export default {
  name: 'PurchaseBookingPage',
  data() {
    return {
      location: {
        name: '',
        city: '',
        country: '',
        price_per_night: 0,
        coverImage: null,
        campsiteTypes: []
      },
      booking: {
        startDate: '',
        endDate: '',
        paymentMethod: 'pay-later' // Default to pay-later
      },
      isLoading: true,
      isSubmitting: false,
      errorMessage: '',
      showSuccessModal: false,
      bookingReference: '',
      stripe: null,
      cardElement: null,
      stripePublishableKey:'pk_test_51RNJCpC7clHoe0VPx8EdUqGxdijFzgzo0E85FEKC0iQzD0oS3TBgPW30ZmIlOqtAPMBkr8rJYrRrl67PXqJv9tXQ00nYqOLRJo',
      isStripeLoading: false,
      isStripeReady: false,
      stripeError: '',
    }
  },
  computed: {
    minDate() {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      return today.toISOString().split('T')[0];
    },
    minEndDate() {
      if (!this.booking.startDate) {
        return this.minDate;
      }
      
      const startDate = new Date(this.booking.startDate);
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    },
    nights() {
      if (!this.booking.startDate || !this.booking.endDate) {
        return 0;
      }
      
      const start = new Date(this.booking.startDate);
      const end = new Date(this.booking.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    totalPrice() {
      return this.location.price_per_night * this.nights;
    },
    serviceFee() {
      // Calculate service fee (10% of total price)
      return this.totalPrice * 0.10;
    },
    finalTotal() {
      return this.totalPrice + this.serviceFee;
    },
    invalidDates() {
      if (!this.booking.startDate || !this.booking.endDate) {
        return true;
      }
      
      const start = new Date(this.booking.startDate);
      const end = new Date(this.booking.endDate);
      const today = new Date(this.minDate); // Use normalized today from minDate

      // Check if start date is before today or if start date is after or same as end date
      return start < today || start >= end;
    }
  },
  watch: {
    'booking.paymentMethod'(newValue) {
      if (newValue === 'pay-now') {
        this.initializeStripeAndElements();
      } else {
        this.destroyCardElement();
      }
    }
  },
  created() {
    this.loadLocationData();
    this.initializeBookingDates();
  },
  methods: {
    initializeBookingDates() {
      // Get dates from query params if available
      const { start_date, end_date } = this.$route.query;
      const todayString = this.minDate; // Use normalized today string

      if (start_date) {
        // Ensure start_date from query is not in the past
        this.booking.startDate = start_date < todayString ? todayString : start_date;
      } else {
        // Default start date to today if not provided
        this.booking.startDate = todayString;
      }
      
      if (end_date) {
        // Ensure end_date is valid in relation to the (potentially adjusted) start_date
        const startDateObj = new Date(this.booking.startDate);
        const endDateObj = new Date(end_date);
        if (endDateObj <= startDateObj) {
          const nextDay = new Date(startDateObj);
          nextDay.setDate(nextDay.getDate() + 1);
          this.booking.endDate = nextDay.toISOString().split('T')[0];
        } else {
          this.booking.endDate = end_date;
        }
      } else {
        // Set end date to start date + 1 day if only start date is provided or adjusted
        const startDateObj = new Date(this.booking.startDate);
        const nextDay = new Date(startDateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        this.booking.endDate = nextDay.toISOString().split('T')[0];
      }
    },
    
    updateEndDate() {
      // If end date is before start date, update it
      if (this.booking.endDate) {
        const startDate = new Date(this.booking.startDate);
        const endDate = new Date(this.booking.endDate);
        
        if (startDate >= endDate) {
          const newEndDate = new Date(startDate);
          newEndDate.setDate(newEndDate.getDate() + 1);
          this.booking.endDate = newEndDate.toISOString().split('T')[0];
        }
      }
    },
    
    loadLocationData() {
      this.isLoading = true;
      const locationId = this.$route.params.id;
      
      if (!locationId) {
        this.errorMessage = 'No location selected. Please choose a location to book.';
        this.isLoading = false;
        return;
      }
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // Save current route for redirect after login
        this.$router.push({
          path: '/login',
          query: { redirect: this.$route.fullPath }
        });
        return;
      }
      
      // Fetch location details
      axios.get(`http://localhost:3001/locations/${locationId}`)
        .then(response => {
          this.location = response.data;
          return this.loadLocationDetails(locationId);
        })
        .catch(error => {
          console.error('Error loading location data:', error);
          this.errorMessage = 'Failed to load location data. Please try again.';
          this.isLoading = false;
        });
    },
    
    async loadLocationDetails(locationId) {
      try {
        // Load location images
        const imagesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/images`);
        if (imagesResponse.data && imagesResponse.data.length > 0) {
          const coverImage = imagesResponse.data.find(img => img.is_cover === 1) || imagesResponse.data[0];
          this.location.coverImage = coverImage.image_url;
        }
        
        // Load campsite types
        const typesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/campsitetype`);
        if (typesResponse.data && typesResponse.data.length > 0) {
          this.location.campsiteTypes = typesResponse.data;
        }
        
        this.isLoading = false;
      } catch (error) {
        console.error('Error loading location details:', error);
        this.errorMessage = 'Failed to load complete location data. Please try again.';
        this.isLoading = false;
      }
    },
    
    async initializeStripeAndElements() {
      if (!this.stripePublishableKey || this.stripePublishableKey === 'YOUR_STRIPE_PUBLISHABLE_KEY') {
        console.error('Stripe publishable key is not set.');
        this.stripeError = 'Payment gateway is not configured. Please add your Stripe Publishable Key.';
        this.isStripeLoading = false;
        return;
      }

      if (this.stripe && this.cardElement) {
        this.isStripeReady = true;
        return; // Already initialized
      }

      this.isStripeLoading = true;
      this.stripeError = '';

      try {
        this.stripe = await loadStripe(this.stripePublishableKey);
        if (!this.stripe) {
          throw new Error('Stripe.js failed to load.');
        }
        
        const elements = this.stripe.elements();
        this.cardElement = elements.create('card', {
          style: {
            base: {
              color: "#32325d",
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSmoothing: "antialiased",
              fontSize: "16px",
              "::placeholder": {
                color: "#aab7c4"
              }
            },
            invalid: {
              color: "#fa755a",
              iconColor: "#fa755a"
            }
          }
        });
        
        // Wait for the DOM to update if #card-element is not immediately available
        this.$nextTick(() => {
          const cardElementDiv = document.getElementById('card-element');
          if (cardElementDiv && !cardElementDiv.hasChildNodes()) { // Mount only if not already mounted
             this.cardElement.mount('#card-element');
             this.cardElement.on('ready', () => {
                this.isStripeReady = true;
                this.isStripeLoading = false;
             });
             this.cardElement.on('change', (event) => {
                if (event.error) {
                  this.stripeError = event.error.message;
                } else {
                  this.stripeError = '';
                }
             });
          } else if (cardElementDiv && cardElementDiv.hasChildNodes()) {
            // Already mounted, or div not clean
            this.isStripeReady = true; // Assume it's ready if children exist
            this.isStripeLoading = false;
          } else {
            console.error('Stripe card element div not found');
            this.stripeError = 'Could not initialize payment form.';
            this.isStripeLoading = false;
          }
        });

      } catch (error) {
        console.error('Error initializing Stripe:', error);
        this.stripeError = error.message || 'Failed to initialize payment form.';
        this.isStripeLoading = false;
        this.isStripeReady = false;
      }
    },

    destroyCardElement() {
      if (this.cardElement) {
        this.cardElement.unmount();
        this.cardElement.destroy();
        this.cardElement = null;
        this.isStripeReady = false;
        this.stripeError = '';
      }
      // Also clear Stripe instance if not needed, or keep it if user might switch back
      // this.stripe = null; 
    },

    async handleBooking() {
      if (this.invalidDates) {
        return;
      }
      
      this.isSubmitting = true;
      this.errorMessage = '';
      this.stripeError = '';
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        this.isSubmitting = false;
        return;
      }

      if (this.booking.paymentMethod === 'pay-now') {
        if (!this.stripe || !this.cardElement || !this.isStripeReady) {
          this.stripeError = 'Payment form is not ready. Please wait or try again.';
          this.isSubmitting = false;
          return;
        }

        try {
          // 1. Create Payment Intent on the backend
          const paymentIntentResponse = await axios.post('http://localhost:3001/api/payments/create-payment-intent', {
            // IMPORTANT: Backend needs to be updated to accept amount directly
            // and not rely on booking_id to fetch it.
            amount: this.finalTotal, // Send amount in base currency unit (e.g., EUR)
            currency: 'eur', // Or your desired currency
            location_id: parseInt(this.$route.params.id),
            // You might want to send other booking details for metadata
            // start_date: this.booking.startDate,
            // end_date: this.booking.endDate,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const clientSecret = paymentIntentResponse.data.clientSecret;
          if (!clientSecret) {
            throw new Error('Failed to get payment client secret.');
          }

          // 2. Confirm the card payment with Stripe.js
          const { paymentIntent, error: stripePaymentError } = await this.stripe.confirmCardPayment(
            clientSecret, {
              payment_method: {
                card: this.cardElement,
                // billing_details: { name: 'Jenny Rosen' }, // Optional: Add billing details
              }
            }
          );

          if (stripePaymentError) {
            this.stripeError = stripePaymentError.message || 'Payment failed. Please check your card details.';
            this.isSubmitting = false;
            return;
          }

          if (paymentIntent && paymentIntent.status === 'succeeded') {
            // 3. Payment successful, now create the booking in your system
            await this.createBookingInSystem(token, paymentIntent.id);
          } else {
            this.stripeError = 'Payment was not successful. Please try again.';
            this.isSubmitting = false;
          }

        } catch (error) {
          console.error('Payment processing error:', error);
          this.errorMessage = error.response?.data?.error || error.message || 'An error occurred during payment processing.';
          this.isSubmitting = false;
        }

      } else { // 'pay-later'
        await this.createBookingInSystem(token);
      }
    },

    async createBookingInSystem(token, stripePaymentIntentId = null) {
      const locationId = this.$route.params.id;
      const formatDate = (dateString) => new Date(dateString).toISOString().split('T')[0];
      
      const bookingData = {
        location_id: parseInt(locationId),
        start_date: formatDate(this.booking.startDate),
        end_date: formatDate(this.booking.endDate),
        total_price: this.finalTotal,
        // Add stripe_payment_intent_id if payment was made
        // Backend POST /bookings needs to be updated to save this
        ...(stripePaymentIntentId && { stripe_payment_intent_id: stripePaymentIntentId })
      };
      
      console.log('Sending booking data to system:', bookingData);

      try {
        const response = await axios.post('http://localhost:3001/bookings', bookingData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Booking creation system response:', response.data);
        this.bookingReference = response.data.booking_id || '';
        this.showSuccessModal = true;

      } catch (error) {
        console.error('System booking error:', error);
        this.errorMessage = error.response?.data?.error || 'Failed to save booking after payment. Please contact support.';
        // If payment was made but booking failed, this is a critical issue to log/handle.
        if (stripePaymentIntentId) {
            this.errorMessage += ` (Payment ID: ${stripePaymentIntentId})`;
        }
      } finally {
        this.isSubmitting = false;
      }
    }
  },
  mounted() {
    // If pay-now is somehow pre-selected (e.g. due to browser cache), initialize Stripe
    if (this.booking.paymentMethod === 'pay-now') {
      this.initializeStripeAndElements();
    }
  },
  beforeDestroy() {
    this.destroyCardElement();
  }
}
</script>

<style scoped>
.purchase-booking {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.booking-container h2 {
  margin-bottom: 30px;
  text-align: center;
}

.booking-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 768px) {
  .booking-grid {
    grid-template-columns: 3fr 2fr;
  }
}

/* Location Preview */
.location-preview {
  display: flex;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.location-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.location-details {
  padding: 15px;
  flex: 1;
}

.location-details h3 {
  margin: 0 0 5px 0;
}

.location-details p {
  margin: 0 0 8px 0;
  color: #666;
}

.campsite-type {
  font-size: 0.9rem;
  color: #666;
}

/* Form Section */
.form-section {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-size: 1.2rem;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.payment-options {
  margin-bottom: 15px;
}

.payment-option {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.payment-option input {
  margin-right: 10px;
}

.payment-details {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.coming-soon {
  font-weight: bold;
  color: #666;
}

.form-actions {
  margin-top: 30px;
}

.submit-btn {
  width: 100%;
  padding: 12px 20px;
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Booking Summary */
.booking-summary {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  position: sticky;
  top: 20px;
  align-self: start;
}

.summary-title {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.price-breakdown {
  margin-bottom: 20px;
}

.price-item,
.service-fee {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.total-price {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #eee;
  font-weight: bold;
}

.booking-policy {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.booking-policy h4 {
  margin: 0 0 10px 0;
}

.booking-policy ul {
  padding-left: 20px;
  margin: 0;
}

.booking-policy li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.date-warning {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  color: #856404;
  font-size: 0.9rem;
}

/* Success Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 4px;
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto 20px;
}

.success-modal h3 {
  margin: 0 0 15px 0;
}

.success-modal p {
  margin: 0 0 15px 0;
}

.booking-reference {
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-weight: bold;
  margin: 15px 0;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  justify-content: center;
}

.home-btn,
.view-bookings-btn {
  padding: 10px 20px;
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.home-btn:hover,
.view-bookings-btn:hover {
  background-color: #f0f0f0;
  text-decoration: none;
}

/* Loading and Error States */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
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
  border-radius: 4px;
  margin: 20px 0;
}

.stripe-card-element {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  margin-bottom: 10px; /* Add some space before the error message */
}

.stripe-error-message {
  color: #fa755a; /* Stripe's error color */
  font-size: 0.9rem;
  margin-top: 5px;
  min-height: 1.2em; /* Reserve space for error message */
}

.loading-inline {
  display: flex;
  align-items: center;
  /* justify-content: center; */ /* If you want it centered */
  padding: 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.loader-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}
</style>
