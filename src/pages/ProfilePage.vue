<template>
  <div class="profile-page">
    <div v-if="isLoading && !user.id" class="loading-container">
      <p class="loading-text">Loading profile...</p>
    </div>
    <div v-else-if="errorMessage && !user.id" class="error-container">
      <p class="error-message">{{ errorMessage }}</p>
      <button @click="loadUserProfile" class="btn btn-primary">Try Again</button>
    </div>
    <div v-else-if="user && user.id" class="container">
      <h1 class="page-title">Welcome, {{ user.name || 'User' }}!</h1>

      <!-- User Information Section -->
      <section class="profile-section user-info-section">
        <h2 class="section-header-title">My Information</h2>
        <div class="user-info-content">
          <!-- Profile Picture Area -->
          <div class="profile-picture-area">
            <div class="profile-picture-container">
              <div v-if="user.profilePictureUrl" class="profile-picture-wrapper">
                <img
                  :src="user.profilePictureUrl"
                  alt="Profile Picture"
                  class="profile-picture"
                  @error="handleProfileImageError"
                />
              </div>
              <div v-else class="profile-picture placeholder-content">
                <span>No Photo</span>
              </div>
            </div>
            <div class="profile-picture-actions">
              <input type="file" @change="onFileSelected" accept="image/*" ref="fileInput" style="display: none;">
              <button @click="$refs.fileInput.click()" class="btn btn-small btn-secondary-outline change-picture-btn">
                {{ user.profilePictureUrl ? 'Change Picture' : 'Add Picture' }}
              </button>
              <!-- Removed upload button -->
              <button v-if="user.profilePictureUrl" @click="removeProfilePicture" class="btn btn-small btn-danger-outline remove-picture-btn">
                Remove Picture
              </button>
            </div>
          </div>

          <!-- Profile Details & Actions Area -->
          <div class="profile-details-area">
            <div v-if="!editMode" class="profile-details">
              <div class="detail-group">
                <p><strong class="font-medium">Name:</strong> {{ user.name || 'N/A' }}</p>
                <p><strong class="font-medium">Email:</strong> {{ user.email }}</p>
              </div>
              <div class="profile-main-actions">
                <button @click="toggleEditMode" class="btn btn-primary-outline">Edit Profile</button>
                <button @click="logout" class="btn btn-danger">Logout</button>
              </div>
               <div v-if="!isOAuthUser" class="delete-account-action">
                  <button @click="confirmDeleteAccount" class="btn btn-danger-outline btn-small">Delete Account</button>
              </div>
            </div>
            
            <!-- Edit Profile Form -->
            <form v-if="editMode" @submit.prevent="updateProfile" class="edit-profile-form">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" v-model="updatedUser.name" required>
              </div>
              <div class="form-group" v-if="!isOAuthUser">
                <label for="currentPassword">Current Password:</label>
                <input type="password" id="currentPassword" v-model="updatedUser.currentPassword">
                <small>Required to change password.</small>
              </div>
              <div class="form-group" v-if="!isOAuthUser">
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" v-model="updatedUser.newPassword" :disabled="isOAuthUser">
                <small v-if="isOAuthUser">Password cannot be changed for Google accounts.</small>
              </div>
              <div class="form-group" v-if="!isOAuthUser">
                <label for="confirmNewPassword">Confirm New Password:</label>
                <input type="password" id="confirmNewPassword" v-model="updatedUser.confirmNewPassword" :disabled="isOAuthUser">
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="isUpdatingProfile">
                  {{ isUpdatingProfile ? 'Saving...' : 'Save Changes' }}
                </button>
                <button type="button" @click="cancelEdit" class="btn btn-secondary-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Bookings Section -->
      <section class="profile-section bookings-section">
        <h2 class="section-header-title">My Bookings</h2>
        <div v-if="loadingBookings" class="loading-container">
          <p class="loading-text">Loading bookings...</p>
        </div>
        <div v-else-if="errorMessage && userBookings.length === 0" class="error-container">
          <p class="error-message">{{ errorMessage.includes('bookings') ? errorMessage : 'Could not load bookings.' }}</p>
        </div>
        <div v-else>
          <!-- Active Bookings -->
          <div v-if="activeBookings.length > 0" class="bookings-list-container">
            <h3 class="bookings-type-title">Active Bookings</h3>
            <div class="bookings-grid">
              <div v-for="booking in activeBookings" :key="booking.booking_id" class="booking-card">
                <div class="booking-image">
                  <img
                    v-if="booking.location && booking.location.coverImage"
                    :src="booking.location.coverImage"
                    :alt="booking.location_name || 'Location image'"
                    @error="handleBookingImageError($event, booking)"
                  />
                  <div v-else class="placeholder-image">
                    <span>No image available</span>
                  </div>
                </div>
                <div class="booking-content">
                  <h4 class="booking-location-name" :title="booking.location_name">{{ booking.location_name || 'N/A' }}</h4>
                  <p class="booking-dates">Dates: {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</p>
                  <p class="booking-price">Total: ${{ formatPrice(booking.total_price) }}</p>
                  <p class="booking-status">Status: <span :class="`status-${booking.status_name}`">{{ booking.status_name }}</span></p>
                  <div class="booking-card-actions">
                    <button @click="viewBookingDetails(booking.booking_id)" class="btn btn-small btn-primary-outline">View Details</button>
                    <button 
                      v-if="canCancelBooking(booking)" 
                      @click="promptCancelBooking(booking.booking_id)" 
                      :disabled="isCancelling === booking.booking_id"
                      class="btn btn-small btn-danger-outline"
                    >
                      {{ isCancelling === booking.booking_id ? 'Cancelling...' : 'Cancel Booking' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!loadingBookings && userBookings.filter(b => b.status_name !== 'cancelled' && b.status_name !== 'expired').length === 0 && activeBookings.length === 0" class="no-bookings-message">
            <p>You have no active bookings.</p>
          </div>

          <!-- Cancelled Bookings -->
          <div v-if="cancelledBookings.length > 0" class="bookings-list-container cancelled-bookings">
            <h3 class="bookings-type-title">Cancelled Bookings</h3>
            <div class="bookings-grid">
              <div v-for="booking in cancelledBookings" :key="booking.booking_id" class="booking-card cancelled">
                 <div class="booking-image">
                   <img
                    v-if="booking.location && booking.location.coverImage"
                    :src="booking.location.coverImage"
                    :alt="booking.location_name || 'Location image'"
                    @error="handleBookingImageError($event, booking)"
                  />
                  <div v-else class="placeholder-image">
                    <span>No image available</span>
                  </div>
                </div>
                <div class="booking-content">
                  <h4 class="booking-location-name" :title="booking.location_name">{{ booking.location_name || 'N/A' }}</h4>
                  <p class="booking-dates">Dates: {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</p>
                  <p class="booking-status">Status: <span :class="`status-${booking.status_name}`">{{ booking.status_name }}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Expired Bookings -->
          <div v-if="expiredBookings.length > 0" class="bookings-list-container past-bookings">
            <h3 class="bookings-type-title">Past Bookings</h3>
            <div class="bookings-grid">
              <div v-for="booking in expiredBookings" :key="booking.booking_id" class="booking-card expired">
                <div class="booking-image">
                   <img
                    v-if="booking.location && booking.location.coverImage"
                    :src="booking.location.coverImage"
                    :alt="booking.location_name || 'Location image'"
                    @error="handleBookingImageError($event, booking)"
                  />
                  <div v-else class="placeholder-image">
                    <span>No image available</span>
                  </div>
                </div>
                <div class="booking-content">
                  <h4 class="booking-location-name" :title="booking.location_name">{{ booking.location_name || 'N/A' }}</h4>
                  <p class="booking-dates">Dates: {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</p>
                   <p class="booking-status">Status: <span :class="`status-${booking.status_name}`">{{ booking.status_name }}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!loadingBookings && userBookings.length === 0 && !errorMessage.includes('bookings')" class="no-bookings-message">
            <p>You haven't made any bookings yet.</p>
            <router-link to="/" class="btn btn-primary">Explore Locations</router-link>
          </div>
        </div>
      </section>

      <!-- Modals -->
      <div v-if="showDeleteConfirmation" class="modal-overlay">
        <div class="modal-content">
          <h3>Confirm Account Deletion</h3>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div class="modal-actions">
            <button @click="deleteAccount" class="btn btn-danger" :disabled="isDeleting">
              {{ isDeleting ? 'Deleting...' : 'Yes, Delete My Account' }}
            </button>
            <button @click="showDeleteConfirmation = false" class="btn btn-secondary-outline">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProfilePage',
  data() {
    return {
      user: {
        id: null,
        name: '',
        email: '',
        profilePictureUrl: null, // Initialize to null
        created_at: '',
        auth_type: ''
      },
      updatedUser: {
        name: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      },
      userBookings: [],
      isLoading: true,
      loadingBookings: true,
      editMode: false,
      isOAuthUser: false,
      errorMessage: '',
      successMessage: '',
      selectedFile: null,
      isUploading: false,
      isUpdatingProfile: false,
      isCancelling: null, // Stores booking_id of booking being cancelled
      showDeleteConfirmation: false,
      isDeleting: false,
    };
  },
  computed: {
    activeBookings() {
      const now = new Date();
      return this.userBookings.filter(booking => {
        const endDate = new Date(booking.end_date);
        return booking.status_name === 'confirmed' && endDate >= now;
      });
    },
    expiredBookings() {
      const now = new Date();
      return this.userBookings.filter(booking => {
        const endDate = new Date(booking.end_date);
        return (booking.status_name !== 'cancelled' && endDate < now) || booking.status_name === 'expired';
      });
    },
    cancelledBookings() {
      return this.userBookings.filter(booking => booking.status_name === 'cancelled');
    }
  },
  methods: {
    handleProfileImageError() {
      console.warn(`[ProfilePage] Error loading profile picture. Original src: ${this.user.profilePictureUrl}. Setting to null.`);
      this.user.profilePictureUrl = null; // Set to null to trigger placeholder
    },
    handleBookingImageError(event, booking) {
      // Log the state of booking.location when the error occurs
      console.log(`[handleBookingImageError] Called for booking ID ${booking.booking_id} (${booking.location_name}). Initial booking.location:`, booking.location ? JSON.parse(JSON.stringify(booking.location)) : 'booking.location is undefined/null');

      const originalSrc = booking.location && booking.location.coverImage ? booking.location.coverImage : (event.target ? event.target.src : 'unknown');
      console.warn(`[ProfilePage] Error loading image for booking ${booking.location_name || booking.booking_id}. Original src: ${originalSrc}. Setting to null.`);

      const bookingInArray = this.userBookings.find(b => b.booking_id === booking.booking_id);
      if (bookingInArray && bookingInArray.location) {
        this.$set(bookingInArray.location, 'coverImage', null); // Ensure reactivity
        console.log(`[handleBookingImageError] Set coverImage to null for bookingInArray.location for booking ID ${booking.booking_id}`);
      } else if (booking.location) {
        console.warn(`[ProfilePage] Booking with ID ${booking.booking_id} not found in userBookings array for image error, or bookingInArray.location was undefined. Attempting to set coverImage on the passed booking object's location directly.`);
        this.$set(booking.location, 'coverImage', null); // Ensure reactivity
        console.log(`[handleBookingImageError] Set coverImage to null for booking.location (fallback) for booking ID ${booking.booking_id}`);
      } else {
        console.error(`[ProfilePage] Cannot set coverImage to null for booking ID ${booking.booking_id}: booking or its location object not found.`);
      }
    },
    loadUserProfile() {
      this.isLoading = true;
      this.errorMessage = '';
      const userDataString = localStorage.getItem('user');
      if (!userDataString) {
        this.$router.push('/login');
        return;
      }
      let storedUser;
      try {
        storedUser = JSON.parse(userDataString);
        this.user.id = storedUser.user_id || storedUser.id; // Handle both possible id keys
        this.user.name = storedUser.name;
        this.user.email = storedUser.email;
        this.user.created_at = storedUser.created_at;
        this.user.auth_type = storedUser.auth_type;
        this.isOAuthUser = storedUser.auth_type === 'google';

        if (storedUser.profile_picture_url) {
          let fullUrl = storedUser.profile_picture_url;
          const timestamp = new Date().getTime();
          // Prepend backend URL if it's a relative path
          if (fullUrl && !fullUrl.startsWith('http')) {
             if (fullUrl.startsWith('/uploads/')) {
                fullUrl = `http://localhost:3001${fullUrl}`;
             } else {
                fullUrl = `http://localhost:3001/${fullUrl}`;
             }
          }
          this.user.profilePictureUrl = fullUrl ? `${fullUrl}?t=${timestamp}` : null;
          console.log('[ProfilePage] Set profilePictureUrl to:', this.user.profilePictureUrl);
        } else {
          this.user.profilePictureUrl = null;
          console.log('[ProfilePage] No profile_picture_url found in storedUser.');
        }

        this.updatedUser.name = storedUser.name;
      } catch (error) {
        console.error('Error loading user profile from localStorage:', error);
        this.errorMessage = 'Failed to load profile data. Please try logging out and back in.';
        // Potentially clear corrupted local storage
        // localStorage.removeItem('user');
        // localStorage.removeItem('token');
        // this.$router.push('/login');
      } finally {
        this.isLoading = false;
      }
      this.fetchUserBookings(); // Load bookings after profile
    },

    async fetchUserBookings() {
      this.loadingBookings = true;
      const token = localStorage.getItem('token'); // Define token here
      if (!token) {
        this.errorMessage = 'Authentication token not found. Please log in.';
        this.loadingBookings = false;
        return;
      }
      axios.get(`http://localhost:3001/bookings/user/${this.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('[ProfilePage] Raw user bookings data received:', JSON.stringify(response.data));
        this.userBookings = response.data.map(booking => {
          let finalCoverImageUrl = null; // Default to null
          
          const locationData = booking.location;
          const backendCoverUrl = locationData ? locationData.cover_image_url : null;

          console.log(`[ProfilePage] Processing booking ID ${booking.booking_id}, location: ${booking.location_name}. Has locationData: ${!!locationData}. Backend cover_image_url: ${backendCoverUrl}`);

          if (backendCoverUrl && typeof backendCoverUrl === 'string' && backendCoverUrl.trim() !== '') {
            const trimmedBackendCoverUrl = backendCoverUrl.trim();
            if (trimmedBackendCoverUrl.startsWith('http://') || trimmedBackendCoverUrl.startsWith('https://')) {
              finalCoverImageUrl = trimmedBackendCoverUrl; // It's already absolute
            } else {
              // It's relative, construct the full URL
              const relativePath = trimmedBackendCoverUrl.startsWith('/') ? trimmedBackendCoverUrl : `/${trimmedBackendCoverUrl}`;
              finalCoverImageUrl = `http://localhost:3001${relativePath}?t=${new Date().getTime()}`; // Add cache buster
            }
          } else {
             console.log(`[ProfilePage] Booking ID ${booking.booking_id} (${booking.location_name}) - cover_image_url is missing or invalid ('${backendCoverUrl}'), using null.`);
             // finalCoverImageUrl remains null
          }
          console.log(`[ProfilePage] Booking ID ${booking.booking_id} (${booking.location_name}) - final coverImage URL set to: ${finalCoverImageUrl}`);

          return {
            ...booking,
            location: { // Ensure location object exists even if original was minimal
              ...(locationData || {}), // Spread original location fields, or empty object if no locationData
              coverImage: finalCoverImageUrl // Override/set coverImage, will be null if no valid image
            }
          };
        });
      })
      .catch(error => {
        console.error('Error fetching user bookings:', error);
        this.errorMessage = error.response?.data?.error || 'Failed to load bookings.';
      })
      .finally(() => {
        this.loadingBookings = false;
      });
    },
    toggleEditMode() {
      this.editMode = !this.editMode;
      if (this.editMode) {
        this.updatedUser.name = this.user.name;
        this.updatedUser.currentPassword = '';
        this.updatedUser.newPassword = '';
        this.updatedUser.confirmNewPassword = '';
      }
    },
    cancelEdit() {
      this.editMode = false;
    },
    updateProfile() {
      if (this.updatedUser.newPassword !== this.updatedUser.confirmNewPassword) {
        this.errorMessage = "New passwords do not match.";
        return;
      }
      if (!this.isOAuthUser && this.updatedUser.newPassword && !this.updatedUser.currentPassword) {
        this.errorMessage = "Current password is required to set a new password.";
        return;
      }

      this.isUpdatingProfile = true;
      this.errorMessage = '';
      this.successMessage = '';
      const token = localStorage.getItem('token');
      
      let payload = { name: this.updatedUser.name };
      if (!this.isOAuthUser && this.updatedUser.newPassword) {
        payload.currentPassword = this.updatedUser.currentPassword;
        payload.newPassword = this.updatedUser.newPassword;
      }

      axios.put(`http://localhost:3001/users/${this.user.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.user.name = response.data.name || this.user.name;
        const storedUser = JSON.parse(localStorage.getItem('user'));
        storedUser.name = this.user.name;
        localStorage.setItem('user', JSON.stringify(storedUser));
        this.$root.$emit('auth-changed'); 

        this.successMessage = 'Profile updated successfully.';
        this.editMode = false;
        this.updatedUser.currentPassword = '';
        this.updatedUser.newPassword = '';
        this.updatedUser.confirmNewPassword = '';
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to update profile.';
      })
      .finally(() => {
        this.isUpdatingProfile = false;
      });
    },
    onFileSelected(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        this.uploadProfilePicture(); // Automatically upload when file is selected
      }
    },
    uploadProfilePicture() {
      if (!this.selectedFile) return;
      this.isUploading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const formData = new FormData();
      formData.append('profile_picture', this.selectedFile); // Changed 'profilePicture' to 'profile_picture'
      const token = localStorage.getItem('token');
      axios.post(`http://localhost:3001/users/${this.user.id}/profile-picture`, formData, { // Changed '/upload-picture' to '/profile-picture'
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        // Backend now sends profile_picture_url
        const newPicPath = response.data.profile_picture_url; 
        this.user.profilePictureUrl = newPicPath ? `${newPicPath}?t=${new Date().getTime()}` : null;
        
        this.successMessage = 'Profile picture updated.';
        this.selectedFile = null; 
        const storedUser = JSON.parse(localStorage.getItem('user'));
        storedUser.profile_picture_url = newPicPath; 
        localStorage.setItem('user', JSON.stringify(storedUser));
        this.$root.$emit('auth-changed'); 
      })
      .catch(error => {
        if (error.response) {
          console.error('Backend Error Data:', error.response.data);
          console.error('Backend Error Status:', error.response.status);
          console.error('Backend Error Headers:', error.response.headers);
          this.errorMessage = `Upload failed: ${error.response.data?.error || error.response.data?.message || error.response.statusText || 'Server error'}`;
        } else if (error.request) {
          console.error('Upload Error: No response received:', error.request);
          this.errorMessage = 'Upload failed: No response from server. Please check your network connection.';
        } else {
          console.error('Upload Error: Request setup issue:', error.message);
          this.errorMessage = `Upload failed: ${error.message}`;
        }
      })
      .finally(() => {
        this.isUploading = false;
      });
    },
    removeProfilePicture() {
      this.isUploading = true; // Reuse for loading state
      this.errorMessage = '';
      this.successMessage = '';
      const token = localStorage.getItem('token');

      // Placeholder for backend call - will need a new endpoint
      axios.delete(`http://localhost:3001/users/${this.user.id}/profile-picture`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.user.profilePictureUrl = null;
        this.successMessage = 'Profile picture removed.';
        const storedUser = JSON.parse(localStorage.getItem('user'));
        storedUser.profile_picture_url = null;
        localStorage.setItem('user', JSON.stringify(storedUser));
        this.$root.$emit('auth-changed');
        // Clear selected file in case user selected one then clicked remove
        this.selectedFile = null; 
        this.$refs.fileInput.value = null; // Reset file input
      })
      .catch(error => {
        console.error('Error removing profile picture:', error.response || error.message || error);
        if (error.response) {
          this.errorMessage = `Removal failed: ${error.response.data?.error || error.response.data?.message || error.response.statusText || 'Server error'}`;
        } else if (error.request) {
          this.errorMessage = 'Removal failed: No response from server.';
        } else {
          this.errorMessage = `Removal failed: ${error.message}`;
        }
      })
      .finally(() => {
        this.isUploading = false;
      });
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$root.$emit('auth-changed');
      this.$router.push('/login');
    },
    confirmDeleteAccount() {
        if (this.isOAuthUser) {
            this.errorMessage = "Accounts created via Google must be managed through Google.";
            return;
        }
        this.showDeleteConfirmation = true;
    },
    deleteAccount() {
        if (this.isOAuthUser) return; 

        this.isDeleting = true;
        this.errorMessage = '';
        const token = localStorage.getItem('token');
        axios.delete(`http://localhost:3001/users/${this.user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            this.logout(); 
        })
        .catch(error => {
            this.errorMessage = error.response?.data?.error || 'Failed to delete account.';
        })
        .finally(() => {
            this.isDeleting = false;
            this.showDeleteConfirmation = false;
        });
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Defined options here
      try {
        return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Invalid Date';
      }
    },
    formatPrice(price) {
      if (price === null || price === undefined) return '0.00';
      const numPrice = parseFloat(String(price));
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    },
    canCancelBooking(booking) {
      return booking.status_name === 'confirmed';
    },
    promptCancelBooking(bookingId) {
      const bookingToCancel = this.userBookings.find(b => b.booking_id === bookingId);
      if (!bookingToCancel) return;

      let confirmationMessage = "Are you sure you want to cancel this booking?";
      // Ensure the confirm dialog is actually used
      if (confirm(confirmationMessage)) {
        this.executeCancelBooking(bookingId);
      }
    },
    async executeCancelBooking(bookingId) {
      this.isCancelling = bookingId;
      this.errorMessage = '';
      this.successMessage = '';
      const token = localStorage.getItem('token');
      try {
        await axios.put(`http://localhost:3001/bookings/${bookingId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.successMessage = 'Booking cancelled successfully.';
        // Refresh bookings to reflect the change
        this.loadUserBookings(token);
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Failed to cancel booking.';
      } finally {
        this.isCancelling = null;
      }
    },
    viewBookingDetails(bookingId) {
      // Navigate to a booking detail page or show a modal
      console.log('View details for booking ID:', bookingId);
      // Example: this.$router.push({ name: 'BookingDetails', params: { bookingId } });
      // For now, just a log. Implement navigation or modal display as needed.
    }
  },
  created() {
    this.loadUserProfile();
    // loadUserBookings is called at the end of loadUserProfile
  },
};
</script>

