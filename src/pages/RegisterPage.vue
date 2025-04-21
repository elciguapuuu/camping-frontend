<template>
  <div class="register-page">
    <div class="auth-container">
      <h2>Create Account</h2>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name"
            v-model="name" 
            placeholder="Enter your name"
            :class="{ 'invalid': nameError }"
          >
          <div v-if="nameError" class="validation-error">{{ nameError }}</div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email"
            v-model="email" 
            placeholder="Enter your email"
            :class="{ 'invalid': emailError }"
          >
          <div v-if="emailError" class="validation-error">{{ emailError }}</div>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password"
            v-model="password" 
            placeholder="Create a password"
            :class="{ 'invalid': passwordError }"
          >
          <div v-if="passwordError" class="validation-error">{{ passwordError }}</div>
          <div class="password-requirements">
            Password must include:
            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
              <li>One special character (@$!%*?&)</li>
            </ul>
          </div>
        </div>
        
        <button type="submit" class="primary-btn" :disabled="isLoading">
          {{ isLoading ? 'Creating account...' : 'Register' }}
        </button>
      </form>
      
      <div class="divider">
        <span>or</span>
      </div>
      
      <div class="social-login">
        <button @click="registerWithGoogle" class="google-btn">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo">
          Continue with Google
        </button>
      </div>
      
      <p class="auth-footer">
        Already have an account? <router-link to="/login">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      nameError: '',
      emailError: '',
      passwordError: '',
      errorMessage: '',
      isLoading: false
    }
  },
  methods: {
    validateName() {
      if (!this.name) {
        this.nameError = 'Name is required';
        return false;
      } else if (this.name.length < 2) {
        this.nameError = 'Name must be at least 2 characters long';
        return false;
      }
      this.nameError = '';
      return true;
    },
    
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
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!this.password) {
        this.passwordError = 'Password is required';
        return false;
      } else if (!passwordRegex.test(this.password)) {
        this.passwordError = 'Password does not meet requirements';
        return false;
      }
      this.passwordError = '';
      return true;
    },
    
    async handleRegister() {
      // Reset error messages
      this.errorMessage = '';
      
      // Validate inputs
      const isNameValid = this.validateName();
      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();
      
      if (!isNameValid || !isEmailValid || !isPasswordValid) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await axios.post('http://localhost:3001/auth/register', {
          name: this.name,
          email: this.email,
          password: this.password
        });
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        
        // Make sure we have all needed user properties in localStorage
        const userData = response.data.user;
        console.log('Registration response user data:', userData);
        
        // Set default values for missing properties
        const normalizedUserData = {
          id: userData.id || userData.user_id,
          name: userData.name,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url || null
        };
        
        localStorage.setItem('user', JSON.stringify(normalizedUserData));
        
        // Emit auth changed event
        this.$nextTick(() => {
          this.$root.$emit('auth-changed');
        });
        
        // Redirect to home
        this.$router.push('/');
        
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.error || 'Registration failed. Please try again.';
        } else {
          this.errorMessage = 'Network error. Please check your connection.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    registerWithGoogle() {
      window.location.href = 'http://localhost:3001/auth/google';
    }
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 20px;
}

.auth-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 40px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 1.8rem;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #444;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #42b983;
}

input.invalid {
  border-color: #ff5252;
}

.validation-error {
  color: #ff5252;
  font-size: 0.85rem;
  margin-top: 5px;
}

.password-requirements {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #666;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}

.password-requirements ul {
  margin: 5px 0 0 0;
  padding-left: 20px;
}

.password-requirements li {
  margin-bottom: 4px;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.primary-btn:hover {
  background-color: #3aa876;
}

.primary-btn:disabled {
  background-color: #a5d5c0;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #777;
  font-size: 0.9rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid #ddd;
}

.divider span {
  padding: 0 10px;
}

.google-btn {
  width: 100%;
  padding: 12px;
  background-color: #4285f4; /* Google blue */
  color: white;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.google-btn:hover {
  background-color: #3367d6; /* Darker Google blue */
}

.google-btn img {
  width: 20px;
  height: 20px;
}

.auth-footer {
  text-align: center;
  margin-top: 25px;
  color: #666;
}

.auth-footer a {
  color: #42b983;
  font-weight: 500;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  text-align: center;
}

@media (max-width: 576px) {
  .auth-container {
    padding: 25px;
  }
  
  .password-requirements {
    font-size: 0.8rem;
  }
}
</style>
