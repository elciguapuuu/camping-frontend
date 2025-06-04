<template>
  <div id="app">
    <NavigationBar ref="navbar" />
    <router-view @auth-update="updateNavbar"/>
  </div>
</template>

<script>
import NavigationBar from './components/NavigationBar.vue'

export default {
  name: 'App',
  components: {
    NavigationBar
  },
  methods: {
    updateNavbar() {
      console.log('🔄 App received auth-update - refreshing navbar');
      if (this.$refs.navbar) {
        this.$refs.navbar.checkAuthStatus();
      }
    },
    
    async fetchInitialProfileData() {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Get user data
        const userData = localStorage.getItem('user');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        
        // Only fetch if there's no profile picture URL
        if (!user.profile_picture_url) {
          console.log('🔍 No profile picture found, fetching user data...');
          
          const response = await fetch('http://localhost:3001/users/me/profile', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) return;
          
          const freshUserData = await response.json();
          
          // Update localStorage
          if (freshUserData.profile_picture_url) {
            user.profile_picture_url = freshUserData.profile_picture_url;
            localStorage.setItem('user', JSON.stringify(user));
            console.log('💾 Updated user data with profile picture');
          }
        }
      } catch (error) {
        console.error('Error fetching initial profile data:', error);
      }
    }
  },
  mounted() {
    this.fetchInitialProfileData();
    
    // Emit initial auth check event to ensure UI is updated correctly
    this.$nextTick(() => {
      console.log('🔄 App mounted - emitting initial auth-changed event');
      this.$root.$emit('auth-changed');
    });
  }
}
</script>

<style>
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f9f9f9;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

h1 {
  font-size: 2.2rem;
}

h2 {
  font-size: 1.8rem;
}

h3 {
  font-size: 1.5rem;
}

a {
  color: #42b983;
  text-decoration: none;
  transition: color 0.2s;
}

a:hover {
  color: #3aa876;
}

button {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #1e8e50;
}

input, textarea, select {
  font-family: inherit;
  font-size: 1rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin: 10px 0;
}

.success-message {
  color: #388e3c;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  padding: 12px;
  margin: 10px 0;
}

.loading {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42b983;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: white;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo-brand {
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-brand a {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
}

.logo-brand a:hover {
  background-color: #f7f7f7;
  text-decoration: none;
}

.auth-links {
  display: flex;
  gap: 20px;
}

.auth-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #f7f7f7;
}

.auth-link:hover {
  background-color: #f0f0f0;
  text-decoration: none;
}
</style>
