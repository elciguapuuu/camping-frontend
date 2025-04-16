<template>
  <div id="app">
    <NavigationBar v-if="isAuthenticated" @logout="handleLogout" />
    <router-view></router-view>
  </div>
</template>

<script>
import NavigationBar from './components/NavigationBar.vue'
import router from './router'

export default {
  name: 'App',
  router,
  components: {
    NavigationBar
  },
  data() {
    return {
      isAuthenticated: false
    }
  },
  created() {
    // Check authentication state on app creation
    this.checkAuth();
    
    // Listen for route changes to update auth state
    this.$router.beforeEach((to, from, next) => {
      this.checkAuth();
      next();
    });
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
    },
    handleLogout() {
      this.isAuthenticated = false;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
