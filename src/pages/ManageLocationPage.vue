<template>
  <div class="manage-location-container"> <!-- Changed class for clarity -->
    <h2>Manage Your Locations</h2>
    
    <div class="page-actions">
      <button @click="openAddLocationForm" class="add-location-btn primary-btn">
        <span class="icon">➕</span> Add New Location
      </button>
    </div>

    <div v-if="errorMessage && !showLocationForm" class="error-message global-error">{{ errorMessage }}</div>
    <div v-if="successMessage && !showLocationForm" class="success-message global-success">{{ successMessage }}</div>

    <!-- Location Form Container -->
    <div v-if="showLocationForm" class="location-form-container card">
      <h3>{{ isEditing ? 'Edit Location' : 'Create New Camping Location' }}</h3>
      <div v-if="errorMessage && showLocationForm" class="error-message form-error">{{ errorMessage }}</div>
      <div v-if="successMessage && showLocationForm" class="success-message form-success">{{ successMessage }}</div>
      
      <form @submit.prevent="handleSubmit" class="location-form">
        <!-- Basic Information Section -->
        <div class="form-section basic-info-section">
          <h4 class="section-title">Basic Information</h4>
          
          <div class="form-group full-width">
            <label for="name">Location Name*</label>
            <input 
              type="text" 
              id="name" 
              v-model="location.name" 
              placeholder="Enter the name of your location"
              required
            >
          </div>
          
          <div class="form-group full-width">
            <label for="description">Description*</label>
            <textarea 
              id="description" 
              v-model="location.description" 
              placeholder="Describe your location, its surroundings, and what makes it special"
              rows="3"
              required
            ></textarea>
          </div>
        </div>
        
        <!-- Location Details Section -->
        <div class="form-section location-details-section">
          <h4 class="section-title">Location Details</h4>
          
          <div class="form-group full-width">
            <label for="address">Full Address*</label>
            <input 
              type="text" 
              id="address" 
              v-model="location.address" 
              placeholder="Enter full address"
              required
            >
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="city">City*</label>
              <input 
                type="text" 
                id="city" 
                v-model="location.city" 
                placeholder="City"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="country">Country*</label>
              <select 
                id="country" 
                v-model="location.country" 
                required
              >
                <option value="" disabled>Select country</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Portugal">Portugal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Austria">Austria</option>
                <option value="Ireland">Ireland</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
          </div>
          
          <div class="form-group full-width manual-coordinates-toggle">
            <label>
              <input 
                type="checkbox" 
                v-model="showManualCoordinates"
              > Enter coordinates manually (if address lookup fails or for precision)
            </label>
          </div>
          
          <div v-if="showManualCoordinates" class="form-row manual-coordinates-fields">
            <div class="form-group">
              <label for="latitude">Latitude*</label>
              <input 
                type="number" 
                id="latitude" 
                v-model="location.latitude" 
                placeholder="e.g. 42.4627"
                step="0.0001"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="longitude">Longitude*</label>
              <input 
                type="number" 
                id="longitude" 
                v-model="location.longitude" 
                placeholder="e.g. -2.4449"
                step="0.0001"
                required
              >
            </div>
          </div>
          <div v-if="showManualCoordinates" class="form-group full-width form-info">
             <p>Tip: You can find coordinates by right-clicking a location on Google Maps and selecting "What's here?"</p>
          </div>

        </div>
        
        <!-- Pricing & Policies Section -->
        <div class="form-section pricing-policy-section">
          <h4 class="section-title">Pricing & Policies</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="price_per_night">Price per night (€)*</label>
              <input 
                type="number" 
                id="price_per_night" 
                v-model.number="location.price_per_night" 
                placeholder="Price in euros"
                min="1"
                step="0.01"
                required
              >
            </div>

            <div class="form-group">
              <label for="max_guests">Maximum Guests per Booking*</label>
              <input 
                type="number" 
                id="max_guests" 
                v-model.number="location.max_guests" 
                placeholder="e.g., 4"
                min="1"
                step="1"
                required
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="service_fee_percentage">Service Fee (%)*</label>
              <input 
                type="number" 
                id="service_fee_percentage" 
                v-model.number="location.service_fee_percentage" 
                placeholder="e.g., 10 for 10%"
                min="0"
                max="100"
                step="0.01"
                required
              >
            </div>
          </div>

          <div class="form-group full-width">
            <label for="booking_policy">Booking Policy*</label>
            <textarea 
              id="booking_policy" 
              v-model="location.booking_policy" 
              placeholder="Describe your booking and cancellation policy (e.g., Flexible: Free cancellation up to 48 hours before check-in...)"
              rows="4"
              required
            ></textarea>
          </div>
        </div>
        
        <!-- Campsite Features Section -->
        <div class="form-section campsite-features-section">
          <h4 class="section-title">Campsite Features</h4>
          
          <div class="form-group full-width">
            <label class="required-label">Campsite Types (select all that apply)*</label>
            <div class="options-grid">
              <div v-for="type in campsiteTypes" :key="type.campsitetypes_id" class="option-item">
                <input 
                  type="checkbox" 
                  :id="'type-' + type.campsitetypes_id" 
                  :value="type.campsitetypes_id"
                  v-model="location.campsite_types"
                >
                <label :for="'type-' + type.campsitetypes_id">{{ type.name }}</label>
              </div>
            </div>
          </div>
          
          <div class="form-group full-width">
            <label>Amenities (select all that apply)</label>
            <div class="options-grid">
              <div v-for="amenity in amenities" :key="amenity.amenity_id" class="option-item">
                <input 
                  type="checkbox" 
                  :id="'amenity-' + amenity.amenity_id" 
                  :value="amenity.amenity_id"
                  v-model="location.amenities"
                >
                <label :for="'amenity-' + amenity.amenity_id">{{ amenity.name }}</label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Images Section -->
        <div class="form-section images-section">
          <h4 class="section-title">Location Images</h4>
          
          <div class="form-group full-width">
            <label class="required-label">Upload Photos (3-10 images)*</label>
            <div class="image-upload-container">
              <input type="file" ref="fileInput" @change="handleFileChange" multiple accept="image/*" style="display: none;">
              
              <div class="image-previews-grid">
                <div v-for="(image, index) in previewImages" :key="index" class="image-preview-item">
                  <img :src="image.preview" alt="Image preview" class="preview-img">
                  <button type="button" @click="removeImage(index)" class="remove-image-btn">&times;</button>
                  <!-- Optional: You might want to indicate if an image is a cover image, if that logic is further developed -->
                  <!-- <span v-if="image.is_cover" class="cover-image-tag">Cover</span> -->
                </div>
                
                <button type="button" @click="triggerFileInput" class="add-image-placeholder" v-if="previewImages.length < 10">
                  <span>+ Add Image</span>
                </button>
              </div>
              
              <p class="image-count-feedback">
                {{ previewImages.length }} / 10 images selected.
                <span v-if="previewImages.length > 0 && previewImages.length < 3" class="error-text-small"> (Min 3 required)</span>
              </p>
              <div v-if="errorMessage && (errorMessage.includes('image') || errorMessage.includes('photo'))" class="error-message small">{{ errorMessage }}</div>

            </div>
          </div>
        </div>
        
        <!-- Submit Section -->
        <div class="form-actions full-width">
          <button type="submit" :disabled="isSubmitting || previewImages.length < 3" class="submit-btn primary-btn">
            {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location') }}
          </button>
          <button type="button" @click="closeLocationForm" class="cancel-btn secondary-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
    
    <!-- My Locations Section -->
    <div class="my-locations-section"> <!-- Renamed for clarity -->
      <h3 v-if="userLocations.length > 0 && !showLocationForm">My Listings</h3>
      <div v-if="userLocations.length === 0 && !isLoadingLocations" class="empty-state">
        <p>You haven't added any locations yet. Click "Add New Location" to get started!</p>
      </div>
      <div v-if="isLoadingLocations" class="loading-state">
        <p>Loading your locations...</p>
      </div>
      <div v-else class="locations-list">
        <div v-for="location in userLocations" :key="location.location_id" class="location-item card">
          <div class="location-item-header">
            <div class="location-image">
              <img v-if="location.coverImage" :src="location.coverImage" :alt="location.name">
              <div v-else class="location-image-placeholder">
                <span>No image</span>
              </div>
            </div>
            <div class="location-summary">
              <h4>{{ location.name }}</h4>
              <p class="location-area">{{ location.city }}, {{ location.country }}</p>
              <p class="location-price"><strong>Price:</strong> €{{ location.price_per_night ? location.price_per_night.toFixed(2) : 'N/A' }} / night</p>
              <p class="location-max-guests"><strong>Max Guests:</strong> {{ location.max_guests ? location.max_guests : 'N/A' }}</p>
              <p class="location-fee"><strong>Service Fee:</strong> {{ location.service_fee_percentage !== undefined ? location.service_fee_percentage.toFixed(2) : 'N/A' }}%</p>
              <p class="location-policy"><strong>Policy:</strong> {{ location.booking_policy ? (location.booking_policy.substring(0, 50) + '...') : 'Not set' }}</p>
              <div class="location-rating-summary" v-if="location.total_reviews > 0">
                <span class="stars">★ {{ Math.round(location.average_rating) }}</span>
                <span class="reviews-count-display"> ({{ location.total_reviews }} {{ location.total_reviews === 1 ? 'review' : 'reviews' }})</span>
              </div>
              <p v-else class="no-reviews-summary">No reviews yet</p>
            </div>
          </div>

          <div class="location-stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Bookings:</span>
              <span class="stat-value">{{ location.total_bookings }}</span>
            </div>
          </div>

          <div class="location-current-bookings-summary">
            <p>Active Bookings: {{ activeBookingsFor(location).length }}</p>
            <p>Past/Cancelled Bookings: {{ pastBookingsFor(location).length }}</p>
            <div v-if="location.loadingLocationBookings">Loading booking details...</div>
          </div>

          <div class="location-actions">
            <button @click="editLocation(location)" class="action-btn edit-btn btn-primary">Edit</button>
            <button @click="deleteLocation(location.location_id)" class="action-btn delete-btn btn-danger">Delete</button>
            <button @click="toggleBookingsDisplay(location)" class="action-btn view-bookings-btn">
              {{ location.showBookingsSection ? 'Hide' : 'View' }} Bookings
            </button>
            <button @click="goToLocationAnalytics(location.location_id)" class="action-btn analytics-btn">View Analytics</button> <!-- New Button -->
          </div>

          <div v-if="location.showBookingsSection" class="location-bookings-details">
            <h4>Bookings for {{ location.name }}</h4>
            <div v-if="location.bookings && location.bookings.length > 0">
              <!-- Tabs for Active/Past -->
              <div class="booking-tabs">
                <button @click="setActiveTab(location, 'active')" :class="{ active: location.activeTab === 'active' }">
                  Active ({{ activeBookingsFor(location).length }})
                </button>
                <button @click="setActiveTab(location, 'past')" :class="{ active: location.activeTab === 'past' }">
                  Past/Cancelled ({{ pastBookingsFor(location).length }})
                </button>
              </div>
              <div v-if="location.activeTab === 'active'">
                <ul v-if="activeBookingsFor(location).length > 0" class="booking-list">
                  <li v-for="booking in activeBookingsFor(location)" :key="booking.booking_id">
                    User: {{ booking.user_name }}, Dates: {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}, Status: {{ booking.status_name }}
                  </li>
                </ul>
                <p v-else>No active bookings.</p>
              </div>
              <div v-if="location.activeTab === 'past'">
                <ul v-if="pastBookingsFor(location).length > 0" class="booking-list">
                  <li v-for="booking in pastBookingsFor(location)" :key="booking.booking_id">
                    User: {{ booking.user_name }}, Dates: {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}, Status: {{ booking.status_name }}
                  </li>
                </ul>
                <p v-else>No past or cancelled bookings.</p>
              </div>
            </div>
            <p v-else-if="!location.loadingLocationBookings">No bookings found for this location.</p>
            <p v-if="location.loadingLocationBookings">Loading bookings...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ManageLocationPage',
  data() {
    return {
      location: {
        name: '',
        description: '',
        address: '',
        city: '',
        country: '',
        price_per_night: null,
        max_guests: null, // Added max_guests
        booking_policy: '',
        service_fee_percentage: 10.00,
        amenities: [],
        campsite_types: [],
        latitude: null,
        longitude: null,
        location_id: null,
      },
      userLocations: [],
      showLocationForm: false,
      isEditing: false,
      isSubmitting: false,
      isLoadingLocations: true,
      errorMessage: '',
      successMessage: '',
      amenities: [],
      campsiteTypes: [],
      previewImages: [],
      filesToUpload: [],
      existingImageUrls: [], // Store URLs of existing images when editing
      imagesToRemove: [], // Store IDs/URLs of images marked for removal
      showManualCoordinates: false,
    };
  },
  computed: {
    activeBookingsFor() {
      return (location) => {
        if (!location || !location.bookings) return [];
        return location.bookings.filter(b => b.status_name === 'confirmed');
      };
    },
    pastBookingsFor() {
      return (location) => {
        if (!location || !location.bookings) return [];
        return location.bookings.filter(b => ['completed', 'cancelled'].includes(b.status_name));
      };
    }
  },
  created() {
    this.loadUserLocations();
    this.loadAmenities();
    this.loadCampsiteTypes();  // Add this line
  },
  methods: {
    formatDate(dateString) { // Helper for displaying dates
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    openAddLocationForm() {
      this.resetForm();
      this.isEditing = false;
      this.location.location_id = null; // Explicitly nullify ID for new location
      this.location.booking_policy = ''; // Reset booking policy
      this.location.service_fee_percentage = 10.00; // Reset service fee to default
      this.showLocationForm = true;
      this.successMessage = '';
      this.errorMessage = '';
    },
    closeLocationForm() {
      this.showLocationForm = false;
      this.resetForm();
    },
    setActiveTab(location, tabName) {
      this.$set(location, 'activeTab', tabName);
    },
    loadAmenities() {
      const token = localStorage.getItem('token');
      
      axios.get('http://localhost:3001/locations/amenities', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        
        this.amenities = response.data.map(amenity => ({
          ...amenity,
          amenity_id: parseInt(amenity.amenity_id, 10)
        }));
        console.log('Available amenities:', this.amenities);
      })
      .catch(error => {
        console.error('Error loading amenities:', error);
      });
    },
    
    loadUserLocations() {
      this.isLoadingLocations = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // Use the updated backend route that includes all necessary stats
      axios.get(`http://localhost:3001/locations/owner/${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        const locations = response.data.map(loc => {
          // Backend now provides properly formatted numbers, but we can ensure defaults here
          return {
            ...loc,
            price_per_night: loc.price_per_night !== undefined ? parseFloat(loc.price_per_night) : 0,
            max_guests: loc.max_guests !== undefined ? parseInt(loc.max_guests) : null, // Added max_guests
            booking_policy: loc.booking_policy || '', // Added
            service_fee_percentage: loc.service_fee_percentage !== undefined ? parseFloat(loc.service_fee_percentage) : 10.00, // Added
            average_rating: loc.average_rating !== undefined ? parseFloat(loc.average_rating) : 0,
            total_reviews: loc.total_reviews !== undefined ? parseInt(loc.total_reviews) : 0,
            total_bookings: loc.total_bookings !== undefined ? parseInt(loc.total_bookings) : 0,
            earnings_last_week: loc.earnings_last_week !== undefined ? parseFloat(loc.earnings_last_week) : 0,
            earnings_last_month: loc.earnings_last_month !== undefined ? parseFloat(loc.earnings_last_month) : 0,
            earnings_last_year: loc.earnings_last_year !== undefined ? parseFloat(loc.earnings_last_year) : 0,
            coverImage: null, // Will be loaded by loadIndividualLocationDetails
            allImages: [],    // Will be loaded by loadIndividualLocationDetails
            campsite_type_name: 'Loading...', // Will be loaded by loadIndividualLocationDetails
            selected_amenity_ids: [], // Initialize for storing fetched IDs
            selected_campsitetype_ids: [], // Initialize for storing fetched IDs
            bookings: [], // Corrected: removed extra comma
            showBookingsSection: false,
            // activeBookingsCount and pastBookingsCount will be derived from bookings array later
            loadingLocationBookings: false,
            activeTab: 'active',
          };
        });
        
        this.userLocations = locations;
        this.isLoadingLocations = false;
        
        // Load additional details (campsite type, images, and bookings)
        this.userLocations.forEach(detailedLoc => {
          this.loadIndividualLocationDetails(detailedLoc, token); 
          this.fetchBookingsForLocation(detailedLoc, token); 
        });
      })
      .catch(error => {
        console.error('Error loading user locations:', error);
        this.errorMessage = 'Failed to load your locations.';
        this.isLoadingLocations = false;
      });
    },
    
    // Modified to handle a single location's non-booking details
    loadIndividualLocationDetails(location, token) {
      // Load campsite types for this specific location
      axios.get(`http://localhost:3001/locations/${location.location_id}/campsitetype`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          if (response.data && response.data.length > 0) {
            // Assuming a location might have multiple types, join their names or pick the first.
            // For simplicity, let's assume the first one or join, adjust as needed.
            this.$set(location, 'campsite_type_name', response.data.map(ct => ct.name).join(', ') || 'Not specified');
            this.$set(location, 'selected_campsitetype_ids', response.data.map(ct => ct.campsitetypes_id)); // Store IDs
          } else {
            this.$set(location, 'campsite_type_name', 'Not specified');
            this.$set(location, 'selected_campsitetype_ids', []);
          }
        })
        .catch(error => {
          console.error(`Error loading campsite type for location ${location.location_id}:`, error);
          this.$set(location, 'campsite_type_name', 'Error loading type');
          this.$set(location, 'selected_campsitetype_ids', []);
        });
        
      // Load images for this specific location
      axios.get(`http://localhost:3001/locations/${location.location_id}/images`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          if (response.data && response.data.length > 0) {
            const coverImage = response.data.find(img => img.is_cover === 1) || response.data[0];
            this.$set(location, 'coverImage', coverImage.image_url);
            this.$set(location, 'allImages', response.data); // Used in editLocation
          } else {
            this.$set(location, 'allImages', []);
          }
        })
        .catch(error => {
          console.error(`Error loading images for location ${location.location_id}:`, error);
          this.$set(location, 'allImages', []);
        });

      // NEW: Load selected amenities for this specific location
      // **ACTION REQUIRED**: Implement this backend endpoint: GET /locations/:location_id/amenities-for-location
      // It should return an array of amenity objects (e.g., [{ amenity_id: 1, name: 'WiFi' }, ...]) for the given location.
      axios.get(`http://localhost:3001/locations/${location.location_id}/amenities-for-location`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          if (response.data && response.data.length > 0) {
            this.$set(location, 'selected_amenity_ids', response.data.map(am => am.amenity_id)); // Store IDs
          } else {
            this.$set(location, 'selected_amenity_ids', []);
          }
        })
        .catch(error => {
          console.error(`Error loading amenities for location ${location.location_id}:`, error);
          this.$set(location, 'selected_amenity_ids', []);
        });
    },

    async fetchBookingsForLocation(location, token) {
      this.$set(location, 'loadingLocationBookings', true);
      try {
        const response = await axios.get(`http://localhost:3001/bookings/location/${location.location_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookingsData = response.data;
        this.$set(location, 'bookings', bookingsData);

        const activeBookings = bookingsData.filter(b => b.status_name === 'confirmed');
        const pastBookings = bookingsData.filter(b => ['completed', 'cancelled'].includes(b.status_name));

        this.$set(location, 'activeBookingsCount', activeBookings.length);
        this.$set(location, 'pastBookingsCount', pastBookings.length);

      } catch (error) {
        console.error(`Error fetching bookings for location ${location.location_id}:`, error);
        // Optionally set an error message on the location object
        this.$set(location, 'errorMessageBookings', 'Could not load bookings.');
      } finally {
        this.$set(location, 'loadingLocationBookings', false);
      }
    },

    toggleBookingsDisplay(location) {
      this.$set(location, 'showBookingsSection', !location.showBookingsSection);
      // If opening and bookings haven't been loaded (e.g., initial load failed or lazy load)
      // For now, we load them all initially in loadUserLocations.
      // if (location.showBookingsSection && location.bookings.length === 0 && !location.loadingLocationBookings) {
      //   const token = localStorage.getItem('token');
      //   this.fetchBookingsForLocation(location, token);
      // }
    },
    
    goToLocationAnalytics(locationId) {
      this.$router.push({ name: 'LocationAnalytics', params: { locationId: locationId } });
    }, // New Method

    // Helper method to get the image URL
    getImageUrl(location) {
      if (location && location.coverImage) {
        return location.coverImage; // Assuming coverImage is the full Cloudinary URL
      }
      return ''; // Return empty string if no image
    },

    loadCampsiteTypes() {
      axios.get('http://localhost:3001/locations/campsitetypes')  // Change this line
        .then(response => {
          this.campsiteTypes = response.data;
          console.log('Loaded campsite types:', response.data);
        })
        .catch(error => {
          console.error('Error loading campsite types:', error);
          this.errorMessage = 'Failed to load campsite types';
        });
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileChange(event) {
      const files = Array.from(event.target.files);
      const remainingSlots = 10 - this.previewImages.length;

      if (files.length > remainingSlots) {
        this.errorMessage = `You can only add ${remainingSlots} more image(s). Max 10 images allowed.`;
        if (this.$refs.fileInput) {
            this.$refs.fileInput.value = ''; // Clear the file input
        }
        return;
      }

      files.forEach(file => {
        // Basic type check (optional, as accept="image/*" should handle it)
        if (!file.type.startsWith('image/')) {
            this.errorMessage = `File ${file.name} is not a valid image type.`;
            return; // Skip this file
        }
        // Basic size check (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.errorMessage = `File ${file.name} exceeds the 5MB size limit.`;
            return; // Skip this file
        }

        this.imagesToUpload.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImages.push({
            preview: e.target.result,
            file: file, // Keep reference to the file object for upload
            isExisting: false,
            public_id: null // Not yet uploaded
          });
        };
        reader.readAsDataURL(file);
      });

      if (this.$refs.fileInput) { // Clear the file input to allow re-selecting same files if needed
          this.$refs.fileInput.value = '';
      }
      this.errorMessage = ''; // Clear error message if files are processed
    },

    removeImage(index) {
      const imageToRemove = this.previewImages[index];

      if (imageToRemove.isExisting && imageToRemove.public_id) {
        if (!this.imagesToDelete.includes(imageToRemove.public_id)) {
          this.imagesToDelete.push(imageToRemove.public_id);
        }
      } else {
        // If it's a newly added image, remove it from imagesToUpload
        const fileIndex = this.imagesToUpload.findIndex(f => f === imageToRemove.file);
        if (fileIndex > -1) {
          this.imagesToUpload.splice(fileIndex, 1);
        }
      }
      this.previewImages.splice(index, 1);
    },

    async handleSubmit() {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      const token = localStorage.getItem('token');

      if (!token) {
        this.$router.push('/login');
        this.isSubmitting = false;
        return;
      }

      const isEditing = !!this.location.location_id;
      let locationPayload = { ...this.location };

      if (!locationPayload.campsite_types || locationPayload.campsite_types.length === 0) {
        this.errorMessage = 'Please select at least one campsite type.';
        this.isSubmitting = false;
        return;
      }
      
      // Image count validation
      const currentImageCount = this.previewImages.filter(img => !(img.isExisting && this.imagesToDelete.includes(img.public_id))).length;
      if (currentImageCount < 3) {
        this.errorMessage = 'A location must have at least 3 images.';
        this.isSubmitting = false;
        return;
      }
      if (currentImageCount > 10) {
        this.errorMessage = 'A location can have a maximum of 10 images.';
        this.isSubmitting = false;
        return;
      }


      const method = isEditing ? 'put' : 'post';
      const url = isEditing
        ? `http://localhost:3001/locations/${locationPayload.location_id}`
        : 'http://localhost:3001/locations';

      if (isEditing) {
        locationPayload.images_to_delete = this.imagesToDelete;
      } else {
        // For new locations, ensure imagesToUpload has content if previewImages does
        if (this.previewImages.length > 0 && this.imagesToUpload.length === 0) {
            // This case should ideally not happen if logic is correct, but as a safeguard:
            console.error("Preview images exist but no files to upload for new location.");
            this.errorMessage = "Error preparing images for upload. Please re-select images.";
            this.isSubmitting = false;
            return;
        }
      }
      // Remove location_id from payload if it's a POST to avoid issues, backend should ignore it anyway
      if (!isEditing) {
        delete locationPayload.location_id;
      }


      try {
        const response = await axios({
          method,
          url,
          data: locationPayload,
          headers: { Authorization: `Bearer ${token}` }
        });

        const locationId = isEditing ? locationPayload.location_id : response.data.location_id;

        if (this.imagesToUpload.length > 0) {
          await this.uploadNewImages(locationId, token);
        }

        this.successMessage = `Location ${isEditing ? 'updated' : 'created'} successfully!`;
        this.loadUserLocations(); // Refresh the list
        this.closeLocationForm(); // This calls resetForm

      } catch (error) {
        console.error('Error saving location:', error);
        this.errorMessage = error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} location.`;
        if (error.message.includes('upload new images')) { // Check if error came from uploadNewImages
            this.errorMessage = error.message; // Show specific image upload error
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    async uploadNewImages(locationId, token) {
      if (this.imagesToUpload.length === 0) return;

      const formData = new FormData();
      this.imagesToUpload.forEach(file => {
        formData.append('images', file);
      });

      try {
        await axios.post(`http://localhost:3001/locations/${locationId}/images`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        this.imagesToUpload = []; // Clear after successful upload
      } catch (error) {
        console.error('Error uploading new images:', error);
        throw new Error(error.response?.data?.error || 'Failed to upload new images. Location data may have been saved/updated, but new images failed.');
      }
    },
    
    resetForm() {
      this.location = {
        name: '',
        description: '',
        address: '',
        city: '',
        country: '',
        price_per_night: null,
        max_guests: null, // Added max_guests
        booking_policy: '', // Added
        service_fee_percentage: 10.00, // Added
        amenities: [],
        campsite_types: [],
        latitude: null,
        longitude: null,
        location_id: null, // Important to reset or handle ID correctly
      };
      this.showManualCoordinates = false;
      this.previewImages = [];
      this.imagesToUpload = [];
      this.imagesToDelete = []; // Reset this
      
      this.successMessage = '';
      this.errorMessage = '';
      this.isEditing = false;
      this.isSubmitting = false;
      
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
      // console.log('Form reset');
    },
    
    editLocation(locationToEdit) {
      this.resetForm(); // Clear form and reset image arrays first
      this.isEditing = true;
      this.showLocationForm = true;
      this.successMessage = '';
      this.errorMessage = '';

      // Deep copy the location object to avoid modifying the original in the list
      this.location = JSON.parse(JSON.stringify(locationToEdit));

      // Ensure numeric values are numbers, not strings, if they come from JSON.parse
      this.location.price_per_night = parseFloat(locationToEdit.price_per_night) || null;
      this.location.max_guests = locationToEdit.max_guests ? parseInt(locationToEdit.max_guests) : null; // Added max_guests
      this.location.latitude = parseFloat(locationToEdit.latitude) || null;
      this.location.longitude = parseFloat(locationToEdit.longitude) || null;
      this.location.service_fee_percentage = parseFloat(locationToEdit.service_fee_percentage) || 10.00;

      // Populate selected amenities and campsite types
      // These should be populated from the detailed load (loadIndividualLocationDetails)
      this.location.amenities = locationToEdit.selected_amenity_ids ? [...locationToEdit.selected_amenity_ids] : [];
      this.location.campsite_types = locationToEdit.selected_campsitetype_ids ? [...locationToEdit.selected_campsitetype_ids] : [];
      
      // Handle images
      this.previewImages = [];
      if (locationToEdit.allImages && locationToEdit.allImages.length > 0) {
        this.previewImages = locationToEdit.allImages.map(img => ({
          preview: img.image_url, // This should be the full URL from Cloudinary
          isExisting: true,
          public_id: img.public_id, // Make sure your image objects have public_id
          file: null // No file object for existing images initially
        }));
      }
      // Ensure booking_policy is populated
      this.location.booking_policy = locationToEdit.booking_policy || '';
    },

    deleteLocation(locationId) {
      const confirmed = window.confirm("Are you sure you want to remove this location? This action cannot be undone and all associated data will be lost.");
      if (!confirmed) {
        return;
      }

      this.isLoadingLocations = true; // Or a specific deleting flag
      this.successMessage = '';
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      axios.delete(`http://localhost:3001/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.userLocations = this.userLocations.filter(loc => loc.location_id !== locationId);
        this.successMessage = 'Location deleted successfully.';
        this.isLoadingLocations = false;
      })
      .catch(error => {
        console.error('Error deleting location:', error);
        this.errorMessage = error.response?.data?.error || 'Failed to delete location.';
        this.isLoadingLocations = false;
      });
    },

    async loadLocationImages(locationId) {
      try {
        const response = await axios.get(`http://localhost:3001/images/location/${locationId}`);
        return response.data;
      } catch (error) {
        console.error('Error loading images:', error);
        return [];
      }
    }
  }
}
</script>

