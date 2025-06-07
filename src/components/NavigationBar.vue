<template>
  <nav class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="logo">
        <!-- Your logo here -->
        Seeker
      </router-link>
    </div>
    
    <div class="navbar-right">
      <router-link v-if="isAuthenticated" to="/manage-location" class="nav-link host-link">
        My Listings
      </router-link>
      
      <!-- Login and Register buttons when NOT authenticated -->
      <div v-if="!isAuthenticated" class="auth-buttons">
        <router-link to="/register" class="nav-link register-btn">
          Register
        </router-link>
        <router-link to="/login" class="nav-link login-btn">
          Login
        </router-link>
      </div>
      
      <!-- Profile dropdown when authenticated -->
      <div v-if="isAuthenticated" class="profile-dropdown" ref="profileDropdown">
        <div class="profile-trigger" @click="toggleDropdown">
          <img 
            v-if="profilePictureUrl" 
            :src="profilePictureUrl" 
            alt="Profile" 
            class="profile-img"
            @error="handleImageError"
          >
          <div v-else class="profile-initials">
            {{ getUserInitials() }}
          </div>
        </div>
        
        <div v-show="showDropdown" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item">Profile</router-link>
          <div @click="logout" class="dropdown-item logout">Log out</div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavigationBar',
  data() {
    return {
      isAuthenticated: false,
      user: null,
      showDropdown: false,
      profilePictureUrl: null,
      imageErrored: false
    }
  },
  created() {
    this.checkAuthStatus();
    
    // Listen for auth-changed events with more detailed logging
    this.$root.$on('auth-changed', () => {
      console.log('🔄 Navbar received auth-changed event - checking auth status');
      // Force clearing the cache
      localStorage.removeItem('_navbarImageCache');
      this.imageErrored = false;
      this.$nextTick(async () => {
        await this.checkAuthStatus();
        
        // If we're logged in but have no profile picture URL, try to fetch it
        if (this.isAuthenticated && (!this.user.profile_picture_url || !this.profilePictureUrl)) {
          this.fetchUserProfile();
        }
      });
    });
    
    // Add a watch on localStorage to catch any changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'user' || event.key === 'token') {
        console.log('📦 Storage changed:', event.key);
        this.checkAuthStatus();
      }
    });
  },
  mounted() {
    // Add click event listener to close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeDestroy() {
    // Remove event listener when component is destroyed
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    checkAuthStatus() {
      console.log('🔍 Checking auth status in navbar');
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
      
      if (this.isAuthenticated) {
        try {
          const userData = localStorage.getItem('user');
          console.log('📄 Raw user data from localStorage:', userData);
          
          if (userData) {
            this.user = JSON.parse(userData);
            console.log('👤 Parsed user data in navbar:', this.user);
            
            // Reset image error state on refresh
            this.imageErrored = false;
            
            // Clear previous profile picture URL
            this.profilePictureUrl = null;
            
            // Check if user has profile picture and image hasn't errored
            if (this.user && this.user.profile_picture_url && !this.imageErrored) {
              console.log('🖼️ Found profile_picture_url:', this.user.profile_picture_url);
              // Generate URL with timestamp to prevent caching
              const timestamp = new Date().getTime();
              if (this.user.profile_picture_url.startsWith('http')) {
                this.profilePictureUrl = `${this.user.profile_picture_url}?t=${timestamp}`;
              } else {
                this.profilePictureUrl = `http://localhost:3001${this.user.profile_picture_url}?t=${timestamp}`;
              }
              
              console.log('🔗 Profile picture URL set to:', this.profilePictureUrl);
            } else {
              console.log('❌ No profile_picture_url found in user data');
            }
          } else {
            this.user = null;
            this.profilePictureUrl = null;
            this.isAuthenticated = false;
            localStorage.removeItem('token');
            console.log('❌ No user data found in localStorage');
          }
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
          this.user = null;
          this.profilePictureUrl = null;
          this.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        this.user = null;
        this.profilePictureUrl = null;
        this.showDropdown = false;
        console.log('🔒 User is not authenticated');
      }
    },
    
    async fetchUserProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        console.log('🔄 Fetching fresh user profile data...');
        const response = await fetch('http://localhost:3001/users/me/profile', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('❌ Error fetching user profile:', response.status);
          return;
        }
        
        const userData = await response.json();
        console.log('✅ Fetched user profile:', userData);
        
        // Update the profile picture URL if it exists
        if (userData.profile_picture_url) {
          // Store the user data in localStorage
          const storedUserJSON = localStorage.getItem('user');
          if (storedUserJSON) {
            const storedUser = JSON.parse(storedUserJSON);
            storedUser.profile_picture_url = userData.profile_picture_url;
            localStorage.setItem('user', JSON.stringify(storedUser));
          }
          
          // Update component data
          if (this.user) this.user.profile_picture_url = userData.profile_picture_url;
          const timestamp = new Date().getTime();
          if (userData.profile_picture_url.startsWith('http')) {
            this.profilePictureUrl = `${userData.profile_picture_url}?t=${timestamp}`;
          } else {
            this.profilePictureUrl = `http://localhost:3001${userData.profile_picture_url}?t=${timestamp}`;
          }
          
          console.log('🖼️ Updated profile picture URL:', this.profilePictureUrl);
        }
      } catch (error) {
        console.error('❌ Error in fetchUserProfile:', error);
      }
    },
    
    handleImageError() {
      console.error('Profile image failed to load');
      this.imageErrored = true;
      this.profilePictureUrl = null;
    },
    
    handleOutsideClick(event) {
      // Check if dropdown is open and the click was outside the dropdown
      if (this.showDropdown && this.$refs.profileDropdown && !this.$refs.profileDropdown.contains(event.target)) {
        this.showDropdown = false;
      }
    },
    
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    
    getUserInitials() {
      if (!this.user || !this.user.name) return '?';
      
      const nameParts = this.user.name.split(' ');
      if (nameParts.length > 1) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    },
    
    logout() {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Update authentication state immediately
      this.isAuthenticated = false;
      this.user = null;
      this.profilePictureUrl = null;
      this.showDropdown = false;
      
      // Force component update
      this.$forceUpdate();
      
      // Only redirect to home if not already there
      if (this.$route.path !== '/') {
        this.$router.push('/');
      } else {
        // If already on home page, refresh the component state
        this.$root.$emit('auth-changed');
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  padding: 0.8rem 1.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #42b983;
  text-decoration: none;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #f7f7f7;
  text-decoration: none;
}

.host-link {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.register-btn {
  background-color: transparent;
  color: #42b983;
  border: 1px solid #42b983;
  padding: 8px 16px;
}

.register-btn:hover {
  background-color: rgba(66, 185, 131, 0.1);
}

.login-btn {
  background-color: #42b983;
  color: white;
  padding: 8px 16px;
}

.login-btn:hover {
  background-color: #3aa876;
}

.profile-dropdown {
  position: relative;
}

.profile-trigger {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.profile-img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}

.profile-initials {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #42b983;
  color: white;
  font-weight: bold;
  font-size: 16px;
  border: 1px solid #ddd;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 180px;
  margin-top: 10px;
  z-index: 1001;
  overflow: hidden;
  border: 1px solid #eee;
}

.dropdown-item {
  display: block;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f7f7f7;
  text-decoration: none;
}

.dropdown-item.logout {
  color: #c62828;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.6rem 1rem;
  }
  
  .logo {
    font-size: 1.2rem;
  }
}
</style>
