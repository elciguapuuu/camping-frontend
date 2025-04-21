<template>
  <div class="manage-location">
    <h2>{{ isEditing ? 'Edit Location' : 'Create New Camping Location' }}</h2>
    
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <div class="page-layout">
      <!-- Location Form -->
      <form @submit.prevent="handleSubmit" class="location-form">
        <!-- Basic Information Section -->
        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>
          
          <div class="form-group">
            <label for="name">Location Name*</label>
            <input 
              type="text" 
              id="name" 
              v-model="location.name" 
              placeholder="Enter a catchy name for your location"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="description">Description*</label>
            <textarea 
              id="description" 
              v-model="location.description" 
              placeholder="Describe your location, its surroundings, and what makes it special"
              rows="5"
              required
            ></textarea>
          </div>
        </div>
        
        <!-- Location Details Section -->
        <div class="form-section">
          <h3 class="section-title">Location Details</h3>
          
          <div class="form-group">
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
          
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="showManualCoordinates"
              > Having trouble finding your location? Enter coordinates manually
            </label>
          </div>
          
          <div v-if="showManualCoordinates" class="form-row">
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
            
            <div class="form-group form-info">
              <p>Tip: You can find coordinates by right-clicking a location on Google Maps and selecting "What's here?"</p>
            </div>
          </div>

          <div class="form-group">
            <label for="price_per_night">Price per night (€)*</label>
            <input 
              type="number" 
              id="price_per_night" 
              v-model="location.price_per_night" 
              placeholder="Price in euros"
              min="1"
              step="0.01"
              required
            >
          </div>
        </div>
        
        <!-- Campsite Features Section -->
        <div class="form-section">
          <h3 class="section-title">Campsite Features</h3>
          
          <div class="form-group">
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
          
          <div class="form-group">
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
        <div class="form-section">
          <h3 class="section-title">Location Images</h3>
          
          <div class="form-group">
            <label class="required-label">Upload Photos (3-10 images)*</label>
            <div class="image-upload-container">
              <div class="upload-preview">
                <div v-for="(image, index) in previewImages" :key="index" class="preview-item">
                  <img :src="image.preview" alt="Preview" class="preview-image">
                  <button type="button" @click="removeImage(index)" class="remove-image-btn">×</button>
                </div>
                <div v-if="previewImages.length < 10" class="upload-placeholder" @click="triggerFileInput">
                  <span>+</span>
                </div>
              </div>
              <div class="upload-instructions">
                <p>Select 3-10 images of your location. First image will be your main image.</p>
                <p v-if="previewImages.length < 3" class="error-text">Please upload at least 3 images</p>
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/*"
                  multiple
                  @change="handleFileChange"
                  class="file-input"
                >
                <button type="button" @click="triggerFileInput" class="select-images-btn">
                  Select Images
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Submit Section -->
        <div class="form-actions">
          <button type="submit" :disabled="isSubmitting || previewImages.length < 3" class="submit-btn">
            {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location') }}
          </button>
          <button v-if="isEditing" type="button" @click="resetForm" class="cancel-btn">
            Cancel Editing
          </button>
        </div>
      </form>
      
      <!-- My Locations Section -->
      <div v-if="userLocations.length > 0" class="my-locations">
        <h3>My Locations</h3>
        <div class="locations-list">
          <div v-for="location in userLocations" :key="location.location_id" class="location-item">
            <div class="location-image" v-if="location.coverImage">
              <img :src="getImageUrl(location)" :alt="location.name">
            </div>
            <div v-else class="location-image location-image-placeholder">
              <span>No image</span>
            </div>
            <div class="location-details">
              <h4>{{ location.name }}</h4>
              <p class="location-area">{{ location.city }}, {{ location.country }}</p>
              <p class="location-price">€{{ location.price_per_night }} per night</p>
              <p class="campsite-type" v-if="location.campsite_type_name">
                {{ location.campsite_type_name }}
              </p>
              <div class="location-actions">
                <button @click="editLocation(location)" class="edit-btn">Edit</button>
                <button @click="deleteLocation(location.location_id)" class="delete-btn">Delete</button>
              </div>
            </div>
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
        amenities: [],
        campsite_type_id: null, // Keep for backward compatibility
        campsite_types: [],     // Add this new array for multiple types
        latitude: null,
        longitude: null
      },
      showManualCoordinates: false,
      amenities: [],
      campsiteTypes: [],
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      userLocations: [],
      isEditing: false,
      infoMessage: '',
      previewImages: [],
      imagesToUpload: []
    }
  },
  created() {
    this.loadUserLocations();
    this.loadAmenities();
    this.loadCampsiteTypes();  // Add this line
  },
  methods: {
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
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      const userData = JSON.parse(localStorage.getItem('user'));
      
      axios.get(`http://localhost:3001/locations/user/${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        // Create a copy of locations with proper reactive properties
        const locations = response.data.map(location => {
          return {
            ...location,
            coverImage: null,
            allImages: [],
            campsite_type_id: null,
            campsite_type_name: 'Loading...'
          };
        });
        
        // Assign the locations to the reactive property
        this.userLocations = locations;
        
        // Load additional data for each location
        this.loadLocationDetails(locations, token);
      })
      .catch(error => {
        console.error('Error loading user locations:', error);
      });
    },
    
    // New method to load location details (images and campsite types) separately
    loadLocationDetails(locations, token) {
      // Process each location
      locations.forEach(location => {
        // Load campsite types
        axios.get(`http://localhost:3001/locations/${location.location_id}/campsitetype`, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(response => {
          if (response.data && response.data.length > 0) {
            // Use $set to ensure reactivity
            this.$set(location, 'campsite_type_id', response.data[0].campsitetypes_id);
            this.$set(location, 'campsite_type_name', response.data[0].name);
          } else {
            this.$set(location, 'campsite_type_name', 'Not specified');
          }
        })
        .catch(error => {
          console.error(`Error loading campsite type for location ${location.location_id}:`, error);
          this.$set(location, 'campsite_type_name', 'Error loading');
        });
        
        // Load images
        axios.get(`http://localhost:3001/locations/${location.location_id}/images`, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(response => {
          if (response.data && response.data.length > 0) {
            const coverImage = response.data.find(img => img.is_cover === 1) || response.data[0];
            // Use $set to ensure reactivity
            this.$set(location, 'coverImage', coverImage.image_url);
            this.$set(location, 'allImages', response.data);
          }
        })
        .catch(error => {
          console.error(`Error loading images for location ${location.location_id}:`, error);
        });
      });
    },
    
    // Helper method to get the image URL
    getImageUrl(location) {
      if (location && location.coverImage) {
        return `http://localhost:3001${location.coverImage}`;
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

    handleSubmit() {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      const isEditing = !!this.location.location_id;
      const locationData = { ...this.location };
      
      // Make sure we're sending the array of campsite types
      if (!locationData.campsite_types || locationData.campsite_types.length === 0) {
        this.errorMessage = 'Please select at least one campsite type';
        this.isSubmitting = false;
        return;
      }
      
      const method = isEditing ? 'put' : 'post';
      const url = isEditing 
        ? `http://localhost:3001/locations/${locationData.location_id}` 
        : 'http://localhost:3001/locations';
      
      if (isEditing) {
        delete locationData.location_id;
      }
      
      axios({
        method,
        url,
        data: locationData,
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        const locationId = isEditing 
          ? this.location.location_id 
          : response.data.location_id;
        
        // Handle images upload if needed
        if (this.imagesToUpload.length > 0) {
          const formData = new FormData();
          this.imagesToUpload.forEach(file => {
            formData.append('images', file);
          });
          
          return axios.post(
            `http://localhost:3001/locations/${locationId}/images`,
            formData,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          )
          .then(() => {
            this.successMessage = isEditing 
              ? 'Location updated successfully!' 
              : 'Location created successfully!';
            this.resetForm();
            this.loadUserLocations();
          });
        } else {
          this.successMessage = isEditing 
            ? 'Location updated successfully!' 
            : 'Location created successfully!';
          this.resetForm();
          this.loadUserLocations();
        }
      })
      .catch(error => {
        console.error('Error saving location:', error);
        this.errorMessage = error.response?.data?.error || 'Failed to save location';
      })
      .finally(() => {
        this.isSubmitting = false;
      });
    },
    
    // helper method to reset the form
    resetForm() {
      this.location = {
        name: '',
        description: '',
        address: '',
        city: '',
        country: '',
        price_per_night: null,
        amenities: [], 
        campsite_type_id: null,
        campsite_types: [],
        latitude: null,
        longitude: null
      };
      this.showManualCoordinates = false;
      this.previewImages = [];
      this.imagesToUpload = [];
      
      // Clear messages
      this.successMessage = '';
      this.errorMessage = '';
      
      console.log('Form reset, amenities:', this.location.amenities);
    },
    
    editLocation(location) {
      this.resetForm();
      
      this.isEditing = true;
      this.location = {
        ...location,
        location_id: parseInt(location.location_id),
        price_per_night: parseFloat(location.price_per_night),
        address: location.address || '',
        amenities: [],
        campsite_types: [] // Initialize empty array
      };
      
      const token = localStorage.getItem('token');
      
      // Fetch amenities for this location
      axios.get(`http://localhost:3001/locations/${location.location_id}/amenities`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('Loaded amenities for editing:', response.data);
        this.location.amenities = response.data.map(a => parseInt(a.amenity_id, 10));
      })
      .catch(error => {
        console.error('Error loading amenities for editing:', error);
      });
      
      // Fetch campsite types for this location
      axios.get(`http://localhost:3001/locations/${location.location_id}/campsitetype`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.location.campsite_types = response.data.map(t => parseInt(t.campsitetypes_id, 10));
      })
      .catch(error => {
        console.error('Error loading campsite types for editing:', error);
      });
      
      // Load existing images
      axios.get(`http://localhost:3001/locations/${location.location_id}/images`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        if (response.data && response.data.length > 0) {
          this.previewImages = response.data.map(image => ({
            preview: `http://localhost:3001${image.image_url}`,
            id: image.image_id,
            isExisting: true
          }));
        }
      })
      .catch(error => {
        console.error('Error loading images for editing:', error);
      });

      // Update UI state
      window.scrollTo(0, 0);
      this.successMessage = `You are now editing "${location.name}"`;
    },

    deleteLocation(locationId) {
      if (!confirm('Are you sure you want to delete this location?')) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }

      axios.delete(`http://localhost:3001/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.successMessage = 'Location deleted successfully';
        this.loadUserLocations();
      })
      .catch(error => {
        this.errorMessage = error.response?.data?.error || 'Failed to delete location';
      });
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileChange(event) {
      const files = Array.from(event.target.files);
      
      // Check if adding these files would exceed the limit
      if (this.previewImages.length + files.length > 10) {
        this.errorMessage = "You can upload a maximum of 10 images";
        return;
      }
      
      files.forEach(file => {
        // Validate file is an image
        if (!file.type.match('image.*')) {
          this.errorMessage = "Please upload only image files";
          return;
        }
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = e => {
          this.previewImages.push({
            preview: e.target.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
        
        // Add to files to be uploaded
        this.imagesToUpload.push(file);
      });
      
      // Reset the input to allow selecting the same file again
      event.target.value = '';
    },

    removeImage(index) {
      const imageToRemove = this.previewImages[index];
      
      // If it's an existing image, delete it from the server
      if (imageToRemove.isExisting) {
        const token = localStorage.getItem('token');
        axios.delete(`http://localhost:3001/images/${imageToRemove.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .catch(error => {
          console.error('Error deleting image:', error);
          this.errorMessage = 'Failed to delete image';
          return; // Don't continue if deletion failed
        });
      }
      
      // Remove from preview array
      this.previewImages.splice(index, 1);
      
      // If it's not an existing image, also remove from imagesToUpload
      if (!imageToRemove.isExisting) {
        const fileIndex = this.imagesToUpload.findIndex(file => 
          file === imageToRemove.file
        );
        if (fileIndex !== -1) {
          this.imagesToUpload.splice(fileIndex, 1);
        }
      }
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
.manage-location {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.manage-location h2 {
  margin-bottom: 20px;
  text-align: center;
}

.page-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 992px) {
  .page-layout {
    grid-template-columns: 2fr 1fr;
  }
  
  .location-form {
    order: 1;
  }
  
  .my-locations {
    order: 2;
    align-self: start;
    position: sticky;
    top: 20px;
  }
}

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
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required-label::after {
  content: ' *';
  color: red;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-item input[type="checkbox"] {
  margin-right: 8px;
}

.form-info {
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Image upload styling */
.image-upload-container {
  margin-top: 10px;
}

.upload-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.8);
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder {
  width: 100px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder span {
  font-size: 30px;
  color: #ccc;
}

.file-input {
  display: none;
}

.select-images-btn {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.error-text {
  color: red;
  font-size: 0.9rem;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 30px;
}

.submit-btn {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  flex: 1;
}

.cancel-btn {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
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
</style>
