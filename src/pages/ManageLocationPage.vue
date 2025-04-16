<template>
  <div class="manage-location">
    <h2>Create New Camping Location</h2>
    
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <form @submit.prevent="handleSubmit" class="location-form">
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
      
      <div class="form-row">
        <div class="form-group">
          <label for="latitude">Latitude</label>
          <input 
            type="number" 
            id="latitude" 
            v-model="location.latitude" 
            placeholder="e.g. 48.8566"
            step="0.0001"
          >
        </div>
        
        <div class="form-group">
          <label for="longitude">Longitude</label>
          <input 
            type="number" 
            id="longitude" 
            v-model="location.longitude" 
            placeholder="e.g. 2.3522"
            step="0.0001"
          >
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
      
      <div class="form-group">
        <label for="campsite_type">Campsite Type*</label>
        <select 
          id="campsite_type" 
          v-model="location.campsite_type_id" 
          required
        >
          <option value="" disabled>Select campsite type</option>
          <option v-for="type in campsiteTypes" :key="type.campsitetypes_id" :value="type.campsitetypes_id">
            {{ type.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Amenities (select all that apply)</label>
        <div class="amenities-list">
          <div v-for="amenity in amenities" :key="amenity.amenity_id" class="amenity-item">
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

      <div class="form-group">
        <label>Location Images (3-10 images)*</label>
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
      
      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting" class="submit-btn">
          {{ isSubmitting ? 'Saving...' : (location.location_id ? 'Update Location' : 'Create Location') }}
        </button>
      </div>
    </form>
    
    <div v-if="userLocations.length > 0" class="my-locations">
      <h3>My Locations</h3>
      <div class="locations-list">
        <div v-for="location in userLocations" :key="location.location_id" class="location-item">
          <h3>{{ location.name }}</h3>
          <p>{{ location.description }}</p>
          
          <div class="location-actions">
            <button @click="editLocation(location)" class="edit-btn">Edit</button>
            <button @click="deleteLocation(location.location_id)" class="delete-btn">Delete</button>
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
        city: '',
        country: '',
        price_per_night: null,
        latitude: null,
        longitude: null,
        amenities: [],
        campsite_type_id: null
      },
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
        // Ensure all amenity IDs are numbers
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
      .then(async response => {
        this.userLocations = response.data;
        
        // For each location, fetch its campsite type
        for (const location of this.userLocations) {
          try {
            const campResponse = await axios.get(
              `http://localhost:3001/locations/${location.location_id}/campsitetype`, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (campResponse.data && campResponse.data.length > 0) {
              location.campsite_type_id = campResponse.data[0].campsitetypes_id;
              location.campsite_type_name = campResponse.data[0].name;
            } else {
              // Handle locations with no campsite type set
              location.campsite_type_name = 'Not specified';
            }
          } catch (error) {
            console.error(`Error fetching campsite type for location ${location.location_id}:`, error);
            // Don't fail completely on error
            location.campsite_type_name = 'Error loading';
          }
        }

        // For each location, fetch its images
        for (const location of this.userLocations) {
          try {
            const imageResponse = await axios.get(
              `http://localhost:3001/locations/${location.location_id}/images`, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (imageResponse.data && imageResponse.data.length > 0) {
              // Get the cover image (is_cover = 1) or the first image
              const coverImage = imageResponse.data.find(img => img.is_cover === 1) || imageResponse.data[0];
              location.coverImage = coverImage.image_url;
              location.allImages = imageResponse.data;
            }
          } catch (error) {
            console.error(`Error fetching images for location ${location.location_id}:`, error);
          }
        }
      })
      .catch(error => {
        console.error('Error loading user locations:', error);
      });
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
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      // Check if we're editing an existing location
      const isEditing = !!this.location.location_id;
      
      // Create a copy of location data to send
      const locationData = { ...this.location };
      
      // Choose the right endpoint and method
      const method = isEditing ? 'put' : 'post';
      const url = isEditing 
        ? `http://localhost:3001/locations/${locationData.location_id}` 
        : 'http://localhost:3001/locations';
      
      // For editing, we only send what's changed
      if (isEditing) {
        // Remove ID from the data we're sending
        delete locationData.location_id;
      }
      
      // Make the API call
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
    
    // Add a helper method to reset the form
    resetForm() {
      // First clear all data
      this.location = {
        name: '',
        description: '',
        city: '',
        country: '',
        price_per_night: null,
        latitude: null,
        longitude: null,
        amenities: [], // Empty array for amenities
        campsite_type_id: null
      };
      this.previewImages = [];
      this.imagesToUpload = [];
      
      // Clear messages
      this.successMessage = '';
      this.errorMessage = '';
      
      console.log('Form reset, amenities:', this.location.amenities);
    },
    
    editLocation(location) {
      // Reset the form first
      this.resetForm();
      
      // Then fill with location data
      this.location = {
        ...location,
        location_id: parseInt(location.location_id),
        price_per_night: parseFloat(location.price_per_night),
        // Start with an empty array
        amenities: []
      };
      
      const token = localStorage.getItem('token');
      
      // Fetch amenities for this location
      axios.get(`http://localhost:3001/locations/${location.location_id}/amenities`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('Loaded amenities for editing:', response.data);
        
        // Update amenities with properly parsed IDs
        this.location.amenities = response.data.map(a => parseInt(a.amenity_id, 10));
        
        console.log('Amenities after loading:', this.location.amenities);
      })
      .catch(error => {
        console.error('Error loading amenities for editing:', error);
        // Continue with editing even if amenities can't be loaded
      });
      
      // Load existing images - THIS IS THE KEY ADDITION
      axios.get(`http://localhost:3001/locations/${location.location_id}/images`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('Loaded images for editing:', response.data);
        
        if (response.data && response.data.length > 0) {
          // Convert server images to the format expected by the preview
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

    // In your location component
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.error-message, .success-message {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.location-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

.amenities-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.amenity-item {
  display: flex;
  align-items: center;
}

.amenity-item input {
  width: auto;
  margin-right: 5px;
}

.form-actions {
  margin-top: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  width: 100%;
  font-size: 1rem;
  padding: 12px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.my-locations {
  margin-top: 40px;
}

.locations-list {
  display: grid;
  gap: 15px;
}

.location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.location-actions {
  display: flex;
  gap: 10px;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

h4 {
  margin: 0 0 5px 0;
}

.location-details p {
  margin: 3px 0;
}

.image-upload-container {
  border: 2px dashed #ddd;
  padding: 15px;
  border-radius: 8px;
}

.upload-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
}

.preview-item {
  width: 120px;
  height: 120px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0,0,0,0.6);
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed #bbb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder span {
  font-size: 32px;
  color: #bbb;
}

.upload-instructions {
  margin-top: 10px;
}

.file-input {
  display: none;
}

.select-images-btn {
  background-color: #2196F3;
  color: white;
  margin-top: 10px;
}

.error-text {
  color: #c62828;
  font-size: 0.9rem;
  margin-top: 5px;
}
</style>
