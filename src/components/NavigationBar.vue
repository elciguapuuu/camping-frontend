<template>
  <nav class="navbar">
    <div class="nav-links">
      <router-link to="/">Home</router-link>
      <router-link to="/manage-location">Manage Location</router-link>
      <div class="user-controls">
        <router-link to="/profile" class="profile-link">
          <img 
            :src="profilePictureUrl || 'http://localhost:3001/images/default-profilepicture.jpg'" 
            alt="Profile" 
            class="profile-pic"
          >
        </router-link>
        <a href="#" @click.prevent="logout" class="logout-link">Logout</a>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavigationBar',
  data() {
    return {
      profilePictureUrl: null
    }
  },
  created() {
    this.getUserProfilePicture();
  },
  methods: {
    getUserProfilePicture() {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        // Fetch user profile from API to get the latest profile picture
        fetch(`http://localhost:3001/users/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch user profile');
          return response.json();
        })
        .then(userData => {
          // If user has a profile picture, use it
          if (userData.profile_picture_url) {
            this.profilePictureUrl = `http://localhost:3001${userData.profile_picture_url}`;
          }
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
        });
      }
    },
    logout() {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Emit logout event to parent
      this.$emit('logout');
      
      // Check current route before redirecting
      if (this.$route.path !== '/') {
        this.$router.push('/');
      } else {
        // If already on home page, refresh the page to update UI
        window.location.reload();
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  padding: 1rem;
  background-color: #2c3e50;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
}

.nav-links a:hover {
  background-color: #4a6785;
  border-radius: 4px;
}

.router-link-active {
  background-color: #4a6785;
  border-radius: 4px;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
}

.profile-link {
  padding: 0;
  display: flex;
  align-items: center;
}

.profile-link:hover {
  background: none;
}

.profile-pic {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.logout-link {
  cursor: pointer;
}
</style>