<style scoped>
/* General Page Styles */
.profile-page {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-title {
  font-size: 2.2rem;
  color: #2c3e50; /* Dark Blue-Gray */
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
}

.loading-container, .error-container {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}
.loading-text { color: #555; }
.error-message { color: #e74c3c; /* Red */ }

/* Section Styles */
.profile-section {
  background-color: #fff;
  padding: 1.5rem 2rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header-title {
  font-size: 1.6rem;
  color: #34495e; /* Wet Asphalt */
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0; /* Light Gray Border */
  font-weight: 500;
}

/* User Info Section */
.user-info-section {
  /* Add styles or remove if empty - Placeholder to avoid errors */
  margin-bottom: 1rem; /* Example style */
}

.user-info-content {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  gap: 1.5rem; /* Space between picture area and details area */
}

.profile-picture-area {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center picture and buttons */
  gap: 0.75rem; /* Space between picture and its actions */
  width: 100%; /* Take full width */
  margin-bottom: 1rem; /* Add some space below the picture area */
}

.profile-picture-container {
  position: relative;
  width: 150px; /* Or your desired size */
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e9ecef; /* Placeholder background */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.profile-picture-wrapper {
  width: 100%;
  height: 100%;
}

.profile-picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.9rem;
  color: #6c757d;
}

.profile-picture-actions {
  display: flex;
  flex-direction: column; /* Stack buttons vertically */
  align-items: flex-start; /* Align to the start of the flex container */
  gap: 0.5rem; /* Space between buttons */
  margin-top: 0.75rem;
}

.change-picture-btn,
.upload-btn, /* Keep for potential future use or if styling is shared */
.remove-picture-btn {
  width: 100%; /* Make buttons take full width of their container */
  padding: 0.5rem 0.8rem; /* Adjust padding for better fit */
  font-size: 0.85rem; /* Slightly smaller font */
}

/* Ensure buttons in profile-main-actions are not affected if they share general .btn styles */
.profile-main-actions .btn {
  width: auto; /* Reset width for these specific buttons */
}

.profile-details-area {
  flex-grow: 1; /* Allow this area to take remaining space */
  width: 100%; /* Take full width */
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Space between detail groups and actions */
}

.detail-group p {
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
  color: #495057;
}
.detail-group p strong {
  color: #343a40;
}

.profile-main-actions {
  display: flex;
  gap: 0.75rem; /* Space between main action buttons */
  margin-top: 1rem;
  flex-wrap: wrap;
}

.delete-account-action {
  margin-top: 1.5rem; /* More space before delete button */
  align-self: flex-start; /* Align to the start if container is flex */
}

/* Edit Profile Form */
.edit-profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Space between form groups */
  margin-top: 1rem; /* Space above the form when it appears */
}

.edit-profile-form .form-group {
  display: flex;
  flex-direction: column;
}

.edit-profile-form label {
  margin-bottom: 0.3rem;
  font-weight: 500;
  font-size: 0.95rem;
  color: #495057;
}

.edit-profile-form input[type="text"],
.edit-profile-form input[type="password"] {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%; /* Make inputs take full width of their container */
  box-sizing: border-box;
}
.edit-profile-form input:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.edit-profile-form small {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.2rem;
}

.edit-profile-form .form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

/* Bookings Section */
.bookings-section {
  /* Add styles or remove if empty - Placeholder to avoid errors */
  margin-top: 1rem; /* Example style */
}

.bookings-list-container {
  margin-bottom: 2rem;
}
.bookings-list-container:last-child {
  margin-bottom: 0;
}

.bookings-type-title {
  font-size: 1.3rem;
  color: #34495e;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.booking-card {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.07);
  overflow: hidden; /* To make border-radius work on image container */
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.booking-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.booking-image {
  width: 100%;
  height: 180px; /* Example height, adjust as needed */
  overflow: hidden; /* Ensures image fits well */
  background-color: #f0f0f0; /* Fallback bg for the container */
}

.booking-image img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Cover ensures the image fills the space, cropping if necessary */
}

.booking-content {
  padding: 1rem;
  flex-grow: 1; /* Allows content to fill space if card heights vary */
  display: flex;
  flex-direction: column;
}

.booking-location-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking-dates,
.booking-price,
.booking-status {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.booking-status .status-confirmed {
  color: #28a745; /* Green */
  font-weight: 500;
}
.booking-status .status-pending {
  color: #fd7e14; /* Orange */
  font-weight: 500;
}
.booking-status .status-cancelled {
  color: #dc3545; /* Red */
  font-weight: 500;
}
.booking-status .status-expired {
  color: #6c757d; /* Gray */
  font-weight: 500;
}

.booking-card-actions {
  margin-top: auto; /* Pushes actions to the bottom of the card */
  padding-top: 0.75rem; /* Space above buttons */
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.no-bookings-message {
  text-align: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 1rem;
}
.no-bookings-message p {
  margin-bottom: 1rem;
  font-size: 1.05rem;
}

/* Placeholder Styles */
.profile-picture.placeholder-content,
.placeholder-image {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e9ecef; /* Light gray background */
  color: #6c757d; /* Muted text color */
  font-size: 0.9rem;
  border-radius: 4px; /* Match image border-radius if any */
  text-align: center;
}

.profile-picture.placeholder-content {
  width: 150px; /* Match profile picture width */
  height: 150px; /* Match profile picture height */
  border-radius: 50%; /* If profile pics are circular */
  /* margin-bottom: 10px; */ /* Handled by gap in profile-picture-container */
}

.booking-card .placeholder-image {
  width: 100%;
  height: 180px; /* Or your standard booking image height */
  border-top-left-radius: 6px; /* Match card styling */
  border-top-right-radius: 6px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 450px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.modal-content p {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #555;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* Button Styles (ensure these are comprehensive or imported) */
.btn {
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}
.btn-primary:disabled {
  background-color: #007bff;
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary-outline {
  color: #007bff;
  border-color: #007bff;
  background-color: transparent;
}
.btn-primary-outline:hover {
  background-color: #007bff;
  color: white;
}

.btn-secondary-outline {
  color: #6c757d;
  border-color: #6c757d;
  background-color: transparent;
}
.btn-secondary-outline:hover {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}
.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-danger-outline {
  color: #dc3545;
  border-color: #dc3545;
  background-color: transparent;
}
.btn-danger-outline:hover {
  background-color: #dc3545;
  color: white;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

</style>
