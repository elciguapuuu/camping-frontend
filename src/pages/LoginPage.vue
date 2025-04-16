<template>
  <div class="login">
    <h2>Login</h2>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <input 
          type="email" 
          v-model="email" 
          placeholder="Email"
          :class="{ 'invalid': emailError }"
        >
        <div v-if="emailError" class="validation-error">{{ emailError }}</div>
      </div>
      
      <div class="form-group">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Password"
          :class="{ 'invalid': passwordError }"
        >
        <div v-if="passwordError" class="validation-error">{{ passwordError }}</div>
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    
    <div class="social-login">
      <p>Or login with:</p>
      <button @click="loginWithGoogle" class="google-btn">Google</button>
    </div>
    
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      emailError: '',
      passwordError: '',
      errorMessage: '',
      isLoading: false
    }
  },
  methods: {
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.emailError = 'Email is required';
        return false;
      } else if (!emailRegex.test(this.email)) {
        this.emailError = 'Invalid email format';
        return false;
      }
      this.emailError = '';
      return true;
    },
    
    validatePassword() {
      if (!this.password) {
        this.passwordError = 'Password is required';
        return false;
      }
      this.passwordError = '';
      return true;
    },
    
    async handleLogin() {
      // Reset error messages
      this.errorMessage = '';
      
      // Validate inputs
      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();
      
      if (!isEmailValid || !isPasswordValid) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await axios.post('http://localhost:3001/auth/login', {
          email: this.email,
          password: this.password
        });
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to the requested page or home
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.push(redirectPath);
        
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.error || 'Login failed. Please try again.';
        } else {
          this.errorMessage = 'Network error. Please check your connection.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    loginWithGoogle() {
      window.location.href = 'http://localhost:3001/auth/google';
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input.invalid {
  border-color: #ff5252;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff5252;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #ffeded;
  border-radius: 4px;
}

.validation-error {
  color: #ff5252;
  font-size: 0.8rem;
  margin-bottom: 5px;
}

.social-login {
  margin-top: 20px;
  text-align: center;
}

.google-btn {
  background-color: #4285F4;
}
</style>
