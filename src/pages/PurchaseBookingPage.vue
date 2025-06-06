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
              :src="location.coverImage" 
              :alt="location.name"
              class="location-image"
            />
            <div v-else class="location-image-placeholder">
              <span>No image available</span>
            </div>
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
              <!-- Replace old date inputs with v-date-picker -->
              <div class="form-group">
                <label class="date-label">Select Dates:</label>
                <v-date-picker
                  v-model="dateRange"
                  is-range
                  :min-date="new Date()"
                  :masks="{ input: 'YYYY-MM-DD' }"
                  class="date-picker-full-width"
                  :attributes="calendarAttributes" 
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
            </div>

            <div class="form-section">
              <h3 class="section-title">Payment Method</h3>
              <div class="payment-options">
                <div class="payment-option">
                  <input 
                    type="radio" 
                    id="pay-later" 
                    value="pay-later" 
                    v-model="paymentMethod"
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
                    v-model="paymentMethod"
                    @change="initializeStripeAndElements" 
                  >
                  <label for="pay-now">Pay now</label>
                </div>
              </div>
              
              <div v-if="paymentMethod === 'pay-now'" class="payment-details">
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
                :disabled="isSubmitting || invalidDates || (paymentMethod === 'pay-now' && !isStripeReady)"
              >
                {{ isSubmitting ? 'Processing...' : (paymentMethod === 'pay-now' ? 'Confirm and Pay' : 'Confirm Booking') }}
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
            <p v-if="location.booking_policy">{{ location.booking_policy }}</p>
            <ul v-else>
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
import { DatePicker } from 'v-calendar'; // Import v-calendar
import 'v-calendar/src/styles/base.css';  // Import v-calendar CSS