<style scoped>
.manage-location-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.page-actions {
  margin-bottom: 20px;
}

.add-location-btn {
  padding: 10px 20px;
  font-size: 1rem;
  /* Add other primary button styles if not global */
}

.location-form-container.card {
  background-color: #fff;
  padding: 25px; /* Increased padding */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.location-form .form-section {
  margin-bottom: 25px; /* Increased spacing between sections */
  padding-bottom: 20px; /* Spacing before border */
  border-bottom: 1px solid #eee; /* Separator line */
}
.location-form .form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.location-form .section-title {
  font-size: 1.3rem; /* Slightly larger section titles */
  color: #333;
  margin-bottom: 20px; /* Increased space below title */
  font-weight: 600;
}

.location-form .form-row {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: 20px; /* Space between items in a row */
  margin-bottom: 15px;
}

.location-form .form-group {
  flex: 1 1 calc(50% - 10px); /* Default to 2 columns, accounting for gap */
  display: flex;
  flex-direction: column;
  margin-bottom: 15px; /* Consistent bottom margin */
}

.location-form .form-group.full-width {
  flex-basis: 100%;
}

.location-form label {
  display: block;
  margin-bottom: 8px; /* Increased space below label */
  font-weight: 500;
  font-size: 0.95rem;
  color: #454545;
}

.location-form input[type="text"],
.location-form input[type="number"],
.location-form textarea,
.location-form select {
  width: 100%;
  padding: 10px 12px; /* Slightly more padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}
.location-form input:focus,
.location-form textarea:focus,
.location-form select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  outline: none;
}

.location-form textarea {
  resize: vertical;
}

.location-form .manual-coordinates-toggle label {
  font-weight: normal;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}
.location-form .manual-coordinates-toggle input[type="checkbox"] {
  margin-right: 8px;
}

.location-form .form-info p {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 5px;
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
}

.location-form .options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* Adjust minmax for item size */
  gap: 10px;
}

.location-form .option-item label {
  font-weight: normal;
  font-size: 0.95rem;
}

.image-upload-container .image-previews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); /* Smaller previews */
  gap: 10px;
  margin-bottom: 10px;
}

