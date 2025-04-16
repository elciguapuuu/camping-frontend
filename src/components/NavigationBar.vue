<template>
  <nav class="navbar">
    <div class="nav-links">
      <router-link to="/">Home</router-link>
      <router-link to="/profile">Profile</router-link>
      <router-link to="/manage-location">Manage Location</router-link>
      <a href="#" @click.prevent="logout" class="logout-link">Logout</a>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavigationBar',
  methods: {
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
  gap: 1rem;
  justify-content: center;
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

.logout-link {
  cursor: pointer;
  margin-left: auto;
}
</style>
