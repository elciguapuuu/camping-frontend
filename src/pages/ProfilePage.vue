<template>
  <div class="profile">
    <h2>User Profile</h2>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">Loading profile information...</div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    
    <!-- Success message -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <div v-if="!isLoading" class="profile-content">
      <!-- View Mode -->
      <div v-if="!editMode" class="profile-info">
        <h3>Personal Information</h3>
        <div class="profile-picture">
          <img 
            :src="user.profilePictureUrl || 'http://localhost:3001/images/default-profilepicture.jpg'" 
            alt="Profile picture"
            class="profile-image"
          >
          <button @click="showUploadModal = true" class="edit-picture-btn">
            {{ user.profilePictureUrl ? 'Change Picture' : 'Add Picture' }}
          </button>
        </div>
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        
        <div class="profile-actions">
          <button @click="toggleEditMode" class="edit-btn">Edit Profile</button>
          <button @click="showDeleteModal = true" class="delete-btn">Delete Account</button>
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </div>
      
      <!-- Edit Mode -->
      <div v-else class="edit-profile">
        <h3>Edit Profile</h3>
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
            <button type="submit" :disabled="isUpdating">
              {{ isUpdating ? 'Updating...' : 'Save Changes' }}
            </button>
            <button type="button" @click="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
      
      <!-- Bookings section -->
      <div class="bookings">
        <h3>My Bookings</h3>
        <p>No bookings found.</p>
        <!-- Bookings list will be implemented here -->
      </div>
    </div>
    
    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Confirm Account Deletion</h3>
        <p>This action cannot be undone. All your data will be permanently removed.</p>
        
        <div v-if="deleteError" class="error-message">{{ deleteError }}</div>
        
        <form @submit.prevent="deleteAccount">
          <div class="form-group">
            <label for="delete_password">Enter your password to confirm</label>
            <input 
              type="password" 
              id="delete_password" 
              v-model="deletePassword" 
              required
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

    <!-- Upload Profile Picture Modal -->
    <div v-if="showUploadModal" class="modal">
      <div class="modal-content">
        <h3>Upload Profile Picture</h3>
        <form @submit.prevent="uploadProfilePicture">
          <div class="form-group">
            <label for="profile_picture">Select an image</label>
            <input 
              type="file" 
              id="profile_picture" 
              ref="profilePictureInput"
              accept="image/*"
              required
            >
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="isUploading" class="upload-btn">
              {{ isUploading ? 'Uploading...' : 'Upload' }}
            </button>
            <button type="button" @click="showUploadModal = false" class="cancel-btn">Cancel</button>
          </div>
        </form>
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
      errorMessage: '',
      successMessage: '',
      showDeleteModal: false,
      showUploadModal: false,
      deletePassword: '',
      deleteError: '',
      isOAuthUser: false
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
        this.$router.push('/login');
        return;
      }
      
      const user = JSON.parse(userData);
      this.user.id = user.id;
      
      // Get token for API request
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      // Fetch user profile
      axios.get(`http://localhost:3001/users/${this.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.user.name = response.data.name;
        this.user.email = response.data.email;
        this.user.profilePictureUrl = response.data.profile_picture_url ?
          `http://localhost:3001${response.data.profile_picture_url}` : null;
        
        // Check if this is an OAuth user (assuming your API returns this info)
        this.isOAuthUser = response.data.auth_type === 'google';
        
        // Initialize updatedUser with current values
        this.updatedUser.name = this.user.name;
        this.updatedUser.email = this.user.email;
      })
      .catch(error => {
        if (error.response && error.response.status === 401) {
          // Unauthorized - token expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.$router.push('/login');
        } else {
          this.errorMessage = error.response?.data?.error || 'Failed to load profile';
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Since we're in the profile page, we know we're not on the home page
      // so this navigation won't be redundant
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
        this.user.profilePictureUrl = `http://localhost:3001${response.data.profile_picture_url}`;
        this.successMessage = 'Profile picture updated successfully';
        this.showUploadModal = false;
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
      })
      .finally(() => {
        this.isUploading = false;
      });
    }
  }
}
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-info, .edit-profile, .bookings {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
}

.edit-btn {
  background-color: #2196F3;
}

.delete-btn, .delete-confirm-btn {
  background-color: #f44336;
}

.cancel-btn {
  background-color: #9e9e9e;
  margin-left: 10px;
}

.logout-btn {
  background-color: #607d8b;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.form-actions, .profile-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  color: #4CAF50;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  margin: 30px 0;
  color: #666;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.oauth-note {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
}

.info-box {
  background-color: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.profile-picture {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4CAF50;
  margin-bottom: 10px;
}

.edit-picture-btn {
  background-color: #2196F3;
  margin-top: 5px;
  padding: 5px 10px;
  font-size: 0.9rem;
}

.upload-btn {
  background-color: #4CAF50;
}
</style>