.image-upload-container .preview-img {
  width: 100%;
  height: 100px; /* Fixed height for previews */
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.image-upload-container .add-image-placeholder {
  height: 100px; /* Match preview height */
}

.form-actions.full-width {
    flex-basis: 100%;
    margin-top: 20px; /* Add some space before action buttons */
}

/* Responsive adjustments for form rows */
@media (max-width: 768px) {
  .location-form .form-row {
    flex-direction: column; /* Stack items in a row on smaller screens */
    gap: 0; /* Remove gap when stacked, rely on form-group margin */
  }
  .location-form .form-group {
    flex-basis: 100%; /* Full width for groups when stacked */
    /* margin-bottom is already set */
  }
  .location-form .options-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.my-locations-section h3 {
  margin-top: 30px;
  margin-bottom: 15px;
  font-size: 1.5rem;
  color: #333;
}

.locations-list {
  display: grid;
  gap: 20px;
}

.location-item.card {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
}

.location-item-header {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.location-image img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}
.location-image-placeholder {
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #888;
}

.location-summary h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 1.2rem;
}
.location-summary p {
  margin: 4px 0; /* Adjusted margin */
  font-size: 0.9rem;
  color: #555;
}

.location-rating-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
}

.stars {
  color: green; 
  font-weight: bold;
}