export default {
  name: 'PurchaseBookingPage',
  components: { // Register v-calendar component
    VDatePicker: DatePicker,
  },
  data() {
    return {
      location: {
        name: '',
        city: '',
        country: '',
        price_per_night: 0,
        coverImage: null,
        campsiteTypes: [],
        booking_policy: '', // Added
        service_fee_percentage: 0 // Added (will be fetched)
      },
      // booking: { // Old booking data structure
      //   startDate: '',
      //   endDate: '',
      //   paymentMethod: 'pay-later' 
      // },
      dateRange: { // New data structure for v-calendar
        start: null,
        end: null,
      },
      paymentMethod: 'pay-later', // Keep paymentMethod separate
      calendarAttributes: [], // For v-calendar, if needed for booked dates (optional here)
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
    // minDate and minEndDate are less critical with v-calendar's :min-date prop
    // but can be kept if other logic depends on them.
    // For simplicity, we'll rely on :min-date="new Date()" in the template.
    
    nights() {
      if (!this.dateRange.start || !this.dateRange.end) {
        return 0;
      }
      const start = new Date(this.dateRange.start);
      const end = new Date(this.dateRange.end);
      if (end <= start) return 0;
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    // ... totalPrice, serviceFee, finalTotal remain largely the same, using this.nights ...
    totalPrice() {
      return this.location.price_per_night * this.nights;
    },
    serviceFee() {
      if (this.location.service_fee_percentage > 0) {
        return this.totalPrice * (this.location.service_fee_percentage / 100);
      }
      return this.totalPrice * 0.10; 
    },
    finalTotal() {
      return this.totalPrice + this.serviceFee;
    },
    invalidDates() {
      if (!this.dateRange.start || !this.dateRange.end) {
        return true; // No dates selected is invalid
      }

      const startDate = new Date(this.dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Normalize start date to the beginning of the day

      const endDate = new Date(this.dateRange.end);
      endDate.setHours(0, 0, 0, 0); // Normalize end date to the beginning of the day

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day

      // Check 1: Start date must not be in the past.
      if (startDate < today) {
        return true;
      }

      // Check 2: End date must be strictly after the start date.
      // (i.e., booking must be for at least one night)
      if (endDate <= startDate) {
        return true;
      }
      
      // If all checks pass, the dates are valid.
      return false;
    }
  },
  watch: {
    paymentMethod(newValue) { // Changed from 'booking.paymentMethod'
      if (newValue === 'pay-now') {
        this.initializeStripeAndElements();
      } else {
        this.destroyCardElement();
      }
    },
    '$route.query': { // Watch for changes in route query parameters
      immediate: true, // Run the handler immediately on component creation
      handler(newQuery) {
        this.initializeBookingDatesFromQuery(newQuery);
      }
    }
  },
  created() {
    this.loadLocationData(); // This will also call initializeBookingDates
    // initializeBookingDates is now called within loadLocationData or after its successful completion
  },
  methods: {
    formatDateForPicker(dateString) { // Helper to convert YYYY-MM-DD to Date object
        if (!dateString) return null;
        const parts = dateString.split('-');
        if (parts.length !== 3) return null; // Basic validation for YYYY-MM-DD
        const [year, month, day] = parts.map(Number);
        // Further validation for numeric parts and valid date construction
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        const date = new Date(year, month - 1, day); // month is 0-indexed
        // Check if the constructed date is valid (e.g., not Feb 30)
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return date;
    },
    formatDateForBackend(date) { // Helper to convert Date object to YYYY-MM-DD string
        if (!date) return null;
        // Ensure 'date' is a Date object
        const dateObj = date instanceof Date ? date : new Date(date);
        
        // Check if dateObj is a valid date after potential conversion
        if (isNaN(dateObj.getTime())) {
            console.error("Error formatting date for backend: Invalid date provided", date);
            return null;
        }

        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
        const day = dateObj.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },
    initializeBookingDatesFromQuery(query) {
      const { checkIn, checkOut, nights: queryNights } = query;
      const today = new Date();
      today.setHours(0,0,0,0); // Normalize today to start of day

      let startDate = checkIn ? this.formatDateForPicker(checkIn) : null;
      // If checkIn date is in the past or invalid, default to today
      if (startDate && startDate < today) startDate = today; 
      else if (!startDate) startDate = today; // Default to today if not provided or invalid
      
      let endDate = checkOut ? this.formatDateForPicker(checkOut) : null;

      // Logic to derive end date if only start date and nights are provided
      if (startDate && !endDate && queryNights) {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (parseInt(queryNights) || 1));
      } else if (startDate && endDate && endDate <= startDate) {
         // Ensure end date is after start date
         endDate = new Date(startDate);
         endDate.setDate(startDate.getDate() + 1); // Default to one day after start
      } else if (startDate && !endDate) { // Default end date if not provided from query
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1); // Default to one day after start
      }
      
      this.dateRange = {
        start: startDate,
        end: endDate
      };
      
      // Optional: Update location details from query if they were passed and are reliable
      // const { locationName, pricePerNight } = query;
      // if (locationName) this.location.name = locationName;
      // if (pricePerNight) this.location.price_per_night = parseFloat(pricePerNight);
    },
    // updateEndDate is no longer needed as v-calendar handles range selection.
    
    async loadLocationData() {
      this.isLoading = true;
      const locationId = this.$route.params.id;
      // ... (rest of token check and initial error handling) ...
      if (!locationId) {
        this.errorMessage = 'No location selected. Please choose a location to book.';
        this.isLoading = false;
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push({ path: '/login', query: { redirect: this.$route.fullPath } });
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/locations/${locationId}`);
        this.location = {
          ...this.location,
          ...response.data,
          booking_policy: response.data.booking_policy || '',
          service_fee_percentage: response.data.service_fee_percentage !== undefined 
                                    ? parseFloat(response.data.service_fee_percentage) 
                                    : 10
        };
        // Initialize dates *after* location data is loaded, using query params
        this.initializeBookingDatesFromQuery(this.$route.query); // Ensure dates are set from query
        await this.loadLocationSubDetails(locationId); // For images, types etc.
      } catch (error) {
        console.error('Error loading location data:', error);
        this.errorMessage = 'Failed to load location data. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadLocationSubDetails(locationId) { // Renamed from loadLocationDetails to avoid conflict
      try {
        const imagesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/images`);
        if (imagesResponse.data && imagesResponse.data.length > 0) {
          const coverImage = imagesResponse.data.find(img => img.is_cover === 1 || img.is_cover === true) || imagesResponse.data[0];
          // Construct full URL if path is relative
          if (coverImage.image_url && !coverImage.image_url.startsWith('http')) {
            this.location.coverImage = `http://localhost:3001${coverImage.image_url.startsWith('/') ? '' : '/'}${coverImage.image_url}`;
          } else {
            this.location.coverImage = coverImage.image_url;
          }
        }
        
        const typesResponse = await axios.get(`http://localhost:3001/locations/${locationId}/campsitetype`);
        if (typesResponse.data && typesResponse.data.length > 0) {
          this.location.campsiteTypes = typesResponse.data;
        }
      } catch (error) {
        console.error('Error loading location sub-details (images/types):', error);
        // Non-critical, so don't necessarily set a page-level error message
      }
    },
    // eslint-disable-next-line no-unused-vars
    onDayClick(day) {
      // Optional: handle day click if needed
      // v-model with is-range handles selection, so this is mostly for additional logic.
      // console.log('Day clicked on purchase page:', day.date);
    },

    // ... initializeStripeAndElements, destroyCardElement remain largely the same ...
    async initializeStripeAndElements() {
      if (!this.stripePublishableKey || this.stripePublishableKey === 'YOUR_STRIPE_PUBLISHABLE_KEY') {
        console.error('Stripe publishable key is not set.');
        this.stripeError = 'Payment gateway is not configured. Please add your Stripe Publishable Key.';
        this.isStripeLoading = false;
        return;
      }

      if (this.stripe && this.cardElement) {
        // Already initialized, ensure it's mounted if the div exists
        this.isStripeReady = true; // Assume ready if objects exist
        // Potentially re-mount if element was hidden and re-shown, though usually not needed
        // if the element itself wasn't destroyed from DOM.
        return; 
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
          // Add your card Element options here (e.g., style)
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
        
        // Wait for the next DOM update cycle to ensure #card-element is available
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
            // If it has child nodes, assume it's already mounted or being managed.
            // This can happen if initializeStripeAndElements is called multiple times.
            this.isStripeReady = true; 
            this.isStripeLoading = false;
          } else {
            console.error('Stripe card element div not found or already has content when trying to mount.');
            this.stripeError = 'Could not initialize payment form. Target element not found or already in use.';
            this.isStripeLoading = false;
            // this.isStripeReady = false; // Ensure it's false if mount fails
          }
        });

      } catch (error) {
        console.error('Error initializing Stripe:', error);
        this.stripeError = error.message || 'Failed to initialize payment form.';
        this.isStripeLoading = false;
        this.isStripeReady = false; // Ensure ready state is false on error
      }
    },

    destroyCardElement() {
      if (this.cardElement) {
        this.cardElement.unmount(); // Unmount from the DOM
        this.cardElement.destroy(); // Destroy the element instance
        this.cardElement = null;
        this.isStripeReady = false; // Set ready state to false
        this.stripeError = ''; // Clear any Stripe errors
      }
      // Note: this.stripe instance is not destroyed here, as it can be reused.
    },

    async handleBooking() {
      if (this.invalidDates) {
        this.errorMessage = "Please select a valid date range.";
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }
      // ... (rest of isSubmitting, token check) ...
      this.isSubmitting = true;
      this.errorMessage = '';
      this.stripeError = '';
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        this.isSubmitting = false;
        return;
      }

      if (this.paymentMethod === 'pay-now') { // Changed from booking.paymentMethod
        // ... (Stripe payment logic) ...
        if (!this.stripe || !this.cardElement || !this.isStripeReady) {
          this.stripeError = 'Payment form is not ready. Please wait or try again.';
          this.isSubmitting = false;
          return;
        }

        try {
          const paymentIntentResponse = await axios.post('http://localhost:3001/api/payments/create-payment-intent', {
            amount: this.finalTotal, 
            currency: 'eur', 
            location_id: parseInt(this.$route.params.id),
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const clientSecret = paymentIntentResponse.data.clientSecret;
          if (!clientSecret) {
            throw new Error('Failed to get payment client secret.');
          }

          const { paymentIntent, error: stripePaymentError } = await this.stripe.confirmCardPayment(
            clientSecret, {
              payment_method: {
                card: this.cardElement,
              }
            }
          );

          if (stripePaymentError) {
            this.stripeError = stripePaymentError.message || 'Payment failed. Please check your card details.';
            this.isSubmitting = false;
            return;
          }

          if (paymentIntent && paymentIntent.status === 'succeeded') {
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
      
      const bookingData = {
        location_id: parseInt(locationId),
        start_date: this.formatDateForBackend(this.dateRange.start), // Use new dateRange
        end_date: this.formatDateForBackend(this.dateRange.end),     // Use new dateRange
        total_price: this.finalTotal,
        service_fee: this.serviceFee, // Added service_fee
        ...(stripePaymentIntentId && { stripe_payment_intent_id: stripePaymentIntentId })
      };
      
      // ... (rest of createBookingInSystem logic) ...
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
        this.errorMessage = error.response?.data?.error || 'Failed to save booking. Please contact support.';
        if (stripePaymentIntentId) {
            this.errorMessage += ` (Payment ID: ${stripePaymentIntentId})`;
        }
      } finally {
        this.isSubmitting = false;
      }
    }
  },
  mounted() {
    if (this.paymentMethod === 'pay-now') { // Changed from booking.paymentMethod
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
  background-color: #009a15;
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
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.stripe-error-message {
  color: #fa755a; /* Stripe's error color */
  font-size: 0.875rem;
  margin-top: 5px;
}

.loading-inline {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #555;
}

.loader-small {
  border: 2px solid #f3f3f3; /* Light grey */
  border-top: 2px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Styles for v-date-picker (can be shared with LocationDetailsPage) */
.date-label {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.date-picker-full-width {
  width: 100%;
  margin-bottom: 15px; /* Or adjust as needed */
}

.date-picker-input-container {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px; /* Match other inputs */
  padding: 0px 0px; /* Remove padding here if input fields have their own */
  background-color: #fff;
}

.date-picker-input-field {
  flex: 1;
  padding: 10px 12px; /* Match other inputs */
  border: none; 
  font-size: 0.95rem; /* Match other inputs */
  background: transparent;
  width: 100%; 
  box-sizing: border-box;
}

.date-picker-input-field:focus {
  outline: none;
}

.date-picker-input-container input:first-child {
  border-right: 1px solid #ddd; 
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}
.date-picker-input-container input:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.date-separator {
  padding: 0 0px; /* No horizontal padding, rely on input field padding */
  color: #888;
  background-color: #fff; 
  height: 100%;
  display: flex;
  align-items: center;
  /* border-left: 1px solid #ddd; */ /* This was in LocationDetails, check if needed */
  /* border-right: 1px solid #ddd; */
}

.is-dragging { /* Style for when dragging to select a range */
  background-color: #f0f0f0;
}

/* Adjust .date-inputs if it's still used as a container */
.date-inputs {
  /* display: grid; */ /* No longer needed if only one picker */
  /* grid-template-columns: 1fr 1fr; */
  /* gap: 15px; */
  margin-bottom: 10px; /* Add some space below the picker */
}
</style>
