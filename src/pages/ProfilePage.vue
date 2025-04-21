<template>
  <div class="profile">
    <h2>User Profile</h2>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading profile information...</p>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    
    <!-- Success message -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <div v-if="!isLoading" class="profile-content">
      <!-- Sidebar with user info -->
      <div class="profile-sidebar">
        <div class="profile-card">
          <div class="profile-picture">
            <img 
              :src="user.profilePictureUrl || 'http://localhost:3001/images/default-profilepicture.jpg'" 
              alt="Profile picture"
              class="profile-image"
            >
            <button @click="showUploadModal = true" class="edit-picture-btn">
              <span class="edit-icon">📷</span>
            </button>
          </div>
          
          <h3>{{ user.name }}</h3>
          <p class="user-email">{{ user.email }}</p>
          
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-number">{{ userBookings.length }}</span>
              <span class="stat-label">Bookings</span>
            </div>
          </div>
          
          <div class="profile-actions">
            <button @click="toggleEditMode" class="action-btn edit-btn">
              <span class="btn-icon">✏️</span> Edit Profile
            </button>
            <button @click="showDeleteModal = true" class="action-btn delete-btn">
              <span class="btn-icon">🗑️</span> Delete Account
            </button>
          </div>
        </div>
      </div>
      
      <!-- Main content area -->
      <div class="profile-main">
        <!-- Edit Profile Form (shown when in edit mode) -->
        <div v-if="editMode" class="section edit-profile">
          <h3 class="section-title">Edit Profile</h3>
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label for="name">Name</label>
              <input 
                type="text" 
                id="name" 
                v-model="updatedUser.name" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                v-model="updatedUser.email" 
                required
                :disabled="isOAuthUser"
              >
              <div v-if="isOAuthUser" class="oauth-note">
                Email cannot be changed for accounts linked to Google
              </div>
            </div>
            
            <!-- Only show password fields for non-OAuth users -->
            <template v-if="!isOAuthUser">
              <div class="form-group">
                <label for="current_password">Current Password (required for changes)</label>
                <input 
                  type="password" 
                  id="current_password" 
                  v-model="updatedUser.current_password" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="new_password">New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  id="new_password" 
                  v-model="updatedUser.new_password"
                >
              </div>
            </template>
            
            <div v-else class="oauth-note info-box">
              Password management is handled by Google for your account
            </div>
            
            <div class="form-actions">
              <button type="submit" class="primary-btn" :disabled="isUpdating">
                {{ isUpdating ? 'Updating...' : 'Save Changes' }}
              </button>
              <button type="button" @click="cancelEdit" class="secondary-btn">Cancel</button>
            </div>
          </form>
        </div>
      
        <!-- Bookings section (shown when not in edit mode) -->
        <div v-else class="section bookings">
          <h3 class="section-title">My Bookings</h3>
          
          <div v-if="loadingBookings" class="loading-inline">
            <div class="loader-small"></div>
            <span>Loading bookings...</span>
          </div>
          
          <div v-else-if="userBookings.length === 0" class="empty-state">
            <div class="empty-icon">🏕️</div>
            <p>You haven't made any bookings yet.</p>
            <router-link to="/" class="primary-btn">Find Camping Spots</router-link>
          </div>
          
          <div v-else class="bookings-list">
            <div v-for="booking in userBookings" :key="booking.booking_id" class="booking-card">
              <div class="booking-image">
                <img 
                  v-if="booking.location && booking.location.coverImage" 
                  :src="`http://localhost:3001${booking.location.coverImage}`" 
                  :alt="booking.location ? booking.location.name : 'Booking'"
                />
                <div v-else class="placeholder-image">
                  <span>No image</span>
                </div>
              </div>
              <div class="booking-details">
                <h4 class="booking-location">{{ booking.location ? booking.location.name : 'Unknown Location' }}</h4>
                
                <div class="booking-info">
                  <div class="info-row">
                    <span class="info-label">Dates:</span>
                    <span class="info-value">{{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">Guests:</span>
                    <span class="info-value">{{ booking.number_of_guests }}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value price">€{{ formatPrice(booking.total_price) }}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value status" :class="getStatusClass(booking.status_id)">
                      {{ getStatusText(booking.status_id) }}
                    </span>
                  </div>
                </div>
                
                <div class="booking-actions">
                  <router-link 
                    :to="`/location/${booking.location_id}`" 
                    class="view-location-btn"
                    v-if="booking.location"
                  >
                    View Location
                  </router-link>
                  <button 
                    @click="cancelBooking(booking.booking_id)"
                    class="cancel-booking-btn"
                    v-if="canBeCancelled(booking)"
                    :disabled="isCancelling === booking.booking_id"
                  >
                    {{ isCancelling === booking.booking_id ? 'Cancelling...' : 'Cancel Booking' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Profile navigation (shown when not in edit mode) -->
        <div v-if="!editMode" class="profile-navigation">
          <router-link to="/manage-locations" class="nav-item">
            <i class="icon">🏕️</i>
            <span>Manage Locations</span>
          </router-link>
          <div @click="logout" class="nav-item danger">
            <i class="icon">🚪</i>
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Account Deletion</h3>
          <button @click="showDeleteModal = false" class="close-modal">&times;</button>
        </div>
        
        <div class="modal-body">
          <p class="warning-text">This action cannot be undone. All your data will be permanently removed.</p>
          
          <div v-if="deleteError" class="error-message">{{ deleteError }}</div>
          
          <form @submit.prevent="deleteAccount">
            <div class="form-group">
              <label for="delete_password">Enter your password to confirm</label>
              <input 
                type="password" 
                id="delete_password" 
                v-model="deletePassword" 
                required
                placeholder="Your current password"
              >
            </div>
            
            <div class="modal-actions">
              <button type="submit" :disabled="isDeleting" class="delete-confirm-btn">
                {{ isDeleting ? 'Deleting...' : 'Delete My Account' }}
              </button>
              <button type="button" @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Upload Profile Picture Modal -->
    <div v-if="showUploadModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Upload Profile Picture</h3>
          <button @click="showUploadModal = false" class="close-modal">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="uploadProfilePicture">
            <div class="form-group">
              <label for="profile_picture">Select an image</label>
              <input 
                type="file" 
                id="profile_picture" 
                ref="profilePictureInput"
                accept="image/*"
                required
                class="file-input"
                @change="handleFileSelect"
              >
              <div class="file-input-preview">
                <img v-if="previewImage" :src="previewImage" alt="Preview" class="preview-image">
                <div v-else class="preview-placeholder">Image preview will appear here</div>
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" :disabled="isUploading || !profilePictureSelected" class="primary-btn">
                {{ isUploading ? 'Uploading...' : 'Upload' }}
              </button>
              <button type="button" @click="showUploadModal = false" class="secondary-btn">Cancel</button>
            </div>
          </form>
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
        id: '',
        name: '',
        email: '',
        profilePictureUrl: ''
      },
      updatedUser: {
        name: '',
        email: '',
        current_password: '',
        new_password: ''
      },
      editMode: false,
      isLoading: true,
      isUpdating: false,
      isDeleting: false,
      isUploading: false,
      loadingBookings: false,
      errorMessage: '',
      successMessage: '',
      showDeleteModal: false,
      showUploadModal: false,
      deletePassword: '',
      deleteError: '',
      isOAuthUser: false,
      userBookings: [],
      isCancelling: null,
      previewImage: null,
      profilePictureSelected: false
    }
  },
  created() {
    this.loadUserProfile();
  },
  methods: {
    loadUserProfile() {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Get stored user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.error('No user data found in localStorage');
        this.$router.push('/login');
        return;
      }
      
      let user;
      try {
        user = JSON.parse(userData);
        console.log('User data from localStorage:', user);
        
        if (!user || !user.id) {
          throw new Error('Invalid user data format');
        }
        
        this.user.id = user.id;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        this.$router.push('/login');
        return;
      }
      
      // Get token for API request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found in localStorage');
        this.$router.push('/login');
        return;
      }
      
      console.log('Fetching user profile for ID:', this.user.id);
      
      // Fetch user profile
      axios.get(`http://localhost:3001/users/${this.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('User profile response:', response.data);
        
        if (!response.data) {
          throw new Error('Empty response from server');
        }
        
        this.user.name = response.data.name || 'Unknown';
        this.user.email = response.data.email || 'No email';
        this.user.profilePictureUrl = response.data.profile_picture_url ?
          `http://localhost:3001${response.data.profile_picture_url}` : null;
        
        // Update the user data in localStorage to ensure profile_picture_url is present
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.name = response.data.name;
        userData.email = response.data.email;
        userData.profile_picture_url = response.data.profile_picture_url;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Check if this is an OAuth user
        this.isOAuthUser = response.data.auth_type === 'google';
        
        // Initialize updatedUser with current values
        this.updatedUser.name = this.user.name;
        this.updatedUser.email = this.user.email;
        
        // Force update navbar with current profile picture
        this.$root.$emit('auth-changed');
        
        // Load user bookings
        this.loadUserBookings(token);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          if (error.response.status === 401) {
            // Unauthorized - token expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
          } else {
            this.errorMessage = error.response.data?.error || 'Failed to load profile';
            this.isLoading = false;
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('No response received from server');
          this.errorMessage = 'No response from server. Please check your connection.';
          this.isLoading = false;
        } else {
          // Error setting up the request
          this.errorMessage = error.message || 'Failed to load profile';
          this.isLoading = false;
        }
      });
    },
    
    loadUserBookings(token) {
      this.loadingBookings = true;
      
      // Check if token and user ID are still valid
      if (!token || !this.user.id) {
        console.error('Missing token or user ID for loading bookings');
        this.loadingBookings = false;
        this.isLoading = false;
        return;
      }
      
      console.log('Fetching bookings for user ID:', this.user.id);
      
      axios.get(`http://localhost:3001/bookings/user/${this.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('User bookings response:', response.data);
        this.userBookings = response.data || [];
        
        // Only load location details if we have bookings
        if (this.userBookings.length > 0) {
          this.loadBookingLocationDetails(token);
        } else {
          this.isLoading = false;
          this.loadingBookings = false;
        }
      })
      .catch(error => {
        console.error('Error loading bookings:', error);
        this.errorMessage = 'Failed to load bookings';
        this.isLoading = false;
        this.loadingBookings = false;
        this.userBookings = []; // Reset to empty array on error
      });
    },
    
    async loadBookingLocationDetails(token) {
      try {
        // Process bookings one by one to avoid overwhelming the server
        for (const booking of this.userBookings) {
          try {
            // Ensure the booking total_price is a number
            if (booking.total_price !== undefined && booking.total_price !== null) {
              booking.total_price = parseFloat(booking.total_price);
              if (isNaN(booking.total_price)) {
                booking.total_price = 0;
              }
            } else {
              booking.total_price = 0;
            }
            
            // Wrap each booking's processing in its own try-catch to prevent one failed booking 
            // from stopping the entire process
            if (!booking.location_id) {
              console.warn('Booking missing location_id:', booking);
              continue;
            }
            
            // Load location details
            const locationResponse = await axios.get(`http://localhost:3001/locations/${booking.location_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!locationResponse.data) {
              console.warn('Empty location response for booking:', booking);
              continue;
            }
            
            const location = locationResponse.data;
            
            // Load location image
            try {
              const imagesResponse = await axios.get(`http://localhost:3001/locations/${booking.location_id}/images`);
              if (imagesResponse.data && imagesResponse.data.length > 0) {
                const coverImage = imagesResponse.data.find(img => img.is_cover === 1) || imagesResponse.data[0];
                location.coverImage = coverImage.image_url;
              }
            } catch (imageError) {
              console.error('Error loading images for location:', imageError);
              // Continue processing even if images fail to load
            }
            
            // Instead of modifying the original array with this.$set, create a copy with the new data
            booking.location = location;
          } catch (bookingError) {
            console.error(`Error loading details for booking ${booking.booking_id}:`, bookingError);
            // Continue processing other bookings even if one fails
          }
        }
      } catch (error) {
        console.error('Error in loadBookingLocationDetails:', error);
      } finally {
        // Always set loading states to false when done, regardless of success or failure
        this.isLoading = false;
        this.loadingBookings = false;
      }
    },
    
    toggleEditMode() {
      this.editMode = true;
      this.updatedUser.name = this.user.name;
      this.updatedUser.email = this.user.email;
      this.updatedUser.current_password = '';
      this.updatedUser.new_password = '';
    },
    
    cancelEdit() {
      this.editMode = false;
      this.errorMessage = '';
    },
    
    updateProfile() {
      this.isUpdating = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      // Only include fields that have changed
      const updateData = {};
      if (this.updatedUser.name !== this.user.name) {
        updateData.name = this.updatedUser.name;
      }
      
      // Only allow email changes for non-OAuth users
      if (!this.isOAuthUser && this.updatedUser.email !== this.user.email) {
        updateData.email = this.updatedUser.email;
      }
      
      // Only include password data for non-OAuth users
      if (!this.isOAuthUser) {
        if (this.updatedUser.new_password) {
          updateData.new_password = this.updatedUser.new_password;
        }
        // Current password is required for any changes (for non-OAuth users)
        updateData.current_password = this.updatedUser.current_password;
      }
      
      axios.put(`http://localhost:3001/users/${this.user.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.successMessage = 'Profile updated successfully';
        this.user.name = this.updatedUser.name;
        this.user.email = this.updatedUser.email;
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.name = this.user.name;
        userData.email = this.user.email;
        localStorage.setItem('user', JSON.stringify(userData));
        
        this.editMode = false;
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to update profile';
      })
      .finally(() => {
        this.isUpdating = false;
        this.updatedUser.current_password = '';
        this.updatedUser.new_password = '';
      });
    },
    
    deleteAccount() {
      this.isDeleting = true;
      this.deleteError = '';
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      axios.delete('http://localhost:3001/users/delete', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          user_id: this.user.id,
          password: this.deletePassword
        }
      })
      .then(() => {
        // Clear local storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login?message=Your account has been deleted');
      })
      .catch(error => {
        this.deleteError = error.response?.data?.error || 'Failed to delete account';
      })
      .finally(() => {
        this.isDeleting = false;
      });
    },
    
    logout() {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Emit auth-changed event to update UI components
      this.$root.$emit('auth-changed');
      
      // Navigate to home page
      this.$router.push('/');
    },

    uploadProfilePicture() {
      this.isUploading = true;
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      const formData = new FormData();
      const fileInput = this.$refs.profilePictureInput;
      
      if (fileInput.files.length === 0) {
        this.errorMessage = 'Please select an image file';
        this.isUploading = false;
        return;
      }
      
      formData.append('profile_picture', fileInput.files[0]);
      
      axios.post(
        `http://localhost:3001/users/${this.user.id}/profile-picture`, 
        formData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      .then(response => {
        // Get the profile picture URL from the response
        const profilePicturePath = response.data.profile_picture_url;
        console.log('New profile picture path:', profilePicturePath);
        
        // Update profile picture URL in the current page
        this.user.profilePictureUrl = `http://localhost:3001${profilePicturePath}`;
        
        // Update localStorage user data with new profile picture
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          if (userData) {
            userData.profile_picture_url = profilePicturePath;
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Give time for localStorage to update
            setTimeout(() => {
              // Force refresh of navbar - this is key!
              this.$root.$emit('auth-changed');
              
              // Also force update this component
              this.$forceUpdate();
              
              // Close the modal
              this.showUploadModal = false;
              this.previewImage = null;
              this.profilePictureSelected = false;
              this.successMessage = 'Profile picture updated successfully';
            }, 200);
          }
        } catch (e) {
          console.error('Error updating user data in localStorage:', e);
        }
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
      })
      .finally(() => {
        this.isUploading = false;
      });
    },
    
    handleFileSelect(event) {
      const fileInput = event.target;
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImage = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
        this.profilePictureSelected = true;
      }
    },
    
    formatDate(dateString) {
      try {
        if (!dateString) return 'Invalid date';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
      }
    },
    
    formatPrice(price) {
      if (price === null || price === undefined) {
        return '0.00';
      }
      
      // Handle different formats of price
      try {
        // Convert to number if it's a string
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        // Check if it's a valid number
        if (isNaN(numPrice)) {
          return '0.00';
        }
        return numPrice.toFixed(2);
      } catch (error) {
        console.error('Error formatting price:', error, 'Price value:', price);
        return '0.00';
      }
    },
    
    getStatusText(statusId) {
      const statuses = {
        5: 'Pending',
        6: 'Confirmed',
        7: 'Cancelled',
        8: 'Completed'
      };
      return statuses[statusId] || 'Unknown';
    },
    
    getStatusClass(statusId) {
      const classes = {
        5: 'status-pending',
        6: 'status-confirmed',
        7: 'status-cancelled',
        8: 'status-completed'
      };
      return classes[statusId] || '';
    },
    
    canBeCancelled(booking) {
      // Only pending or confirmed bookings can be cancelled
      return booking.status_id === 5 || booking.status_id === 6;
    },
    
    cancelBooking(bookingId) {
      if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
      }
      
      this.isCancelling = bookingId;
      const token = localStorage.getItem('token');
      
      axios.patch(`http://localhost:3001/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        // Update booking status in the local array
        const booking = this.userBookings.find(b => b.booking_id === bookingId);
        if (booking) {
          booking.status_id = 7; // Updated to status_id 7 for 'Cancelled'
        }
        
        this.successMessage = 'Booking cancelled successfully';
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to cancel booking';
      })
      .finally(() => {
        this.isCancelling = null;
      });
    }
  },
  mounted() {
    // Add event listener for file input
    this.$nextTick(() => {
      if (this.$refs.profilePictureInput) {
        this.$refs.profilePictureInput.addEventListener('change', this.handleFileSelect);
      }
    });
  },
  beforeDestroy() {
    // Remove event listener
    if (this.$refs.profilePictureInput) {
      this.$refs.profilePictureInput.removeEventListener('change', this.handleFileSelect);
    }
  }
}
</script>

<style scoped>
.profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile h2 {
  margin-bottom: 30px;
  text-align: center;
  font-size: 2rem;
  color: #42b983;
}

/* Loading and messages */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42b983;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.loader-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message, .success-message {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* Profile layout */
.profile-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 900px) {
  .profile-content {
    grid-template-columns: 300px 1fr;
  }
}

/* Profile card in sidebar */
.profile-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.profile-picture {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 20px;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #f0f0f0;
}

.edit-picture-btn {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: white;
  border: 2px solid #f0f0f0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.edit-picture-btn span {
  font-size: 18px;
}

.edit-picture-btn span.edit-icon {
  font-size: 20px;
}

.edit-picture-btn:hover {
  background-color: #f9f9f9;
  transform: scale(1.05);
}

.profile-card h3 {
  font-size: 1.5rem;
  margin-bottom: 5px;
  color: #2c3e50;
}

.user-email {
  color: #666;
  margin-bottom: 20px;
  word-break: break-all;
}

.profile-stats {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat {
  text-align: center;
  padding: 0 15px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #42b983;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon {
  margin-right: 8px;
  font-size: 16px;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.edit-btn {
  background-color: #f0f0f0;
  color: #333;
}

.edit-btn:hover {
  background-color: #e0e0e0;
}

.delete-btn {
  background-color: #ffebee;
  color: #c62828;
}

.delete-btn:hover {
  background-color: #ffcdd2;
}

.logout-btn {
  background-color: #f5f5f5;
  color: #333;
}

.logout-btn:hover {
  background-color: #e0e0e0;
}

/* Main content area */
.profile-main {
  flex: 1;
}

.section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #42b983;
}

/* Form styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.file-input {
  padding: 10px 0;
}

.file-input-preview {
  margin-top: 15px;
  width: 100%;
  height: 200px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;
}

.file-input-preview:hover {
  border-color: #42b983;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.9rem;
  background-color: #f9f9f9;
}

.oauth-note {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #666;
}

.info-box {
  background-color: #e3f2fd;
  padding: 15px;
  border-radius: 6px;
  color: #0d47a1;
}

/* Button styles */
.form-actions {
  display: flex;
  gap: 15px;
}

.primary-btn, .secondary-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background-color: #42b983;
  color: white;
}

.primary-btn:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #333;
}

.secondary-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Empty state styling */
.empty-state {
  text-align: center;
  padding: 30px;
}

.empty-icon {
  font-size: 50px;
  margin-bottom: 15px;
}

.empty-state p {
  margin-bottom: 20px;
  color: #666;
}

/* Bookings list */
.bookings-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .bookings-list {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

.booking-card {
  display: flex;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.booking-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.booking-image {
  width: 120px;
  flex-shrink: 0;
}

.booking-image img,
.placeholder-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.8rem;
}

.booking-details {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.booking-location {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #2c3e50;
}

.booking-info {
  flex: 1;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.info-label {
  width: 80px;
  color: #666;
  font-weight: 500;
}

.info-value {
  flex: 1;
}

.info-value.price {
  font-weight: 600;
  color: #42b983;
}

.info-value.status {
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-pending {
  background-color: #fff8e1;
  color: #ff8f00;
}

.status-confirmed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-cancelled {
  background-color: #ffebee;
  color: #c62828;
}

.status-completed {
  background-color: #e8eaf6;
  color: #3f51b5;
}

.booking-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.view-location-btn,
.cancel-booking-btn {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.view-location-btn {
  background-color: #f5f5f5;
  color: #333;
  text-decoration: none;
  flex: 1;
  border: none;
}

.view-location-btn:hover {
  background-color: #e9e9e9;
  text-decoration: none;
  transform: translateY(-1px);
}

.cancel-booking-btn {
  background-color: #ffebee;
  color: #c62828;
  border: none;
  flex: 1;
}

.cancel-booking-btn:hover {
  background-color: #ffcdd2;
  transform: translateY(-1px);
}

/* Profile navigation */
.profile-navigation {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:hover {
  background-color: #f9f9f9;
  text-decoration: none;
}

.nav-item .icon {
  margin-right: 15px;
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.nav-item.danger {
  color: #c62828;
}

.nav-item.danger:hover {
  background-color: #ffebee;
}

/* Modal styling */
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
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #2c3e50;
}

.close-modal {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 5px;
  transition: all 0.2s;
}

.close-modal:hover {
  color: #333;
  transform: scale(1.1);
}

.modal-body {
  padding: 20px;
}

.warning-text {
  color: #c62828;
  margin-bottom: 20px;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.delete-confirm-btn {
  flex: 1;
  background-color: #c62828;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-confirm-btn:hover {
  background-color: #b71c1c;
  transform: translateY(-2px);
}

.cancel-btn {
  flex: 1;
  background-color: #f0f0f0;
  color: #333;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

@media (max-width: 576px) {
  .form-actions, .modal-actions {
    flex-direction: column;
  }
}
</style>