.reviews-count {
  font-size: 0.85rem;
  color: #777;
}

.no-reviews-summary {
  font-size: 0.85rem;
  color: #888;
  margin: 5px 0;
}

.location-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.stat-item {
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.stat-label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  color: #007bff; /* Highlight value */
  font-weight: bold;
}

/* Styles for Image Upload Section */
.image-upload-container {
  border: 2px dashed #ccc;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  background-color: #f9f9f9;
  margin-top: 10px;
}

.image-previews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px;
  margin-bottom: 15px;
}

.image-preview-item {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  height: 120px; /* Fixed height for uniform items */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover; /* Changed to cover to fill the box better */
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  padding: 0;
}
.remove-image-btn:hover {
  background-color: rgba(255, 0, 0, 0.8);
}

.add-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px; /* Match preview item height */
  border: 2px dashed #007bff;
  border-radius: 4px;
  color: #007bff;
  cursor: pointer;
  background-color: #eef7ff;
  transition: background-color 0.3s ease;
}
.add-image-placeholder:hover {
  background-color: #d0e8ff;
}
.add-image-placeholder span {
  font-size: 1rem;
}

.image-count-feedback {
  font-size: 0.9rem;
  color: #555;
  margin-top: 10px;
}
.error-text-small {
  color: #dc3545;
  font-size: 0.8rem;
}

.form-info p {
  font-size: 0.85rem;
  color: #666;
  margin-top: 5px;
}

/* General Form Styling Improvements */
.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 2px solid #007bff;
  display: inline-block;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #444;
}
.required-label::after {
  content: "*";
  color: red;
  margin-left: 4px;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="email"], /* If you add email fields */
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.2s ease-in-out;
}
.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group input[type="email"]:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0,123,255,.25);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-start; /* Align items at the start for varying heights */
}
.form-row .form-group {
  flex: 1; /* Each group takes equal space */
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.option-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #eee;
}
.option-item input[type="checkbox"] {
  margin-right: 10px;
  width: 18px; /* Custom size */
  height: 18px; /* Custom size */
  cursor: pointer;
}
.option-item label {
  margin-bottom: 0; /* Override default label margin */
  font-weight: normal;
  color: #333;
  cursor: pointer;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: flex-end; /* Align buttons to the right */
}

.primary-btn, .secondary-btn { /* General button styling */
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.primary-btn {
  background-color: #007bff;
  color: white;
}
.primary-btn:hover {
  background-color: #0056b3;
}
.primary-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
.secondary-btn {
  background-color: #6c757d;
  color: white;
}
.secondary-btn:hover {
  background-color: #545b62;
}

.error-message {
  color: #dc3545; /* Bootstrap danger color */
  background-color: #f8d7da; /* Light red background */
  border: 1px solid #f5c6cb; /* Reddish border */
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}
.error-message.small {
  padding: 5px 10px;
  font-size: 0.8rem;
  margin-top: 5px;
}

.success-message {
  color: #155724; /* Bootstrap success color */
  background-color: #d4edda; /* Light green background */
  border: 1px solid #c3e6cb; /* Greenish border */
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* Booking details specific styles */
.location-current-bookings-summary {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
.location-current-bookings-summary p {
  margin: 5px 0;
}

.location-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
}

.action-btn {
  padding: 8px 12px; /* Adjusted padding for potentially more buttons */
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.edit-btn {
  background-color: #ffc107; /* Yellow */
  color: #212529;
  border: 1px solid #dda600;
}
.edit-btn:hover {
  background-color: #e0a800;
}
.delete-btn {
  background-color: #dc3545; /* Red */
  color: white;
  border: 1px solid #b02a37;
}
.delete-btn:hover {
  background-color: #c82333;
}
.view-bookings-btn {
  background-color: #17a2b8; /* Teal */
  color: white;
  border: 1px solid #128293;
}
.view-bookings-btn:hover {
  background-color: #138496;
}
.analytics-btn {
  background-color: #28a745; /* Green */
  color: white;
  border: 1px solid #1e7e34;
}
.analytics-btn:hover {
  background-color: #218838;
}

.location-bookings-details {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fdfdfd;
}
.location-bookings-details h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.booking-tabs {
  display: flex;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
}
.booking-tabs button {
  padding: 8px 15px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  color: #007bff;
  border-bottom: 2px solid transparent; /* For active state */
  margin-bottom: -1px; /* Align with parent border */
}
.booking-tabs button.active {
  font-weight: bold;
  border-bottom-color: #007bff;
  color: #0056b3;
}
.booking-tabs button:hover:not(.active) {
  background-color: #f0f0f0;
}

.booking-list {
  list-style-type: none;
  padding-left: 0;
}
.booking-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: #444;
}
.booking-list li:last-child {
  border-bottom: none;
}

/* New styles for improved space utilization */

/* Responsive adjustments for the list of locations */
@media (min-width: 769px) { /* For tablets and wider */
  .locations-list {
    /* Allow for 2 or 3 columns depending on available width */
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

/* Responsive adjustments for the location add/edit form */
@media (min-width: 992px) { /* Apply two-column layout for form sections on wider screens */
  .location-form {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two equal columns */
    gap: 30px; /* Adjust gap as needed for rows and columns */
    align-items: start; /* Align items at the start of their grid area */
  }

  .location-form > .form-section {
    margin-bottom: 0; /* Grid gap will handle spacing between sections */
    border-bottom: none; /* Remove bottom border in grid layout */
    padding-bottom: 0; /* Remove padding associated with the bottom border */
    /* Sections will flow automatically:
       Section 1: Col 1, Row 1
       Section 2: Col 2, Row 1
       Section 3: Col 1, Row 2
       Section 4: Col 2, Row 2
       etc.
    */
  }

  .location-form > .images-section,
  .location-form > .form-actions {
    grid-column: 1 / -1; /* Make these sections span both columns */
  }
  
  .location-form > .form-actions { /* Ensure form-actions retains its specific margin if different */
    margin-top: 10px; /* Add some space above the full-width actions */
  }
}

/* End of new styles for space utilization */

/* Responsive adjustments if needed */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0; /* Remove gap if stacked */
  }
  .form-row .form-group {
    width: 100%; /* Full width for stacked items */
    margin-bottom: 15px; /* Add margin between stacked items */
  }
  .locations-list {
    grid-template-columns: 1fr; /* Stack location items on smaller screens */
  }
  .location-item-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .location-image, .location-image-placeholder {
    margin-bottom: 10px;
  }
  .location-stats-grid {
    grid-template-columns: 1fr; /* Stack stats on smaller screens */
  }
}

/* My locations styling */
.my-locations {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
}

.my-locations h3 {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.location-item {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

.location-image {
  width: 120px;
  height: 80px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.location-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.location-details {
  flex: 1;
}

.location-details h4 {
  margin: 0 0 8px 0;
}

.location-area, .location-price, .campsite-type {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
}

.location-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.edit-btn, .delete-btn {
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  background-color: #f7f7f7;
}

.location-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f7f7;
  color: #999;
  font-size: 0.9rem;
}

/* Disabled states */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ensure action buttons have consistent styling and specific overrides */
.location-actions .action-btn {
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid transparent;
  margin: 5px; /* Add some margin for spacing */
}

/* Edit Button - Blue */
.location-actions .edit-btn {
  background-color: #007bff; /* Primary blue */
  color: white;
  border-color: #007bff;
}

.location-actions .edit-btn:hover {
  background-color: #0056b3; /* Darker blue on hover */
  border-color: #0056b3;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

/* Delete Button - Red */
.location-actions .delete-btn {
  background-color: #dc3545; /* Danger red */
  color: white;
  border-color: #dc3545;
}

.location-actions .delete-btn:hover {
  background-color: #c82333; /* Darker red on hover */
  border-color: #c82333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

/* Other action buttons (View Bookings, Analytics) - Secondary/Outline style */
.location-actions .view-bookings-btn,
.location-actions .analytics-btn {
  background-color: #6c757d; /* Secondary gray */
  color: white;
  border-color: #6c757d;
}

.location-actions .view-bookings-btn:hover,
.location-actions .analytics-btn:hover {
  background-color: #5a6268; /* Darker gray on hover */
  border-color: #545b62;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}


/* General Button Styles (if not already globally defined or to override) */
.primary-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: #007bff;
  color: white;
}
.primary-btn:hover {
  background-color: #0056b3;
}
.primary-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
.secondary-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: #6c757d;
  color: white;
}
.secondary-btn:hover {
  background-color: #545b62;
}
</style>
